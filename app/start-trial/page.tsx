import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { needsTrialSetup, type Workspace } from "@/lib/access";
import { needsOnboarding } from "@/lib/onboarding";
import { logout } from "@/app/(auth)/actions";
import { StartTrialForm } from "@/components/marketing/StartTrialForm";
import { Wordmark } from "@/components/Wordmark";
import { getPlanCatalog } from "@/lib/planCatalog";
import { currencyForCountry, isBillingInterval } from "@/lib/pricing";
import { TRIAL_DAYS, type BillingInterval, type Currency } from "@/lib/constants";

export const metadata: Metadata = { title: "Choose your plan" };

export default async function StartTrialPage({
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

  // Don't take a card before we know who they are.
  if (await needsOnboarding(user)) redirect("/welcome");

  // Already trialing / subscribed (or a canceled resubscriber) — the app and
  // Settings handle those; only brand-new workspaces belong here.
  if (!needsTrialSetup(workspace)) redirect("/process-library");

  const headerList = await headers();
  const currency = (workspace.currency ??
    currencyForCountry(headerList.get("cf-ipcountry"))) as Currency;

  const rawPlan = typeof params.plan === "string" ? params.plan : "monthly";
  const initialInterval: BillingInterval = isBillingInterval(rawPlan)
    ? rawPlan
    : "monthly";

  const { name: planName, pricing } = await getPlanCatalog();

  return (
    <div className="min-h-dvh bg-surface">
      <header className="flex items-center justify-between border-b border-hairline px-6 py-4">
        <Wordmark className="h-5" />
        <form action={logout}>
          <button
            type="submit"
            className="text-[13px] font-medium text-ink-faint transition-colors hover:text-ink"
          >
            Sign out
          </button>
        </form>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
        <h1 className="text-balance text-[32px] font-bold leading-[1.08] tracking-[-0.025em] text-ink sm:text-[40px]">
          Choose your plan
        </h1>
        <p className="mt-3 text-[16px] leading-relaxed text-ink">
          Your Workspace is ready. Start your {TRIAL_DAYS}-day free Trial to
          unlock it. You won&apos;t be charged today.
        </p>

        <StartTrialForm
          currency={currency}
          plan={pricing[currency]}
          planName={planName}
          initialInterval={initialInterval}
        />
      </main>
    </div>
  );
}
