-- Card-required trial
-- The 7-day free trial now begins only after the user starts a Stripe
-- subscription with a trial (card captured up front, auto-bills after 7 days,
-- cancel anytime). So a freshly-created workspace is 'incomplete' with no trial
-- window until Stripe reports 'trialing' via webhook.

-- New workspaces are 'incomplete' (no access) until checkout completes.
alter table public.workspaces
  alter column subscription_status set default 'incomplete';

-- Trials are driven by Stripe now, not granted on signup.
alter table public.workspaces
  alter column trial_ends_at drop not null;
alter table public.workspaces
  alter column trial_ends_at drop default;

-- Existing rows that were given a trial without a Stripe subscription lose the
-- ungated trial (they can start a real, card-backed trial from Settings).
update public.workspaces
  set subscription_status = 'incomplete',
      trial_ends_at = null
  where stripe_subscription_id is null
    and subscription_status in ('trialing', 'active', 'past_due');
