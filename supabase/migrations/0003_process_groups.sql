-- ProDraw: process groups + wider chevron colour palette
-- Lets a process act as a collapsible group that nests child processes,
-- shown indented under a chevron on the project's high-level screen.

-- ============================================================
-- processes: self-referencing parent + group flag
-- ============================================================
alter table public.processes
  add column if not exists parent_id uuid
    references public.processes (id) on delete cascade,
  add column if not exists is_group boolean not null default false;

create index if not exists processes_parent_idx on public.processes (parent_id);

-- Note: architecture_stages.color now also accepts
-- violet | teal | magenta | lime (in addition to cobalt | ember | gold).
-- Colour is a free text column, so no schema change is required.
