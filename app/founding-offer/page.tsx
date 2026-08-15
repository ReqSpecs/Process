import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { AuthModalProvider } from "@/components/auth/AuthModal";
import { FoundingOfferPage } from "@/components/marketing/FoundingOfferPage";
import { Wordmark } from "@/components/Wordmark";
import { PLAN_PRICING } from "@/lib/constants";
import { resolveCurrency } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Founding Offer",
  description:
    "ProDraw.ai — a lightweight BPMN process repository for Business Analysts and Process Analysts. Early adopters save up to 65%.",
};

export default async function FoundingOfferRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [headerList, params] = await Promise.all([headers(), searchParams]);

  const first = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  // UTMs and other query params stay on the URL for Meta; only currency/country
  // overrides are read for local QA when cf-ipcountry is absent.
  const currency = resolveCurrency(headerList, {
    currency: first(params.currency),
    country: first(params.country),
  });

  return (
    <AuthModalProvider>
      <div className="min-h-dvh bg-surface">
        <header className="border-b border-hairline px-5 py-3 sm:px-8 sm:py-4">
          <div className="mx-auto max-w-6xl">
            <Link href="/" aria-label="ProDraw home">
              <Wordmark className="h-6" />
            </Link>
          </div>
        </header>
        <FoundingOfferPage currency={currency} plan={PLAN_PRICING[currency]} />
      </div>
    </AuthModalProvider>
  );
}
