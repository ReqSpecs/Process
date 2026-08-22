import type { User } from "@supabase/supabase-js";
import type { createClient } from "@/lib/supabase/server";
import { needsTrialSetup, type Workspace } from "@/lib/access";
import { needsOnboarding } from "@/lib/onboarding";
import { claimSignupConversion } from "@/lib/signupConversion";
import { withSignupFlag } from "@/lib/signupFlag";

export const DEFAULT_DESTINATION = "/process-library";

/** Only internal, single-slash paths are allowed as a post-login destination. */
export function safeNext(next: string | null | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//")
    ? next
    : DEFAULT_DESTINATION;
}

/**
 * Single source of truth for where a freshly authenticated user goes, shared by
 * the OAuth/magic-link callback and the in-modal password and code forms.
 * Order matters: finish the profile, then take a card, then let them in.
 */
export async function postAuthDestination(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: User,
  next: string | null | undefined
): Promise<string> {
  const target = safeNext(next);

  // The user explicitly asked to reset their password; that's the whole point
  // of this round trip, so it jumps the queue. An existing account by
  // definition, so there is no signup to report either.
  if (target.startsWith("/reset-password")) return target;

  const destination = await route(supabase, user, target);

  // Tagged here rather than in each caller, so every way in — magic link,
  // OAuth, emailed code, password — reports a new account the same way, on
  // whichever page that route happens to land on.
  return (await claimSignupConversion(user))
    ? withSignupFlag(destination)
    : destination;
}

async function route(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: User,
  target: string
): Promise<string> {
  if (await needsOnboarding(user)) {
    return `/welcome?next=${encodeURIComponent(target)}`;
  }

  const { data } = await supabase
    .from("workspaces")
    .select("*")
    .eq("owner_id", user.id)
    .single();
  const workspace = data as Workspace | null;

  if (workspace && needsTrialSetup(workspace)) {
    // Preserve /start-trial?plan=… when they came from the pricing page.
    return target.startsWith("/start-trial") ? target : "/start-trial";
  }

  return target;
}
