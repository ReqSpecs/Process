"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CaretDown,
  Check,
  GridFour,
  Kanban,
  MagnifyingGlass,
  Plus,
  Rows,
  SquaresFour,
  TreeStructure,
  X,
} from "@phosphor-icons/react";
import { createProject, updateProjectStatus } from "@/app/(app)/actions";
import { projectSlug } from "@/lib/slug";
import {
  PROJECT_STATUSES,
  resolveProjectColor,
  resolveProjectIcon,
} from "@/lib/ui/projectStyle";
import type { ProjectStatus } from "@/lib/types";

export type DashboardProject = {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: ProjectStatus;
  color: string | null;
  icon: string | null;
  areas: number;
  processes: number;
  updated: string | null;
};

const VIEW_KEY = "prodraw:projectsView";

const LIST_GRID =
  "grid grid-cols-[1fr_auto] items-center gap-3 md:grid-cols-[1.8fr_0.6fr_0.7fr_0.9fr_0.9fr]";

export function ProjectsGrid({ items }: { items: DashboardProject[] }) {
  const [rows, setRows] = useState(items);
  useEffect(() => setRows(items), [items]);

  const [view, setView] = useState<"tile" | "list">("tile");
  useEffect(() => {
    const v = localStorage.getItem(VIEW_KEY);
    if (v === "list" || v === "tile") setView(v);
  }, []);
  const changeView = (v: "tile" | "list") => {
    setView(v);
    localStorage.setItem(VIEW_KEY, v);
  };

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [dupError, setDupError] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (
        q &&
        !p.name.toLowerCase().includes(q) &&
        !p.description.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [rows, query, statusFilter]);

  function setStatus(id: string, status: ProjectStatus) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    const fd = new FormData();
    fd.set("id", id);
    fd.set("status", status);
    void updateProjectStatus(fd);
  }

  return (
    <div className="min-h-full w-full">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-hairline px-6 py-3.5 sm:px-8">
        <div className="flex items-center gap-2">
          <Kanban size={18} weight="bold" className="text-ink-faint" />
          <h1 className="text-[16px] font-semibold text-ink">All projects</h1>
          <span className="rounded-full bg-mist px-2 py-0.5 text-[11px] font-medium text-ink-faint">
            {rows.length}
          </span>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {/* search */}
          <div className="flex items-center gap-1.5 rounded-lg border border-hairline px-2.5 py-1.5 text-[12px] focus-within:border-cobalt">
            <MagnifyingGlass size={13} weight="bold" className="text-ink-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="w-24 bg-transparent text-ink outline-none placeholder:text-ink-faint sm:w-40"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="flex h-4 w-4 items-center justify-center rounded-full text-ink-faint hover:bg-mist hover:text-ink"
              >
                <X size={11} weight="bold" />
              </button>
            )}
          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as ProjectStatus | "all")
            }
            className="rounded-lg border border-hairline bg-surface px-2.5 py-1.5 text-[12px] text-ink-soft outline-none focus:border-cobalt"
          >
            <option value="all">All statuses</option>
            {PROJECT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <div className="inline-flex rounded-lg border border-hairline bg-mist/50 p-0.5">
          <button
            onClick={() => changeView("tile")}
            aria-label="Tile view"
            className={`flex h-7 w-7 items-center justify-center rounded-md ${
              view === "tile" ? "bg-surface text-ink shadow-soft" : "text-ink-faint"
            }`}
          >
            <GridFour size={15} weight="bold" />
          </button>
          <button
            onClick={() => changeView("list")}
            aria-label="List view"
            className={`flex h-7 w-7 items-center justify-center rounded-md ${
              view === "list" ? "bg-surface text-ink shadow-soft" : "text-ink-faint"
            }`}
          >
            <Rows size={15} weight="bold" />
          </button>
        </div>

        <div>
          {adding ? (
            <form
              action={createProject}
              onSubmit={(e) => {
                if (e.currentTarget.dataset.submitted === "1") {
                  e.preventDefault();
                  return;
                }
                const name = newName.trim();
                if (!name) {
                  e.preventDefault();
                  setAdding(false);
                  return;
                }
                if (rows.some((p) => p.slug === projectSlug(name))) {
                  e.preventDefault();
                  setDupError(true);
                  return;
                }
                e.currentTarget.dataset.submitted = "1";
              }}
              className="flex items-center gap-2"
            >
              <input
                name="name"
                autoFocus
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  if (dupError) setDupError(false);
                }}
                onBlur={(e) => {
                  if (!e.target.value.trim()) {
                    setAdding(false);
                    setDupError(false);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setAdding(false);
                    setDupError(false);
                  }
                }}
                placeholder="Project name"
                className={`w-48 rounded-lg border bg-surface px-3 py-1.5 text-[13px] outline-none ${
                  dupError
                    ? "border-red-400 focus:border-red-500"
                    : "border-hairline focus:border-cobalt"
                }`}
                required
              />
              <button
                type="submit"
                className="rounded-lg bg-cobalt px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-cobalt-deep"
              >
                Create
              </button>
            </form>
          ) : (
            <button
              onClick={() => {
                setNewName("");
                setDupError(false);
                setAdding(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-cobalt px-3 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-cobalt-deep"
            >
              <Plus size={13} weight="bold" /> New project
            </button>
          )}
        </div>
        </div>
      </div>

      <div>
      {dupError && (
        <p className="px-6 pt-3 text-[12px] font-medium text-red-500 sm:px-8">
          A project with this name already exists.
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="px-6 py-6 text-[14px] text-ink-faint sm:px-8">
          No projects match.
        </p>
      ) : view === "tile" ? (
        <div className="grid gap-4 px-6 py-6 sm:grid-cols-2 sm:px-8 xl:grid-cols-3">
          {filtered.map((p) => (
            <TileCard key={p.id} p={p} onStatus={setStatus} />
          ))}
        </div>
      ) : (
        <div>
          <div
            className={`${LIST_GRID} border-b border-hairline px-6 py-2.5 text-[11px] font-medium uppercase tracking-wide text-ink-faint sm:px-8`}
          >
            <span>Project</span>
            <span className="hidden md:block">Areas</span>
            <span className="hidden md:block">Processes</span>
            <span className="hidden md:block">Updated</span>
            <span>Status</span>
          </div>
          {filtered.map((p) => (
            <ListRow key={p.id} p={p} onStatus={setStatus} />
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

function StatusMenu({
  value,
  onChange,
}: {
  value: ProjectStatus;
  onChange: (s: ProjectStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  const cur =
    PROJECT_STATUSES.find((s) => s.value === value) ?? PROJECT_STATUSES[0];
  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
        style={{ background: cur.bg, color: cur.text }}
      >
        {cur.label}
        <CaretDown size={10} weight="bold" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-36 rounded-lg border border-hairline bg-white p-1 shadow-float">
          {PROJECT_STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen(false);
                if (s.value !== value) onChange(s.value);
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12.5px] text-ink hover:bg-mist"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: s.dot }}
              />
              {s.label}
              {s.value === value && (
                <Check size={12} weight="bold" className="ml-auto text-ink-faint" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TileCard({
  p,
  onStatus,
}: {
  p: DashboardProject;
  onStatus: (id: string, s: ProjectStatus) => void;
}) {
  const color = resolveProjectColor(p.id, p.color);
  const Icon = resolveProjectIcon(p.id, p.icon);
  return (
    <Link
      href={`/project/${p.slug}`}
      className="group flex flex-col rounded-xl border border-hairline bg-white p-4 transition-colors hover:border-ink-faint/40 hover:shadow-soft"
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ background: `${color}1a` }}
        >
          <Icon size={18} weight="bold" color={color} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-ink">{p.name}</p>
          {p.description && (
            <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-ink-soft">
              {p.description}
            </p>
          )}
        </div>
        <StatusMenu value={p.status} onChange={(s) => onStatus(p.id, s)} />
      </div>
      <div className="mt-4 flex items-center gap-4 text-[12px] text-ink-faint">
        <span className="inline-flex items-center gap-1">
          <SquaresFour size={14} weight="bold" />
          {p.areas} areas
        </span>
        <span className="inline-flex items-center gap-1">
          <TreeStructure size={14} weight="bold" />
          {p.processes} processes
        </span>
        {p.updated && <span className="ml-auto">Updated {p.updated}</span>}
      </div>
    </Link>
  );
}

function ListRow({
  p,
  onStatus,
}: {
  p: DashboardProject;
  onStatus: (id: string, s: ProjectStatus) => void;
}) {
  const color = resolveProjectColor(p.id, p.color);
  const Icon = resolveProjectIcon(p.id, p.icon);
  return (
    <Link
      href={`/project/${p.slug}`}
      className={`${LIST_GRID} border-b border-black/[0.04] px-6 py-3 transition-colors hover:bg-mist/40 sm:px-8`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: `${color}1a` }}
        >
          <Icon size={16} weight="bold" color={color} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-ink">{p.name}</p>
          {p.description && (
            <p className="truncate text-[12.5px] text-ink-soft">
              {p.description}
            </p>
          )}
        </div>
      </div>
      <span className="hidden text-[12px] text-ink-faint md:block">
        {p.areas}
      </span>
      <span className="hidden text-[12px] text-ink-faint md:block">
        {p.processes}
      </span>
      <span className="hidden text-[12px] text-ink-faint md:block">
        {p.updated ?? "\u2014"}
      </span>
      <div className="justify-self-start">
        <StatusMenu value={p.status} onChange={(s) => onStatus(p.id, s)} />
      </div>
    </Link>
  );
}
