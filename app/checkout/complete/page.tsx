import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPlanCatalog } from "@/lib/planCatalog";
import { isSupportedCurrency } from "@/lib/pricing";
import { CheckoutComplete } from "@/components/checkout/CheckoutComplete";

export const metadata: Metadata = { title: "Setting up your workspace" };

/**
 * Where Stripe returns after checkout.
 *
 * Deliberately outside the (app) group: that layout sends anyone without a
 * subscription to the plan chooser, and for the first seconds after paying
 * that's exactly what the customer looks like. Landing here instead means the
 * conversion is recorded and the wait is explained, rather than dumping them
 * back on the page they just bought from.
 */
export default async function CheckoutCompletePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Set by startCheckout, and only for a first subscription. Re-subscribes get
  // no trial, so reporting one to Meta would be a lie.
  const isTrial = params.trial === "1";

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("currency")
    .eq("owner_id", user.id)
    .single();

  const conversion = isTrial ? await trialValue(workspace?.currency) : {};

  return <CheckoutComplete isTrial={isTrial} {...conversion} />;
}

/**
 * What the trial is worth, for Meta's value optimisation. The monthly rate
 * stands in for yearly checkouts too: the interval isn't in the return URL, and
 * a figure that swings between two numbers for one event makes the campaign
 * reporting harder to read than a consistent understatement does.
 */
async function trialValue(
  currency: string | null | undefined
): Promise<{ value?: number; currency?: string }> {
  if (!currency || !isSupportedCurrency(currency)) return {};
  const { pricing } = await getPlanCatalog();
  return { value: pricing[currency].monthly, currency };
}
