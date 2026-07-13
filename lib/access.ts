import { TRIAL_DAYS } from "@/lib/constants";

export type Workspace = {
  id: string;
  owner_id: string;
  name: string;
  trial_ends_at: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string;
  currency: string | null;
  created_at: string;
  updated_at: string;
};

export type AccessState = {
  /** Can create/edit processes. */
  canEdit: boolean;
  /** Subscription is live (not trial). */
  isSubscribed: boolean;
  /** In free trial window. */
  isTrialing: boolean;
  /** Days left in trial (0 when expired or subscribed). */
  trialDaysLeft: number;
};

export function getAccessState(workspace: Workspace): AccessState {
  const isSubscribed =
    workspace.subscription_status === "active" ||
    workspace.subscription_status === "past_due";

  const trialEnd = new Date(workspace.trial_ends_at).getTime();
  const msLeft = trialEnd - Date.now();
  const isTrialing = !isSubscribed && msLeft > 0;
  const trialDaysLeft = isTrialing
    ? Math.min(TRIAL_DAYS, Math.max(0, Math.ceil(msLeft / 86_400_000)))
    : 0;

  return {
    canEdit: isSubscribed || isTrialing,
    isSubscribed,
    isTrialing,
    trialDaysLeft,
  };
}
