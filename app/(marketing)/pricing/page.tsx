import type { Metadata } from "next";
import { headers } from "next/headers";
import { PricingSection } from "@/components/marketing/PricingSection";
import { currencyForCountry } from "@/lib/pricing";

export const metadata: Metadata = { title: "Pricing" };

export default async function PricingPage() {
  const headerList = await headers();
  const currency = currencyForCountry(headerList.get("cf-ipcountry"));

  return <PricingSection currency={currency} />;
}
