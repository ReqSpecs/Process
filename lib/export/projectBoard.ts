import type { jsPDF } from "jspdf";
import type { ArchitectureStage, ProcessRow } from "@/lib/types";

/* Shared A3 renderer that mirrors the live project board (ProjectView.tsx):
   interlocking chevron chain, modern process cards / groups, and the
   traditional mini-chevron tree. Kept self-contained so the A4 exports
   (single process) keep using pdfHelpers untouched. */

export const A3 = { width: 420, height: 297, margin: 16 } as const;
export const A3_CONTENT_W = A3.width - A3.margin * 2;
export const A3_BOTTOM = A3.height - 14;

const C_INK = "#1d1c1a";
const C_FAINT = "#8a867e";
const C_HAIR = "#e6e4df";
const NAVY = "#12244d";

// Matches STAGE_COLORS in ProjectView.tsx.
const FILL: Record<string, string> = {
  lime: "#AEF029",
  violet: "#7C3AED",
  cobalt: "#0047AB",
  ember: "#FF5722",
  magenta: "#E81E62",
  teal: "#0F9E7A",
  gold: "#b45309",
};
const INK: Record<string, string> = {
  lime: "#7a9e00",
  violet: "#7C3AED",
  cobalt: "#0047AB",
  ember: "#FF5722",
  magenta: "#E81E62",
  teal: "#0F9E7A",
  gold: "#b45309",
};
const LIGHT = new Set(["lime"]);

export const inkFor = (color: string) => INK[color] ?? INK.cobalt;
export const fillFor = (color: string) => FILL[color] ?? FILL.cobalt;

/* chevron chain */
const CHEV_H = 20;
const CHEV_ARROW = CHEV_H * 0.3;
const CHEV_GAP_BELOW = 7;
const COL_PAD = 3;

/* modern cards (mm, before fit-to-page scaling) */
const CARD_H = 10;
const CARD_GAP = 2.4;
const GROUP_H = 10.5;
const GROUP_KIDS_GAP = 2.2;
const CHILD_INDENT = 5;
const CHILD_H = 9;
const CHILD_GAP = 2;
const GROUP_BOTTOM = 3.5;

/* traditional tree */
const ROW_H = 9;
const BAR_H = 7.2;
const TREE_INDENT = 5;

type Kids = (groupId: string) => ProcessRow[];

/* ------------------------------------------------------------------ board */

export function drawProjectBoard(
  doc: jsPDF,
  {
    stages,
    top,
    kids,
    view,
    startY,
  }: {
    stages: ArchitectureStage[];
    top: (stageId: string) => ProcessRow[];
    kids: Kids;
    view: "modern" | "traditional";
    startY: number;
  },
) {
  if (stages.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(C_FAINT);
    doc.text("No chevrons yet.", A3.margin, startY + 12);
    return;
  }

  const n = stages.length;
  const colW = A3_CONTENT_W / n;

  drawChevrons(doc, stages, startY, colW);

  const colTop = startY + CHEV_H + CHEV_GAP_BELOW;
  const avail = A3_BOTTOM - colTop;

  const heights = stages.map((s) =>
    view === "modern"
      ? measureModern(top(s.id), kids)
      : measureTraditional(top(s.id), kids),
  );
  const maxH = Math.max(1, ...heights);
  const s = Math.max(0.4, Math.min(1, avail / maxH));

  stages.forEach((stage, i) => {
    const x = A3.margin + i * colW + COL_PAD;
    const w = colW - COL_PAD * 2;
    const ink = inkFor(stage.color);
    const fill = fillFor(stage.color);
    if (view === "modern") {
      drawModernCol(doc, x, colTop, w, ink, top(stage.id), kids, s);
    } else {
      drawTraditionalCol(doc, x, colTop, w, ink, fill, top(stage.id), kids, s);
    }
  });
}

/* ------------------------------------------------------------- measuring */

function measureModern(items: ProcessRow[], kids: Kids): number {
  let h = 0;
  for (const item of items) {
    if (item.is_group) {
      h += GROUP_H + GROUP_KIDS_GAP;
      for (const _c of kids(item.id)) h += CHILD_H + CHILD_GAP;
      h += GROUP_BOTTOM;
    } else {
      h += CARD_H + CARD_GAP;
    }
  }
  return h;
}

function measureTraditional(items: ProcessRow[], kids: Kids): number {
  let h = 0;
  for (const item of items) {
    h += ROW_H;
    if (item.is_group) for (const _c of kids(item.id)) h += ROW_H;
  }
  return h;
}

/* ------------------------------------------------------------- chevrons */

function drawChevrons(
  doc: jsPDF,
  stages: ArchitectureStage[],
  y: number,
  colW: number,
) {
  const A = CHEV_ARROW;
  stages.forEach((stage, i) => {
    const x = A3.margin + i * colW;
    const first = i === 0;
    doc.setFillColor(fillFor(stage.color));
    doc.lines(
      [
        [colW - A, 0],
        [A, CHEV_H / 2],
        [-A, CHEV_H / 2],
        [-(colW - A), 0],
        first ? [0, -CHEV_H / 2] : [A, -CHEV_H / 2],
        first ? [0, -CHEV_H / 2] : [-A, -CHEV_H / 2],
      ],
      x,
      y,
      [1, 1],
      "F",
      true,
    );
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(LIGHT.has(stage.color) ? NAVY : "#ffffff");
    const usableW = colW - A - (first ? 6 : A) - 6;
    const lines = (doc.splitTextToSize(stage.name, usableW) as string[]).slice(
      0,
      2,
    );
    const cx = x + (first ? 0 : A) + (colW - A - (first ? 0 : A)) / 2;
    doc.text(lines, cx, y + CHEV_H / 2 + 1, {
      align: "center",
      baseline: "middle",
    });
  });
}

/* --------------------------------------------------------------- modern */

function drawModernCol(
  doc: jsPDF,
  x: number,
  startY: number,
  w: number,
  ink: string,
  items: ProcessRow[],
  kids: Kids,
  s: number,
) {
  let y = startY;
  for (const item of items) {
    if (item.is_group) {
      groupCard(doc, x, y, w, GROUP_H * s, ink, item.name, kids(item.id).length, s);
      y += GROUP_H * s + GROUP_KIDS_GAP * s;
      const cx = x + CHILD_INDENT * s;
      const cw = w - CHILD_INDENT * s;
      const kidList = kids(item.id);
      const branchTop = y;
      let lastY = y;
      for (const c of kidList) {
        doc.setDrawColor(tint(ink, 0.72));
        doc.setLineWidth(0.3);
        doc.line(x + 1.4 * s, y + (CHILD_H * s) / 2, cx, y + (CHILD_H * s) / 2);
        procCard(doc, cx, y, cw, CHILD_H * s, ink, c.name, s);
        lastY = y + (CHILD_H * s) / 2;
        y += CHILD_H * s + CHILD_GAP * s;
      }
      if (kidList.length > 0) {
        doc.setDrawColor(tint(ink, 0.72));
        doc.setLineWidth(0.3);
        doc.line(x + 1.4 * s, branchTop, x + 1.4 * s, lastY);
      }
      y += GROUP_BOTTOM * s;
    } else {
      procCard(doc, x, y, w, CARD_H * s, ink, item.name, s);
      y += CARD_H * s + CARD_GAP * s;
    }
  }
}

function procCard(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  ink: string,
  name: string,
  s: number,
) {
  doc.setFillColor("#ffffff");
  doc.setDrawColor(C_HAIR);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, w, h, 1.6, 1.6, "FD");
  iconTile(doc, x + 2 * s, y + (h - 5.2 * s) / 2, 5.2 * s, ink);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9 * s);
  doc.setTextColor(C_INK);
  const tx = x + 2 * s + 5.2 * s + 2.2 * s;
  const line = clip(doc, name, w - (tx - x) - 2.5 * s);
  doc.text(line, tx, y + h / 2 + 0.3, { baseline: "middle" });
}

function groupCard(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  ink: string,
  name: string,
  count: number,
  s: number,
) {
  doc.setFillColor("#ffffff");
  doc.setDrawColor(tint(ink, 0.5));
  doc.setLineWidth(0.9);
  doc.roundedRect(x, y, w, h, 1.8, 1.8, "FD");
  iconTile(doc, x + 2.2 * s, y + (h - 5.4 * s) / 2, 5.4 * s, ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9 * s);
  doc.setTextColor(C_INK);
  const tx = x + 2.2 * s + 5.4 * s + 2.4 * s;
  const countW = doc.getTextWidth(String(count)) + 2;
  const line = clip(doc, name, w - (tx - x) - countW - 3 * s);
  doc.text(line, tx, y + h / 2 + 0.3, { baseline: "middle" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5 * s);
  doc.setTextColor(C_FAINT);
  doc.text(String(count), x + w - 2.5 * s, y + h / 2 + 0.3, {
    align: "right",
    baseline: "middle",
  });
}

function iconTile(doc: jsPDF, x: number, y: number, size: number, ink: string) {
  doc.setFillColor(tint(ink, 0.86));
  doc.roundedRect(x, y, size, size, size * 0.22, size * 0.22, "F");
  doc.setFillColor(ink);
  const inner = size * 0.42;
  doc.roundedRect(
    x + (size - inner) / 2,
    y + (size - inner) / 2,
    inner,
    inner,
    inner * 0.25,
    inner * 0.25,
    "F",
  );
}

/* ----------------------------------------------------------- traditional */

function drawTraditionalCol(
  doc: jsPDF,
  x: number,
  startY: number,
  w: number,
  ink: string,
  fill: string,
  items: ProcessRow[],
  kids: Kids,
  s: number,
) {
  const rowH = ROW_H * s;
  const barH = BAR_H * s;
  const indent = TREE_INDENT * s;
  let y = startY;

  for (const item of items) {
    const barY = y + (rowH - barH) / 2;
    // trunk tick into the row
    doc.setDrawColor(C_HAIR);
    doc.setLineWidth(0.3);
    doc.line(x, barY + barH / 2, x + 2 * s, barY + barH / 2);

    if (item.is_group) {
      chevBar(doc, x + 2 * s, barY, w - 2 * s, barH, "#ffffff", ink, item.name, s, ink);
      y += rowH;
      const kx = x + indent + 2 * s;
      const kidList = kids(item.id);
      const branchTop = y;
      let lastMid = branchTop;
      for (const c of kidList) {
        const cBarY = y + (rowH - barH) / 2;
        const mid = cBarY + barH / 2;
        doc.setDrawColor(C_HAIR);
        doc.setLineWidth(0.3);
        doc.line(x + indent, mid, kx, mid);
        chevBar(doc, kx, cBarY, w - (kx - x), barH, tint(ink, 0.9), ink, c.name, s);
        lastMid = mid;
        y += rowH;
      }
      if (kidList.length > 0) {
        doc.setDrawColor(C_HAIR);
        doc.setLineWidth(0.3);
        doc.line(x + indent, branchTop, x + indent, lastMid);
      }
    } else {
      chevBar(doc, x + 2 * s, barY, w - 2 * s, barH, tint(ink, 0.9), ink, item.name, s);
      y += rowH;
    }
  }
}

function chevBar(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  textColor: string,
  label: string,
  s: number,
  border?: string,
) {
  const A = h * 0.42;
  doc.setFillColor(fill);
  if (border) {
    doc.setDrawColor(border);
    doc.setLineWidth(0.5);
  }
  doc.lines(
    [
      [w - A, 0],
      [A, h / 2],
      [-A, h / 2],
      [-(w - A), 0],
      [A, -h / 2],
      [-A, -h / 2],
    ],
    x,
    y,
    [1, 1],
    border ? "FD" : "F",
    true,
  );
  doc.setFont("helvetica", border ? "bold" : "normal");
  doc.setFontSize(8 * s);
  doc.setTextColor(textColor);
  const tx = x + A + 1.6 * s;
  const line = clip(doc, label, w - A * 2 - 3 * s);
  doc.text(line, tx, y + h / 2 + 0.3, { baseline: "middle" });
}

/* --------------------------------------------------------- header/footer */

export function drawA3Header(doc: jsPDF, title: string, subtitle: string) {
  doc.setFillColor("#ffffff");
  doc.rect(0, 0, A3.width, A3.height, "F");
  doc.setFillColor("#0047AB");
  doc.triangle(A3.margin, 16, A3.margin + 4, 20, A3.margin, 24, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(C_INK);
  doc.text("ProDraw", A3.margin + 6, 21.5);
  doc.setFontSize(22);
  doc.text(title, A3.margin, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(C_FAINT);
  doc.text(subtitle, A3.margin, 47);
  doc.setDrawColor(C_HAIR);
  doc.setLineWidth(0.3);
  doc.line(A3.margin, 52, A3.width - A3.margin, 52);
}

export function drawA3Footer(doc: jsPDF, pageNum?: number, pageCount?: number) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(C_FAINT);
  doc.text(
    `Exported from ProDraw \u2014 ${new Date().toLocaleDateString()}`,
    A3.margin,
    A3.height - 8,
  );
  if (pageNum && pageCount) {
    doc.text(`${pageNum} / ${pageCount}`, A3.width - A3.margin, A3.height - 8, {
      align: "right",
    });
  }
}

/* --------------------------------------------------------------- helpers */

function clip(doc: jsPDF, text: string, maxW: number): string {
  if (doc.getTextWidth(text) <= maxW) return text;
  let t = text;
  while (t.length > 1 && doc.getTextWidth(t + "\u2026") > maxW) t = t.slice(0, -1);
  return t + "\u2026";
}

export function tint(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const mix = (c: number) => Math.round(c + (255 - c) * amt);
  return `#${((1 << 24) + (mix(r) << 16) + (mix(g) << 8) + mix(b))
    .toString(16)
    .slice(1)}`;
}
