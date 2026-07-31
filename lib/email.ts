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
 * Where in-app feedback lands, and who it comes from. The From address only has
 * to sit on a domain verified in Resend; replies don't go there, they go to the
 * person who wrote in via reply-to.
 */
const FEEDBACK_TO = process.env.FEEDBACK_EMAIL_TO ?? "info@prodraw.ai";
const FEEDBACK_FROM =
  process.env.RESEND_FROM_EMAIL ?? "ProDraw <noreply@prodraw.ai>";

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
    from: FEEDBACK_FROM,
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
