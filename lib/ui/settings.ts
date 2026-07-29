import type { ProcessDocStatus, ProjectStatus } from "@/lib/types";

export type ColorStyle = "minimal" | "vibrant" | "brand";
export type ThemeSetting = "light" | "dark" | "system";
export type ProjectView = "modern" | "traditional";

export type WorkspaceSettings = {
  branding: {
    logoIcon: string;
    logoColor: string;
    brandPrimary: string;
    brandAccent: string;
  };
  appearance: {
    theme: ThemeSetting;
    projectIcons: boolean;
    processIcons: boolean;
    colorStyle: ColorStyle;
  };
  defaults: {
    projectStatus: ProjectStatus;
    processStatus: ProcessDocStatus;
    projectView: ProjectView;
    exportSize: "a3";
    exportBehaviour: "current";
  };
  emails: {
    marketing: boolean;
  };
};

export const DEFAULT_SETTINGS: WorkspaceSettings = {
  branding: {
    logoIcon: "chart-line-up",
    logoColor: "#0047AB",
    brandPrimary: "#0047AB",
    brandAccent: "#0F9E7A",
  },
  appearance: {
    theme: "light",
    projectIcons: true,
    processIcons: true,
    colorStyle: "vibrant",
  },
  defaults: {
    projectStatus: "draft",
    processStatus: "draft",
    projectView: "modern",
    exportSize: "a3",
    exportBehaviour: "current",
  },
  emails: {
    marketing: true,
  },
};

/** Merge a stored settings blob over the defaults so every field is present. */
export function resolveSettings(raw: unknown): WorkspaceSettings {
  const r = (raw ?? {}) as Partial<WorkspaceSettings>;
  return {
    branding: { ...DEFAULT_SETTINGS.branding, ...(r.branding ?? {}) },
    appearance: { ...DEFAULT_SETTINGS.appearance, ...(r.appearance ?? {}) },
    defaults: { ...DEFAULT_SETTINGS.defaults, ...(r.defaults ?? {}) },
    emails: { ...DEFAULT_SETTINGS.emails, ...(r.emails ?? {}) },
  };
}

export const COLOR_STYLES: { value: ColorStyle; label: string; hint: string }[] =
  [
    { value: "minimal", label: "Minimal", hint: "Muted, monochrome accents" },
    { value: "vibrant", label: "Vibrant", hint: "The colourful ProDraw palette" },
    { value: "brand", label: "Brand", hint: "Use your brand colours" },
  ];

export type HelpTopic = { q: string; a: string };

export const HELP_TOPICS: { heading: string; items: HelpTopic[] }[] = [
  {
    heading: "Getting started",
    items: [
      {
        q: "What is ProDraw?",
        a: "ProDraw is a calm home for your business processes: map a project's process architecture, document each process on a BPMN 2.0 canvas, and export polished PDFs.",
      },
      {
        q: "How do I create a project?",
        a: "Use the + next to Projects in the sidebar, or the New project button on the Projects dashboard. A project is a container for your process architecture.",
      },
    ],
  },
  {
    heading: "Working with processes",
    items: [
      {
        q: "How do chevrons work?",
        a: "Chevrons are the high-level stages of your architecture (left to right). Each chevron holds the processes that belong to that stage; drag processes between chevrons to reorganise.",
      },
      {
        q: "How does the BPMN canvas work?",
        a: "Open a process to edit its BPMN 2.0 diagram. Drag shapes from the palette, connect them with sequence flows, and use the formatting ribbon for styling, alignment, and swimlanes.",
      },
      {
        q: "How does autosave work?",
        a: "Edits save automatically a moment after you stop working, and snapshots are kept periodically. The status pill in the editor shows Saved, Saving, or Unsaved changes.",
      },
      {
        q: "How does export work?",
        a: "Export a single process from its editor, or export a whole project (A3) from the project page. The project export matches your current Modern or Traditional view.",
      },
    ],
  },
];
