import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getAccessState, type Workspace } from "@/lib/access";
import { hasPassword } from "@/lib/onboarding";
import { getPlanCatalog } from "@/lib/planCatalog";
import { currencyForCountry } from "@/lib/pricing";
import { CURRENCY_SYMBOLS, type Currency } from "@/lib/constants";
import { resolveSettings } from "@/lib/ui/settings";
import { SettingsShell } from "@/components/app/settings/SettingsShell";

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

  const { name: planName, pricing } = await getPlanCatalog();
  const settings = resolveSettings(workspace.settings);
  const name =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    "";

  const tab = typeof params.tab === "string" ? params.tab : "account";

  const providers: string[] = Array.from(
    new Set(
      (user.identities ?? []).map((i: { provider: string }) => i.provider)
    )
  );

  return (
    <SettingsShell
      name={name}
      email={user.email ?? ""}
      signIn={{
        providers,
        hasPassword: await hasPassword(user.email ?? ""),
      }}
      workspaceName={workspace.name}
      description={workspace.description ?? ""}
      settings={settings}
      access={access}
      billing={{
        symbol,
        currency,
        plan: pricing[currency],
        planName,
        hasSubscription: !!workspace.stripe_subscription_id,
      }}
      banners={{
        checkoutSuccess: params.checkout === "success",
        billingNotConfigured: params.error === "billing-not-configured",
        upgrade: !!params.upgrade,
        cancelled: params.cancelled === "1",
        deletedData: params.deleted === "data",
      }}
      initialTab={tab}
    />
  );
}
