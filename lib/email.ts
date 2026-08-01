/**
 * Outbound mail, sent through Resend's REST API.
 *
 * Deliberately fetch-only rather than the Resend SDK: this runs on Cloudflare
 * Workers, where the Stripe SDK already cost us an afternoon of hangs, and a
 * single POST doesn't justify importing a client that assumes Node.
 *
 * Every path returns a boolean instead of throwing. Mail here is a notification
 * about something already recorded, so a mail failure must never take down the
 * request that triggered it.
 */

import { siteUrl } from "@/lib/site";
import { SUPPORT_EMAIL } from "@/lib/support";
import { CURRENCY_SYMBOLS, TRIAL_DAYS, type Currency } from "@/lib/constants";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/** Resend can stall behind a Worker's CPU budget; fail fast instead. */
const SEND_TIMEOUT_MS = 10_000;

type Mail = {
  to: string;
  from: string;
  subject: string;
  text: string;
  /** Set to the person who wrote in, so hitting reply reaches them. */
  replyTo?: string;
};

async function sendMail(mail: Mail): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY is unset — not sending", {
      subject: mail.subject,
    });
    return false;
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: mail.from,
        to: [mail.to],
        subject: mail.subject,
        text: mail.text,
        reply_to: mail.replyTo,
      }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });

    if (!response.ok) {
      // Nearly always a From address that isn't on a verified domain, and the
      // body says exactly that — worth keeping rather than swallowing.
      console.error("[email] Resend rejected the send", {
        status: response.status,
        body: await response.text().catch(() => "<unreadable>"),
      });
      return false;
    }
    return true;
  } catch (cause) {
    console.error("[email] send failed", { subject: mail.subject, cause });
    return false;
  }
}

/**
 * Who everything comes from, and where in-app feedback lands. The From address
 * only has to sit on a domain verified in Resend; replies don't go there, they
 * go wherever reply-to points.
 */
const FROM_ADDRESS =
  process.env.RESEND_FROM_EMAIL ?? "ProDraw <noreply@prodraw.ai>";
const FEEDBACK_TO = process.env.FEEDBACK_EMAIL_TO ?? SUPPORT_EMAIL;

const CATEGORY_LABELS: Record<string, string> = {
  feature: "Feature idea",
  bug: "Bug report",
  other: "Message",
};

/** First line of the message, trimmed to something a subject line can hold. */
function summarise(message: string): string {
  const line = message.split("\n", 1)[0].trim();
  return line.length > 60 ? `${line.slice(0, 57)}…` : line;
}

export async function sendFeedbackEmail(feedback: {
  category: string;
  message: string;
  fromName: string;
  fromEmail: string;
  userId: string;
  workspaceId: string | null;
}): Promise<boolean> {
  const label = CATEGORY_LABELS[feedback.category] ?? CATEGORY_LABELS.other;

  return sendMail({
    to: FEEDBACK_TO,
    from: FROM_ADDRESS,
    replyTo: feedback.fromEmail || undefined,
    subject: `[ProDraw] ${label}: ${summarise(feedback.message)}`,
    text: [
      feedback.message,
      "",
      "—",
      `Category:  ${feedback.category}`,
      `Name:      ${feedback.fromName || "not set"}`,
      `Email:     ${feedback.fromEmail || "unknown"}`,
      `User ID:   ${feedback.userId}`,
      `Workspace: ${feedback.workspaceId ?? "none"}`,
      `Sent:      ${new Date().toISOString()}`,
    ].join("\n"),
  });
}

/**
 * The enrollment confirmation, sent the moment a subscription starts.
 *
 * Mastercard requires one for every subscription without exception, and Visa
 * requires one for trials. Visa's rule normally asks for a separate reminder
 * seven days before the first charge, which a seven-day trial can't satisfy —
 * so for trials of seven days or less it wants the reminder's details (the
 * expiry date and a cancellation link) folded into this email instead. That is
 * why the trial wording below repeats the charge date and the cancel link
 * rather than just welcoming them.
 */
export async function sendSubscriptionStartedEmail(sub: {
  to: string;
  name: string;
  planName: string | null;
  /** Null for a resubscribe, which bills straight away with no second trial. */
  trialEndsAt: Date | null;
  amount: number | null;
  currency: string | null;
  interval: string | null;
}): Promise<boolean> {
  if (!sub.to) {
    console.warn("[email] no address for subscription confirmation");
    return false;
  }

  const billingUrl = `${siteUrl()}/settings?tab=billing`;
  const plan = sub.planName ?? "ProDraw";
  const price = formatPrice(sub.amount, sub.currency, sub.interval);
  const greeting = sub.name ? `Hi ${sub.name.split(" ")[0]},` : "Hi,";

  if (!sub.trialEndsAt) {
    return sendMail({
      to: sub.to,
      from: FROM_ADDRESS,
      replyTo: SUPPORT_EMAIL,
      subject: "Your ProDraw subscription is active",
      text: [
        greeting,
        "",
        `Your ProDraw subscription is active. You're on ${plan}${
          price ? `, at ${price}` : ""
        }, and it renews automatically until you cancel.`,
        "",
        "Cancel any time in Settings → Billing:",
        billingUrl,
        "",
        "— ProDraw",
        `Questions? Reply to this email or write to ${SUPPORT_EMAIL}.`,
      ].join("\n"),
    });
  }

  const charge = formatDate(sub.trialEndsAt);

  return sendMail({
    to: sub.to,
    from: FROM_ADDRESS,
    replyTo: SUPPORT_EMAIL,
    subject: `Your ProDraw trial has started — free until ${charge}`,
    text: [
      greeting,
      "",
      `Your ${TRIAL_DAYS}-day free trial of ${plan} has started. Nothing has`,
      "been charged to your card. Here's what you've agreed to:",
      "",
      `  Plan            ${plan}`,
      `  Free until      ${charge}`,
      `  Then            ${price ?? "the price shown at checkout"}, until you cancel`,
      `  First charge    ${charge}, automatically, to the card you entered`,
      "",
      `Cancel before ${charge} and you won't be charged at all:`,
      billingUrl,
      "",
      "We'll email you again three days before that first charge.",
      "",
      "— ProDraw",
      `Questions? Reply to this email or write to ${SUPPORT_EMAIL}.`,
    ].join("\n"),
  });
}

/**
 * The pre-charge notice for a trial that converts on its own.
 *
 * This isn't a courtesy. A free trial that auto-charges is negative option
 * billing, and Mastercard requires a reminder three to seven days before a
 * digital trial converts, carrying the amount, the date and how to cancel;
 * Visa asks the same of trials longer than seven days. Without one, a disputed
 * first charge is close to indefensible. Stripe's trial_will_end webhook fires
 * exactly three days out, which is what triggers this.
 */
export async function sendTrialEndingEmail(trial: {
  to: string;
  name: string;
  endsAt: Date;
  /** Smallest currency unit, straight off the Stripe price. */
  amount: number | null;
  currency: string | null;
  /** "month" | "year", as Stripe words it. */
  interval: string | null;
}): Promise<boolean> {
  if (!trial.to) {
    console.warn("[email] no address for trial reminder — not sending");
    return false;
  }

  const billingUrl = `${siteUrl()}/settings?tab=billing`;
  const date = formatDate(trial.endsAt);
  const price = formatPrice(trial.amount, trial.currency, trial.interval);

  // Every fact the card networks want in the notice lives in this paragraph.
  const charge = price
    ? `you'll be charged ${price} and your subscription continues at that price until you cancel`
    : `your subscription begins at the price shown on your billing page and continues until you cancel`;

  return sendMail({
    to: trial.to,
    from: FROM_ADDRESS,
    replyTo: SUPPORT_EMAIL,
    subject: `Your ProDraw trial ends on ${date}`,
    text: [
      trial.name ? `Hi ${trial.name.split(" ")[0]},` : "Hi,",
      "",
      `Your ${TRIAL_DAYS}-day ProDraw trial ends on ${date}. On that day ${charge}.`,
      "",
      "Staying? There's nothing to do — everything you've built stays exactly",
      "where it is.",
      "",
      "Changed your mind? Cancel any time before that date and you won't be",
      "charged at all:",
      billingUrl,
      "",
      "— ProDraw",
      `Questions? Reply to this email or write to ${SUPPORT_EMAIL}.`,
    ].join("\n"),
  });
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatPrice(
  amount: number | null,
  currency: string | null,
  interval: string | null
): string | null {
  if (amount == null || !currency) return null;

  // The ISO code carries the weight here: symbols alone leave an Australian
  // "$15.00" and an American "$10.00" looking identical in a charge notice.
  // Two decimals suits every currency we sell in; revisit for the likes of JPY.
  const code = currency.toUpperCase();
  const symbol = CURRENCY_SYMBOLS[code as Currency] ?? "";
  const formatted = `${symbol}${(amount / 100).toFixed(2)} ${code}`;

  return interval ? `${formatted} per ${interval}` : formatted;
}
