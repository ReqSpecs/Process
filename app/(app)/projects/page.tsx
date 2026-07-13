import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { projectSlug } from "@/lib/slug";
import {
  ProjectsGrid,
  type DashboardProject,
} from "@/components/app/ProjectsGrid";
import type { ArchitectureStage, ProcessRow, Project } from "@/lib/types";

function fmtDate(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function ProjectsDashboard() {
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

  const [{ data: allStages }, { data: allProcesses }] = await Promise.all([
    supabase
      .from("architecture_stages")
      .select("*")
      .returns<ArchitectureStage[]>(),
    supabase.from("processes").select("*").returns<ProcessRow[]>(),
  ]);

  const stageCount = new Map<string, number>();
  for (const s of allStages ?? []) {
    if (!projIds.has(s.project_id)) continue;
    stageCount.set(s.project_id, (stageCount.get(s.project_id) ?? 0) + 1);
  }
  const procCount = new Map<string, number>();
  for (const p of allProcesses ?? []) {
    if (!projIds.has(p.project_id) || p.is_group) continue;
    procCount.set(p.project_id, (procCount.get(p.project_id) ?? 0) + 1);
  }

  const items: DashboardProject[] = projList.map((p) => ({
    id: p.id,
    name: p.name,
    slug: projectSlug(p.name),
    description: p.description ?? "",
    status: p.status ?? "draft",
    color: p.color ?? null,
    icon: p.icon ?? null,
    areas: stageCount.get(p.id) ?? 0,
    processes: procCount.get(p.id) ?? 0,
    updated: fmtDate(p.updated_at),
  }));

  return <ProjectsGrid items={items} />;
}
