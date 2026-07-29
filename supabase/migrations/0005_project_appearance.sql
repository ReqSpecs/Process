-- Project appearance + status
-- The app reads/writes projects.status, projects.icon and projects.color
-- (see lib/types.ts, app/(app)/actions.ts) but the columns were never added.
-- This closes that drift so a real Supabase project matches the code.

alter table public.projects
  add column if not exists status text not null default 'draft',
  add column if not exists icon text,
  add column if not exists color text;

alter table public.projects
  drop constraint if exists projects_status_check;

alter table public.projects
  add constraint projects_status_check
  check (status in ('draft', 'active', 'in_review', 'complete', 'archived'));
