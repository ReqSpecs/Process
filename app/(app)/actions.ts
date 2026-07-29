"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAccessState, type Workspace } from "@/lib/access";
import { defaultDiagramXml } from "@/lib/bpmn/defaultDiagram";
import { projectSlug } from "@/lib/slug";
import { STAGE_COLOR_ORDER } from "@/lib/types";
import { resolveSettings } from "@/lib/ui/settings";

// Revalidate every /project/[slug] page (we don't always know the slug here,
// and it changes on rename), plus the process library list.
const PROJECT_ROUTE = "/project/[slug]";
const LIBRARY_ROUTE = "/process-library";

async function requireEditableWorkspace() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("*")
    .eq("owner_id", user.id)
    .single<Workspace>();

  if (!workspace) redirect("/login");

  const access = getAccessState(workspace);
  if (!access.canEdit) redirect("/settings?upgrade=1");

  return { supabase, workspace, user };
}

// ---------- projects ----------

/** True if another project in the workspace already resolves to this slug. */
async function projectNameTaken(
  supabase: Awaited<ReturnType<typeof requireEditableWorkspace>>["supabase"],
  workspaceId: string,
  name: string,
  ignoreId?: string,
): Promise<boolean> {
  const slug = projectSlug(name);
  const { data } = await supabase
    .from("projects")
    .select("id, name")
    .eq("workspace_id", workspaceId)
    .returns<{ id: string; name: string }[]>();
  return (data ?? []).some(
    (p) => p.id !== ignoreId && projectSlug(p.name) === slug,
  );
}

export async function createProject(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const { supabase, workspace } = await requireEditableWorkspace();
  // Names must be unique within a workspace — the /project/[slug] URL is
  // derived from the name, so duplicates would collide.
  if (await projectNameTaken(supabase, workspace.id, name)) return;

  const status = resolveSettings(workspace.settings).defaults.projectStatus;
  const { data, error } = await supabase
    .from("projects")
    .insert({ workspace_id: workspace.id, name, status })
    .select("id")
    .single();

  if (error || !data) return;
  // The sidebar project list lives in the (app) layout — revalidate it so the
  // new project shows up immediately instead of after a refresh.
  revalidatePath("/", "layout");
  redirect(`/project/${projectSlug(name)}`);
}

export async function renameProject(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;

  const { supabase, workspace } = await requireEditableWorkspace();
  // Reject a rename that would duplicate another project's name/slug.
  if (await projectNameTaken(supabase, workspace.id, name, id)) return;

  await supabase.from("projects").update({ name }).eq("id", id);
  revalidatePath("/", "layout");
  revalidatePath(LIBRARY_ROUTE);
  // The slug is derived from the name, so follow the project to its new URL.
  redirect(`/project/${projectSlug(name)}`);
}

export async function updateProjectDescription(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  if (!id) return;

  const { supabase } = await requireEditableWorkspace();
  await supabase.from("projects").update({ description }).eq("id", id);
  revalidatePath(PROJECT_ROUTE, "page");
}

export async function updateProjectStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const allowed = ["draft", "active", "in_review", "complete", "archived"];
  if (!id || !allowed.includes(status)) return;

  const { supabase } = await requireEditableWorkspace();
  await supabase.from("projects").update({ status }).eq("id", id);
  // Layout covers the sidebar (archived hidden) + the projects dashboard.
  revalidatePath("/", "layout");
  revalidatePath(PROJECT_ROUTE, "page");
  revalidatePath(LIBRARY_ROUTE);
}

export async function updateProjectAppearance(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const icon = String(formData.get("icon") ?? "").trim() || null;
  const color = String(formData.get("color") ?? "").trim() || null;
  if (!id) return;

  const { supabase } = await requireEditableWorkspace();
  await supabase.from("projects").update({ icon, color }).eq("id", id);
  revalidatePath("/", "layout");
  revalidatePath(LIBRARY_ROUTE);
}

export async function deleteProject(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { supabase } = await requireEditableWorkspace();
  await supabase.from("projects").delete().eq("id", id);
  revalidatePath("/", "layout");
  revalidatePath(LIBRARY_ROUTE);
  redirect(LIBRARY_ROUTE);
}

// ---------- architecture stages ----------

export async function createStage(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!projectId || !name) return;

  const { supabase } = await requireEditableWorkspace();

  const { data: existing } = await supabase
    .from("architecture_stages")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false });

  const count = existing?.length ?? 0;
  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  await supabase.from("architecture_stages").insert({
    project_id: projectId,
    name,
    color: STAGE_COLOR_ORDER[count % STAGE_COLOR_ORDER.length],
    sort_order: nextOrder,
  });
  revalidatePath(PROJECT_ROUTE, "page");
}

export async function updateStage(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "cobalt");
  if (!id || !name) return;

  const { supabase } = await requireEditableWorkspace();
  await supabase.from("architecture_stages").update({ name, color }).eq("id", id);
  revalidatePath(PROJECT_ROUTE, "page");
}

export async function moveStage(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  const direction = String(formData.get("direction") ?? "");
  if (!id || !projectId) return;

  const { supabase } = await requireEditableWorkspace();
  const { data: stages } = await supabase
    .from("architecture_stages")
    .select("id, sort_order")
    .eq("project_id", projectId)
    .order("sort_order");

  if (!stages) return;
  const idx = stages.findIndex((s) => s.id === id);
  const swapIdx = direction === "left" ? idx - 1 : idx + 1;
  if (idx < 0 || swapIdx < 0 || swapIdx >= stages.length) return;

  await supabase
    .from("architecture_stages")
    .update({ sort_order: stages[swapIdx].sort_order })
    .eq("id", stages[idx].id);
  await supabase
    .from("architecture_stages")
    .update({ sort_order: stages[idx].sort_order })
    .eq("id", stages[swapIdx].id);

  revalidatePath(PROJECT_ROUTE, "page");
}

export async function deleteStage(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  if (!id) return;

  const { supabase } = await requireEditableWorkspace();
  await supabase.from("architecture_stages").delete().eq("id", id);
  revalidatePath(PROJECT_ROUTE, "page");
}

// ---------- processes ----------

export async function createProcess(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const stageId = String(formData.get("stageId") ?? "") || null;
  const parentId = String(formData.get("parentId") ?? "") || null;
  const isGroup = String(formData.get("isGroup") ?? "") === "1";
  const name = String(formData.get("name") ?? "").trim();
  const borderWeight =
    String(formData.get("borderWeight") ?? "") === "thick" ? "thick" : "thin";
  const connectorWeight =
    String(formData.get("connectorWeight") ?? "") === "thin" ? "thin" : "thick";
  const cornerStyle =
    String(formData.get("cornerStyle") ?? "") === "sharp" ? "sharp" : "round";
  if (!projectId || !name) return;

  const { supabase, workspace } = await requireEditableWorkspace();
  const docStatus = resolveSettings(workspace.settings).defaults.processStatus;
  const { data, error } = await supabase
    .from("processes")
    .insert({
      project_id: projectId,
      stage_id: stageId,
      parent_id: parentId,
      is_group: isGroup,
      name,
      bpmn_xml: isGroup
        ? ""
        : defaultDiagramXml({ borderWeight, connectorWeight, cornerStyle }),
      doc_status: docStatus,
    })
    .select("id")
    .single();

  if (error || !data) return;

  revalidatePath(PROJECT_ROUTE, "page");
  revalidatePath(LIBRARY_ROUTE);
}

export async function renameProcess(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;

  const { supabase } = await requireEditableWorkspace();
  await supabase.from("processes").update({ name }).eq("id", id);
  revalidatePath(`/processes/${id}`);
  revalidatePath(LIBRARY_ROUTE);
  revalidatePath(PROJECT_ROUTE, "page");
}

export async function updateProcessOwner(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  const owner = String(formData.get("owner") ?? "").trim();
  if (!id) return;

  const { supabase } = await requireEditableWorkspace();
  await supabase.from("processes").update({ doc_owner: owner }).eq("id", id);
  revalidatePath(LIBRARY_ROUTE);
  if (projectId) revalidatePath(PROJECT_ROUTE, "page");
  revalidatePath(`/processes/${id}`);
}

export async function updateProcessStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  const status = String(formData.get("status") ?? "");
  const allowed = ["draft", "in_review", "approved"];
  if (!id || !allowed.includes(status)) return;

  const { supabase } = await requireEditableWorkspace();
  await supabase.from("processes").update({ doc_status: status }).eq("id", id);
  revalidatePath(LIBRARY_ROUTE);
  if (projectId) revalidatePath(PROJECT_ROUTE, "page");
  revalidatePath(`/processes/${id}`);
}

export async function deleteProcess(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  const stay = String(formData.get("stay") ?? "") === "1";
  if (!id) return;

  const { supabase } = await requireEditableWorkspace();
  // Remove any child processes first (real DB also cascades via FK).
  await supabase.from("processes").delete().eq("parent_id", id);
  await supabase.from("processes").delete().eq("id", id);
  revalidatePath(PROJECT_ROUTE, "page");
  revalidatePath(LIBRARY_ROUTE);
  // Deleting from the project screen (e.g. a card/group) should stay put;
  // deleting from a process detail page returns to the project.
  if (!stay) {
    const { data: proj } = await supabase
      .from("projects")
      .select("name")
      .eq("id", projectId)
      .maybeSingle<{ name: string }>();
    redirect(`/project/${projectSlug(proj?.name ?? "")}`);
  }
}

export async function reorderStages(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  let ids: string[] = [];
  try {
    ids = JSON.parse(String(formData.get("ids") ?? "[]")) as string[];
  } catch {
    return;
  }
  if (!projectId || ids.length === 0) return;

  const { supabase } = await requireEditableWorkspace();
  for (let i = 0; i < ids.length; i++) {
    await supabase
      .from("architecture_stages")
      .update({ sort_order: i })
      .eq("id", ids[i]);
  }
  // No revalidate: the client keeps the optimistic order; persisting silently
  // avoids a route refetch that would fight the in-progress drag interaction.
}

type Move = {
  id: string;
  stageId: string | null;
  parentId: string | null;
  sortOrder: number;
};

/**
 * Persist a drag-and-drop rearrangement: update stage_id / parent_id /
 * sort_order for each affected process in one shot.
 */
export async function reorderProcesses(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  let moves: Move[] = [];
  try {
    moves = JSON.parse(String(formData.get("moves") ?? "[]")) as Move[];
  } catch {
    return;
  }
  if (!projectId || moves.length === 0) return;

  const { supabase } = await requireEditableWorkspace();
  for (const m of moves) {
    if (!m.id) continue;
    await supabase
      .from("processes")
      .update({
        stage_id: m.stageId,
        parent_id: m.parentId,
        sort_order: m.sortOrder,
      })
      .eq("id", m.id);
  }
  // No revalidate: the client holds the optimistic order. Revalidating any path
  // triggers a route refetch that fights the in-progress drag, causing the
  // "can't drag again until I move something" clunkiness. Persist silently.
}

// ---------- feedback ----------

export async function submitFeedback(formData: FormData) {
  const category = String(formData.get("category") ?? "feature");
  const message = String(formData.get("message") ?? "").trim();
  if (!message) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  await supabase.from("feedback").insert({
    user_id: user.id,
    workspace_id: workspace?.id ?? null,
    category,
    message,
  });
}
