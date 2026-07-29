export const APP_NAME = "ProDraw";
export const APP_TAGLINE = "The modern home for your business processes.";
export const APP_DESCRIPTION =
  "A lightweight process repository for Business Analysts and Process Analysts. Map your process architecture, document BPMN 2.0 processes, and keep everything in one calm workspace.";

export const TRIAL_DAYS = 7;

/** Grace period (hours) an unverified email account keeps full trial access. */
export const VERIFICATION_GRACE_HOURS = 24;

export const SUPPORTED_CURRENCIES = ["AUD", "USD", "GBP"] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export type BillingInterval = "monthly" | "yearly";

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  AUD: "A$",
  USD: "$",
  GBP: "\u00A3",
};

/** Shared by the public pricing page and the in-app trial screen. */
export const EARLY_ADOPTER_FEATURES = [
  "Unlimited projects & processes",
  "Process library",
  "Chevron process architecture",
  "Full BPMN 2.0 canvas",
  "Process documentation",
  "PDF export for high level, a single process or whole projects",
  "Autosave & version snapshots",
  "Suggest features, shape the roadmap",
] as const;

export const ENTERPRISE_FEATURES = [
  "Invite & manage teammates with roles and permissions",
  "Multiple workspaces under one organization",
  "Org-wide project and process management",
  "Centralized admin billing",
  "SSO (SAML / OIDC)",
  "Audit log",
  "Priority support",
] as const;

/**
 * Early-adopter plan pricing. Yearly is 20% off the monthly rate, billed
 * annually. `regularMonthly` is the display-only struck-through anchor.
 */
export const PLAN_PRICING: Record<
  Currency,
  {
    monthly: number;
    yearlyMonthly: number;
    yearlyTotal: number;
    regularMonthly: number;
  }
> = {
  AUD: { monthly: 15, yearlyMonthly: 12, yearlyTotal: 144, regularMonthly: 39 },
  USD: { monthly: 10, yearlyMonthly: 8, yearlyTotal: 96, regularMonthly: 29 },
  GBP: { monthly: 8, yearlyMonthly: 6.4, yearlyTotal: 76.8, regularMonthly: 19 },
};
