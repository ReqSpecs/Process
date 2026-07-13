"use client";

import { useEffect, useRef, useState } from "react";
import { CaretDown, DownloadSimple, FileText, Stack } from "@phosphor-icons/react";
import type { ArchitectureStage, ProcessRow, Project } from "@/lib/types";

export function ExportProjectButton({
  project,
  stages,
  processes,
  view,
}: {
  project: Project;
  stages: ArchitectureStage[];
  processes: ProcessRow[];
  view: "modern" | "traditional";
}) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  async function exportView() {
    setOpen(false);
    setExporting(true);
    try {
      const { exportProjectViewPdf } = await import(
        "@/lib/export/exportProjectView"
      );
      await exportProjectViewPdf({ project, stages, processes, view });
    } finally {
      setExporting(false);
    }
  }

  async function exportEntire() {
    setOpen(false);
    setExporting(true);
    try {
      const { exportProjectPdf } = await import("@/lib/export/exportProject");
      await exportProjectPdf({ project, stages, processes, view });
    } finally {
      setExporting(false);
    }
  }

  const empty = processes.filter((p) => !p.is_group).length === 0;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={exporting || empty}
        className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-surface px-3.5 py-2 text-[13px] font-semibold text-ink transition-colors hover:border-ink-faint disabled:opacity-50"
      >
        <DownloadSimple size={15} weight="bold" />
        {exporting ? "Exporting\u2026" : "Export PDF"}
        <CaretDown size={12} weight="bold" className="text-ink-faint" />
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-1.5 w-64 overflow-hidden rounded-xl border border-hairline bg-surface p-1 shadow-float">
          <MenuItem
            icon={<FileText size={16} weight="bold" />}
            title={`Current view (${view === "modern" ? "Modern" : "Traditional"})`}
            desc="Chevrons & process layout as shown"
            onClick={exportView}
          />
          <MenuItem
            icon={<Stack size={16} weight="bold" />}
            title="Entire project"
            desc="Architecture + every process diagram"
            onClick={exportEntire}
          />
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  title,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-mist"
    >
      <span className="mt-0.5 text-ink-soft">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold text-ink">{title}</span>
        <span className="block text-[11.5px] text-ink-faint">{desc}</span>
      </span>
    </button>
  );
}
