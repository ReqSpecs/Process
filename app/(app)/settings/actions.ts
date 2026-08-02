"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { siteUrl } from "@/lib/site";
import {
  isBillingInterval,
  isSupportedCurrency,
  resolveCurrency,
} from "@/lib/pricing";
import { stripePriceId } from "@/lib/planCatalog";
import { fullName } from "@/lib/onboarding";
import { resolveSettings, type WorkspaceSettings } from "@/lib/ui/settings";
import type { Workspace } from "@/lib/access";
import type { BillingInterval, Currency } from "@/lib/constants";

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

export async function startCheckout(formData?: FormData) {
  const { workspace, user } = await getWorkspaceOrRedirect();
  const stripe = getStripe();
  const baseUrl = siteUrl();

  const rawInterval = String(formData?.get("interval") ?? "monthly");
  const interval: BillingInterval = isBillingInterval(rawInterval)
    ? rawInterval
    : "monthly";

  // Currency locks on first checkout so re-subscribes stay consistent.
  let currency = workspace.currency;
  if (!currency || !isSupportedCurrency(currency)) {
    const headerList = await headers();
    currency = resolveCurrency(headerList);
  }

  const priceId = await stripePriceId(currency as Currency, interval);
  if (!priceId) {
    redirect("/settings?error=billing-not-configured");
  }

  let customerId = workspace.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      // Named customers are the difference between a readable Stripe dashboard
      // and a list of anonymous email addresses.
      name: fullName(user) || undefined,
      metadata: { workspace_id: workspace.id },
    });
    customerId = customer.id;
    // Service key: billing columns aren't writable by the user's own client, so
    // nobody can hand themselves a subscription status or a free plan.
    await createServiceClient()
      .from("workspaces")
      .update({ stripe_customer_id: customerId, currency })
      .eq("id", workspace.id);
  }

  // First subscribe gets the 7-day free trial; a card is captured up front so
  // Stripe auto-bills when the trial ends. Re-subscribes (already had a sub)
  // start billing immediately with no second trial.
  const isFirstTrial = !workspace.stripe_subscription_id;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    // Not straight into the app: the webhook that marks this workspace as paid
    // is still in flight, and /checkout/complete waits for it.
    success_url: `${baseUrl}/checkout/complete${isFirstTrial ? "?trial=1" : ""}`,
    cancel_url: `${baseUrl}/settings?tab=billing&checkout=cancelled`,
    metadata: { workspace_id: workspace.id },
    // Always collect a payment method so day-8 billing succeeds.
    payment_method_collection: "always",
    subscription_data: {
      metadata: { workspace_id: workspace.id },
      ...(isFirstTrial ? { trial_period_days: 7 } : {}),
    },
  });

  redirect(session.url!);
}

export async function openBillingPortal() {
  const { workspace } = await getWorkspaceOrRedirect();
  if (!workspace.stripe_customer_id) redirect("/settings");

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: workspace.stripe_customer_id,
    return_url: `${siteUrl()}/settings?tab=billing`,
  });

  redirect(session.url);
}

export async function cancelSubscription() {
  const { workspace } = await getWorkspaceOrRedirect();
  if (!workspace.stripe_subscription_id) redirect("/settings?tab=billing");

  const stripe = getStripe();
  await stripe.subscriptions.update(workspace.stripe_subscription_id, {
    cancel_at_period_end: true,
  });
  revalidatePath("/settings");
  redirect("/settings?tab=billing&cancelled=1");
}

// ---------- account ----------

export async function updateAccountName(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const { supabase, workspace } = await getWorkspaceOrRedirect();
  await supabase.auth.updateUser({ data: { full_name: name } });

  if (name && workspace.stripe_customer_id) {
    // Best effort by design: renaming yourself must not fail because Stripe is
    // unreachable. The next checkout would reconcile it anyway.
    try {
      await getStripe().customers.update(workspace.stripe_customer_id, { name });
    } catch {}
  }

  revalidatePath("/settings");
}

// ---------- workspace profile + settings ----------

export async function updateWorkspaceProfile(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  const { supabase, workspace } = await getWorkspaceOrRedirect();
  const update: Record<string, string> = { description };
  if (name) update.name = name;

  await supabase.from("workspaces").update(update).eq("id", workspace.id);
  revalidatePath("/", "layout");
  revalidatePath("/settings");
}

/** Deep-merge a partial settings patch over the stored blob. */
export async function saveWorkspaceSettings(patch: {
  branding?: Partial<WorkspaceSettings["branding"]>;
  appearance?: Partial<WorkspaceSettings["appearance"]>;
  defaults?: Partial<WorkspaceSettings["defaults"]>;
  emails?: Partial<WorkspaceSettings["emails"]>;
}) {
  const { supabase, workspace } = await getWorkspaceOrRedirect();
  const current = resolveSettings(workspace.settings);
  const next: WorkspaceSettings = {
    branding: { ...current.branding, ...(patch.branding ?? {}) },
    appearance: { ...current.appearance, ...(patch.appearance ?? {}) },
    defaults: { ...current.defaults, ...(patch.defaults ?? {}) },
    emails: { ...current.emails, ...(patch.emails ?? {}) },
  };

  await supabase.from("workspaces").update({ settings: next }).eq("id", workspace.id);
  revalidatePath("/", "layout");
  revalidatePath("/settings");
}

// ---------- danger zone ----------

export async function deleteAllData() {
  const { supabase, workspace } = await getWorkspaceOrRedirect();
  // Cascades to stages / processes / versions via FK on delete cascade.
  await supabase.from("projects").delete().eq("workspace_id", workspace.id);
  revalidatePath("/", "layout");
  redirect("/settings?deleted=data");
}

export async function deleteAccount() {
  const { supabase, workspace, user } = await getWorkspaceOrRedirect();

  if (workspace.stripe_subscription_id) {
    try {
      await getStripe().subscriptions.cancel(workspace.stripe_subscription_id);
    } catch {
      // Non-fatal: proceed with account removal even if the cancel fails.
    }
  }

  // Removing the auth user cascades the workspace (owner_id on delete cascade)
  // and everything beneath it. Requires the service-role key.
  const admin = createServiceClient();
  await admin.auth.admin.deleteUser(user.id);
  await supabase.auth.signOut();
  redirect("/");
}
