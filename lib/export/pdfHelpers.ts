import type { jsPDF } from "jspdf";

export const PDF_COLORS = {
  ink: "#1d1c1a",
  inkSoft: "#55524c",
  inkFaint: "#8a867e",
  paper: "#f7f6f3",
  hairline: "#e6e4df",
  cobalt: "#1e40af",
  ember: "#f97316",
  gold: "#b45309",
} as const;

export const PAGE = {
  width: 297, // A4 landscape (mm)
  height: 210,
  margin: 18,
} as const;

export function drawHeader(doc: jsPDF, title: string, subtitle: string) {
  doc.setFillColor(PDF_COLORS.paper);
  doc.rect(0, 0, PAGE.width, PAGE.height, "F");

  // wordmark
  doc.setFillColor(PDF_COLORS.cobalt);
  doc.triangle(PAGE.margin, 16, PAGE.margin + 4, 20, PAGE.margin, 24, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(PDF_COLORS.ink);
  doc.text("ProDraw", PAGE.margin + 6, 21.5);

  doc.setFontSize(20);
  doc.text(title, PAGE.margin, 38);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(PDF_COLORS.inkFaint);
  doc.text(subtitle, PAGE.margin, 45);

  doc.setDrawColor(PDF_COLORS.hairline);
  doc.setLineWidth(0.3);
  doc.line(PAGE.margin, 50, PAGE.width - PAGE.margin, 50);
}

export function drawFooter(doc: jsPDF, pageNum: number, pageCount: number) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(PDF_COLORS.inkFaint);
  doc.text(
    `Exported from ProDraw — ${new Date().toLocaleDateString()}`,
    PAGE.margin,
    PAGE.height - 8
  );
  doc.text(
    `${pageNum} / ${pageCount}`,
    PAGE.width - PAGE.margin,
    PAGE.height - 8,
    { align: "right" }
  );
}

/** Render a BPMN SVG string onto the current page, scaled to fit the box. */
export async function drawSvg(
  doc: jsPDF,
  svgString: string,
  box: { x: number; y: number; width: number; height: number }
) {
  await import("svg2pdf.js"); // registers doc.svg()

  const parsed = new DOMParser().parseFromString(svgString, "image/svg+xml");
  const element = parsed.documentElement as unknown as SVGSVGElement;

  const svgWidth = parseFloat(element.getAttribute("width") ?? "0") || 800;
  const svgHeight = parseFloat(element.getAttribute("height") ?? "0") || 600;
  const scale = Math.min(box.width / svgWidth, box.height / svgHeight, 1.2);
  const width = svgWidth * scale;
  const height = svgHeight * scale;

  // svg2pdf needs the element attached to the DOM for style resolution
  const holder = document.createElement("div");
  holder.style.position = "fixed";
  holder.style.left = "-10000px";
  holder.appendChild(element);
  document.body.appendChild(holder);

  try {
    await (doc as jsPDF & {
      svg: (el: Element, options: { x: number; y: number; width: number; height: number }) => Promise<jsPDF>;
    }).svg(element, {
      x: box.x + (box.width - width) / 2,
      y: box.y + (box.height - height) / 2,
      width,
      height,
    });
  } finally {
    holder.remove();
  }
}

/** Draw a chevron chain (project architecture) onto the current page. */
export function drawChevrons(
  doc: jsPDF,
  stages: { name: string; color: string }[],
  y: number
) {
  if (stages.length === 0) return;

  const totalWidth = PAGE.width - PAGE.margin * 2;
  const gap = 1.5;
  const chevronWidth = (totalWidth - gap * (stages.length - 1)) / stages.length;
  const height = 14;
  const notch = Math.min(6, chevronWidth * 0.18);

  const fills: Record<string, string> = {
    cobalt: "#0047AB",
    ember: "#FF5722",
    gold: "#b45309",
    violet: "#7C3AED",
    teal: "#0F9E7A",
    magenta: "#E81E62",
    lime: "#AEF029",
  };
  const lightFills = new Set(["lime"]); // need dark text

  stages.forEach((stage, i) => {
    const x = PAGE.margin + i * (chevronWidth + gap);
    doc.setFillColor(fills[stage.color] ?? "#0047AB");

    // chevron polygon: notched left (except first), pointed right
    const leftNotch = i === 0 ? 0 : notch;
    doc.lines(
      [
        [chevronWidth - notch, 0],
        [notch, height / 2],
        [-notch, height / 2],
        [-(chevronWidth - notch), 0],
        [leftNotch, -height / 2],
        [-leftNotch, -height / 2],
      ],
      x,
      y,
      [1, 1],
      "F",
      true
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(lightFills.has(stage.color) ? "#12244d" : "#ffffff");
    const label = doc.splitTextToSize(stage.name, chevronWidth - notch - 4) as string[];
    doc.text(label.slice(0, 2), x + (chevronWidth + leftNotch - notch) / 2, y + height / 2 + 1, {
      align: "center",
      baseline: "middle",
    });
  });
}
