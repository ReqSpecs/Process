-- Lets the sign-in form decide whether to show a password field or go straight
-- to an emailed code. auth.users isn't reachable over PostgREST, so this has to
-- be a definer function; it's granted to service_role only, and the app calls
-- it from a server action with the service client (never from the browser).

create or replace function public.email_has_password(p_email text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select u.encrypted_password is not null and u.encrypted_password <> ''
      from auth.users u
      where lower(u.email) = lower(trim(p_email))
        and u.deleted_at is null
      limit 1
    ),
    false
  );
$$;

revoke all on function public.email_has_password(text) from public;
revoke all on function public.email_has_password(text) from anon;
revoke all on function public.email_has_password(text) from authenticated;
grant execute on function public.email_has_password(text) to service_role;
