import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAccessState, type Workspace } from "@/lib/access";
import { Sidebar } from "@/components/app/Sidebar";
import { ProcessNavProvider } from "@/components/app/ProcessNavContext";
import { TrialBanner } from "@/components/app/TrialBanner";
import type { Project } from "@/lib/types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("workspace_id", workspace.id)
    .order("created_at")
    .returns<Project[]>();

  const access = getAccessState(workspace);

  return (
    <ProcessNavProvider>
      <div className="flex min-h-screen bg-surface">
        <Sidebar
          projects={projects ?? []}
          email={user.email ?? ""}
          access={access}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <TrialBanner access={access} />
          <main className="flex min-w-0 flex-1 flex-col">{children}</main>
        </div>
      </div>
    </ProcessNavProvider>
  );
}
