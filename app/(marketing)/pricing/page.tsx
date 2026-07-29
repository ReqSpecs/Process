import type { Metadata } from "next";
import { headers } from "next/headers";
import { PricingTable } from "@/components/marketing/PricingSection";
import { resolveCurrency } from "@/lib/pricing";

export const metadata: Metadata = { title: "Pricing" };

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [headerList, params] = await Promise.all([headers(), searchParams]);

  const first = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  // ?currency=GBP or ?country=GB let you verify the display locally, where the
  // Cloudflare geo header isn't present. In production cf-ipcountry drives it.
  const currency = resolveCurrency(headerList, {
    currency: first(params.currency),
    country: first(params.country),
  });

  return <PricingTable initialCurrency={currency} />;
}
