-- Reporting a signup to Meta exactly once.
--
-- The pixel runs in the browser, but accounts are created on the server — by an
-- OTP verification or an OAuth callback, neither of which the browser can see.
-- postAuthDestination() claims this column on the first authenticated request an
-- account ever makes and tags the redirect; the browser reports
-- CompleteRegistration when it sees the tag.
--
-- A column rather than a flag in localStorage: storage is cleared, shared
-- between people on one machine, and absent in private windows, so on its own it
-- would both double-count and under-count. `where signup_reported_at is null` is
-- atomic, so a refresh, a second tab, or a magic link opened twice still
-- produces one conversion.

alter table public.profiles
  add column if not exists signup_reported_at timestamptz;

-- Everyone with an account registered before any of this existed. Without the
-- backfill their next sign-in would report as a brand-new signup.
update public.profiles
   set signup_reported_at = coalesce(created_at, now())
 where signup_reported_at is null;
