-- Workspace profile + preferences
-- Adds a description and a generic settings store (appearance, branding,
-- project/process defaults, email prefs) to workspaces. All non-billing
-- settings live in the jsonb blob to avoid column sprawl.

alter table public.workspaces
  add column if not exists description text not null default '';

alter table public.workspaces
  add column if not exists settings jsonb not null default '{}'::jsonb;
