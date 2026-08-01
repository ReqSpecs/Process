import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe, getStripeCryptoProvider } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import {
  sendSubscriptionStartedEmail,
  sendTrialEndingEmail,
} from "@/lib/email";
import type { BillingAlert } from "@/lib/access";
import type { SupabaseServerClient } from "@/lib/supabase/server";

/** Map Stripe's subscription status onto the values the app stores. */
function mapStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    default:
      // canceled | unpaid | incomplete | incomplete_expired | paused
      return "canceled";
  }
}

/**
 * Statement text for the charge that ends a trial. Stripe caps this at 22
 * characters and requires at least one letter.
 */
const TRIAL_END_DESCRIPTOR = "PRODRAW END TRIAL";

/**
 * Stripe raises the post-trial invoice for the period beginning the instant the
 * trial ends, so the two timestamps line up. The tolerance only absorbs clock
 * skew between what we stored and what Stripe billed.
 */
function startsAtTrialEnd(trialEndsAt: string, periodStart: number): boolean {
  const stored = new Date(trialEndsAt).getTime();
  if (Number.isNaN(stored)) return false;
  return Math.abs(stored / 1000 - periodStart) < 120;
}

function trialEndsAt(subscription: Stripe.Subscription): string | null {
  return subscription.trial_end
    ? new Date(subscription.trial_end * 1000).toISOString()
    : null;
}

/** Only set when the price's product was expanded and still exists. */
function productName(price: Stripe.Price | undefined): string | null {
  const product = price?.product;
  if (!product || typeof product === "string" || "deleted" in product) {
    return null;
  }
  return product.name;
}

/** Expanded or not, all we ever want from these fields is the id. */
function idOf(
  ref: string | { id: string } | null | undefined
): string | null {
  if (!ref) return null;
  return typeof ref === "string" ? ref : ref.id;
}

/**
 * Invoices don't carry our workspace metadata, and where the subscription id
 * lives on an invoice has moved between API versions. The customer is stable,
 * and we already store it at checkout.
 */
async function updateByCustomer(
  supabase: SupabaseServerClient,
  customer: string | { id: string } | null | undefined,
  update: { billing_alert: BillingAlert | null }
): Promise<void> {
  const id = idOf(customer);
  if (!id) return;
  await supabase.from("workspaces").update(update).eq("stripe_customer_id", id);
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = await request.text();
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
      undefined,
      getStripeCryptoProvider()
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const workspaceId = session.metadata?.workspace_id;
      if (!workspaceId || !session.subscription) break;

      // Retrieve the subscription so we record its real status (usually
      // "trialing" for a first checkout) and trial end date. The product is
      // expanded so the confirmation email can name the plan as Stripe does.
      const subscription = await stripe.subscriptions.retrieve(
        String(session.subscription),
        { expand: ["items.data.price.product"] }
      );

      const { data: rows } = await supabase
        .from("workspaces")
        .update({
          stripe_subscription_id: subscription.id,
          subscription_status: mapStatus(subscription.status),
          trial_ends_at: trialEndsAt(subscription),
          currency: session.currency?.toUpperCase() ?? undefined,
        })
        .eq("id", workspaceId)
        // Already pointing at this subscription means Stripe is retrying, so
        // the update matches nothing and the confirmation can't go out twice.
        .or(
          `stripe_subscription_id.is.null,stripe_subscription_id.neq.${subscription.id}`
        )
        .select("owner_name, owner_email");

      const owner = rows?.[0];
      if (owner) {
        const price = subscription.items.data[0]?.price;
        await sendSubscriptionStartedEmail({
          to: owner.owner_email,
          name: owner.owner_name,
          planName: productName(price),
          trialEndsAt: subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : null,
          amount: price?.unit_amount ?? null,
          currency: price?.currency ?? null,
          interval: price?.recurring?.interval ?? null,
        });
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const workspaceId = subscription.metadata?.workspace_id;
      const status = mapStatus(subscription.status);

      const update: Record<string, unknown> = {
        subscription_status: status,
        trial_ends_at: trialEndsAt(subscription),
      };

      // Once billing settles either way there's nothing left for the user to
      // act on, so don't leave a stale warning in their face. past_due keeps
      // whatever the invoice webhook set.
      if (status === "active" || status === "canceled") {
        update.billing_alert = null;
      }

      const query = supabase.from("workspaces").update(update);

      if (workspaceId) {
        await query.eq("id", workspaceId);
      } else {
        await query.eq("stripe_subscription_id", subscription.id);
      }
      break;
    }

    // Fires 3 days out, which is the window Mastercard requires for a digital
    // trial that converts on its own. The email is the notice — losing it means
    // losing any dispute over the first charge — so the flag is only a record
    // that we reached this point.
    case "customer.subscription.trial_will_end": {
      const subscription = event.data.object;
      const workspaceId = subscription.metadata?.workspace_id;

      const match = workspaceId
        ? { column: "id", value: workspaceId }
        : { column: "stripe_customer_id", value: idOf(subscription.customer) };
      if (!match.value) break;

      const { data: rows } = await supabase
        .from("workspaces")
        .update({ billing_alert: "trial_ending" as const })
        .eq(match.column, match.value)
        // A row already flagged is Stripe retrying. Excluding it here means the
        // update returns nothing and the reminder goes out exactly once. The
        // null arm is needed because SQL's <> drops nulls, which is every
        // workspace with no outstanding alert.
        .or("billing_alert.is.null,billing_alert.neq.trial_ending")
        .select("owner_name, owner_email");

      const owner = rows?.[0];
      if (owner && subscription.trial_end) {
        const price = subscription.items.data[0]?.price;
        await sendTrialEndingEmail({
          to: owner.owner_email,
          name: owner.owner_name,
          endsAt: new Date(subscription.trial_end * 1000),
          amount: price?.unit_amount ?? null,
          currency: price?.currency ?? null,
          interval: price?.recurring?.interval ?? null,
        });
      }
      break;
    }

    // Visa asks that the charge ending a trial identify itself on the
    // cardholder's statement, so it doesn't read as an unrecognised debit a
    // week after signup. Subscription invoices sit open for around an hour
    // before they finalize, and this is the only window to set it.
    case "invoice.created": {
      const invoice = event.data.object;
      const customerId = idOf(invoice.customer);
      if (!invoice.id || !customerId) break;

      // Every renewal shares this billing reason; the date check below is what
      // narrows it to the one invoice that follows a trial.
      if (invoice.billing_reason !== "subscription_cycle") break;

      const { data: rows } = await supabase
        .from("workspaces")
        .select("trial_ends_at")
        .eq("stripe_customer_id", customerId)
        .limit(1);

      const trialEnd = rows?.[0]?.trial_ends_at;
      if (!trialEnd || !startsAtTrialEnd(trialEnd, invoice.period_start)) break;

      try {
        await stripe.invoices.update(invoice.id, {
          statement_descriptor: TRIAL_END_DESCRIPTOR,
        });
      } catch (cause) {
        // Finalized already, most likely. Descriptor text isn't worth failing
        // the webhook over and having Stripe redeliver the whole event.
        console.error("[stripe] could not set trial-end descriptor", {
          invoice: invoice.id,
          cause,
        });
      }
      break;
    }

    // The first real charge was declined. The subscription goes past_due on its
    // own; this is what tells the user why editing is about to stop.
    case "invoice.payment_failed": {
      await updateByCustomer(supabase, event.data.object.customer, {
        billing_alert: "payment_failed",
      });
      break;
    }

    // 3DS/SCA challenge — common on UK/EU cards. Nothing is wrong with the
    // card, but the charge won't clear until the cardholder confirms.
    case "invoice.payment_action_required": {
      await updateByCustomer(supabase, event.data.object.customer, {
        billing_alert: "action_required",
      });
      break;
    }

    case "invoice.paid": {
      await updateByCustomer(supabase, event.data.object.customer, {
        billing_alert: null,
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
