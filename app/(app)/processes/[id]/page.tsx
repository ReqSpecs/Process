import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAccessState, type Workspace } from "@/lib/access";
import { ProcessEditor } from "@/components/app/ProcessEditor";
import { SetProcessNav } from "@/components/app/ProcessNavContext";
import type { ArchitectureStage, ProcessRow, Project } from "@/lib/types";

export default async function ProcessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: process } = await supabase
    .from("processes")
    .select("*")
    .eq("id", id)
    .maybeSingle<ProcessRow>();

  if (!process) notFound();

  const [{ data: project }, { data: workspace }] = await Promise.all([
    supabase
      .from("projects")
      .select("*")
      .eq("id", process.project_id)
      .single<Project>(),
    supabase
      .from("workspaces")
      .select("*")
      .eq("owner_id", user.id)
      .single<Workspace>(),
  ]);

  if (!project || !workspace) notFound();

  const access = getAccessState(workspace);

  const [{ data: stages }, { data: siblings }] = await Promise.all([
    supabase
      .from("architecture_stages")
      .select("*")
      .eq("project_id", project.id)
      .order("sort_order")
      .returns<ArchitectureStage[]>(),
    supabase
      .from("processes")
      .select("id,project_id,stage_id,parent_id,is_group,name,sort_order")
      .eq("project_id", project.id)
      .order("sort_order")
      .order("created_at")
      .returns<ProcessRow[]>(),
  ]);

  return (
    <>
      <SetProcessNav
        project={project}
        stages={stages ?? []}
        processes={siblings ?? []}
        currentProcessId={process.id}
      />
      <ProcessEditor
        process={process}
        project={project}
        readOnly={!access.canEdit}
      />
    </>
  );
}
