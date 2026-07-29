import type { jsPDF } from "jspdf";
import type { ArchitectureStage, ProcessRow, Project } from "@/lib/types";
import { drawSvg } from "@/lib/export/pdfHelpers";
import { safeFilename } from "@/lib/export/exportProcess";
import {
  A3,
  A3_CONTENT_W,
  drawA3Footer,
  drawA3Header,
  drawProjectBoard,
} from "@/lib/export/projectBoard";

const C_INK = "#1d1c1a";
const C_FAINT = "#8a867e";
const C_HAIR = "#e6e4df";

/**
 * Export a whole project: page 1 is the high-level architecture (modern view,
 * identical to the board), then one A3 page per process in reading order with a
 * large diagram + documentation.
 */
export async function exportProjectPdf({
  project,
  stages,
  processes,
  view = "modern",
}: {
  project: Project;
  stages: ArchitectureStage[];
  processes: ProcessRow[];
  view?: "modern" | "traditional";
}) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a3" });

  const top = (stageId: string) =>
    processes
      .filter((p) => p.stage_id === stageId && !p.parent_id)
      .sort((a, b) => a.sort_order - b.sort_order);
  const kids = (groupId: string) =>
    processes
      .filter((p) => p.parent_id === groupId)
      .sort((a, b) => a.sort_order - b.sort_order);
  const unassignedTop = () =>
    processes
      .filter(
        (p) =>
          !p.parent_id &&
          (!p.stage_id || !stages.some((s) => s.id === p.stage_id)),
      )
      .sort((a, b) => a.sort_order - b.sort_order);

  // Reading order: stage by stage, each top item, group children inline.
  const ordered: ProcessRow[] = [];
  const walk = (items: ProcessRow[]) => {
    for (const item of items) {
      if (item.is_group) ordered.push(...kids(item.id).filter((c) => !c.is_group));
      else ordered.push(item);
    }
  };
  for (const stage of stages) walk(top(stage.id));
  walk(unassignedTop());

  const pageCount = 1 + ordered.length;

  // ---------- page 1: architecture ----------
  drawA3Header(
    doc,
    project.name,
    `Process architecture \u00b7 ${view === "modern" ? "Modern" : "Traditional"} view`,
  );
  drawProjectBoard(doc, { stages, top, kids, view, startY: 60 });
  drawA3Footer(doc, 1, pageCount);

  // ---------- pages 2..n: each process diagram ----------
  const renderSvg = await createBpmnRenderer();
  try {
    for (let i = 0; i < ordered.length; i++) {
      const proc = ordered[i];
      doc.addPage("a3", "landscape");

      const stageName = proc.stage_id
        ? stages.find((s) => s.id === proc.stage_id)?.name
        : undefined;
      drawA3Header(
        doc,
        proc.name,
        stageName ? `${project.name} \u00b7 ${stageName}` : project.name,
      );

      try {
        const svg = await renderSvg(proc.bpmn_xml);
        await drawSvg(doc, svg, {
          x: A3.margin,
          y: 62,
          width: A3_CONTENT_W,
          height: 176,
        });
      } catch {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(C_FAINT);
        doc.text("(Diagram could not be rendered)", A3.margin, 92);
      }

      drawDocBlock(doc, proc);
      drawA3Footer(doc, i + 2, pageCount);
    }
  } finally {
    renderSvg.destroy();
  }

  doc.save(`${safeFilename(project.name)}.pdf`);
}

/* ------------------------------------------------------------- doc block */

function drawDocBlock(doc: jsPDF, process: ProcessRow) {
  const fields: [string, string][] = [
    ["Owner", process.doc_owner],
    ["Status", process.doc_status.replace("_", " ")],
    ["Inputs", process.doc_inputs],
    ["Outputs", process.doc_outputs],
    ["Systems", process.doc_systems],
    ["Notes", process.doc_notes],
  ];
  const filled = fields.filter(([, v]) => v && v.trim());
  if (filled.length === 0) return;

  const y0 = 250;
  doc.setDrawColor(C_HAIR);
  doc.setLineWidth(0.3);
  doc.line(A3.margin, y0 - 6, A3.width - A3.margin, y0 - 6);

  const cols = 4;
  const colW = (A3_CONTENT_W - 12) / cols;
  filled.forEach(([label, value], i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = A3.margin + col * (colW + 4);
    const y = y0 + row * 18;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(C_FAINT);
    doc.text(label.toUpperCase(), x, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(C_INK);
    const lines = (doc.splitTextToSize(value, colW) as string[]).slice(0, 3);
    doc.text(lines, x, y + 5);
  });
}

/* ------------------------------------------------- off-screen bpmn viewer */

type BpmnViewer = {
  importXML: (xml: string) => Promise<unknown>;
  saveSVG: () => Promise<{ svg: string }>;
  get: (m: string) => { zoom: (l: "fit-viewport") => void };
  destroy: () => void;
};

async function createBpmnRenderer() {
  const { default: Viewer } = await import("bpmn-js/lib/Viewer");
  const { makeProdrawViewerModule, prodrawModdleDescriptor } = await import(
    "@/lib/bpmn/prodrawModules"
  );
  const { readStencil } = await import("@/lib/bpmn/stencil");

  const holder = document.createElement("div");
  holder.style.position = "fixed";
  holder.style.left = "-10000px";
  holder.style.top = "0";
  holder.style.width = "1400px";
  holder.style.height = "900px";
  document.body.appendChild(holder);

  const Ctor = Viewer as unknown as new (options: {
    container: HTMLElement;
    additionalModules?: unknown[];
    moddleExtensions?: Record<string, unknown>;
  }) => BpmnViewer;

  // One viewer per stencil so each diagram exports with its own styling.
  const viewers: Record<string, BpmnViewer> = {};
  const getViewer = (stencil: string): BpmnViewer => {
    if (!viewers[stencil]) {
      viewers[stencil] = new Ctor({
        container: holder,
        additionalModules: [makeProdrawViewerModule(stencil as never)],
        moddleExtensions: { prodraw: prodrawModdleDescriptor },
      });
    }
    return viewers[stencil];
  };

  const render = async (xml: string): Promise<string> => {
    if (!xml || !xml.trim()) throw new Error("empty diagram");
    const viewer = getViewer(readStencil(xml));
    await viewer.importXML(xml);
    // Fit the diagram so saveSVG captures the whole model (mirrors the editor).
    try {
      viewer.get("canvas").zoom("fit-viewport");
    } catch {
      /* zoom is best-effort */
    }
    const { svg } = await viewer.saveSVG();
    return svg;
  };

  render.destroy = () => {
    Object.values(viewers).forEach((v) => v.destroy());
    holder.remove();
  };

  return render;
}
