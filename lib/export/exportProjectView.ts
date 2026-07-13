import type { ArchitectureStage, ProcessRow, Project } from "@/lib/types";
import { safeFilename } from "@/lib/export/exportProcess";
import {
  drawA3Footer,
  drawA3Header,
  drawProjectBoard,
} from "@/lib/export/projectBoard";

/** Export the project's high-level architecture in the currently selected view. */
export async function exportProjectViewPdf({
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

  drawA3Header(
    doc,
    project.name,
    `Process architecture \u00b7 ${view === "modern" ? "Modern" : "Traditional"} view`,
  );
  drawProjectBoard(doc, { stages, top, kids, view, startY: 60 });
  drawA3Footer(doc);

  doc.save(`${safeFilename(project.name)}-${view}.pdf`);
}
