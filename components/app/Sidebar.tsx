"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  CaretDown,
  CaretRight,
  Gear,
  Kanban,
  Plus,
  Stack,
} from "@phosphor-icons/react";
import { Wordmark } from "@/components/Wordmark";
import { FeedbackModal } from "@/components/app/FeedbackModal";
import {
  useProcessNav,
  type ProcessNavData,
} from "@/components/app/ProcessNavContext";
import { createProject } from "@/app/(app)/actions";
import { logout } from "@/app/(auth)/actions";
import {
  resolveProjectColor,
  resolveProjectIcon,
  stageColor,
} from "@/lib/ui/projectStyle";
import { projectSlug } from "@/lib/slug";
import type { AccessState } from "@/lib/access";
import type { ProcessRow, Project } from "@/lib/types";

export function Sidebar({
  projects,
  email,
  access,
}: {
  projects: Project[];
  email: string;
  access: AccessState;
}) {
  const pathname = usePathname();
  const nav = useProcessNav();
  const processData = nav?.data ?? null;
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [dupError, setDupError] = useState(false);

  function openAdd() {
    setNewName("");
    setDupError(false);
    setAdding(true);
  }

  return (
    <>
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-hairline bg-paper">
        <div className="px-4 pb-2 pt-5">
          <Link href="/process-library" aria-label="Process library">
            <Wordmark className="h-5" />
          </Link>
        </div>

        <nav className="mt-3 flex-1 overflow-y-auto px-2">
          {processData ? (
            <ProcessNavTree data={processData} pathname={pathname} />
          ) : (
          <>
          <Link
            href="/process-library"
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] font-medium transition-colors ${
              pathname === "/process-library"
                ? "bg-mist text-ink"
                : "text-ink-soft hover:bg-mist/60 hover:text-ink"
            }`}
          >
            <Stack size={16} weight="bold" className="text-ink-faint" />
            Process library
          </Link>

          <div className="mb-1 mt-5 flex items-center gap-1 px-2">
            <Link
              href="/projects"
              className={`flex flex-1 items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold transition-colors ${
                pathname === "/projects"
                  ? "bg-mist text-ink"
                  : "text-ink-soft hover:bg-mist/60 hover:text-ink"
              }`}
            >
              <Kanban size={16} weight="bold" className="text-ink-faint" />
              Projects
            </Link>
            <button
              onClick={() => (adding ? setAdding(false) : openAdd())}
              aria-label="Add project"
              title="Add project"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-hairline text-ink-soft transition-colors hover:bg-mist hover:text-ink"
            >
              <Plus size={15} weight="bold" />
            </button>
          </div>

          <ul className="space-y-0.5">
            {projects
              .filter((project) => project.status !== "archived")
              .map((project) => {
              const href = `/project/${projectSlug(project.name)}`;
              const active = pathname === href;
              const color = resolveProjectColor(project.id, project.color);
              const ProjIcon = resolveProjectIcon(project.id, project.icon);
              return (
                <li key={project.id}>
                  <Link
                    href={href}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] font-medium transition-colors ${
                      active
                        ? "bg-white text-ink shadow-soft ring-1 ring-black/[0.04]"
                        : "text-ink-soft hover:bg-mist/60 hover:text-ink"
                    }`}
                  >
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                      style={{ background: `${color}1a` }}
                    >
                      <ProjIcon size={14} weight="bold" color={color} />
                    </span>
                    <span className="truncate">{project.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {adding ? (
            <form
              action={createProject}
              className="mt-1.5 px-1"
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
                const slug = projectSlug(name);
                if (projects.some((p) => projectSlug(p.name) === slug)) {
                  e.preventDefault();
                  setDupError(true);
                  return;
                }
                e.currentTarget.dataset.submitted = "1";
                setAdding(false);
              }}
            >
              <input
                name="name"
                autoFocus
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  if (dupError) setDupError(false);
                }}
                placeholder="Project name"
                onBlur={(e) => {
                  if (!e.target.value.trim()) {
                    setAdding(false);
                    setDupError(false);
                    return;
                  }
                  e.currentTarget.form?.requestSubmit();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setAdding(false);
                    setDupError(false);
                  }
                }}
                className={`w-full rounded-lg border bg-surface px-3 py-1.5 text-[13px] outline-none ${
                  dupError
                    ? "border-red-400 focus:border-red-500"
                    : "border-hairline focus:border-cobalt"
                }`}
                required
              />
              {dupError ? (
                <p className="mt-1 px-1 text-[11px] font-medium text-red-500">
                  A project with this name already exists.
                </p>
              ) : (
                <p className="mt-1 px-1 text-[11px] text-ink-faint">
                  Press Enter to create
                </p>
              )}
            </form>
          ) : (
            <button
              onClick={openAdd}
              className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-ink-faint transition-colors hover:bg-mist/60 hover:text-ink"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-dashed border-ink-faint/40">
                <Plus size={13} weight="bold" />
              </span>
              New project
            </button>
          )}

          {projects.length === 0 && !adding && (
            <p className="px-3 py-1.5 text-[13px] text-ink-faint">
              No projects yet
            </p>
          )}
          </>
          )}
        </nav>

        <div className="space-y-0.5 border-t border-hairline p-2">
          <button
            onClick={() => setFeedbackOpen(true)}
            className="block w-full rounded-lg px-3 py-2 text-left text-[14px] font-medium text-ink-soft transition-colors hover:bg-mist/60 hover:text-ink"
          >
            Suggest a feature
          </button>
          <Link
            href="/settings"
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] font-medium transition-colors ${
              pathname === "/settings"
                ? "bg-mist text-ink"
                : "text-ink-soft hover:bg-mist/60 hover:text-ink"
            }`}
          >
            <Gear size={16} weight="bold" className="text-ink-faint" />
            Settings
            {!access.isSubscribed && access.isTrialing && (
              <span className="ml-auto rounded-full bg-gold-tint px-2 py-0.5 text-[11px] font-semibold text-gold">
                Trial
              </span>
            )}
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="block w-full rounded-lg px-3 py-2 text-left text-[14px] font-medium text-ink-faint transition-colors hover:bg-mist/60 hover:text-ink"
            >
              Log out
            </button>
          </form>
          <p className="truncate px-3 pb-1 pt-1.5 text-[12px] text-ink-faint">
            {email}
          </p>
        </div>
      </aside>

      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  );
}

function ProcessNavTree({
  data,
  pathname,
}: {
  data: ProcessNavData;
  pathname: string;
}) {
  const { project, stages, processes, currentProcessId } = data;
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (id: string) =>
    setCollapsed((c) => ({ ...c, [id]: !c[id] }));

  const bySort = (a: ProcessRow, b: ProcessRow) => a.sort_order - b.sort_order;
  const topOf = (stageId: string) =>
    processes.filter((p) => p.stage_id === stageId && !p.parent_id).sort(bySort);
  const kids = (groupId: string) =>
    processes.filter((p) => p.parent_id === groupId).sort(bySort);
  const unassigned = processes
    .filter(
      (p) =>
        !p.parent_id && (!p.stage_id || !stages.some((s) => s.id === p.stage_id)),
    )
    .sort(bySort);

  const Leaf = ({ proc, depth }: { proc: ProcessRow; depth: number }) => {
    const active = proc.id === currentProcessId;
    const href = `/processes/${proc.id}`;
    return (
      <li>
        <Link
          href={href}
          style={{ paddingLeft: 12 + depth * 14 }}
          className={`flex items-center gap-2 rounded-lg py-1.5 pr-2 text-[13px] transition-colors ${
            active
              ? "bg-white font-semibold text-ink shadow-soft ring-1 ring-black/[0.04]"
              : "font-medium text-ink-soft hover:bg-mist/60 hover:text-ink"
          }`}
        >
          <span className="truncate">{proc.name || "Untitled"}</span>
        </Link>
      </li>
    );
  };

  const Node = ({ proc, depth }: { proc: ProcessRow; depth: number }) => {
    if (!proc.is_group) return <Leaf proc={proc} depth={depth} />;
    const children = kids(proc.id);
    const isCollapsed = collapsed[proc.id];
    return (
      <li>
        <button
          onClick={() => toggle(proc.id)}
          style={{ paddingLeft: 12 + depth * 14 }}
          className="flex w-full items-center gap-1.5 rounded-lg py-1.5 pr-2 text-[13px] font-medium text-ink-soft transition-colors hover:bg-mist/60 hover:text-ink"
        >
          {isCollapsed ? (
            <CaretRight size={12} weight="bold" className="shrink-0 text-ink-faint" />
          ) : (
            <CaretDown size={12} weight="bold" className="shrink-0 text-ink-faint" />
          )}
          <span className="truncate">{proc.name || "Group"}</span>
        </button>
        {!isCollapsed && children.length > 0 && (
          <ul className="space-y-0.5">
            {children.map((c) => (
              <Node key={c.id} proc={c} depth={depth + 1} />
            ))}
          </ul>
        )}
      </li>
    );
  };

  const active = pathname === `/project/${projectSlug(project.name)}`;

  return (
    <div>
      <Link
        href={`/project/${projectSlug(project.name)}`}
        className={`mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors ${
          active ? "bg-mist text-ink" : "text-ink-soft hover:bg-mist/60 hover:text-ink"
        }`}
      >
        <ArrowLeft size={15} weight="bold" className="shrink-0 text-ink-faint" />
        <span className="truncate">{project.name}</span>
      </Link>

      <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
        Processes
      </p>

      <div className="space-y-2">
        {stages.map((stage) => {
          const items = topOf(stage.id);
          const c = stageColor(stage.color);
          return (
            <div key={stage.id}>
              <div className="flex items-center gap-2 px-3 py-1">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: c.fill }}
                />
                <span className="truncate text-[12.5px] font-semibold text-ink">
                  {stage.name}
                </span>
                <span className="ml-auto text-[11px] tabular-nums text-ink-faint">
                  {items.length}
                </span>
              </div>
              {items.length > 0 && (
                <ul className="space-y-0.5">
                  {items.map((p) => (
                    <Node key={p.id} proc={p} depth={1} />
                  ))}
                </ul>
              )}
            </div>
          );
        })}

        {unassigned.length > 0 && (
          <div>
            <div className="flex items-center gap-2 px-3 py-1">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-ink-faint/40" />
              <span className="truncate text-[12.5px] font-semibold text-ink">
                Unassigned
              </span>
              <span className="ml-auto text-[11px] tabular-nums text-ink-faint">
                {unassigned.length}
              </span>
            </div>
            <ul className="space-y-0.5">
              {unassigned.map((p) => (
                <Node key={p.id} proc={p} depth={1} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
