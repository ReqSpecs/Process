import {
  SUPPORTED_CURRENCIES,
  type BillingInterval,
  type Currency,
  type PlanPrice,
} from "@/lib/constants";

/** Map a cf-ipcountry header value to a supported display currency. */
export function currencyForCountry(country: string | null | undefined): Currency {
  if (!country) return "USD";
  const c = country.toUpperCase();
  if (c === "AU" || c === "NZ") return "AUD";
  if (c === "GB") return "GBP";
  return "USD";
}

/**
 * Resolve the display currency for a request.
 *
 * Priority:
 *   1. Explicit `?currency=` override (for QA/testing).
 *   2. Explicit `?country=` override (for QA/testing).
 *   3. Geo headers — `cf-ipcountry` (Cloudflare, present in production) with
 *      common fallbacks so detection also works behind Vercel/other edges.
 *
 * Locally there is no edge geo header, so this returns USD unless an override
 * query param is supplied.
 */
export function resolveCurrency(
  headers: Pick<Headers, "get">,
  overrides?: { currency?: string | null; country?: string | null },
): Currency {
  const currencyOverride = overrides?.currency?.toUpperCase();
  if (currencyOverride && isSupportedCurrency(currencyOverride)) {
    return currencyOverride;
  }

  const country =
    overrides?.country ||
    headers.get("cf-ipcountry") ||
    headers.get("x-vercel-ip-country") ||
    headers.get("x-country") ||
    null;

  return currencyForCountry(country);
}

export function isSupportedCurrency(value: string): value is Currency {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(value);
}

export function isBillingInterval(value: string): value is BillingInterval {
  return value === "monthly" || value === "yearly";
}

/** Monthly-equivalent early-adopter price for the selected interval. */
export function planPrice(plan: PlanPrice, interval: BillingInterval): number {
  return interval === "yearly" ? plan.yearlyMonthly : plan.monthly;
}

/** Format a price: whole numbers stay whole; decimals show 2 places. */
export function formatPrice(amount: number): string {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
}