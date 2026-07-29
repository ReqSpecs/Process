-- Supersedes email_has_password: the login form also needs to know whether the
-- account exists at all, so it can say "no account for that email" instead of
-- silently creating one. Same rules as before — definer function over
-- auth.users, granted to service_role only, called from a server action.

create or replace function public.email_account_state(p_email text)
returns text
language sql
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select case
               when u.encrypted_password is not null and u.encrypted_password <> ''
                 then 'password'
               else 'passwordless'
             end
      from auth.users u
      where lower(u.email) = lower(trim(p_email))
        and u.deleted_at is null
      limit 1
    ),
    'none'
  );
$$;

revoke all on function public.email_account_state(text) from public;
revoke all on function public.email_account_state(text) from anon;
revoke all on function public.email_account_state(text) from authenticated;
grant execute on function public.email_account_state(text) to service_role;

drop function if exists public.email_has_password(text);
