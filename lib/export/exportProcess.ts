import type { ProcessRow } from "@/lib/types";
import { drawFooter, drawHeader, drawSvg, PAGE, PDF_COLORS } from "@/lib/export/pdfHelpers";

/** Export a single process: diagram page + documentation block. */
export async function exportProcessPdf({
  projectName,
  process,
  svg,
}: {
  projectName: string;
  process: ProcessRow;
  svg: string;
}) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  drawHeader(doc, process.name, `${projectName} · BPMN 2.0`);

  await drawSvg(doc, svg, {
    x: PAGE.margin,
    y: 56,
    width: PAGE.width - PAGE.margin * 2,
    height: 100,
  });

  drawDocBlock(doc, process, 162);
  drawFooter(doc, 1, 1);

  doc.save(`${safeFilename(process.name)}.pdf`);
}

export function drawDocBlock(
  doc: import("jspdf").jsPDF,
  process: ProcessRow,
  startY: number
) {
  const fields: [string, string][] = [
    ["Owner", process.doc_owner],
    ["Status", process.doc_status.replace("_", " ")],
    ["Inputs", process.doc_inputs],
    ["Outputs", process.doc_outputs],
    ["Systems", process.doc_systems],
    ["Risks", process.doc_risks],
    ["Notes", process.doc_notes],
  ];
  const filled = fields.filter(([, v]) => v && v.trim());
  if (filled.length === 0) return;

  const colWidth = (PAGE.width - PAGE.margin * 2 - 12) / 4;
  let x = PAGE.margin;
  let y = startY;

  doc.setDrawColor(PDF_COLORS.hairline);
  doc.setLineWidth(0.3);
  doc.line(PAGE.margin, y - 6, PAGE.width - PAGE.margin, y - 6);

  filled.forEach(([label, value], i) => {
    if (i > 0 && i % 4 === 0) {
      x = PAGE.margin;
      y += 22;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(PDF_COLORS.inkFaint);
    doc.text(label.toUpperCase(), x, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(PDF_COLORS.ink);
    const lines = doc.splitTextToSize(value, colWidth - 4) as string[];
    doc.text(lines.slice(0, 4), x, y + 4.5);

    x += colWidth + 4;
  });
}

export function safeFilename(name: string) {
  return name.replace(/[^a-z0-9-_ ]/gi, "").trim().replace(/\s+/g, "-") || "process";
}
