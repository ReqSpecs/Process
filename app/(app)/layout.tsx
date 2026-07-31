import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAccessState, needsTrialSetup } from "@/lib/access";
import { sessionWorkspace } from "@/lib/session";
import { needsOnboarding } from "@/lib/onboarding";
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

  // The onboarding check reads auth.users through an RPC, so it's a round trip of
  // its own — run it alongside the workspace lookup rather than after it.
  const [workspace, onboarding] = await Promise.all([
    sessionWorkspace(),
    needsOnboarding(user),
  ]);

  if (!workspace) redirect("/login");

  // Backstop for anyone who navigated straight here mid-signup. Order matches
  // the callback: finish the profile, then take a card, then let them in.
  if (onboarding) redirect("/welcome");
  if (needsTrialSetup(workspace)) redirect("/start-trial");

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("workspace_id", workspace.id)
    .order("created_at")
    .returns<Project[]>();

  const access = getAccessState(workspace);

  return (
    <ProcessNavProvider>
      <div className="flex h-screen overflow-hidden bg-surface">
        <Sidebar
          projects={projects ?? []}
          email={user.email ?? ""}
          access={access}
        />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <TrialBanner access={access} />
          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </ProcessNavProvider>
  );
}
