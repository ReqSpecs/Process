-- Trials collect a card up front, so the day-8 charge can fail (declined card)
-- or stall (3DS/SCA challenge) long after the user last thought about billing.
-- Stripe tells us via invoice webhooks; this column carries that signal into
-- the app so we can say something instead of silently pausing their work.
--
--   trial_ending    3 days out, card will be charged automatically
--   payment_failed  the charge was declined
--   action_required the bank wants the cardholder to confirm
--
-- Cleared when an invoice is paid, or when the subscription settles into
-- active/canceled and there is nothing left to act on.

alter table public.workspaces
  add column if not exists billing_alert text;

alter table public.workspaces
  drop constraint if exists workspaces_billing_alert_check;

alter table public.workspaces
  add constraint workspaces_billing_alert_check
  check (
    billing_alert is null
    or billing_alert in ('trial_ending', 'payment_failed', 'action_required')
  );
