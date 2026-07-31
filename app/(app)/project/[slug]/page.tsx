import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sessionWorkspace } from "@/lib/session";
import { ProjectView } from "@/components/app/ProjectView";
import { projectSlug } from "@/lib/slug";
import type { ArchitectureStage, Project, ProcessRow } from "@/lib/types";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [supabase, workspace] = await Promise.all([
    createClient(),
    // Shared with the layout's lookup rather than repeating it.
    sessionWorkspace(),
  ]);
  if (!workspace) redirect("/login");

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("workspace_id", workspace.id)
    .returns<Project[]>();

  const project = (projects ?? []).find((p) => projectSlug(p.name) === slug);
  if (!project) notFound();

  const [{ data: stages }, { data: processes }] = await Promise.all([
    supabase
      .from("architecture_stages")
      .select("*")
      .eq("project_id", project.id)
      .order("sort_order")
      .returns<ArchitectureStage[]>(),
    supabase
      .from("processes")
      .select("*")
      .eq("project_id", project.id)
      .order("sort_order")
      .order("created_at")
      .returns<ProcessRow[]>(),
  ]);

  const otherProjectNames = (projects ?? [])
    .filter((p) => p.id !== project.id)
    .map((p) => p.name);

  return (
    <ProjectView
      project={project}
      stages={stages ?? []}
      processes={processes ?? []}
      otherProjectNames={otherProjectNames}
    />
  );
}
