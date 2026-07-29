/**
 * Per-project diagram style preferences (task border weight, connector weight,
 * connector corner style). Remembered client-side, keyed by project, so every
 * process a user creates in a project inherits the same look — keeping exports
 * and shares visually consistent across the project.
 *
 * The value is also baked into each new process's BPMN XML at creation, so the
 * preference survives on the diagram itself (see `defaultDiagramXml`).
 */
import type { BorderWeight, CornerStyle } from "./stencil";

export type DiagramPrefs = {
  border: BorderWeight;
  connector: BorderWeight;
  corner: CornerStyle;
};

export const DEFAULT_DIAGRAM_PREFS: DiagramPrefs = {
  border: "thin",
  connector: "thick",
  corner: "round",
};

const key = (projectId: string, kind: keyof DiagramPrefs) =>
  `prodraw:pref:${kind}:${projectId}`;

// Legacy global keys (pre project-scoping) — read as a fallback so existing
// users keep their remembered border preference.
const LEGACY = {
  border: "prodraw:borderWeight",
  connector: "prodraw:connectorWeight",
  corner: "prodraw:cornerStyle",
} as const;

function read(projectId: string, kind: keyof DiagramPrefs): string | null {
  try {
    return (
      localStorage.getItem(key(projectId, kind)) ??
      localStorage.getItem(LEGACY[kind])
    );
  } catch {
    return null;
  }
}

/** Reads a project's remembered diagram preferences (with sensible defaults). */
export function readDiagramPrefs(projectId: string): DiagramPrefs {
  return {
    border: read(projectId, "border") === "thick" ? "thick" : "thin",
    connector: read(projectId, "connector") === "thin" ? "thin" : "thick",
    corner: read(projectId, "corner") === "sharp" ? "sharp" : "round",
  };
}

/** Persists a single project-scoped diagram preference. */
export function writeDiagramPref(
  projectId: string,
  kind: keyof DiagramPrefs,
  value: string,
): void {
  try {
    localStorage.setItem(key(projectId, kind), value);
  } catch {
    /* ignore storage errors */
  }
}
