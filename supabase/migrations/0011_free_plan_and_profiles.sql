-- Complimentary access, and being able to tell who's who in the dashboard.
--
-- Two problems, one migration:
--
-- 1. Some accounts should have full access without ever being charged (design
--    partners, friends, support cases). `workspaces.plan` is that grant. It sits
--    on the workspace because every access decision already reads the workspace,
--    and because a plan on workspace_members would be ambiguous the moment a
--    workspace has two members. It deliberately does not touch Stripe: granting
--    'free' to someone who already pays overrides their access but leaves the
--    subscription alone, so cancel that in Stripe separately.
--
-- 2. Names live in auth.users.raw_user_meta_data, which can't be sorted,
--    filtered or joined in the Table Editor. `profiles` is the queryable copy,
--    and workspaces carries a mirror of the owner's name and email so the row
--    you edit to grant a plan also tells you whose row it is.

-- ============================================================
-- workspaces.plan
-- ============================================================
alter table public.workspaces
  add column if not exists plan text not null default 'early_adopter';

alter table public.workspaces
  drop constraint if exists workspaces_plan_check;

alter table public.workspaces
  add constraint workspaces_plan_check
  check (plan in ('early_adopter', 'free'));

-- ============================================================
-- Owner identity, mirrored for the dashboard
-- ============================================================
alter table public.workspaces
  add column if not exists owner_name text not null default '';

alter table public.workspaces
  add column if not exists owner_email text not null default '';

-- ============================================================
-- profiles
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  full_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Matches fullName() in lib/onboarding.ts: we set full_name, OAuth providers
-- set name, and neither is guaranteed to be there.
create or replace function public.user_display_name(meta jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  select trim(coalesce(meta->>'full_name', meta->>'name', ''));
$$;

-- Definer, so reading a teammate's profile doesn't recurse through
-- workspace_members' own policies.
create or replace function public.shares_workspace_with(target_user uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select target_user = auth.uid() or exists (
    select 1
    from public.workspace_members mine
    join public.workspace_members theirs
      on theirs.workspace_id = mine.workspace_id
    where mine.user_id = auth.uid()
      and theirs.user_id = target_user
  );
$$;

drop policy if exists "profiles select" on public.profiles;
drop policy if exists "profiles update own" on public.profiles;

create policy "profiles select" on public.profiles
  for select using (public.shares_workspace_with(id));

-- Read-only to clients on purpose. Rows follow auth.users through the security
-- definer triggers below, and names are changed via auth.updateUser rather than
-- written here — so there's no reason for anyone to edit the copy we identify
-- them by.

-- ============================================================
-- Signup: profile and owner mirror alongside the workspace.
-- (Recreated in full; supersedes the definition in 0006.)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ws_id uuid;
  display_name text := public.user_display_name(new.raw_user_meta_data);
  addr text := coalesce(new.email, '');
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, addr, display_name)
  on conflict (id) do nothing;

  insert into public.workspaces (owner_id, name, owner_name, owner_email)
  values (new.id, 'My workspace', display_name, addr)
  returning id into ws_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (ws_id, new.id, 'owner');

  return new;
end;
$$;

-- ============================================================
-- Renames and email changes keep both copies current. Signup collects the name
-- at /welcome, which is an update to raw_user_meta_data, so this trigger is what
-- fills in the name for most accounts.
-- ============================================================
create or replace function public.sync_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name text := public.user_display_name(new.raw_user_meta_data);
  addr text := coalesce(new.email, '');
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, addr, display_name)
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        updated_at = now();

  update public.workspaces
     set owner_name = display_name,
         owner_email = addr
   where owner_id = new.id
     and (owner_name, owner_email) is distinct from (display_name, addr);

  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email, raw_user_meta_data on auth.users
  for each row execute function public.sync_user_profile();

-- ============================================================
-- Billing columns belong to us, not to the client.
--
-- RLS can gate rows but not columns, and "workspace admin update" from 0006
-- covers the whole row — so an owner could PATCH their own plan to 'free', or
-- set subscription_status to 'active', straight through the API. Column-level
-- grants are the only thing that actually stops that. Everything the app writes
-- as the user stays writable; billing state is written with the service key
-- (Stripe webhooks, and checkout recording its customer id).
-- ============================================================
revoke update on public.workspaces from anon, authenticated;
grant update (name, description, settings) on public.workspaces to authenticated;

-- ============================================================
-- Backfill existing accounts.
-- ============================================================
insert into public.profiles (id, email, full_name)
select u.id, coalesce(u.email, ''), public.user_display_name(u.raw_user_meta_data)
from auth.users u
where u.deleted_at is null
on conflict (id) do nothing;

update public.workspaces w
   set owner_name = public.user_display_name(u.raw_user_meta_data),
       owner_email = coalesce(u.email, '')
  from auth.users u
 where u.id = w.owner_id;
