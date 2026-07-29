-- Workspace membership (team-ready ownership)
-- Adds a membership table so a workspace can eventually have more than its
-- owner. App pages still resolve the workspace via owner_id for now; switching
-- those queries to a membership lookup is what actually lets a second member
-- see data, and is deferred until invites ship. RLS is made membership-aware
-- here so the data model is ready.

-- ============================================================
-- workspace_members
-- ============================================================
create table public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index workspace_members_user_idx on public.workspace_members (user_id);

-- Backfill an owner membership for every existing workspace.
insert into public.workspace_members (workspace_id, user_id, role)
select id, owner_id, 'owner' from public.workspaces
on conflict do nothing;

-- ============================================================
-- Membership helpers (security definer to avoid RLS recursion)
-- ============================================================
create or replace function public.is_workspace_member(ws_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.workspaces w
    where w.id = ws_id and w.owner_id = auth.uid()
  ) or exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws_id and m.user_id = auth.uid()
  );
$$;

create or replace function public.workspace_role(ws_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select case
    when exists (
      select 1 from public.workspaces w
      where w.id = ws_id and w.owner_id = auth.uid()
    ) then 'owner'
    else (
      select m.role from public.workspace_members m
      where m.workspace_id = ws_id and m.user_id = auth.uid()
    )
  end;
$$;

-- ============================================================
-- owns_workspace now means "is a member of" (owner or invited).
-- owns_project delegates to it, so process/stage access follows automatically.
-- ============================================================
create or replace function public.owns_workspace(ws_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_workspace_member(ws_id);
$$;

-- ============================================================
-- workspaces policies: membership-based select, owner/admin update
-- ============================================================
drop policy if exists "workspace owner select" on public.workspaces;
drop policy if exists "workspace owner update" on public.workspaces;

create policy "workspace member select" on public.workspaces
  for select using (public.is_workspace_member(id));
create policy "workspace admin update" on public.workspaces
  for update using (public.workspace_role(id) in ('owner', 'admin'));

-- ============================================================
-- workspace_members policies
-- ============================================================
alter table public.workspace_members enable row level security;

create policy "members select" on public.workspace_members
  for select using (public.is_workspace_member(workspace_id));
create policy "members insert" on public.workspace_members
  for insert with check (public.workspace_role(workspace_id) in ('owner', 'admin'));
create policy "members update" on public.workspace_members
  for update using (public.workspace_role(workspace_id) in ('owner', 'admin'));
create policy "members delete" on public.workspace_members
  for delete using (public.workspace_role(workspace_id) in ('owner', 'admin'));

-- ============================================================
-- Signup trigger also records the owner membership.
-- (Recreated in full; supersedes the definition in 0001.)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ws_id uuid;
begin
  insert into public.workspaces (owner_id, name)
  values (new.id, 'My workspace')
  returning id into ws_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (ws_id, new.id, 'owner');

  return new;
end;
$$;
