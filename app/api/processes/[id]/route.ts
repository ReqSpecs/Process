import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DOC_FIELDS = [
  "doc_owner",
  "doc_status",
  "doc_inputs",
  "doc_outputs",
  "doc_systems",
  "doc_risks",
  "doc_notes",
] as const;

/** Snapshot into process_versions at most this often. */
const SNAPSHOT_INTERVAL_MS = 10 * 60 * 1000;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Record<string, unknown>;

  const update: Record<string, string> = {};
  if (typeof body.bpmn_xml === "string") update.bpmn_xml = body.bpmn_xml;
  if (typeof body.name === "string" && body.name.trim()) {
    update.name = (body.name as string).trim();
  }
  for (const field of DOC_FIELDS) {
    if (typeof body[field] === "string") update[field] = body[field] as string;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  // RLS restricts the update to processes the user owns.
  const { data, error } = await supabase
    .from("processes")
    .update(update)
    .eq("id", id)
    .select("id, updated_at")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }

  // Throttled version snapshot (diagram changes only)
  if (update.bpmn_xml) {
    const { data: lastSnapshot } = await supabase
      .from("process_versions")
      .select("created_at")
      .eq("process_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const stale =
      !lastSnapshot ||
      Date.now() - new Date(lastSnapshot.created_at).getTime() > SNAPSHOT_INTERVAL_MS;

    if (stale) {
      await supabase
        .from("process_versions")
        .insert({ process_id: id, bpmn_xml: update.bpmn_xml });
    }
  }

  return NextResponse.json({ ok: true, updated_at: data.updated_at });
}
