import type { jsPDF } from "jspdf";
import { drawFooter, PAGE, PDF_COLORS } from "@/lib/export/pdfHelpers";

export type LibraryExportRow = {
  name: string;
  project: string;
  accent: string; // project accent hex
  owners: { initials: string; color: string }[];
  edited: string;
  status: string; // label: Published | In review | Draft
};

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  Published: { bg: "#e7f6ec", text: "#1a7f45", dot: "#22a35b" },
  "In review": { bg: "#fef3d6", text: "#b26a02", dot: "#f59e0b" },
  Draft: { bg: "#ecebe8", text: "#6b675f", dot: "#9a958c" },
};

/** Mix a hex colour toward white by amt (0..1) for soft chip tints. */
function tint(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const mix = (c: number) => Math.round(c + (255 - c) * amt);
  return `#${((1 << 24) + (mix(r) << 16) + (mix(g) << 8) + mix(b)).toString(16).slice(1)}`;
}

const COLS = [
  { key: "name", label: "Process", w: 88 },
  { key: "project", label: "Project", w: 66 },
  { key: "owner", label: "Owner", w: 42 },
  { key: "edited", label: "Edited", w: 28 },
  { key: "status", label: "Status", w: 37 },
] as const;

const X0 = PAGE.margin;
const ROW_H = 9;
const TABLE_TOP = 60;
const BOTTOM = PAGE.height - 16;

/**
 * Export the current process-library view (already filtered + sorted) as a
 * styled landscape table PDF that mirrors the dashboard's colours.
 */
export async function exportLibraryPdf({
  rows,
  subtitle,
}: {
  rows: LibraryExportRow[];
  subtitle: string;
}) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const perPage = Math.floor((BOTTOM - (TABLE_TOP + 8)) / ROW_H);
  const pages = Math.max(1, Math.ceil(rows.length / perPage));
  let page = 1;

  drawPageChrome(doc, subtitle);
  let y = TABLE_TOP + 8;

  for (let i = 0; i < rows.length; i++) {
    if (y + ROW_H > BOTTOM) {
      drawFooter(doc, page, pages);
      doc.addPage("a4", "landscape");
      page += 1;
      drawPageChrome(doc, subtitle);
      y = TABLE_TOP + 8;
    }
    drawRow(doc, rows[i], y);
    y += ROW_H;
  }

  drawFooter(doc, page, pages);
  doc.save(`process-library-${new Date().toISOString().slice(0, 10)}.pdf`);
}

/** White page background, ProDraw wordmark, title + subtitle, table header. */
function drawPageChrome(doc: jsPDF, subtitle: string) {
  // white background (matches the in-app dashboard)
  doc.setFillColor("#ffffff");
  doc.rect(0, 0, PAGE.width, PAGE.height, "F");

  // wordmark
  doc.setFillColor("#0047AB");
  doc.triangle(X0, 15, X0 + 4, 19, X0, 23, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(PDF_COLORS.ink);
  doc.text("ProDraw", X0 + 6, 20.5);

  // title + subtitle
  doc.setFontSize(20);
  doc.text("Process library", X0, 37);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(PDF_COLORS.inkFaint);
  doc.text(subtitle, X0, 44);

  // table header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(PDF_COLORS.inkFaint);
  let x = X0;
  for (const c of COLS) {
    doc.text(c.label.toUpperCase(), x, TABLE_TOP);
    x += c.w;
  }
  doc.setDrawColor(PDF_COLORS.hairline);
  doc.setLineWidth(0.3);
  doc.line(X0, TABLE_TOP + 2.5, PAGE.width - PAGE.margin, TABLE_TOP + 2.5);
}

function drawRow(doc: jsPDF, r: LibraryExportRow, top: number) {
  const cy = top + ROW_H / 2 - 1; // vertical centre for this row
  const colX: Record<string, number> = {};
  let x = X0;
  for (const c of COLS) {
    colX[c.key] = x;
    x += c.w;
  }

  // ---- Process: colour dot + bold name
  doc.setFillColor(r.accent);
  doc.circle(colX.name + 1.4, cy, 1.4, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(PDF_COLORS.ink);
  doc.text(fit(doc, r.name, COLS[0].w - 7), colX.name + 5, cy, {
    baseline: "middle",
  });

  // ---- Project: soft pill with dot + accent text
  if (r.project) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    const label = fit(doc, r.project, COLS[1].w - 12);
    const tw = doc.getTextWidth(label);
    const pillW = Math.min(COLS[1].w - 3, tw + 9);
    doc.setFillColor(tint(r.accent, 0.86));
    doc.roundedRect(colX.project, cy - 2.9, pillW, 5.8, 2.9, 2.9, "F");
    doc.setFillColor(r.accent);
    doc.circle(colX.project + 3, cy, 1, "F");
    doc.setTextColor(r.accent);
    doc.text(label, colX.project + 5.5, cy, { baseline: "middle" });
  }

  // ---- Owner: overlapping initial bubbles
  if (r.owners.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(PDF_COLORS.inkFaint);
    doc.text("\u2014", colX.owner, cy, { baseline: "middle" });
  } else {
    const shown = r.owners.slice(0, 4);
    let ox = colX.owner + 2.4;
    shown.forEach((o) => {
      doc.setFillColor(o.color);
      doc.circle(ox, cy, 2.4, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      doc.setTextColor("#ffffff");
      doc.text(o.initials, ox, cy + 0.1, {
        align: "center",
        baseline: "middle",
      });
      ox += 3.6; // overlap
    });
    if (r.owners.length > 4) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(PDF_COLORS.inkFaint);
      doc.text(`+${r.owners.length - 4}`, ox + 1, cy, { baseline: "middle" });
    }
  }

  // ---- Edited
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(PDF_COLORS.inkSoft);
  doc.text(fit(doc, r.edited, COLS[3].w - 2), colX.edited, cy, {
    baseline: "middle",
  });

  // ---- Status pill
  const st = STATUS_STYLE[r.status] ?? STATUS_STYLE.Draft;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  const stw = doc.getTextWidth(r.status);
  const stPillW = stw + 9;
  doc.setFillColor(st.bg);
  doc.roundedRect(colX.status, cy - 2.9, stPillW, 5.8, 2.9, 2.9, "F");
  doc.setFillColor(st.dot);
  doc.circle(colX.status + 3, cy, 1, "F");
  doc.setTextColor(st.text);
  doc.text(r.status, colX.status + 5.5, cy, { baseline: "middle" });

  // row separator
  doc.setDrawColor("#f0efec");
  doc.setLineWidth(0.2);
  doc.line(X0, top + ROW_H - 0.5, PAGE.width - PAGE.margin, top + ROW_H - 0.5);
}

/** Truncate text with an ellipsis to fit within maxW (mm). */
function fit(doc: jsPDF, text: string, maxW: number): string {
  if (!text) return "\u2014";
  if (doc.getTextWidth(text) <= maxW) return text;
  let t = text;
  while (t.length > 1 && doc.getTextWidth(t + "\u2026") > maxW) {
    t = t.slice(0, -1);
  }
  return t + "\u2026";
}
