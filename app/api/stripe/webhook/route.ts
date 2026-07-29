import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
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

function trialEndsAt(subscription: Stripe.Subscription): string | null {
  return subscription.trial_end
    ? new Date(subscription.trial_end * 1000).toISOString()
    : null;
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
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const workspaceId = session.metadata?.workspace_id;
      if (workspaceId && session.subscription) {
        // Retrieve the subscription so we record its real status (usually
        // "trialing" for a first checkout) and trial end date.
        const subscription = await stripe.subscriptions.retrieve(
          String(session.subscription)
        );
        await supabase
          .from("workspaces")
          .update({
            stripe_subscription_id: subscription.id,
            subscription_status: mapStatus(subscription.status),
            trial_ends_at: trialEndsAt(subscription),
            currency: session.currency?.toUpperCase() ?? undefined,
          })
          .eq("id", workspaceId);
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

    // Fires 3 days out. The card is already on file and will be charged
    // automatically, so this is the last honest chance to remind them.
    case "customer.subscription.trial_will_end": {
      const subscription = event.data.object;
      const workspaceId = subscription.metadata?.workspace_id;
      const update = { billing_alert: "trial_ending" as const };

      if (workspaceId) {
        await supabase.from("workspaces").update(update).eq("id", workspaceId);
      } else {
        await updateByCustomer(supabase, subscription.customer, update);
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
