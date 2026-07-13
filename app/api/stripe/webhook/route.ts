import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";

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
        await supabase
          .from("workspaces")
          .update({
            stripe_subscription_id: String(session.subscription),
            subscription_status: "active",
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

      const status =
        subscription.status === "active" || subscription.status === "trialing"
          ? "active"
          : subscription.status === "past_due"
            ? "past_due"
            : "canceled";

      const query = supabase
        .from("workspaces")
        .update({ subscription_status: status });

      if (workspaceId) {
        await query.eq("id", workspaceId);
      } else {
        await query.eq("stripe_subscription_id", subscription.id);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
