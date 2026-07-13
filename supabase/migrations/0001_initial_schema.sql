-- ProDraw initial schema
-- Run via Supabase SQL editor or `supabase db push`.

-- ============================================================
-- workspaces: one per user (auto-created on signup)
-- ============================================================
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'My workspace',
  trial_ends_at timestamptz not null default (now() + interval '7 days'),
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text not null default 'trialing', -- trialing | active | past_due | canceled
  currency text, -- locked at first checkout: AUD | USD | EUR | GBP
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index workspaces_owner_idx on public.workspaces (owner_id);

-- ============================================================
-- projects
-- ============================================================
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  description text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_workspace_idx on public.projects (workspace_id);

-- ============================================================
-- architecture_stages: high-level chevrons within a project
-- ============================================================
create table public.architecture_stages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  color text not null default 'cobalt', -- cobalt | ember | gold
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index architecture_stages_project_idx on public.architecture_stages (project_id);

-- ============================================================
-- processes: child processes under a stage, each with a BPMN canvas
-- ============================================================
create table public.processes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  stage_id uuid references public.architecture_stages (id) on delete set null,
  name text not null,
  bpmn_xml text not null default '',
  doc_owner text not null default '',
  doc_status text not null default 'draft', -- draft | in_review | approved
  doc_inputs text not null default '',
  doc_outputs text not null default '',
  doc_systems text not null default '',
  doc_risks text not null default '',
  doc_notes text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index processes_project_idx on public.processes (project_id);
create index processes_stage_idx on public.processes (stage_id);

-- ============================================================
-- process_versions: autosave snapshots (no UI in v1)
-- ============================================================
create table public.process_versions (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null references public.processes (id) on delete cascade,
  bpmn_xml text not null,
  created_at timestamptz not null default now()
);

create index process_versions_process_idx on public.process_versions (process_id, created_at desc);

-- ============================================================
-- feedback: suggest-a-feature / contact
-- ============================================================
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete set null,
  category text not null default 'feature', -- feature | bug | other
  message text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- blocked_email_domains: disposable email blocklist
-- ============================================================
create table public.blocked_email_domains (
  domain text primary key,
  reason text not null default 'disposable',
  created_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.workspaces enable row level security;
alter table public.projects enable row level security;
alter table public.architecture_stages enable row level security;
alter table public.processes enable row level security;
alter table public.process_versions enable row level security;
alter table public.feedback enable row level security;
alter table public.blocked_email_domains enable row level security;

-- workspaces: owner can read/update; inserts happen via trigger
create policy "workspace owner select" on public.workspaces
  for select using (owner_id = auth.uid());
create policy "workspace owner update" on public.workspaces
  for update using (owner_id = auth.uid());

-- helper: check the workspace belongs to the current user
create or replace function public.owns_workspace(ws_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.workspaces w
    where w.id = ws_id and w.owner_id = auth.uid()
  );
$$;

-- projects
create policy "project select" on public.projects
  for select using (public.owns_workspace(workspace_id));
create policy "project insert" on public.projects
  for insert with check (public.owns_workspace(workspace_id));
create policy "project update" on public.projects
  for update using (public.owns_workspace(workspace_id));
create policy "project delete" on public.projects
  for delete using (public.owns_workspace(workspace_id));

-- helper: check project ownership through workspace
create or replace function public.owns_project(p_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.projects p
    join public.workspaces w on w.id = p.workspace_id
    where p.id = p_id and w.owner_id = auth.uid()
  );
$$;

-- architecture_stages
create policy "stage select" on public.architecture_stages
  for select using (public.owns_project(project_id));
create policy "stage insert" on public.architecture_stages
  for insert with check (public.owns_project(project_id));
create policy "stage update" on public.architecture_stages
  for update using (public.owns_project(project_id));
create policy "stage delete" on public.architecture_stages
  for delete using (public.owns_project(project_id));

-- processes
create policy "process select" on public.processes
  for select using (public.owns_project(project_id));
create policy "process insert" on public.processes
  for insert with check (public.owns_project(project_id));
create policy "process update" on public.processes
  for update using (public.owns_project(project_id));
create policy "process delete" on public.processes
  for delete using (public.owns_project(project_id));

-- process_versions
create policy "version select" on public.process_versions
  for select using (
    exists (
      select 1 from public.processes p
      where p.id = process_id and public.owns_project(p.project_id)
    )
  );
create policy "version insert" on public.process_versions
  for insert with check (
    exists (
      select 1 from public.processes p
      where p.id = process_id and public.owns_project(p.project_id)
    )
  );

-- feedback: users can insert their own
create policy "feedback insert" on public.feedback
  for insert with check (user_id = auth.uid());
create policy "feedback select own" on public.feedback
  for select using (user_id = auth.uid());

-- blocked_email_domains: readable by anon for signup validation
create policy "blocklist read" on public.blocked_email_domains
  for select using (true);

-- ============================================================
-- Trigger: auto-create workspace on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.workspaces (owner_id, name)
  values (new.id, 'My workspace');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Trigger: keep updated_at fresh
-- ============================================================
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger touch_workspaces before update on public.workspaces
  for each row execute function public.touch_updated_at();
create trigger touch_projects before update on public.projects
  for each row execute function public.touch_updated_at();
create trigger touch_stages before update on public.architecture_stages
  for each row execute function public.touch_updated_at();
create trigger touch_processes before update on public.processes
  for each row execute function public.touch_updated_at();
