"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  CaretDown,
  CaretUp,
  Check,
  DownloadSimple,
  FunnelSimple,
  MagnifyingGlass,
  Plus,
  Stack,
  Trash,
  X,
} from "@phosphor-icons/react";
import {
  createProcess,
  deleteProcess,
  updateProcessOwner,
  updateProcessStatus,
} from "@/app/(app)/actions";
import {
  initials,
  ownerColor,
  processIcon,
  relativeTime,
  resolveProjectColor,
  splitOwners,
} from "@/lib/ui/projectStyle";
import { readDiagramPrefs } from "@/lib/bpmn/diagramPrefs";

type RawStatus = "draft" | "in_review" | "approved";

export type LibraryRow = {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  owner: string;
  status: RawStatus;
  edited: string; // ISO
};

export type LibraryProject = {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  stages: { id: string; name: string }[];
};

const STATUS_META: Record<
  RawStatus,
  { label: string; bg: string; dot: string; text: string; rank: number }
> = {
  approved: { label: "Published", bg: "#e7f6ec", dot: "#22a35b", text: "#1a7f45", rank: 0 },
  in_review: { label: "In review", bg: "#fef3d6", dot: "#f59e0b", text: "#b26a02", rank: 1 },
  draft: { label: "Draft", bg: "#ecebe8", dot: "#9a958c", text: "#6b675f", rank: 2 },
};

const STATUS_ORDER: RawStatus[] = ["approved", "in_review", "draft"];

type SortKey = "name" | "project" | "owner" | "edited" | "status";
type SortDir = "asc" | "desc";

const GRID =
  "grid grid-cols-[1.5fr_0.8fr_32px] items-center gap-3 md:grid-cols-[1.8fr_1.2fr_0.8fr_0.7fr_0.9fr_32px]";

export function ProcessLibrary({
  rows,
  projects,
}: {
  rows: LibraryRow[];
  projects: LibraryProject[];
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Set<RawStatus>>(new Set());
  const [projectFilter, setProjectFilter] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("edited");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterOpen, setFilterOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Resolve each project's accent to its user-chosen colour (falling back to the
  // deterministic default) so chips/dots match the sidebar and project page.
  const accentOf = useCallback(
    (id: string) =>
      resolveProjectColor(id, projects.find((p) => p.id === id)?.color),
    [projects],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = rows.filter((r) => {
      if (statusFilter.size && !statusFilter.has(r.status)) return false;
      if (projectFilter.size && !projectFilter.has(r.projectId)) return false;
      if (
        q &&
        !r.name.toLowerCase().includes(q) &&
        !r.projectName.toLowerCase().includes(q) &&
        !r.owner.toLowerCase().includes(q)
      )
        return false;
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    out.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "project":
          cmp = a.projectName.localeCompare(b.projectName);
          break;
        case "owner":
          cmp = a.owner.localeCompare(b.owner);
          break;
        case "status":
          cmp = STATUS_META[a.status].rank - STATUS_META[b.status].rank;
          break;
        case "edited":
          cmp = new Date(a.edited).getTime() - new Date(b.edited).getTime();
          break;
      }
      return cmp * dir;
    });
    return out;
  }, [rows, query, statusFilter, projectFilter, sortKey, sortDir]);

  const activeFilters = statusFilter.size + projectFilter.size;
  const isFiltered = activeFilters > 0 || query.trim().length > 0;

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "edited" ? "desc" : "asc");
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const { exportLibraryPdf } = await import("@/lib/export/exportLibrary");
      const parts: string[] = [];
      if (query.trim()) parts.push(`search "${query.trim()}"`);
      if (statusFilter.size)
        parts.push(
          [...statusFilter].map((s) => STATUS_META[s].label).join(", "),
        );
      if (projectFilter.size) {
        const names = projects
          .filter((p) => projectFilter.has(p.id))
          .map((p) => p.name);
        parts.push(names.join(", "));
      }
      const subtitle =
        `${filtered.length} process${filtered.length === 1 ? "" : "es"}` +
        (parts.length ? ` · ${parts.join(" · ")}` : "");

      await exportLibraryPdf({
        subtitle,
        rows: filtered.map((r) => ({
          name: r.name,
          project: r.projectName,
          accent: accentOf(r.projectId),
          owners: splitOwners(r.owner).map((n) => ({
            initials: initials(n),
            color: ownerColor(n),
          })),
          edited: relativeTime(r.edited),
          status: STATUS_META[r.status].label,
        })),
      });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="min-h-full w-full">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-hairline px-6 py-3.5 sm:px-8">
        <div className="flex items-center gap-2">
          <Stack size={18} weight="bold" className="text-ink-faint" />
          <h1 className="text-[16px] font-semibold text-ink">All processes</h1>
          <span className="rounded-full bg-mist px-2 py-0.5 text-[11px] font-medium text-ink-faint">
            {filtered.length}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
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

          {/* filter */}
          <div className="relative">
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] transition-colors ${
                activeFilters
                  ? "border-cobalt/40 bg-cobalt-wash text-cobalt"
                  : "border-hairline text-ink-soft hover:border-ink-faint"
              }`}
            >
              <FunnelSimple size={13} weight="bold" />
              <span>Filter</span>
              {activeFilters > 0 && (
                <span className="rounded-full bg-cobalt px-1.5 text-[10px] font-semibold text-white">
                  {activeFilters}
                </span>
              )}
            </button>
            {filterOpen && (
              <FilterPanel
                projects={projects}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                projectFilter={projectFilter}
                setProjectFilter={setProjectFilter}
                onClose={() => setFilterOpen(false)}
              />
            )}
          </div>

          {/* export */}
          <button
            onClick={handleExport}
            disabled={exporting || filtered.length === 0}
            title="Export this view to PDF"
            className="flex items-center gap-1.5 rounded-lg border border-hairline px-2.5 py-1.5 text-[12px] text-ink-soft transition-colors hover:border-ink-faint disabled:opacity-50"
          >
            <DownloadSimple size={13} weight="bold" />
            <span>{exporting ? "Exporting\u2026" : "Export"}</span>
          </button>

          {/* new */}
          <div className="relative">
            <button
              onClick={() => setNewOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg bg-cobalt px-2.5 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-cobalt-deep"
            >
              <Plus size={13} weight="bold" />
              <span>New</span>
            </button>
            {newOpen && (
              <NewProcessPanel
                projects={projects}
                onClose={() => setNewOpen(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* table header */}
      <div
        className={`${GRID} border-b border-hairline px-6 py-2.5 text-[11px] font-medium uppercase tracking-wide text-ink-faint sm:px-8`}
      >
        <HeaderCell label="Process" k="name" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
        <HeaderCell label="Project" k="project" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="hidden md:flex" />
        <HeaderCell label="Owner" k="owner" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="hidden md:flex" />
        <HeaderCell label="Edited" k="edited" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="hidden md:flex" />
        <HeaderCell label="Status" k="status" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="justify-end md:justify-start" />
        <span />
      </div>

      {/* rows */}
      {filtered.length > 0 ? (
        <div>
          {filtered.map((r) => (
            <RowItem key={r.id} row={r} accent={accentOf(r.projectId)} />
          ))}
        </div>
      ) : (
        <div className="px-6 py-16 text-center">
          <p className="text-[14px] font-medium text-ink">
            {rows.length === 0
              ? "No processes yet"
              : "No processes match your filters"}
          </p>
          <p className="mt-1 text-[13px] text-ink-faint">
            {rows.length === 0
              ? "Create your first process to start building your library."
              : "Try clearing search or filters."}
          </p>
          {isFiltered && rows.length > 0 && (
            <button
              onClick={() => {
                setQuery("");
                setStatusFilter(new Set());
                setProjectFilter(new Set());
              }}
              className="mt-3 text-[13px] font-semibold text-cobalt hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------- rows */

function RowItem({ row, accent }: { row: LibraryRow; accent: string }) {
  const [editingOwner, setEditingOwner] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const s = STATUS_META[row.status];
  const Glyph = processIcon(row.id);
  const owners = splitOwners(row.owner);

  return (
    <div
      className={`${GRID} group relative border-b border-black/[0.04] px-6 py-2.5 transition-colors hover:bg-mist/40 sm:px-8`}
    >
      {/* process name (link into editor) */}
      <Link
        href={`/processes/${row.id}`}
        className="flex min-w-0 items-center gap-2.5"
      >
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
          style={{ background: `${accent}1a` }}
        >
          <Glyph size={13} weight="bold" color={accent} />
        </span>
        <span className="truncate text-[13px] font-medium text-ink hover:underline">
          {row.name}
        </span>
      </Link>

      {/* project chip */}
      <div className="hidden min-w-0 md:block">
        <span
          className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full px-2 py-0.5 text-[11px] font-medium"
          style={{ background: `${accent}14`, color: accent }}
        >
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ background: accent }}
          />
          <span className="truncate">{row.projectName}</span>
        </span>
      </div>

      {/* owner (click to edit) */}
      <div className="hidden items-center md:flex">
        {editingOwner ? (
          <form
            action={updateProcessOwner}
            onSubmit={() => setEditingOwner(false)}
            className="w-full"
          >
            <input type="hidden" name="id" value={row.id} />
            <input type="hidden" name="projectId" value={row.projectId} />
            <input
              name="owner"
              defaultValue={row.owner}
              autoFocus
              placeholder="Owner name"
              onBlur={(e) => e.currentTarget.form?.requestSubmit()}
              onKeyDown={(e) => {
                if (e.key === "Escape") setEditingOwner(false);
              }}
              className="w-full rounded border border-cobalt/50 bg-surface px-1.5 py-0.5 text-[12px] outline-none"
            />
          </form>
        ) : (
          <button
            onClick={() => setEditingOwner(true)}
            title={row.owner ? `${row.owner} — click to edit` : "Set owner"}
            className="flex items-center gap-1"
          >
            {owners.length > 0 ? (
              <>
                <span className="flex -space-x-1.5">
                  {owners.slice(0, 3).map((n, i) => (
                    <span
                      key={`${n}-${i}`}
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white ring-2 ring-surface"
                      style={{ background: ownerColor(n) }}
                    >
                      {initials(n)}
                    </span>
                  ))}
                </span>
                {owners.length > 3 && (
                  <span className="text-[10px] font-medium text-ink-faint">
                    +{owners.length - 3}
                  </span>
                )}
              </>
            ) : (
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-ink-faint/50 text-[9px] font-bold text-ink-faint">
                +
              </span>
            )}
          </button>
        )}
      </div>

      {/* edited */}
      <span className="hidden truncate text-[12px] text-ink-faint md:block">
        {relativeTime(row.edited)}
      </span>

      {/* status (click to change) */}
      <div className="relative flex justify-end md:justify-start">
        <button
          onClick={() => setStatusOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium transition-opacity hover:opacity-80"
          style={{ background: s.bg, color: s.text }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.dot }} />
          {s.label}
          <CaretDown size={9} weight="bold" />
        </button>
        {statusOpen && (
          <>
            <button
              className="fixed inset-0 z-30 cursor-default"
              aria-label="Close"
              onClick={() => setStatusOpen(false)}
            />
            <form
              action={updateProcessStatus}
              onSubmit={() => setStatusOpen(false)}
              className="absolute right-0 top-full z-40 mt-1 w-36 rounded-xl border border-hairline bg-surface p-1 shadow-float md:left-0 md:right-auto"
            >
              <input type="hidden" name="id" value={row.id} />
              <input type="hidden" name="projectId" value={row.projectId} />
              {STATUS_ORDER.map((st) => {
                const m = STATUS_META[st];
                return (
                  <button
                    key={st}
                    type="submit"
                    name="status"
                    value={st}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] text-ink hover:bg-mist"
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: m.dot }}
                    />
                    {m.label}
                    {st === row.status && (
                      <Check size={11} weight="bold" className="ml-auto text-cobalt" />
                    )}
                  </button>
                );
              })}
            </form>
          </>
        )}
      </div>

      {/* delete */}
      <form
        action={deleteProcess}
        onSubmit={(e) => {
          if (!confirm(`Delete process "${row.name}"?`)) e.preventDefault();
        }}
        className="flex justify-end"
      >
        <input type="hidden" name="id" value={row.id} />
        <input type="hidden" name="projectId" value={row.projectId} />
        <input type="hidden" name="stay" value="1" />
        <button
          type="submit"
          aria-label={`Delete ${row.name}`}
          className="flex h-6 w-6 items-center justify-center rounded-md text-ink-faint opacity-0 transition-colors hover:bg-ember-tint hover:text-signal group-hover:opacity-100"
        >
          <Trash size={14} weight="bold" />
        </button>
      </form>
    </div>
  );
}

/* --------------------------------------------------------------- header cell */

function HeaderCell({
  label,
  k,
  sortKey,
  sortDir,
  onSort,
  className = "",
}: {
  label: string;
  k: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
  className?: string;
}) {
  const active = sortKey === k;
  return (
    <button
      onClick={() => onSort(k)}
      className={`flex items-center gap-1 uppercase tracking-wide transition-colors hover:text-ink ${
        active ? "text-ink" : ""
      } ${className}`}
    >
      <span>{label}</span>
      {active &&
        (sortDir === "asc" ? (
          <CaretUp size={10} weight="bold" />
        ) : (
          <CaretDown size={10} weight="bold" />
        ))}
    </button>
  );
}

/* ------------------------------------------------------------------- filter */

function FilterPanel({
  projects,
  statusFilter,
  setStatusFilter,
  projectFilter,
  setProjectFilter,
  onClose,
}: {
  projects: LibraryProject[];
  statusFilter: Set<RawStatus>;
  setStatusFilter: (s: Set<RawStatus>) => void;
  projectFilter: Set<string>;
  setProjectFilter: (s: Set<string>) => void;
  onClose: () => void;
}) {
  const toggle = <T,>(set: Set<T>, val: T, apply: (s: Set<T>) => void) => {
    const next = new Set(set);
    next.has(val) ? next.delete(val) : next.add(val);
    apply(next);
  };

  return (
    <>
      <button
        className="fixed inset-0 z-30 cursor-default"
        aria-label="Close filter"
        onClick={onClose}
      />
      <div className="absolute right-0 top-full z-40 mt-1.5 w-56 rounded-xl border border-hairline bg-surface p-2 shadow-float">
        <p className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
          Status
        </p>
        {STATUS_ORDER.map((st) => (
          <CheckRow
            key={st}
            label={STATUS_META[st].label}
            dot={STATUS_META[st].dot}
            checked={statusFilter.has(st)}
            onClick={() => toggle(statusFilter, st, setStatusFilter)}
          />
        ))}

        {projects.length > 0 && (
          <>
            <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
              Project
            </p>
            <div className="max-h-44 overflow-y-auto">
              {projects.map((p) => (
                <CheckRow
                  key={p.id}
                  label={p.name}
                  dot={resolveProjectColor(p.id, p.color)}
                  checked={projectFilter.has(p.id)}
                  onClick={() => toggle(projectFilter, p.id, setProjectFilter)}
                />
              ))}
            </div>
          </>
        )}

        {(statusFilter.size > 0 || projectFilter.size > 0) && (
          <button
            onClick={() => {
              setStatusFilter(new Set());
              setProjectFilter(new Set());
            }}
            className="mt-1 w-full rounded-lg px-2 py-1.5 text-left text-[12px] font-medium text-ink-faint hover:bg-mist hover:text-ink"
          >
            Clear all
          </button>
        )}
      </div>
    </>
  );
}

function CheckRow({
  label,
  dot,
  checked,
  onClick,
}: {
  label: string;
  dot: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] text-ink hover:bg-mist"
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
          checked ? "border-cobalt bg-cobalt text-white" : "border-hairline"
        }`}
      >
        {checked && <Check size={10} weight="bold" />}
      </span>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: dot }} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </button>
  );
}

/* ---------------------------------------------------------------- new process */

function NewProcessPanel({
  projects,
  onClose,
}: {
  projects: LibraryProject[];
  onClose: () => void;
}) {
  const [projQuery, setProjQuery] = useState("");
  const [selectedId, setSelectedId] = useState(projects[0]?.id ?? "");
  const [listOpen, setListOpen] = useState(false);

  const selected = projects.find((p) => p.id === selectedId);
  const matches = projects.filter((p) =>
    p.name.toLowerCase().includes(projQuery.trim().toLowerCase()),
  );

  return (
    <>
      <button
        className="fixed inset-0 z-30 cursor-default"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="absolute right-0 top-full z-40 mt-1.5 w-72 rounded-xl border border-hairline bg-surface p-3 shadow-float">
        {projects.length === 0 ? (
          <p className="px-1 py-2 text-[12px] text-ink-soft">
            Create a project first, then add processes to it.
          </p>
        ) : (
          <form
            action={(fd) => {
              const prefs = readDiagramPrefs(String(fd.get("projectId") ?? ""));
              fd.set("borderWeight", prefs.border);
              fd.set("connectorWeight", prefs.connector);
              fd.set("cornerStyle", prefs.corner);
              createProcess(fd);
            }}
            className="space-y-2.5"
          >
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                Process name
              </label>
              <input
                name="name"
                autoFocus
                placeholder="e.g. Vendor Onboarding"
                required
                className="w-full rounded-lg border border-hairline bg-surface px-2.5 py-1.5 text-[13px] outline-none focus:border-cobalt"
              />
            </div>

            {/* searchable project combobox */}
            <div className="relative">
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                Project
              </label>
              <input type="hidden" name="projectId" value={selectedId} />
              <input
                value={listOpen ? projQuery : selected?.name ?? ""}
                onChange={(e) => {
                  setProjQuery(e.target.value);
                  setListOpen(true);
                }}
                onFocus={() => {
                  setProjQuery("");
                  setListOpen(true);
                }}
                placeholder={"Search projects\u2026"}
                className="w-full rounded-lg border border-hairline bg-surface px-2.5 py-1.5 text-[13px] outline-none focus:border-cobalt"
              />
              {listOpen && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-40 overflow-y-auto rounded-lg border border-hairline bg-surface py-1 shadow-float">
                  {matches.length === 0 && (
                    <p className="px-2.5 py-1.5 text-[12px] text-ink-faint">
                      No matches
                    </p>
                  )}
                  {matches.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSelectedId(p.id);
                        setListOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[12px] hover:bg-mist ${
                        p.id === selectedId ? "text-cobalt" : "text-ink"
                      }`}
                    >
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: resolveProjectColor(p.id, p.color) }}
                      />
                      <span className="min-w-0 flex-1 truncate">{p.name}</span>
                      {p.id === selectedId && (
                        <Check size={11} weight="bold" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* chevron / stage */}
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                Chevron
              </label>
              <select
                name="stageId"
                key={selectedId}
                defaultValue=""
                className="w-full rounded-lg border border-hairline bg-surface px-2.5 py-1.5 text-[13px] outline-none focus:border-cobalt"
              >
                <option value="">Unassigned (drag in later)</option>
                {(selected?.stages ?? []).map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={!selectedId}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-cobalt px-3 py-2 text-[13px] font-semibold text-white hover:bg-cobalt-deep disabled:opacity-50"
            >
              <Plus size={13} weight="bold" /> Create process
            </button>
          </form>
        )}
      </div>
    </>
  );
}
