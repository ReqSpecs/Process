"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ArrowsLeftRight,
  CaretDown,
  CaretRight,
  ChartLineUp,
  Check,
  CreditCard,
  DotsThreeVertical,
  FilePlus,
  FolderSimple,
  ListChecks,
  MagnifyingGlass,
  Package,
  PaperPlaneTilt,
  PencilSimple,
  Plus,
  Receipt,
  SealCheck,
  ShieldCheck,
  SquaresFour,
  TreeStructure,
  Trash,
  type Icon,
} from "@phosphor-icons/react";
import {
  createProcess,
  createStage,
  deleteProcess,
  deleteProject,
  deleteStage,
  renameProject,
  reorderProcesses,
  reorderStages,
  updateProjectAppearance,
  updateProjectDescription,
  updateProjectStatus,
  updateStage,
} from "@/app/(app)/actions";
import { ExportProjectButton } from "@/components/app/ExportProjectButton";
import { ConfirmDeleteModal } from "@/components/app/ConfirmDeleteModal";
import {
  PROJECT_COLOR_LIBRARY,
  PROJECT_ICON_LIBRARY,
  PROJECT_STATUSES,
  resolveProjectColor,
  resolveProjectIcon,
} from "@/lib/ui/projectStyle";
import { projectSlug } from "@/lib/slug";
import { readDiagramPrefs } from "@/lib/bpmn/diagramPrefs";
// The list createStage assigns colours from — shared so an optimistic chevron
// can't be given a different colour than the one about to be stored.
import { STAGE_COLOR_ORDER } from "@/lib/types";
import type {
  ArchitectureStage,
  ProcessRow,
  Project,
  ProjectStatus,
  StageColor,
} from "@/lib/types";

const NAVY = "#12244d";

const STAGE_COLORS: Record<
  StageColor,
  { fill: string; ink: string; light?: boolean }
> = {
  lime: { fill: "#AEF029", ink: "#7a9e00", light: true },
  violet: { fill: "#7C3AED", ink: "#7C3AED" },
  cobalt: { fill: "#0047AB", ink: "#0047AB" },
  ember: { fill: "#FF5722", ink: "#FF5722" },
  magenta: { fill: "#E81E62", ink: "#E81E62" },
  teal: { fill: "#0F9E7A", ink: "#0F9E7A" },
  gold: { fill: "#b45309", ink: "#b45309" },
};

const COLOR_CYCLE: StageColor[] = [
  "lime",
  "violet",
  "cobalt",
  "ember",
  "magenta",
  "teal",
  "gold",
];

// Blunt start (flat left) vs. open-ended (notched left) — 16px arrow.
const CHEV_BLUNT =
  "polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%)";
const CHEV_OPEN =
  "polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%, 16px 50%)";
const MINI_OPEN =
  "polygon(0 0, calc(100% - 11px) 0, 100% 50%, calc(100% - 11px) 100%, 0 100%, 11px 50%)";
// Same chevron inset by a uniform ~2px perpendicular stroke (angled edges need a
// larger horizontal offset than flats to keep the border thickness even).
const MINI_OPEN_INNER =
  "polygon(3.8px 2px, calc(100% - 12.05px) 2px, calc(100% - 2.43px) 50%, calc(100% - 12.05px) calc(100% - 2px), 3.8px calc(100% - 2px), 13.43px 50%)";

const COL_MIN = 210;

const PROC_ICONS: Icon[] = [
  FilePlus,
  ListChecks,
  SealCheck,
  ArrowsLeftRight,
  PaperPlaneTilt,
  ShieldCheck,
  Receipt,
  Package,
  CreditCard,
  MagnifyingGlass,
  ChartLineUp,
];

function hash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}
function iconFor(id: string): Icon {
  return PROC_ICONS[hash(id) % PROC_ICONS.length];
}
function colorOf(stage: ArchitectureStage) {
  return STAGE_COLORS[stage.color] ?? STAGE_COLORS.cobalt;
}
function nextColor(color: StageColor): StageColor {
  return COLOR_CYCLE[(COLOR_CYCLE.indexOf(color) + 1) % COLOR_CYCLE.length];
}

// Submit an inline create/edit form on blur. Empty values close instead of
// creating blanks. Deduplication lives in guardInlineSubmit, so every route into
// the form — blur, Enter, or the button — is counted the same way.
function submitInlineOnBlur(
  e: React.FocusEvent<HTMLInputElement>,
  onEmpty: () => void,
) {
  if (!e.currentTarget.value.trim()) {
    onEmpty();
    return;
  }
  e.currentTarget.form?.requestSubmit();
}

/**
 * First submit wins; anything after it is a duplicate.
 *
 * Clicking the submit button blurs the input first, so the blur handler submits
 * and then the click submits the same form again a few milliseconds later —
 * which inserts two rows. React skips a form action when the submit event is
 * already default-prevented, so cancelling here is enough to drop the second.
 */
function guardInlineSubmit(e: React.FormEvent<HTMLFormElement>): void {
  const form = e.currentTarget;
  if (form.dataset.submitted === "1") {
    e.preventDefault();
    return;
  }
  form.dataset.submitted = "1";
}

/* ------------------------------------------------------- optimistic creates */

/*
 * Creating anything costs a round trip to the server action plus a route
 * revalidation — well over a second. Rather than watch a spinner, we render the
 * new row straight away and let the server catch up. The client mints the id and
 * sends it along, so when the revalidated data arrives it contains this exact
 * row and React reconciles it away to nothing.
 *
 * Fields the board doesn't read (the diagram XML, doc status, owner) are left at
 * placeholder values; the real ones come back with the revalidation.
 */

function optimisticStage(
  id: string,
  projectId: string,
  name: string,
  existing: ArchitectureStage[],
): ArchitectureStage {
  const now = new Date().toISOString();
  return {
    id,
    project_id: projectId,
    name,
    // Same formulas as createStage, so the chevron never changes under them.
    color: STAGE_COLOR_ORDER[existing.length % STAGE_COLOR_ORDER.length],
    sort_order: existing.reduce((max, s) => Math.max(max, s.sort_order), -1) + 1,
    created_at: now,
    updated_at: now,
  };
}

function optimisticProcess(
  id: string,
  projectId: string,
  stageId: string | null,
  parentId: string | null,
  isGroup: boolean,
  name: string,
): ProcessRow {
  const now = new Date().toISOString();
  return {
    id,
    project_id: projectId,
    stage_id: stageId,
    parent_id: parentId,
    is_group: isGroup,
    name,
    bpmn_xml: "",
    doc_owner: "",
    doc_status: "draft",
    doc_inputs: "",
    doc_outputs: "",
    doc_systems: "",
    doc_risks: "",
    doc_notes: "",
    // createProcess leaves sort_order at its default, so new rows tie and fall
    // back to created_at — which puts this one last, where it was just added.
    sort_order: 0,
    created_at: now,
    updated_at: now,
  };
}

/** Lets the process/group forms, nested deep in the board, seed a new row. */
const AddProcessCtx = createContext<AddRow<ProcessRow>>(() => {});

type AddRow<T> = (row: T, done: Promise<unknown>) => void;

/**
 * Server rows, with rows we've just created layered on top until the server
 * confirms them.
 *
 * The layering isn't optional. Next runs server actions one at a time, so
 * creating two things in quick succession means the first one's revalidated data
 * arrives *after* the second row was added and doesn't contain it — a plain
 * "server data wins" sync would blink the new row off the board for a second,
 * which looks far more broken than the delay we're removing.
 *
 * A pending row is dropped once the server sends it back, or once its own insert
 * has finished and the next batch of data still doesn't have it — which means the
 * insert failed and the row was never real.
 */
function useCreatedRows<T extends { id: string }>(serverRows: T[]) {
  const [rows, setRows] = useState<T[]>(serverRows);
  const pending = useRef(new Map<string, { row: T; settled: boolean }>());

  useEffect(() => {
    const known = new Set(serverRows.map((r) => r.id));
    for (const [id, p] of pending.current) {
      if (known.has(id) || p.settled) pending.current.delete(id);
    }
    setRows([
      ...serverRows,
      ...Array.from(pending.current.values(), (p) => p.row),
    ]);
  }, [serverRows]);

  const add = useCallback<AddRow<T>>((row, done) => {
    pending.current.set(row.id, { row, settled: false });
    setRows((prev) => [...prev, row]);
    const settle = () => {
      const p = pending.current.get(row.id);
      if (p) p.settled = true;
    };
    // Both arms: a rejected insert has to stop protecting the row too.
    void done.then(settle, settle);
  }, []);

  return { rows, setRows, add };
}

/* --------------------------------------------------------- drag context */

type DropHint = { key: string; index: number; top: number } | null;
type ListInfo = { el: HTMLElement; stageId: string | null; parentId: string | null };
type DragCtx = {
  draggingId: string | null;
  hint: DropHint;
  start: (id: string) => void;
  end: () => void;
  register: (key: string, info: ListInfo) => void;
  unregister: (key: string) => void;
  selected: Set<string>;
  isSelected: (id: string) => boolean;
  toggleSelect: (id: string, stageId: string | null) => void;
  clearSelect: () => void;
};
const DragContext = createContext<DragCtx | null>(null);
const useDrag = () => useContext(DragContext)!;

type DeleteTarget =
  | { kind: "stage"; id: string; name: string; count: number }
  | { kind: "process"; id: string; name: string }
  | { kind: "group"; id: string; name: string; count: number }
  | { kind: "project"; id: string; name: string }
  | { kind: "multi"; ids: string[]; count: number }
  | null;

/* ================================================================ main */

export function ProjectView({
  project,
  stages,
  processes,
  otherProjectNames = [],
}: {
  project: Project;
  stages: ArchitectureStage[];
  processes: ProcessRow[];
  otherProjectNames?: string[];
}) {
  const takenSlugs = new Set(otherProjectNames.map(projectSlug));
  const [nameError, setNameError] = useState(false);
  const [iconKey, setIconKey] = useState<string | null>(project.icon ?? null);
  const [iconColor, setIconColor] = useState<string | null>(
    project.color ?? null,
  );
  useEffect(() => setIconKey(project.icon ?? null), [project.icon]);
  useEffect(() => setIconColor(project.color ?? null), [project.color]);
  const accent = resolveProjectColor(project.id, iconColor);
  const ProjIcon = resolveProjectIcon(project.id, iconKey);

  function saveAppearance(nextIcon: string | null, nextColor: string | null) {
    setIconKey(nextIcon);
    setIconColor(nextColor);
    const fd = new FormData();
    fd.set("id", project.id);
    if (nextIcon) fd.set("icon", nextIcon);
    if (nextColor) fd.set("color", nextColor);
    void updateProjectAppearance(fd);
  }

  const {
    rows: items,
    setRows: setItems,
    add: addProcess,
  } = useCreatedRows(processes);

  const {
    rows: stageList,
    setRows: setStageList,
    add: addStage,
  } = useCreatedRows(stages);

  const [view, setView] = useState<"modern" | "traditional">("modern");
  useEffect(() => {
    const saved = localStorage.getItem(`prodraw:view:${project.id}`);
    if (saved === "traditional" || saved === "modern") setView(saved);
  }, [project.id]);
  const changeView = (v: "modern" | "traditional") => {
    setView(v);
    localStorage.setItem(`prodraw:view:${project.id}`, v);
    clearSelect();
  };

  const [addingStage, setAddingStage] = useState(false);
  const [delTarget, setDelTarget] = useState<DeleteTarget>(null);

  // process drag state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hint, setHint] = useState<DropHint>(null);
  const draggingRef = useRef<string | null>(null);
  const hintRef = useRef<DropHint>(null);
  const listsRef = useRef<Map<string, ListInfo>>(new Map());

  const register = useCallback((key: string, info: ListInfo) => {
    listsRef.current.set(key, info);
  }, []);
  const unregister = useCallback((key: string) => {
    listsRef.current.delete(key);
  }, []);

  // Multi-select: ctrl/cmd-click gathers processes within a single chevron so
  // they can be deleted or dragged together. Scope is one chevron at a time —
  // picking a process in a different chevron starts a fresh selection.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const selStageRef = useRef<string | null>(null);
  const isSelected = useCallback((id: string) => selected.has(id), [selected]);
  const toggleSelect = useCallback((id: string, stageId: string | null) => {
    setSelected((prev) => {
      let next = new Set(prev);
      if (next.size > 0 && selStageRef.current !== (stageId ?? null)) {
        next = new Set();
      }
      if (next.has(id)) next.delete(id);
      else next.add(id);
      selStageRef.current = next.size > 0 ? (stageId ?? null) : null;
      return next;
    });
  }, []);
  const clearSelect = useCallback(() => {
    selStageRef.current = null;
    setSelected((prev) => (prev.size === 0 ? prev : new Set()));
  }, []);

  // Keep the selection honest when the underlying processes change.
  useEffect(() => {
    setSelected((prev) => {
      if (prev.size === 0) return prev;
      const next = new Set([...prev].filter((id) => items.some((p) => p.id === id)));
      return next.size === prev.size ? prev : next;
    });
  }, [items]);

  // Escape clears the current selection.
  useEffect(() => {
    if (selected.size === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") clearSelect();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected.size, clearSelect]);

  function deleteMany(ids: string[]) {
    const idSet = new Set(ids);
    setItems((prev) =>
      prev.filter((p) => !idSet.has(p.id) && !idSet.has(p.parent_id ?? "")),
    );
    ids.forEach((id) => {
      const fd = new FormData();
      fd.set("id", id);
      fd.set("projectId", project.id);
      fd.set("stay", "1");
      void deleteProcess(fd);
    });
    clearSelect();
  }

  // Safety net: guarantee drag state is cleared at the end of every drag, even
  // when the dragged card's React node unmounts on drop (e.g. moving the last
  // Unassigned item removes its whole section, so the element's own onDragEnd
  // may never fire). Without this the board could stay in a permanent "dragging"
  // state and the next drag would feel stuck.
  useEffect(() => {
    const reset = () => {
      draggingRef.current = null;
      hintRef.current = null;
      setDraggingId(null);
      setHint(null);
    };
    window.addEventListener("dragend", reset);
    window.addEventListener("drop", reset);
    return () => {
      window.removeEventListener("dragend", reset);
      window.removeEventListener("drop", reset);
    };
  }, []);

  const topItems = useCallback(
    (stageId: string | null) =>
      items
        .filter((p) =>
          stageId
            ? p.stage_id === stageId && !p.parent_id
            : !p.parent_id &&
              (!p.stage_id || !stageList.some((s) => s.id === p.stage_id)),
        )
        .sort((a, b) => a.sort_order - b.sort_order),
    [items, stageList],
  );
  const childrenOf = useCallback(
    (groupId: string) =>
      items
        .filter((p) => p.parent_id === groupId)
        .sort((a, b) => a.sort_order - b.sort_order),
    [items],
  );

  const unassigned = topItems(null);

  const applyHint = useCallback((h: DropHint) => {
    hintRef.current = h;
    setHint((prev) => {
      if (!prev && !h) return prev;
      if (prev && h && prev.key === h.key && prev.index === h.index) return prev;
      return h;
    });
  }, []);

  // Deterministic drop target: the innermost registered list under the cursor.
  const hitTest = useCallback((x: number, y: number): DropHint => {
    let best: { key: string; el: HTMLElement; rect: DOMRect } | null = null;
    let bestArea = Infinity;
    for (const [key, info] of listsRef.current) {
      const r = info.el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        const area = r.width * r.height;
        if (area < bestArea) {
          bestArea = area;
          best = { key, el: info.el, rect: r };
        }
      }
    }
    if (!best) return null;
    const cards = Array.from(
      best.el.querySelectorAll(":scope > [data-card]"),
    ) as HTMLElement[];
    let index = cards.length;
    for (let i = 0; i < cards.length; i++) {
      const cr = cards[i].getBoundingClientRect();
      if (y < cr.top + cr.height / 2) {
        index = i;
        break;
      }
    }
    let top: number;
    if (cards.length === 0) top = 6;
    else if (index < cards.length)
      top = cards[index].getBoundingClientRect().top - best.rect.top;
    else top = cards[cards.length - 1].getBoundingClientRect().bottom - best.rect.top;
    return { key: best.key, index, top };
  }, []);

  function onContainerDragOver(e: React.DragEvent<HTMLDivElement>) {
    if (!draggingRef.current) return; // let chevron dnd handle itself
    // While a process is in hand, always accept the drop. Calling preventDefault
    // is what makes the browser fire the `drop` event; if we only did it when the
    // cursor is exactly over a list, a release over a momentary gap (between
    // columns, the tight band under a tall group, empty padding) would be
    // rejected and the card would snap back — the "I can't move it" symptom.
    e.preventDefault();
    const h = hitTest(e.clientX, e.clientY);
    // Keep the last valid target when the cursor is briefly over dead space, so
    // the drop still lands where the user last aimed instead of being lost.
    if (h) applyHint(h);
  }

  function onContainerDrop(e: React.DragEvent<HTMLDivElement>) {
    const dragId = draggingRef.current;
    if (!dragId) return;
    e.preventDefault();
    const h = hintRef.current;
    if (h) {
      const info = listsRef.current.get(h.key);
      if (info) handleDrop(dragId, info.stageId, info.parentId, h.index);
    }
    draggingRef.current = null;
    hintRef.current = null;
    setDraggingId(null);
    setHint(null);
  }

  function handleDrop(
    dragId: string,
    stageId: string | null,
    parentId: string | null,
    index: number,
  ) {
    const dragged = items.find((p) => p.id === dragId);
    if (!dragged) return;

    // A multi-selection that includes the grabbed card moves as a unit;
    // otherwise only the grabbed card moves.
    const multi = selected.has(dragId) && selected.size > 1;
    const movingIds = multi
      ? items.filter((p) => selected.has(p.id)).map((p) => p.id)
      : [dragId];
    const movingSet = new Set(movingIds);

    // Guard: groups can't be nested, and nothing can be dropped into itself.
    if (parentId && movingIds.some((id) => items.find((p) => p.id === id)?.is_group))
      return;
    if (parentId && movingSet.has(parentId)) return;

    const isMember = (p: ProcessRow) =>
      parentId
        ? p.parent_id === parentId
        : (stageId
            ? p.stage_id === stageId
            : !p.stage_id || !stageList.some((s) => s.id === p.stage_id)) &&
          !p.parent_id;

    // Match the VISUAL order the drop `index` was measured against (topItems /
    // childrenOf both sort by sort_order). Using the raw `items` array order
    // here would insert at the wrong spot once the array order and sort_order
    // diverge (e.g. after an optimistic move, or in a column that mixes a group
    // with sibling processes) — which made a sibling look like it couldn't move.
    const moving = items
      .filter((p) => movingSet.has(p.id))
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((p) => ({ ...p, stage_id: stageId, parent_id: parentId }));

    const list = items
      .filter((p) => !movingSet.has(p.id) && isMember(p))
      .sort((a, b) => a.sort_order - b.sort_order);
    const idx = Math.max(0, Math.min(index, list.length));
    list.splice(idx, 0, ...moving);
    const order = new Map(list.map((p, i) => [p.id, i]));

    // Children of any moved group follow their parent into the new chevron.
    const childIds = items
      .filter((p) => p.parent_id && movingSet.has(p.parent_id))
      .map((p) => p.id);

    const next = items.map((p) => {
      if (movingSet.has(p.id))
        return {
          ...p,
          stage_id: stageId,
          parent_id: parentId,
          sort_order: order.get(p.id) ?? 0,
        };
      if (order.has(p.id)) return { ...p, sort_order: order.get(p.id)! };
      if (childIds.includes(p.id)) return { ...p, stage_id: stageId };
      return p;
    });
    setItems(next);

    if (multi) selStageRef.current = stageId ?? null;

    const moves = [
      ...list.map((p) => ({
        id: p.id,
        stageId: movingSet.has(p.id) ? stageId : (p.stage_id ?? null),
        parentId: movingSet.has(p.id) ? parentId : (p.parent_id ?? null),
        sortOrder: order.get(p.id) ?? 0,
      })),
      ...childIds.map((id) => {
        const c = items.find((p) => p.id === id)!;
        return { id, stageId, parentId: c.parent_id, sortOrder: c.sort_order };
      }),
    ];
    const fd = new FormData();
    fd.set("projectId", project.id);
    fd.set("moves", JSON.stringify(moves));
    void reorderProcesses(fd);
  }

  const ctx: DragCtx = {
    draggingId,
    hint,
    start: (id) => {
      draggingRef.current = id;
      setDraggingId(id);
    },
    end: () => {
      draggingRef.current = null;
      hintRef.current = null;
      setDraggingId(null);
      setHint(null);
    },
    register,
    unregister,
    selected,
    isSelected,
    toggleSelect,
    clearSelect,
  };

  function reorderStageIds(orderedIds: string[]) {
    const byId = new Map(stageList.map((s) => [s.id, s]));
    const nextStages = orderedIds
      .map((id) => byId.get(id))
      .filter((s): s is ArchitectureStage => Boolean(s));
    setStageList(nextStages);
    const fd = new FormData();
    fd.set("projectId", project.id);
    fd.set("ids", JSON.stringify(orderedIds));
    void reorderStages(fd);
  }

  /**
   * Rename or recolour a chevron, on screen straight away.
   *
   * updateStage writes the name and the colour together, so whichever one isn't
   * changing is sent back as it already is.
   */
  function changeStage(
    stage: ArchitectureStage,
    changes: Partial<Pick<ArchitectureStage, "name" | "color">>,
  ) {
    const next = { ...stage, ...changes };
    setStageList((prev) => prev.map((s) => (s.id === stage.id ? next : s)));

    const fd = new FormData();
    fd.set("id", stage.id);
    fd.set("projectId", project.id);
    fd.set("name", next.name);
    fd.set("color", next.color);
    void updateStage(fd);
  }

  // Empty chevrons carry no risk, so skip the type-to-confirm modal entirely.
  function deleteEmptyStage(id: string) {
    setStageList((prev) => prev.filter((s) => s.id !== id));
    const fd = new FormData();
    fd.set("id", id);
    fd.set("projectId", project.id);
    void deleteStage(fd);
  }

  // Deleting an empty group destroys nothing, so drop it without confirmation.
  function deleteEmptyGroup(id: string) {
    setItems((prev) => prev.filter((p) => p.id !== id));
    const fd = new FormData();
    fd.set("id", id);
    fd.set("projectId", project.id);
    fd.set("stay", "1");
    void deleteProcess(fd);
  }

  // Route delete requests: empty groups skip the modal, everything else opens it.
  function requestDelete(t: DeleteTarget) {
    if (t && t.kind === "group" && t.count === 0) {
      deleteEmptyGroup(t.id);
      return;
    }
    setDelTarget(t);
  }

  return (
    <AddProcessCtx.Provider value={addProcess}>
    <DragContext.Provider value={ctx}>
      <div
        className="flex min-h-0 flex-1 flex-col"
        onDragOver={onContainerDragOver}
        onDrop={onContainerDrop}
        onClick={(e) => {
          if (selected.size === 0) return;
          if (!(e.target as HTMLElement).closest("[data-card]")) clearSelect();
        }}
      >
       <div className="flex w-full min-h-0 flex-1 flex-col px-6 pb-6 pt-10 sm:px-10">
        <div className="shrink-0">
        {/* ---- title ---- */}
        <div className="flex items-start justify-between gap-6">
          <div className="flex min-w-0 flex-1 items-start gap-3.5">
            <ProjectIconPicker
              icon={ProjIcon}
              color={accent}
              selectedKey={iconKey}
              selectedColor={iconColor}
              onChange={saveAppearance}
            />
            <div className="min-w-0 flex-1">
              <form
                action={renameProject}
                className="group"
                onSubmit={(e) => {
                  const input = e.currentTarget.elements.namedItem(
                    "name",
                  ) as HTMLInputElement | null;
                  const v = input?.value.trim() ?? "";
                  if (!v || v === project.name) {
                    e.preventDefault();
                    return;
                  }
                  if (takenSlugs.has(projectSlug(v))) {
                    e.preventDefault();
                    setNameError(true);
                    if (input) input.value = project.name;
                  }
                }}
              >
                <input type="hidden" name="id" value={project.id} />
                <input
                  name="name"
                  defaultValue={project.name}
                  onChange={() => {
                    if (nameError) setNameError(false);
                  }}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (!v || v === project.name) {
                      setNameError(false);
                      return;
                    }
                    // Block renames that collide with another project's name.
                    if (takenSlugs.has(projectSlug(v))) {
                      setNameError(true);
                      e.target.value = project.name;
                      return;
                    }
                    setNameError(false);
                    e.target.form?.requestSubmit();
                  }}
                  className={`-ml-1.5 w-full min-w-0 rounded-lg bg-transparent px-1.5 py-1 text-[clamp(28px,3.2vw,40px)] font-bold leading-[1.32] tracking-[-0.025em] text-ink outline-none transition-colors hover:bg-mist/40 focus:bg-surface focus:ring-1 ${
                    nameError ? "ring-red-400 focus:ring-red-400" : "focus:ring-hairline"
                  }`}
                  aria-label="Project name"
                />
              </form>
              {nameError && (
                <p className="mt-1 px-1.5 text-[13px] font-medium text-red-500">
                  A project with this name already exists.
                </p>
              )}
              <form action={updateProjectDescription} className="-ml-1.5 mt-0.5 max-w-2xl">
                <input type="hidden" name="id" value={project.id} />
                <textarea
                  name="description"
                  defaultValue={project.description}
                  placeholder={"Add a description\u2026"}
                  rows={1}
                  onBlur={(e) => {
                    if (e.target.value !== project.description)
                      e.target.form?.requestSubmit();
                  }}
                  className="block max-h-[3.6rem] w-full resize-none overflow-auto whitespace-pre-line rounded-md bg-transparent px-1.5 py-1 text-[15px] leading-relaxed text-ink-soft outline-none transition-colors placeholder:text-ink-faint/60 hover:bg-mist/40 focus:bg-surface [field-sizing:content]"
                  aria-label="Project description"
                />
              </form>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 pt-2">
            <ProjectStatusButton
              projectId={project.id}
              status={project.status ?? "draft"}
            />
            <ExportProjectButton
              project={project}
              stages={stageList}
              processes={items}
              view={view}
            />
            <button
              onClick={() =>
                setDelTarget({
                  kind: "project",
                  id: project.id,
                  name: project.name,
                })
              }
              title="Delete project"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-ember-tint hover:text-signal"
            >
              <Trash size={16} weight="bold" />
            </button>
          </div>
        </div>

        {/* ---- toolbar: view toggle + add chevron ---- */}
        <div className="mt-7 flex items-center justify-between gap-3">
          <div className="inline-flex rounded-lg border border-hairline bg-mist/50 p-0.5">
            <ToggleBtn
              active={view === "modern"}
              onClick={() => changeView("modern")}
              icon={<SquaresFour size={14} weight="bold" />}
            >
              Modern
            </ToggleBtn>
            <ToggleBtn
              active={view === "traditional"}
              onClick={() => changeView("traditional")}
              icon={<TreeStructure size={14} weight="bold" />}
            >
              Traditional
            </ToggleBtn>
          </div>

          {addingStage ? (
            <form
              action={(fd) => {
                setAddingStage(false);
                const name = String(fd.get("name") ?? "").trim();
                if (!name) return;
                const id = crypto.randomUUID();
                fd.set("clientId", id);
                addStage(
                  optimisticStage(id, project.id, name, stageList),
                  createStage(fd),
                );
              }}
              onSubmit={guardInlineSubmit}
              className="flex items-center gap-2"
            >
              <input type="hidden" name="projectId" value={project.id} />
              <input
                name="name"
                placeholder="Chevron name"
                autoFocus
                onBlur={(e) => submitInlineOnBlur(e, () => setAddingStage(false))}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setAddingStage(false);
                }}
                className="w-44 rounded-lg border border-hairline bg-surface px-3 py-1.5 text-[13px] outline-none focus:border-cobalt"
                required
              />
              <button
                type="submit"
                className="rounded-lg bg-cobalt px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-cobalt-deep"
              >
                Add
              </button>
            </form>
          ) : (
            <button
              onClick={() => setAddingStage(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-surface px-3 py-1.5 text-[13px] font-semibold text-ink transition-colors hover:border-ink-faint"
            >
              <Plus size={13} weight="bold" /> Add chevron
            </button>
          )}
        </div>
        </div>

        {/* ---- board (fills remaining height; owns horizontal + vertical scroll) ---- */}
        <div className="mt-6 w-full min-h-0 flex-1 overflow-auto pb-2">
        {stageList.length === 0 ? (
          <EmptyBoard />
        ) : (
          <Board
            view={view}
            stages={stageList}
            topItems={topItems}
            childrenOf={childrenOf}
            projectId={project.id}
            onDelete={requestDelete}
            onReorderStages={reorderStageIds}
            onDeleteEmptyStage={deleteEmptyStage}
            onChangeStage={changeStage}
          />
        )}

        {/* ---- unassigned ---- */}
        {unassigned.length > 0 && (
          <div className="mt-12">
            <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-wider text-ink-faint">
              Unassigned
            </p>
            <DropList
              listKey="s:__unassigned"
              stageId={null}
              parentId={null}
              count={unassigned.length}
              className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4"
            >
              {unassigned.map((proc) => (
                <DragItem key={proc.id} id={proc.id}>
                  <ProcessCard
                    process={proc}
                    ink={STAGE_COLORS.cobalt.ink}
                    onDelete={onDeleteProc(setDelTarget)}
                  />
                </DragItem>
              ))}
            </DropList>
          </div>
        )}
        </div>
       </div>
      </div>

      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-hairline bg-surface/95 py-1.5 pl-3.5 pr-1.5 shadow-float backdrop-blur">
          <span className="text-[13px] font-semibold text-ink">
            {selected.size} selected
          </span>
          <span className="hidden text-[12px] text-ink-faint sm:inline">
            &middot; drag to move &middot; Esc to clear
          </span>
          <span className="mx-1 h-4 w-px bg-hairline" />
          <button
            onClick={() =>
              setDelTarget({
                kind: "multi",
                ids: [...selected],
                count: selected.size,
              })
            }
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-signal transition-colors hover:bg-ember-tint"
          >
            <Trash size={14} weight="bold" /> Delete
          </button>
          <button
            onClick={clearSelect}
            className="rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-ink-soft transition-colors hover:bg-mist"
          >
            Clear
          </button>
        </div>
      )}

      <DeleteModal
        target={delTarget}
        projectId={project.id}
        onClose={() => setDelTarget(null)}
        onDeleteMany={deleteMany}
      />
    </DragContext.Provider>
    </AddProcessCtx.Provider>
  );
}

function onDeleteProc(set: (t: DeleteTarget) => void) {
  return (p: ProcessRow) => set({ kind: "process", id: p.id, name: p.name });
}

/* ================================================================ board */

function Board({
  view,
  stages,
  topItems,
  childrenOf,
  projectId,
  onDelete,
  onReorderStages,
  onDeleteEmptyStage,
  onChangeStage,
}: {
  view: "modern" | "traditional";
  stages: ArchitectureStage[];
  topItems: (id: string | null) => ProcessRow[];
  childrenOf: (id: string) => ProcessRow[];
  projectId: string;
  onDelete: (t: DeleteTarget) => void;
  onReorderStages: (ids: string[]) => void;
  onDeleteEmptyStage: (id: string) => void;
  onChangeStage: (
    stage: ArchitectureStage,
    changes: Partial<Pick<ArchitectureStage, "name" | "color">>,
  ) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [openForm, setOpenForm] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  // chevron drag state
  const [dragStage, setDragStage] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<{
    id: string;
    after: boolean;
  } | null>(null);

  function dropChevron() {
    if (dragStage && overStage && dragStage !== overStage.id) {
      const ids = stages.map((s) => s.id).filter((id) => id !== dragStage);
      const target = ids.indexOf(overStage.id) + (overStage.after ? 1 : 0);
      ids.splice(target, 0, dragStage);
      onReorderStages(ids);
    }
    setDragStage(null);
    setOverStage(null);
  }

  // Chevrons/columns share one grid track set so they stay aligned. Tracks
  // grow to fill the viewport (1fr) but never shrink below COL_MIN — once they
  // hit that floor the grid overflows and the board's scroll region scrolls.
  // Chevrons use a fixed, consistent width and start from the left. They never
  // stretch to fill the viewport — if there are too many, the board's scroll
  // region overflows horizontally instead.
  const gridStyle: React.CSSProperties = {
    display: "grid",
    width: "max-content",
    gridTemplateColumns: `repeat(${stages.length}, ${COL_MIN}px)`,
    justifyContent: "start",
  };

  return (
    <div>
        {/* chevron row */}
        <div style={{ ...gridStyle, alignItems: "stretch" }}>
          {stages.map((stage, i) => {
            const c = colorOf(stage);
            const isOpen = menuOpen === stage.id;
            const showBar = dragStage && overStage?.id === stage.id;
            return (
              <div
                key={stage.id}
                className="group/stage relative min-w-0"
                style={{
                  zIndex: isOpen ? 999 : stages.length - i,
                }}
                draggable={editing !== stage.id}
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  setDragStage(stage.id);
                }}
                onDragEnd={() => {
                  setDragStage(null);
                  setOverStage(null);
                }}
                onDragOver={(e) => {
                  if (!dragStage) return;
                  e.preventDefault();
                  const r = e.currentTarget.getBoundingClientRect();
                  const after = e.clientX > r.left + r.width / 2;
                  setOverStage((prev) =>
                    prev && prev.id === stage.id && prev.after === after
                      ? prev
                      : { id: stage.id, after },
                  );
                }}
                onDrop={(e) => {
                  if (!dragStage) return;
                  e.preventDefault();
                  dropChevron();
                }}
              >
                {/* drop indicator */}
                {showBar && (
                  <span
                    className="absolute top-0 z-40 h-14 w-1 rounded-full bg-cobalt"
                    style={{ [overStage!.after ? "right" : "left"]: -2 }}
                  />
                )}
                <div
                  className={`relative flex h-14 items-center ${
                    editing !== stage.id ? "cursor-grab active:cursor-grabbing" : ""
                  } ${dragStage === stage.id ? "opacity-40" : ""}`}
                  style={{
                    background: c.fill,
                    clipPath: i === 0 ? CHEV_BLUNT : CHEV_OPEN,
                    marginLeft: i === 0 ? 0 : -8,
                    borderRadius: 4,
                  }}
                >
                  {editing === stage.id ? (
                    <form
                      action={(fd) => {
                        setEditing(null);
                        const name = String(fd.get("name") ?? "").trim();
                        if (name && name !== stage.name) {
                          onChangeStage(stage, { name });
                        }
                      }}
                      className="absolute inset-0 flex items-center px-5"
                    >
                      <input
                        name="name"
                        defaultValue={stage.name}
                        autoFocus
                        onBlur={(e) => e.target.form?.requestSubmit()}
                        className="w-full rounded bg-white/95 px-2 py-1 text-center text-[12.5px] font-semibold text-ink outline-none"
                      />
                    </form>
                  ) : (
                    <span
                      className={`flex h-full w-full items-center justify-center text-center ${
                        i === 0 ? "pl-4 pr-6" : "pl-7 pr-6"
                      }`}
                      style={{ color: c.light ? NAVY : "#fff" }}
                      title={stage.name}
                    >
                      <span className="line-clamp-2 text-[12.5px] font-semibold leading-tight [overflow-wrap:anywhere]">
                        {stage.name}
                      </span>
                    </span>
                  )}
                </div>

                <StageMenu
                  stage={stage}
                  open={isOpen}
                  onOpenChange={(o) => setMenuOpen(o ? stage.id : null)}
                  onRename={() => setEditing(stage.id)}
                  onRecolor={() =>
                    onChangeStage(stage, { color: nextColor(stage.color) })
                  }
                  onDelete={() => {
                    const count = topItems(stage.id).length;
                    if (count === 0) {
                      onDeleteEmptyStage(stage.id);
                    } else {
                      onDelete({
                        kind: "stage",
                        id: stage.id,
                        name: stage.name,
                        count,
                      });
                    }
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* process columns */}
        <div className="mt-3" style={{ ...gridStyle, alignItems: "start" }}>
          {stages.map((stage) => {
            const c = colorOf(stage);
            const items = topItems(stage.id);
            const listKey = `s:${stage.id}`;
            return (
              <div key={stage.id} className="flex min-w-0 flex-col px-1.5">
                {view === "modern" ? (
                  <DropList
                    listKey={listKey}
                    stageId={stage.id}
                    parentId={null}
                    count={items.length}
                    className="flex flex-col gap-1.5"
                    emptyHint="Drop a process here"
                  >
                    {items.map((item) =>
                      item.is_group ? (
                        <DragItem key={item.id} id={item.id}>
                          <GroupBlock
                            group={item}
                            projectId={projectId}
                            stageId={stage.id}
                            ink={c.ink}
                            procs={childrenOf(item.id)}
                            collapsed={collapsed.has(item.id)}
                            onToggle={() => toggle(item.id)}
                            addingChild={openForm === `child:${item.id}`}
                            onAddChild={() => setOpenForm(`child:${item.id}`)}
                            onCloseForm={() => setOpenForm(null)}
                            onDelete={onDelete}
                          />
                        </DragItem>
                      ) : (
                        <DragItem key={item.id} id={item.id}>
                          <ProcessCard
                            process={item}
                            ink={c.ink}
                            onDelete={onDeleteProc(onDelete)}
                          />
                        </DragItem>
                      ),
                    )}

                    {openForm === `proc:${stage.id}` ? (
                      <AddForm
                        projectId={projectId}
                        stageId={stage.id}
                        placeholder="Process name"
                        onClose={() => setOpenForm(null)}
                      />
                    ) : openForm === `group:${stage.id}` ? (
                      <AddForm
                        projectId={projectId}
                        stageId={stage.id}
                        isGroup
                        placeholder="Group name"
                        onClose={() => setOpenForm(null)}
                      />
                    ) : (
                      <div className="flex gap-1 pt-1">
                        <button
                          onClick={() => setOpenForm(`proc:${stage.id}`)}
                          className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-dashed border-ink-faint/40 px-2 py-1.5 text-[11px] font-medium text-ink-faint transition-colors hover:border-cobalt hover:text-cobalt"
                        >
                          <Plus size={11} weight="bold" /> Process
                        </button>
                        <button
                          onClick={() => setOpenForm(`group:${stage.id}`)}
                          title="Add a group"
                          className="flex items-center justify-center gap-1 rounded-lg border border-dashed border-ink-faint/40 px-2 py-1.5 text-[11px] font-medium text-ink-faint transition-colors hover:border-cobalt hover:text-cobalt"
                        >
                          <FolderSimple size={11} weight="bold" /> Group
                        </button>
                      </div>
                    )}
                  </DropList>
                ) : (
                  <TraditionalColumn
                    items={items}
                    childrenOf={childrenOf}
                    ink={c.ink}
                    stageId={stage.id}
                    collapsed={collapsed}
                    onToggle={toggle}
                    onDelete={onDelete}
                  />
                )}
              </div>
            );
          })}
        </div>
    </div>
  );
}

/* ==================================================== traditional column */

function TraditionalColumn({
  items,
  childrenOf,
  ink,
  stageId,
  collapsed,
  onToggle,
  onDelete,
}: {
  items: ProcessRow[];
  childrenOf: (id: string) => ProcessRow[];
  ink: string;
  stageId: string;
  collapsed: Set<string>;
  onToggle: (id: string) => void;
  onDelete: (t: DeleteTarget) => void;
}) {
  return (
    <DropList
      listKey={`s:${stageId}`}
      stageId={stageId}
      parentId={null}
      count={items.length}
      className="ml-2 flex flex-col pt-2"
      emptyHint="Drop a process here"
    >
      {items.length === 0 && (
        <p className="border-l border-dashed border-hairline pl-4 text-[12px] text-ink-faint">
          No processes
        </p>
      )}
      {items.map((item) => {
        const GI = iconFor(item.id);
        return item.is_group ? (
          <DragItem key={item.id} id={item.id}>
            <TreeRow>
              <span className="relative inline-flex max-w-full">
                <span
                  className="pointer-events-none absolute inset-0"
                  style={{ clipPath: MINI_OPEN, background: ink }}
                />
                <button
                  onClick={() => onToggle(item.id)}
                  className="relative inline-flex h-8 min-w-0 items-center gap-1.5 pl-4 pr-6 text-[12px] font-semibold"
                  style={{ clipPath: MINI_OPEN_INNER, background: "#fff", color: ink }}
                >
                  {collapsed.has(item.id) ? (
                    <CaretRight size={11} weight="bold" className="shrink-0" />
                  ) : (
                    <CaretDown size={11} weight="bold" className="shrink-0" />
                  )}
                  <GI size={12} weight="bold" className="shrink-0" />
                  <span className="truncate">{item.name}</span>
                  <span className="text-[10.5px] font-medium opacity-70">
                    {childrenOf(item.id).length}
                  </span>
                </button>
              </span>
            </TreeRow>
            {!collapsed.has(item.id) && (
              <div className="ml-5">
                <DropList
                  listKey={`g:${item.id}`}
                  stageId={stageId}
                  parentId={item.id}
                  count={childrenOf(item.id).length}
                  className="flex flex-col"
                  emptyHint="Drop here"
                >
                  {childrenOf(item.id).map((child) => (
                    <DragItem key={child.id} id={child.id}>
                      <TreeRow>
                        <MiniChevron
                          process={child}
                          ink={ink}
                          onDelete={() =>
                            onDelete({
                              kind: "process",
                              id: child.id,
                              name: child.name,
                            })
                          }
                        />
                      </TreeRow>
                    </DragItem>
                  ))}
                </DropList>
              </div>
            )}
          </DragItem>
        ) : (
          <DragItem key={item.id} id={item.id}>
            <TreeRow>
              <MiniChevron
                process={item}
                ink={ink}
                onDelete={() =>
                  onDelete({ kind: "process", id: item.id, name: item.name })
                }
              />
            </TreeRow>
          </DragItem>
        );
      })}
    </DropList>
  );
}

function TreeRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative border-l border-hairline pb-1.5 pl-4">
      <span className="absolute left-0 top-[15px] h-px w-3 bg-hairline" />
      {children}
    </div>
  );
}

function MiniChevron({
  process,
  ink,
  onDelete,
}: {
  process: ProcessRow;
  ink: string;
  onDelete: () => void;
}) {
  const Glyph = iconFor(process.id);
  const ctx = useDrag();
  const picked = ctx.isSelected(process.id);
  return (
    <div className="group/mini flex items-center gap-1">
      <Link
        href={`/processes/${process.id}`}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            e.stopPropagation();
            ctx.toggleSelect(process.id, process.stage_id ?? null);
          }
        }}
        className="inline-flex h-8 min-w-0 flex-1 items-center gap-1.5 pl-3 pr-6 text-[12px] font-medium transition-transform hover:translate-x-0.5"
        style={{
          background: picked ? ink : `${ink}14`,
          clipPath: MINI_OPEN,
          color: picked ? "#fff" : ink,
        }}
        title={process.name}
      >
        <Glyph size={12} weight="bold" className="shrink-0" />
        <span className="truncate">{process.name}</span>
      </Link>
      <button
        onClick={onDelete}
        aria-label={`Delete ${process.name}`}
        className="hidden h-6 w-6 shrink-0 items-center justify-center rounded-full text-ink-faint hover:bg-ember-tint hover:text-signal group-hover/mini:flex"
      >
        <Trash size={13} weight="bold" />
      </button>
    </div>
  );
}

/* ================================================================ drag bits */

function DropList({
  listKey,
  stageId,
  parentId,
  count,
  className,
  emptyHint,
  children,
}: {
  listKey: string;
  stageId: string | null;
  parentId: string | null;
  count: number;
  className?: string;
  emptyHint?: string;
  children: React.ReactNode;
}) {
  const ctx = useDrag();
  const { register, unregister } = ctx;
  const ref = useRef<HTMLDivElement>(null);
  const active = ctx.draggingId != null;
  const hinting = ctx.hint?.key === listKey;

  useEffect(() => {
    const el = ref.current;
    if (el) register(listKey, { el, stageId, parentId });
    return () => unregister(listKey);
  }, [listKey, stageId, parentId, register, unregister]);

  return (
    <div
      ref={ref}
      className={`relative ${className ?? ""} rounded-lg transition-colors ${
        active
          ? "outline-dashed outline-1 outline-offset-2 " +
            (hinting ? "bg-cobalt/[0.04] outline-cobalt/50" : "outline-hairline")
          : ""
      }`}
      style={active && count === 0 ? { minHeight: 48 } : undefined}
    >
      {children}
      {active && hinting && ctx.hint?.top != null && (
        <div
          className="pointer-events-none absolute left-0 right-0 z-10 h-0.5 -translate-y-1/2 rounded-full bg-cobalt"
          style={{ top: ctx.hint.top }}
        />
      )}
    </div>
  );
}

function DragItem({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const ctx = useDrag();
  const dragging =
    ctx.draggingId === id ||
    (ctx.draggingId != null &&
      ctx.selected.size > 1 &&
      ctx.selected.has(id) &&
      ctx.selected.has(ctx.draggingId));
  return (
    <div
      data-card
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        e.dataTransfer.effectAllowed = "move";
        ctx.start(id);
      }}
      onDragEnd={(e) => {
        e.stopPropagation();
        ctx.end();
      }}
      className={`transition-opacity ${
        dragging ? "opacity-40" : "cursor-grab active:cursor-grabbing"
      }`}
    >
      {children}
    </div>
  );
}

/* ================================================================ pieces */

function ProcessCard({
  process,
  ink,
  onDelete,
}: {
  process: ProcessRow;
  ink: string;
  onDelete: (p: ProcessRow) => void;
}) {
  const Glyph = iconFor(process.id);
  const ctx = useDrag();
  const picked = ctx.isSelected(process.id);
  return (
    <div className="group/card relative">
      <Link
        href={`/processes/${process.id}`}
        draggable={false}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            e.stopPropagation();
            ctx.toggleSelect(process.id, process.stage_id ?? null);
          }
        }}
        className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 shadow-soft transition-colors ${
          picked
            ? "border-cobalt bg-cobalt/[0.06] ring-1 ring-cobalt"
            : "border-black/[0.07] bg-white hover:border-black/[0.12]"
        }`}
      >
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
          style={{ background: `${ink}1a` }}
        >
          <Glyph size={13} weight="bold" color={ink} />
        </span>
        <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-ink">
          {process.name}
        </span>
      </Link>
      <button
        onClick={() => onDelete(process)}
        aria-label={`Delete ${process.name}`}
        className="absolute right-1.5 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-md bg-white/95 p-1 text-ink-faint shadow-soft hover:bg-ember-tint hover:text-signal group-hover/card:flex"
      >
        <Trash size={13} weight="bold" />
      </button>
    </div>
  );
}

function GroupBlock({
  group,
  procs,
  projectId,
  stageId,
  ink,
  collapsed,
  onToggle,
  addingChild,
  onAddChild,
  onCloseForm,
  onDelete,
}: {
  group: ProcessRow;
  procs: ProcessRow[];
  projectId: string;
  stageId: string;
  ink: string;
  collapsed: boolean;
  onToggle: () => void;
  addingChild: boolean;
  onAddChild: () => void;
  onCloseForm: () => void;
  onDelete: (t: DeleteTarget) => void;
}) {
  const listKey = `g:${group.id}`;
  const Glyph = iconFor(group.id);
  return (
    <div className="group/group relative">
      <div
        className="flex items-center gap-2 rounded-lg border-2 bg-white px-2.5 py-1.5 shadow-soft"
        style={{ borderColor: `${ink}59` }}
      >
        <button
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          {collapsed ? (
            <CaretRight size={12} weight="bold" className="text-ink-faint" />
          ) : (
            <CaretDown size={12} weight="bold" className="text-ink-faint" />
          )}
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
            style={{ background: `${ink}1a` }}
          >
            <Glyph size={13} weight="bold" color={ink} />
          </span>
          <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-ink">
            {group.name}
          </span>
          <span className="text-[10.5px] font-medium text-ink-faint">
            {procs.length}
          </span>
        </button>
        <button
          onClick={() =>
            onDelete({
              kind: "group",
              id: group.id,
              name: group.name,
              count: procs.length,
            })
          }
          aria-label={`Delete group ${group.name}`}
          className="invisible flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-ink-faint hover:bg-ember-tint hover:text-signal group-hover/group:visible"
        >
          <Trash size={12} weight="bold" />
        </button>
      </div>

      {!collapsed && (
        <div className="ml-4 mt-1.5 border-l border-black/[0.08] pl-3">
          <DropList
            listKey={listKey}
            stageId={stageId}
            parentId={group.id}
            count={procs.length}
            className="space-y-1.5"
            emptyHint="Drop here"
          >
            {procs.map((child) => (
              <DragItem key={child.id} id={child.id}>
                <ProcessCard
                  process={child}
                  ink={ink}
                  onDelete={onDeleteProc(onDelete)}
                />
              </DragItem>
            ))}
          </DropList>
          {addingChild ? (
            <AddForm
              projectId={projectId}
              stageId={stageId}
              parentId={group.id}
              placeholder="Process name"
              onClose={onCloseForm}
            />
          ) : (
            <button
              onClick={onAddChild}
              className="mt-1.5 flex w-full items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-ink-faint transition-colors hover:text-cobalt"
            >
              <Plus size={11} weight="bold" /> Add process
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ========================================================= project icon */

function ProjectIconPicker({
  icon: Current,
  color,
  selectedKey,
  selectedColor,
  onChange,
}: {
  icon: Icon;
  color: string;
  selectedKey: string | null;
  selectedColor: string | null;
  onChange: (iconKey: string | null, color: string | null) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative mt-[3px] shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Change project icon"
        className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-soft ring-1 ring-black/[0.04] transition-[filter] hover:brightness-95"
        style={{
          background: `linear-gradient(140deg, ${color}22, ${color}0d)`,
          color,
        }}
      >
        <Current size={24} weight="fill" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-14 z-50 w-[308px] rounded-2xl border border-hairline bg-surface p-3 shadow-float">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
              Colour
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PROJECT_COLOR_LIBRARY.map((c) => {
                const active =
                  (selectedColor ?? "").toLowerCase() === c.toLowerCase();
                return (
                  <button
                    key={c}
                    onClick={() => onChange(selectedKey, c)}
                    className={`h-6 w-6 rounded-full transition-transform hover:scale-110 ${
                      active ? "ring-2 ring-ink ring-offset-2" : ""
                    }`}
                    style={{ background: c }}
                    aria-label={`Colour ${c}`}
                  />
                );
              })}
            </div>

            <p className="mb-1.5 mt-3 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
              Icon
            </p>
            <div className="grid max-h-[220px] grid-cols-7 gap-1 overflow-y-auto pr-1">
              {PROJECT_ICON_LIBRARY.map(({ key, Icon: I }) => {
                const active = selectedKey === key;
                return (
                  <button
                    key={key}
                    onClick={() => onChange(key, selectedColor)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                      active ? "" : "text-ink-soft hover:bg-mist"
                    }`}
                    style={active ? { background: `${color}1a`, color } : undefined}
                    title={key}
                  >
                    <I size={18} weight={active ? "fill" : "regular"} />
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ========================================================= project status */

function ProjectStatusButton({
  projectId,
  status,
}: {
  projectId: string;
  status: ProjectStatus;
}) {
  const [current, setCurrent] = useState<ProjectStatus>(status);
  useEffect(() => setCurrent(status), [status]);
  const [open, setOpen] = useState(false);

  const cfg =
    PROJECT_STATUSES.find((s) => s.value === current) ?? PROJECT_STATUSES[0];

  function choose(v: ProjectStatus) {
    setOpen(false);
    if (v === current) return;
    setCurrent(v);
    const fd = new FormData();
    fd.set("id", projectId);
    fd.set("status", v);
    void updateProjectStatus(fd);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Project status"
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold ring-1 ring-inset ring-black/[0.06] transition-[filter] hover:brightness-[0.97]"
        style={{ background: cfg.bg, color: cfg.text }}
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: cfg.dot }}
        />
        {cfg.label}
        <CaretDown size={12} weight="bold" className="opacity-60" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1 w-44 overflow-hidden rounded-xl border border-hairline bg-surface p-1 shadow-float">
            {PROJECT_STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => choose(s.value)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-ink transition-colors hover:bg-mist"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: s.dot }}
                />
                {s.label}
                {s.value === current && (
                  <Check
                    size={13}
                    weight="bold"
                    className="ml-auto text-ink-faint"
                  />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ============================================================ stage menu */

function StageMenu({
  stage,
  open,
  onOpenChange,
  onRename,
  onRecolor,
  onDelete,
}: {
  stage: ArchitectureStage;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRename: () => void;
  onRecolor: () => void;
  onDelete: () => void;
}) {
  function recolor() {
    onRecolor();
    onOpenChange(false);
  }

  return (
    <div className="absolute right-2.5 top-1.5 z-30">
      <button
        onClick={() => onOpenChange(!open)}
        title="Chevron options"
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        className={`flex h-6 w-6 items-center justify-center rounded-full bg-white/85 text-ink-soft shadow-soft transition-opacity hover:bg-white ${
          open ? "opacity-100" : "opacity-0 group-hover/stage:opacity-100"
        }`}
      >
        <DotsThreeVertical size={15} weight="bold" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => onOpenChange(false)}
          />
          <div className="absolute right-0 z-50 mt-1 w-44 overflow-hidden rounded-xl border border-hairline bg-surface p-1 shadow-float">
            <MenuRow
              icon={<PencilSimple size={14} />}
              onClick={() => {
                onRename();
                onOpenChange(false);
              }}
            >
              Rename
            </MenuRow>
            <MenuRow
              icon={
                <span
                  className="block h-3 w-3 rounded-full"
                  style={{
                    background: STAGE_COLORS[nextColor(stage.color)].fill,
                  }}
                />
              }
              onClick={recolor}
            >
              Change colour
            </MenuRow>
            <div className="my-1 h-px bg-hairline" />
            <MenuRow
              icon={<Trash size={14} />}
              danger
              onClick={() => {
                onDelete();
                onOpenChange(false);
              }}
            >
              Delete
            </MenuRow>
          </div>
        </>
      )}
    </div>
  );
}

function MenuRow({
  icon,
  children,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] font-medium transition-colors ${
        danger ? "text-signal hover:bg-ember-tint" : "text-ink hover:bg-mist"
      }`}
    >
      <span className={danger ? "text-signal" : "text-ink-soft"}>{icon}</span>
      {children}
    </button>
  );
}

/* ============================================================ add form */

function AddForm({
  projectId,
  stageId,
  parentId,
  isGroup,
  placeholder,
  onClose,
}: {
  projectId: string;
  stageId: string;
  parentId?: string;
  isGroup?: boolean;
  placeholder: string;
  onClose: () => void;
}) {
  const addProcess = useContext(AddProcessCtx);

  return (
    <form
      action={(fd) => {
        onClose();
        const name = String(fd.get("name") ?? "").trim();
        if (!name) return;

        const prefs = readDiagramPrefs(projectId);
        fd.set("borderWeight", prefs.border);
        fd.set("connectorWeight", prefs.connector);
        fd.set("cornerStyle", prefs.corner);

        const id = crypto.randomUUID();
        fd.set("clientId", id);
        addProcess(
          optimisticProcess(
            id,
            projectId,
            stageId,
            parentId ?? null,
            Boolean(isGroup),
            name,
          ),
          createProcess(fd),
        );
      }}
      onSubmit={guardInlineSubmit}
      className="mt-1.5"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="stageId" value={stageId} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      {isGroup && <input type="hidden" name="isGroup" value="1" />}
      <input
        name="name"
        placeholder={placeholder}
        autoFocus
        onBlur={(e) => submitInlineOnBlur(e, onClose)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
        className="w-full rounded-lg border border-cobalt/50 bg-surface px-2.5 py-1.5 text-[12px] outline-none focus:border-cobalt"
        required
      />
    </form>
  );
}

/* ============================================================ misc ui */

function ToggleBtn({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
        active ? "bg-surface text-ink shadow-soft" : "text-ink-soft hover:text-ink"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function EmptyBoard() {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-ink-faint/40 bg-mist/30 px-6 py-14 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-cobalt/10">
        <SquaresFour size={20} weight="bold" className="text-cobalt" />
      </div>
      <p className="mt-3 text-[15px] font-semibold text-ink">
        Map your architecture
      </p>
      <p className="mx-auto mt-1 max-w-sm text-[13.5px] text-ink-soft">
        Add your first high-level chevron — e.g. &ldquo;Request&rdquo;,
        &ldquo;Approval&rdquo;, &ldquo;Fulfilment&rdquo; — then drop detailed
        processes underneath each one.
      </p>
    </div>
  );
}

/* ============================================================ delete modal */

function DeleteModal({
  target,
  projectId,
  onClose,
  onDeleteMany,
}: {
  target: DeleteTarget;
  projectId: string;
  onClose: () => void;
  onDeleteMany: (ids: string[]) => void;
}) {
  if (!target) return null;

  if (target.kind === "multi") {
    return (
      <ConfirmDeleteModal
        open
        title={`Delete ${target.count} processes?`}
        confirmLabel={`Delete ${target.count}`}
        action={() => {
          onDeleteMany(target.ids);
          onClose();
        }}
        onCancel={onClose}
        description={
          <>
            You&rsquo;re deleting <b>{target.count}</b> selected processes. Their
            saved BPMN diagrams and documentation will be permanently removed.
            This can&rsquo;t be undone.
          </>
        }
      />
    );
  }

  if (target.kind === "stage") {
    return (
      <ConfirmDeleteModal
        open
        title="Delete chevron?"
        confirmLabel="Delete chevron"
        action={(fd) => {
          deleteStage(fd);
          onClose();
        }}
        onCancel={onClose}
        description={
          <>
            You&rsquo;re deleting the <b>{target.name}</b> chevron.
            {target.count > 0 ? (
              <>
                {" "}
                Its <b>{target.count}</b> linked process
                {target.count === 1 ? "" : "es"} won&rsquo;t be deleted —
                they&rsquo;ll move to <b>Unassigned</b> so you can re-file them.
              </>
            ) : (
              " It has no processes attached."
            )}
          </>
        }
      >
        <input type="hidden" name="id" value={target.id} />
        <input type="hidden" name="projectId" value={projectId} />
      </ConfirmDeleteModal>
    );
  }

  if (target.kind === "group") {
    return (
      <ConfirmDeleteModal
        open
        title="Delete group?"
        confirmLabel="Delete group"
        action={(fd) => {
          deleteProcess(fd);
          onClose();
        }}
        onCancel={onClose}
        description={
          <>
            Deleting the <b>{target.name}</b> group will permanently delete the{" "}
            <b>{target.count}</b> process{target.count === 1 ? "" : "es"} inside
            it, including their saved BPMN diagrams and documentation. This
            can&rsquo;t be undone.
          </>
        }
      >
        <input type="hidden" name="id" value={target.id} />
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="stay" value="1" />
      </ConfirmDeleteModal>
    );
  }

  if (target.kind === "process") {
    return (
      <ConfirmDeleteModal
        open
        title="Delete process?"
        confirmLabel="Delete process"
        action={(fd) => {
          deleteProcess(fd);
          onClose();
        }}
        onCancel={onClose}
        description={
          <>
            Deleting <b>{target.name}</b> will permanently remove its saved BPMN
            diagram and documentation. This can&rsquo;t be undone.
          </>
        }
      >
        <input type="hidden" name="id" value={target.id} />
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="stay" value="1" />
      </ConfirmDeleteModal>
    );
  }

  return (
    <ConfirmDeleteModal
      open
      title="Delete project?"
      confirmLabel="Delete project"
      action={deleteProject}
      onCancel={onClose}
      description={
        <>
          Deleting <b>{target.name}</b> will permanently remove the project, its
          chevrons, and every process inside it. This can&rsquo;t be undone.
        </>
      }
    >
      <input type="hidden" name="id" value={target.id} />
    </ConfirmDeleteModal>
  );
}
