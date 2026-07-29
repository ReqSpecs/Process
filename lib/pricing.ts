import {
  PLAN_PRICING,
  SUPPORTED_CURRENCIES,
  type BillingInterval,
  type Currency,
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
export function planPrice(currency: Currency, interval: BillingInterval): number {
  const plan = PLAN_PRICING[currency];
  return interval === "yearly" ? plan.yearlyMonthly : plan.monthly;
}

/** Annual total when paying yearly. */
export function yearlyTotal(currency: Currency): number {
  return PLAN_PRICING[currency].yearlyTotal;
}

/** Display-only struck-through regular monthly price. */
export function regularPrice(currency: Currency): number {
  return PLAN_PRICING[currency].regularMonthly;
}

/** Yearly savings vs monthly, as a whole percent (e.g. 20). */
export function savingsPercent(currency: Currency): number {
  const plan = PLAN_PRICING[currency];
  return Math.round((1 - plan.yearlyMonthly / plan.monthly) * 100);
}

/** Format a price: whole numbers stay whole; decimals show 2 places. */
export function formatPrice(amount: number): string {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
}

/** Stripe price IDs per currency + interval, set via env once products exist. */
export function stripePriceId(
  currency: Currency,
  interval: BillingInterval = "monthly"
): string | undefined {
  const suffix = interval === "yearly" ? "YEARLY" : "MONTHLY";
  const map: Record<Currency, string | undefined> = {
    AUD: process.env[`STRIPE_PRICE_AUD_${suffix}`],
    USD: process.env[`STRIPE_PRICE_USD_${suffix}`],
    GBP: process.env[`STRIPE_PRICE_GBP_${suffix}`],
  };
  return map[currency];
}
