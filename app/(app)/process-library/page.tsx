import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ProcessLibrary,
  type LibraryProject,
  type LibraryRow,
} from "@/components/app/ProcessLibrary";
import type { ArchitectureStage, ProcessRow, Project } from "@/lib/types";

type RawStatus = LibraryRow["status"];

function normalizeStatus(s: string): RawStatus {
  if (s === "approved" || s === "in_review") return s;
  return "draft";
}

export default async function LibraryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("workspace_id", workspace?.id ?? "")
    .order("created_at")
    .returns<Project[]>();

  const projList = projects ?? [];
  const projIds = new Set(projList.map((p) => p.id));
  const projName = new Map(projList.map((p) => [p.id, p.name]));

  const { data: allStages } = await supabase
    .from("architecture_stages")
    .select("*")
    .order("sort_order")
    .returns<ArchitectureStage[]>();

  const stagesByProject = new Map<string, { id: string; name: string }[]>();
  for (const s of allStages ?? []) {
    if (!projIds.has(s.project_id)) continue;
    const list = stagesByProject.get(s.project_id) ?? [];
    list.push({ id: s.id, name: s.name });
    stagesByProject.set(s.project_id, list);
  }

  const libraryProjects: LibraryProject[] = projList.map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color ?? null,
    icon: p.icon ?? null,
    stages: stagesByProject.get(p.id) ?? [],
  }));

  const { data: allProcesses } = await supabase
    .from("processes")
    .select("*")
    .order("updated_at", { ascending: false })
    .returns<ProcessRow[]>();

  const rows: LibraryRow[] = (allProcesses ?? [])
    .filter((p) => projIds.has(p.project_id) && !p.is_group)
    .map((p) => ({
      id: p.id,
      name: p.name,
      projectId: p.project_id,
      projectName: projName.get(p.project_id) ?? "\u2014",
      owner: p.doc_owner,
      status: normalizeStatus(p.doc_status),
      edited: p.updated_at,
    }));

  return <ProcessLibrary rows={rows} projects={libraryProjects} />;
}
