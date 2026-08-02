"use server";

import { createClient } from "@/lib/supabase/server";
import { needsTrialSetup, type Workspace } from "@/lib/access";

/**
 * Has Stripe's webhook landed yet?
 *
 * Checkout redirects the browser back at the same moment Stripe posts
 * checkout.session.completed, and until that webhook writes the subscription
 * id the workspace still looks unstarted. Walking into the app before then
 * bounces the customer straight back to the plan chooser they just paid from.
 */
export async function subscriptionReady(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return true;

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("*")
    .eq("owner_id", user.id)
    .single<Workspace>();

  // No workspace is someone else's problem — let the app's own guards deal
  // with it rather than holding them on a spinner.
  if (!workspace) return true;

  return !needsTrialSetup(workspace);
}
