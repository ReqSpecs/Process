"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { currencyForCountry, isSupportedCurrency, stripePriceId } from "@/lib/pricing";
import type { Workspace } from "@/lib/access";

async function getWorkspaceOrRedirect() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("*")
    .eq("owner_id", user.id)
    .single<Workspace>();

  if (!workspace) redirect("/login");
  return { supabase, workspace, user };
}

export async function startCheckout() {
  const { supabase, workspace, user } = await getWorkspaceOrRedirect();
  const stripe = getStripe();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // Currency locks on first checkout so re-subscribes stay consistent.
  let currency = workspace.currency;
  if (!currency || !isSupportedCurrency(currency)) {
    const headerList = await headers();
    currency = currencyForCountry(headerList.get("cf-ipcountry"));
  }

  const priceId = stripePriceId(currency as Parameters<typeof stripePriceId>[0]);
  if (!priceId) {
    redirect("/settings?error=billing-not-configured");
  }

  let customerId = workspace.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { workspace_id: workspace.id },
    });
    customerId = customer.id;
    await supabase
      .from("workspaces")
      .update({ stripe_customer_id: customerId, currency })
      .eq("id", workspace.id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/settings?checkout=success`,
    cancel_url: `${siteUrl}/settings?checkout=cancelled`,
    metadata: { workspace_id: workspace.id },
    subscription_data: {
      metadata: { workspace_id: workspace.id },
    },
  });

  redirect(session.url!);
}

export async function openBillingPortal() {
  const { workspace } = await getWorkspaceOrRedirect();
  if (!workspace.stripe_customer_id) redirect("/settings");

  const stripe = getStripe();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const session = await stripe.billingPortal.sessions.create({
    customer: workspace.stripe_customer_id,
    return_url: `${siteUrl}/settings`,
  });

  redirect(session.url);
}
