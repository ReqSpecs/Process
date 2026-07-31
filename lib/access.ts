import { TRIAL_DAYS } from "@/lib/constants";

/** Something the user has to know about, set from Stripe's invoice webhooks. */
export type BillingAlert =
  | "trial_ending"
  | "payment_failed"
  | "action_required";

/**
 * "free" is granted by hand in Supabase and means full access, no card, no
 * charge. Everyone else is on the paid plan and goes through Stripe.
 */
export type WorkspacePlan = "early_adopter" | "free";

export type Workspace = {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  settings: Record<string, unknown> | null;
  plan: string;
  owner_name: string;
  owner_email: string;
  trial_ends_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string;
  billing_alert: string | null;
  currency: string | null;
  created_at: string;
  updated_at: string;
};

export type AccessState = {
  /** Can create/edit processes. */
  canEdit: boolean;
  /** Access was granted by hand: no card, no trial clock, nothing to sell. */
  isFreePlan: boolean;
  /** Paid subscription is live (active or past_due). */
  isSubscribed: boolean;
  /** In the Stripe-backed free trial window. */
  isTrialing: boolean;
  /** Days left in trial (0 when expired or subscribed). */
  trialDaysLeft: number;
  /** Outstanding billing problem, if any. */
  billingAlert: BillingAlert | null;
};

const BILLING_ALERTS: readonly string[] = [
  "trial_ending",
  "payment_failed",
  "action_required",
];

export function getAccessState(workspace: Workspace): AccessState {
  const status = workspace.subscription_status;
  const isFreePlan = workspace.plan === "free";
  const isSubscribed = status === "active" || status === "past_due";
  const isTrialing = status === "trialing";

  let trialDaysLeft = 0;
  if (isTrialing && workspace.trial_ends_at) {
    const msLeft = new Date(workspace.trial_ends_at).getTime() - Date.now();
    trialDaysLeft = Math.min(
      TRIAL_DAYS,
      Math.max(0, Math.ceil(msLeft / 86_400_000)),
    );
  }

  // past_due means a charge failed, whether or not the invoice webhook landed
  // first — never let that state pass silently. A granted account has no card,
  // so any alert left over from a past subscription is noise to them.
  const stored = workspace.billing_alert;
  const billingAlert: BillingAlert | null = isFreePlan
    ? null
    : stored && BILLING_ALERTS.includes(stored)
      ? (stored as BillingAlert)
      : status === "past_due"
        ? "payment_failed"
        : null;

  return {
    canEdit: isFreePlan || isSubscribed || isTrialing,
    isFreePlan,
    isSubscribed,
    isTrialing,
    trialDaysLeft,
    billingAlert,
  };
}

/**
 * A brand-new workspace hasn't started its card-backed trial yet. These users
 * are sent to the start-trial screen instead of an empty, read-only app.
 * (Canceled/expired subscribers keep the normal read-only + resubscribe path.)
 */
export function needsTrialSetup(workspace: Workspace): boolean {
  // Granted accounts already have access; never ask them for a card.
  if (workspace.plan === "free") return false;

  return (
    workspace.subscription_status === "incomplete" &&
    !workspace.stripe_subscription_id
  );
}
