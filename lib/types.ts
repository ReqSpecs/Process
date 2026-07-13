export type ProjectStatus =
  | "draft"
  | "active"
  | "in_review"
  | "complete"
  | "archived";

export type Project = {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  icon: string | null;
  color: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type StageColor =
  | "cobalt"
  | "ember"
  | "gold"
  | "violet"
  | "teal"
  | "magenta"
  | "lime";

// Order used when auto-assigning a colour to a new chevron by position.
export const STAGE_COLOR_ORDER: StageColor[] = [
  "lime",
  "violet",
  "cobalt",
  "ember",
  "magenta",
  "teal",
  "gold",
];

export type ArchitectureStage = {
  id: string;
  project_id: string;
  name: string;
  color: StageColor;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ProcessDocStatus = "draft" | "in_review" | "approved";

export type ProcessRow = {
  id: string;
  project_id: string;
  stage_id: string | null;
  parent_id: string | null;
  is_group: boolean;
  name: string;
  bpmn_xml: string;
  doc_owner: string;
  doc_status: ProcessDocStatus;
  doc_inputs: string;
  doc_outputs: string;
  doc_systems: string;
  doc_risks: string;
  doc_notes: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};
