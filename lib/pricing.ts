import { type Currency, EARLY_ADOPTER_PRICE, SUPPORTED_CURRENCIES } from "@/lib/constants";

const EU_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
  "SI", "ES", "SE",
]);

/** Map a cf-ipcountry header value to a supported display currency. */
export function currencyForCountry(country: string | null | undefined): Currency {
  if (!country) return "USD";
  const c = country.toUpperCase();
  if (c === "AU" || c === "NZ") return "AUD";
  if (c === "GB") return "GBP";
  if (EU_COUNTRIES.has(c)) return "EUR";
  return "USD";
}

export function isSupportedCurrency(value: string): value is Currency {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(value);
}

/** Same headline number in every currency — early adopter simplicity. */
export function priceFor(_currency: Currency): number {
  return EARLY_ADOPTER_PRICE;
}

/** Stripe price IDs per currency, set via env once products exist. */
export function stripePriceId(currency: Currency): string | undefined {
  const map: Record<Currency, string | undefined> = {
    AUD: process.env.STRIPE_PRICE_AUD,
    USD: process.env.STRIPE_PRICE_USD,
    EUR: process.env.STRIPE_PRICE_EUR,
    GBP: process.env.STRIPE_PRICE_GBP,
  };
  return map[currency];
}
