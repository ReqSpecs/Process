export const APP_NAME = "ProDraw";
export const APP_TAGLINE = "The modern home for your business processes.";
export const APP_DESCRIPTION =
  "A lightweight process repository for Business Analysts and Process Analysts. Map your process architecture, document BPMN 2.0 processes, and keep everything in one calm workspace.";

export const TRIAL_DAYS = 7;

/** Grace period (hours) an unverified email account keeps full trial access. */
export const VERIFICATION_GRACE_HOURS = 24;

export const EARLY_ADOPTER_PRICE = 10;

export const SUPPORTED_CURRENCIES = ["AUD", "USD", "EUR", "GBP"] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  AUD: "A$",
  USD: "$",
  EUR: "\u20AC",
  GBP: "\u00A3",
};
