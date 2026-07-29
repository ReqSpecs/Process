"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { CaretDown, Check, Swatches, User } from "@phosphor-icons/react";
import { exportProcessPdf } from "@/lib/export/exportProcess";
import { projectSlug } from "@/lib/slug";
import type {
  BpmnApi,
  SelectionSummary,
} from "@/components/app/BpmnCanvas";
import { ProcessRibbon } from "@/components/app/ProcessRibbon";
import {
  readBorderWeight,
  readConnectorWeight,
  readCornerStyle,
  readStencil,
  STENCILS,
  type BorderWeight,
  type CornerStyle,
  type Stencil,
} from "@/lib/bpmn/stencil";

import { writeDiagramPref } from "@/lib/bpmn/diagramPrefs";
import type { ProcessDocStatus, ProcessRow, Project } from "@/lib/types";

const BpmnCanvas = dynamic(
  () => import("@/components/app/BpmnCanvas").then((m) => m.BpmnCanvas),
  { ssr: false, loading: () => <CanvasSkeleton /> }
);

type SaveState = "saved" | "saving" | "dirty" | "error";

const AUTOSAVE_DEBOUNCE_MS = 1500;

const EMPTY_SELECTION: SelectionSummary = {
  count: 0,
  hasShape: false,
  hasConnection: false,
  borderWeight: null,
  bold: false,
  italic: false,
  underline: false,
  fontSize: null,
};

const STATUS_OPTIONS: { value: ProcessDocStatus; label: string; dot: string }[] = [
  { value: "draft", label: "Draft", dot: "#94a3b8" },
  { value: "in_review", label: "In review", dot: "#b45309" },
  { value: "approved", label: "Approved", dot: "#0F9E7A" },
];

export function ProcessEditor({
  process,
  project,
  readOnly,
}: {
  process: ProcessRow;
  project: Project;
  readOnly: boolean;
}) {
  const [name, setName] = useState(process.name);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [exporting, setExporting] = useState(false);
  const [api, setApi] = useState<BpmnApi | null>(null);
  const [selection, setSelection] = useState<SelectionSummary>(EMPTY_SELECTION);
  const [ribbonOpen, setRibbonOpen] = useState(true);
  const [stencil, setStencil] = useState<Stencil>(() =>
    readStencil(process.bpmn_xml),
  );
  const [loadXml, setLoadXml] = useState(process.bpmn_xml);
  const [borderWeight, setBorderWeight] = useState<BorderWeight>(() =>
    readBorderWeight(process.bpmn_xml),
  );
  const [connectorWeight, setConnectorWeight] = useState<BorderWeight>(() =>
    readConnectorWeight(process.bpmn_xml),
  );
  const [cornerStyle, setCornerStyle] = useState<CornerStyle>(() =>
    readCornerStyle(process.bpmn_xml),
  );

  const apiRef = useRef<BpmnApi | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const docRef = useRef<Partial<ProcessRow>>({});

  useEffect(() => {
    const saved = localStorage.getItem("prodraw:ribbon");
    if (saved === "0") setRibbonOpen(false);
  }, []);
  const toggleRibbon = () =>
    setRibbonOpen((v) => {
      localStorage.setItem("prodraw:ribbon", v ? "0" : "1");
      return !v;
    });

  const flush = useCallback(async () => {
    if (readOnly) return;
    setSaveState("saving");
    try {
      const xml = await apiRef.current?.getXml();
      const payload: Record<string, string> = { ...docRef.current } as Record<string, string>;
      if (xml) payload.bpmn_xml = xml;
      const res = await fetch(`/api/processes/${process.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        // Survive page unload: without this a save fired on refresh/navigate is
        // cancelled mid-flight, dropping the last change (e.g. a connector toggle).
        keepalive: true,
      });
      if (!res.ok) throw new Error("save failed");
      docRef.current = {};
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }, [process.id, readOnly]);

  const scheduleSave = useCallback(() => {
    if (readOnly) return;
    setSaveState("dirty");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, AUTOSAVE_DEBOUNCE_MS);
  }, [flush, readOnly]);

  // save on unload if dirty
  useEffect(() => {
    const handler = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        flush();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => {
      window.removeEventListener("beforeunload", handler);
      handler();
    };
  }, [flush]);

  const handleDocChange = useCallback(
    (fields: Partial<ProcessRow>) => {
      Object.assign(docRef.current, fields);
      scheduleSave();
    },
    [scheduleSave]
  );

  // Diagram-wide style changes save to this process's XML (via the canvas API's
  // onChange) AND update the project-scoped preference so every new process in
  // the project inherits the same look — keeping exports/shares consistent.
  function changeBorderWeight(next: BorderWeight) {
    setBorderWeight(next);
    apiRef.current?.setBorderWeight(next);
    writeDiagramPref(project.id, "border", next);
    void flush();
  }

  function changeConnectorWeight(next: BorderWeight) {
    setConnectorWeight(next);
    apiRef.current?.setConnectorWeight(next);
    writeDiagramPref(project.id, "connector", next);
    void flush();
  }

  function changeCornerStyle(next: CornerStyle) {
    setCornerStyle(next);
    apiRef.current?.setConnectorCorner(next);
    writeDiagramPref(project.id, "corner", next);
    void flush();
  }

  async function switchStencil(next: Stencil) {
    if (next === stencil) return;
    // Capture current edits so the re-init (new stencil) re-imports them.
    const current = (await apiRef.current?.getXml()) ?? loadXml;
    setLoadXml(current);
    setStencil(next);
    scheduleSave();
  }

  async function handleExport() {
    const a = apiRef.current;
    if (!a) return;
    setExporting(true);
    try {
      const svg = await a.getSvg();
      await exportProcessPdf({
        projectName: project.name,
        process: { ...process, name },
        svg,
      });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      {/* top bar */}
      <div className="flex shrink-0 items-center gap-3 border-b border-hairline bg-paper px-4 py-2.5">
        <nav className="flex min-w-0 items-center gap-1.5 text-[13px]">
          <Link
            href={`/project/${projectSlug(project.name)}`}
            className="shrink-0 font-medium text-ink-faint transition-colors hover:text-ink"
          >
            {project.name}
          </Link>
          <span className="text-ink-faint">/</span>
          <input
            value={name}
            readOnly={readOnly}
            onChange={(e) => {
              setName(e.target.value);
              docRef.current.name = e.target.value;
              scheduleSave();
            }}
            className="min-w-0 flex-1 rounded-md bg-transparent px-1.5 py-0.5 text-[13px] font-semibold text-ink outline-none transition-colors hover:bg-mist/60 focus:bg-surface"
            aria-label="Process name"
          />
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {!readOnly && (
            <StencilSelect value={stencil} onChange={switchStencil} />
          )}
          <SaveStatus state={readOnly ? "saved" : saveState} readOnly={readOnly} />
          <OwnerField
            defaultValue={process.doc_owner}
            readOnly={readOnly}
            onChange={(v) => handleDocChange({ doc_owner: v })}
          />
          <StatusSelect
            value={process.doc_status}
            readOnly={readOnly}
            onChange={(v) => handleDocChange({ doc_status: v })}
          />
          <button
            onClick={handleExport}
            disabled={exporting}
            className="rounded-full border border-cobalt bg-surface px-3.5 py-1.5 text-[12px] font-semibold text-cobalt transition-colors hover:bg-cobalt-wash disabled:opacity-60"
          >
            {exporting ? "Exporting\u2026" : "Export PDF"}
          </button>
        </div>
      </div>

      {!readOnly && (
        <ProcessRibbon
          api={api}
          selection={selection}
          borderWeight={borderWeight}
          onBorderWeight={changeBorderWeight}
          connectorWeight={connectorWeight}
          onConnectorWeight={changeConnectorWeight}
          cornerStyle={cornerStyle}
          onCornerStyle={changeCornerStyle}
          open={ribbonOpen}
          onToggle={toggleRibbon}
        />
      )}

      {/* canvas */}
      <div className="flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1">
          <BpmnCanvas
            xml={loadXml}
            readOnly={readOnly}
            stencil={stencil}
            onChange={scheduleSave}
            onSelectionChange={setSelection}
            onReady={(a) => {
              apiRef.current = a;
              setApi(a);
            }}
          />

          {/* zoom / undo controls — kept bottom-left so they never overlap the
              bpmn.io watermark in the bottom-right (license requirement) */}
          <div className="absolute bottom-4 left-4 flex items-center gap-1 rounded-full border border-hairline bg-surface p-1 shadow-soft">
            {!readOnly && (
              <>
                <CanvasButton label="Undo" onClick={() => apiRef.current?.undo()}>
                  &#8630;
                </CanvasButton>
                <CanvasButton label="Redo" onClick={() => apiRef.current?.redo()}>
                  &#8631;
                </CanvasButton>
                <span className="mx-0.5 h-4 w-px bg-hairline" />
              </>
            )}
            <CanvasButton label="Zoom out" onClick={() => apiRef.current?.zoomOut()}>
              &#8722;
            </CanvasButton>
            <CanvasButton label="Fit to view" onClick={() => apiRef.current?.zoomFit()}>
              &#8857;
            </CanvasButton>
            <CanvasButton label="Zoom in" onClick={() => apiRef.current?.zoomIn()}>
              +
            </CanvasButton>
          </div>

          {readOnly && (
            <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-ember-tint px-4 py-1.5 text-[12px] font-semibold text-ink shadow-soft">
              Trial ended — read only.{" "}
              <Link href="/settings" className="text-cobalt underline">
                Subscribe to keep editing
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OwnerField({
  defaultValue,
  readOnly,
  onChange,
}: {
  defaultValue: string;
  readOnly: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-2.5 py-1">
      <User size={14} weight="bold" className="shrink-0 text-ink-faint" />
      <input
        defaultValue={defaultValue}
        readOnly={readOnly}
        placeholder="Owner"
        onChange={(e) => onChange(e.target.value)}
        className="w-28 bg-transparent text-[12px] text-ink outline-none placeholder:text-ink-faint"
        aria-label="Process owner"
      />
    </div>
  );
}

function StatusSelect({
  value,
  readOnly,
  onChange,
}: {
  value: ProcessDocStatus;
  readOnly: boolean;
  onChange: (value: ProcessDocStatus) => void;
}) {
  const [current, setCurrent] = useState<ProcessDocStatus>(value);
  const [open, setOpen] = useState(false);
  const cfg = STATUS_OPTIONS.find((s) => s.value === current) ?? STATUS_OPTIONS[0];

  function choose(v: ProcessDocStatus) {
    setOpen(false);
    if (v === current) return;
    setCurrent(v);
    onChange(v);
  }

  return (
    <div className="relative">
      <button
        onClick={() => !readOnly && setOpen((o) => !o)}
        disabled={readOnly}
        title="Process status"
        className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-3 py-1.5 text-[12px] font-semibold text-ink transition-colors hover:border-ink-faint disabled:opacity-60"
      >
        <span className="h-2 w-2 rounded-full" style={{ background: cfg.dot }} />
        {cfg.label}
        {!readOnly && <CaretDown size={11} weight="bold" className="text-ink-faint" />}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1 w-40 overflow-hidden rounded-xl border border-hairline bg-surface p-1 shadow-float">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => choose(s.value)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium text-ink transition-colors hover:bg-mist"
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.dot }} />
                {s.label}
                {s.value === current && (
                  <Check size={13} weight="bold" className="ml-auto text-ink-faint" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function StencilSelect({
  value,
  onChange,
}: {
  value: Stencil;
  onChange: (value: Stencil) => void;
}) {
  const [open, setOpen] = useState(false);
  const cfg = STENCILS.find((s) => s.value === value) ?? STENCILS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Stencil set"
        className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-3 py-1.5 text-[12px] font-semibold text-ink transition-colors hover:border-ink-faint"
      >
        <Swatches size={13} weight="bold" className="text-ink-faint" />
        {cfg.label}
        <CaretDown size={11} weight="bold" className="text-ink-faint" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1 w-56 overflow-hidden rounded-xl border border-hairline bg-surface p-1 shadow-float">
            {STENCILS.map((s) => (
              <button
                key={s.value}
                onClick={() => {
                  setOpen(false);
                  onChange(s.value);
                }}
                className="flex w-full items-start gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-mist"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] font-medium text-ink">
                    {s.label}
                  </span>
                  <span className="block text-[11px] text-ink-faint">
                    {s.hint}
                  </span>
                </span>
                {s.value === value && (
                  <Check size={13} weight="bold" className="mt-0.5 shrink-0 text-ink-faint" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SaveStatus({ state, readOnly }: { state: SaveState; readOnly: boolean }) {
  if (readOnly) {
    return (
      <span className="rounded-full bg-mist px-2.5 py-1 text-[11px] font-medium text-ink-faint">
        Read only
      </span>
    );
  }
  const map: Record<SaveState, { label: string; cls: string }> = {
    saved: { label: "Saved", cls: "bg-mist text-ink-faint" },
    dirty: { label: "Unsaved changes", cls: "bg-mist text-ink-faint" },
    saving: { label: "Saving\u2026", cls: "bg-gold-tint text-gold" },
    error: { label: "Save failed — retrying", cls: "bg-ember-tint text-signal" },
  };
  const { label, cls } = map[state];
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${cls}`}>
      {label}
    </span>
  );
}

function CanvasButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-full text-[15px] text-ink-soft transition-colors hover:bg-mist hover:text-ink"
    >
      {children}
    </button>
  );
}

function CanvasSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-paper">
      <p className="text-[13px] text-ink-faint">Loading canvas&hellip;</p>
    </div>
  );
}
