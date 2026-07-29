import type Stripe from "stripe";
import {
  PLAN_NAME,
  PLAN_PRICING,
  SUPPORTED_CURRENCIES,
  type BillingInterval,
  type Currency,
  type PlanPrice,
} from "@/lib/constants";
import { getStripe } from "@/lib/stripe";

/**
 * Server only — pulls in the Stripe SDK. Client components should take the
 * resolved `PlanPrice` as a prop instead of importing this.
 */

type IntervalIds = Partial<Record<BillingInterval, string>>;

export type PlanCatalog = {
  /** Stripe's product name, shown wherever the plan is labelled. */
  name: string;
  pricing: Record<Currency, PlanPrice>;
  priceIds: Record<Currency, IntervalIds>;
};

const OK_TTL_MS = 60 * 60 * 1000;
// Retry sooner after a miss so a transient Stripe error doesn't pin the
// fallback amounts in place for an hour.
const MISS_TTL_MS = 60 * 1000;

let cached: { until: number; value: PlanCatalog } | null = null;

export async function getPlanCatalog(): Promise<PlanCatalog> {
  if (cached && Date.now() < cached.until) return cached.value;

  const productId = process.env.STRIPE_PRODUCT_ID;
  if (!productId) return remember(fallback(), MISS_TTL_MS);

  try {
    const { data } = await getStripe().prices.list({
      product: productId,
      active: true,
      limit: 100,
      // Carries the product name back on the same call.
      expand: ["data.product"],
    });
    return remember(fromStripe(data), OK_TTL_MS);
  } catch {
    return remember(fallback(), MISS_TTL_MS);
  }
}

/** Stripe price to charge, or undefined if the catalog couldn't be read. */
export async function stripePriceId(
  currency: Currency,
  interval: BillingInterval = "monthly"
): Promise<string | undefined> {
  const { priceIds } = await getPlanCatalog();
  return priceIds[currency][interval];
}

function fromStripe(prices: Stripe.Price[]): PlanCatalog {
  const catalog = fallback();
  catalog.name = productName(prices) ?? catalog.name;

  for (const currency of SUPPORTED_CURRENCIES) {
    const monthly = newest(prices, currency, "month");
    const yearly = newest(prices, currency, "year");
    const stated = PLAN_PRICING[currency];

    const yearlyTotal = amount(yearly) ?? stated.yearlyTotal;
    catalog.pricing[currency] = {
      monthly: amount(monthly) ?? stated.monthly,
      yearlyTotal,
      yearlyMonthly: round2(yearlyTotal / 12),
      regularMonthly: stated.regularMonthly,
    };

    if (monthly) catalog.priceIds[currency].monthly = monthly.id;
    if (yearly) catalog.priceIds[currency].yearly = yearly.id;
  }

  return catalog;
}

/** Expanded product off any price; a deleted product carries no name. */
function productName(prices: Stripe.Price[]): string | undefined {
  for (const { product } of prices) {
    if (typeof product === "object" && "name" in product && product.name) {
      return product.name;
    }
  }
  return undefined;
}

/** Most recently created active price, so superseded ones lose out. */
function newest(
  prices: Stripe.Price[],
  currency: Currency,
  interval: "month" | "year"
): Stripe.Price | undefined {
  return prices
    .filter(
      (p) =>
        p.currency === currency.toLowerCase() &&
        p.recurring?.interval === interval &&
        p.recurring?.interval_count === 1 &&
        p.unit_amount != null
    )
    .sort((a, b) => b.created - a.created)[0];
}

function amount(price: Stripe.Price | undefined): number | undefined {
  return price?.unit_amount != null ? price.unit_amount / 100 : undefined;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function fallback(): PlanCatalog {
  return {
    name: PLAN_NAME,
    pricing: { ...PLAN_PRICING },
    priceIds: { AUD: {}, USD: {}, GBP: {} },
  };
}

function remember(value: PlanCatalog, ttlMs: number): PlanCatalog {
  cached = { until: Date.now() + ttlMs, value };
  return value;
}
