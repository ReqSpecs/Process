import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getAccessState, type Workspace } from "@/lib/access";
import { openBillingPortal, startCheckout } from "@/app/(app)/settings/actions";
import { currencyForCountry } from "@/lib/pricing";
import { CURRENCY_SYMBOLS, EARLY_ADOPTER_PRICE, type Currency } from "@/lib/constants";

export default async function SettingsPage({
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

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("*")
    .eq("owner_id", user.id)
    .single<Workspace>();

  if (!workspace) redirect("/login");

  const access = getAccessState(workspace);
  const headerList = await headers();
  const currency = (workspace.currency ??
    currencyForCountry(headerList.get("cf-ipcountry"))) as Currency;
  const symbol = CURRENCY_SYMBOLS[currency] ?? "$";

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 sm:px-10">
      <h1 className="text-[26px] font-bold tracking-tight text-ink">Settings</h1>

      {params.checkout === "success" && (
        <p className="mt-4 rounded-lg bg-cobalt-wash px-4 py-3 text-[14px] font-medium text-cobalt">
          You&apos;re subscribed — thank you for backing ProDraw early.
        </p>
      )}
      {params.error === "billing-not-configured" && (
        <p className="mt-4 rounded-lg bg-ember-tint px-4 py-3 text-[14px] font-medium text-signal">
          Billing isn&apos;t configured yet. Please try again later.
        </p>
      )}
      {params.upgrade && !access.canEdit && (
        <p className="mt-4 rounded-lg bg-ember-tint px-4 py-3 text-[14px] font-medium text-ink">
          Your trial has ended. Subscribe below to keep editing — your work is
          safe.
        </p>
      )}

      {/* account */}
      <section className="mt-8 rounded-panel border border-hairline bg-surface p-6">
        <h2 className="text-[15px] font-semibold text-ink">Account</h2>
        <div className="mt-4 space-y-3 text-[14px]">
          <div className="flex justify-between">
            <span className="text-ink-faint">Email</span>
            <span className="font-medium text-ink">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-faint">Workspace</span>
            <span className="font-medium text-ink">{workspace.name}</span>
          </div>
        </div>
      </section>

      {/* billing */}
      <section className="mt-5 rounded-panel border border-hairline bg-surface p-6">
        <h2 className="text-[15px] font-semibold text-ink">Billing</h2>

        {access.isSubscribed ? (
          <>
            <p className="mt-2 text-[14px] text-ink-soft">
              You&apos;re on the{" "}
              <span className="font-semibold text-ink">Early adopter</span> plan
              — {symbol}
              {EARLY_ADOPTER_PRICE} {currency}/month.
            </p>
            <form action={openBillingPortal} className="mt-4">
              <button
                type="submit"
                className="rounded-full border border-hairline bg-surface px-5 py-2.5 text-[14px] font-semibold text-ink transition-colors hover:border-ink-faint"
              >
                Manage subscription
              </button>
            </form>
            <p className="mt-2 text-[12px] text-ink-faint">
              Update payment method, view invoices, or cancel — via Stripe.
            </p>
          </>
        ) : (
          <>
            <p className="mt-2 text-[14px] text-ink-soft">
              {access.isTrialing ? (
                <>
                  <span className="font-semibold text-ink">
                    {access.trialDaysLeft} day
                    {access.trialDaysLeft === 1 ? "" : "s"}
                  </span>{" "}
                  left in your free trial.
                </>
              ) : (
                "Your free trial has ended."
              )}{" "}
              Subscribe for {symbol}
              {EARLY_ADOPTER_PRICE} {currency}/month — founding price, locked in
              while you stay subscribed.
            </p>
            <form action={startCheckout} className="mt-4">
              <button
                type="submit"
                className="rounded-full bg-cobalt px-6 py-2.5 text-[14px] font-semibold text-white shadow-soft transition-colors hover:bg-cobalt-deep"
              >
                Subscribe — {symbol}
                {EARLY_ADOPTER_PRICE}/month
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
