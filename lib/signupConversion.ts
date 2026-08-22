import type { User } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo";

/**
 * Claims the right to report this account's signup to Meta, and answers whether
 * this caller won it.
 *
 * True exactly once per account, ever. The claim *is* the update: `is null` in
 * the predicate means two concurrent sign-ins cannot both win it, so a refresh
 * mid-redirect, a second tab, or a magic link opened twice all count once.
 *
 * Written with the service key because profiles is deliberately read-only to
 * clients (migration 0011), and it has to be trustworthy — this is the number
 * the ad spend gets judged on.
 *
 * Note for local work: the claim is made in development too, so the redirect can
 * be verified end to end. The pixel itself only reports in production, so an
 * account first signed into locally spends its conversion without sending one.
 */
export async function claimSignupConversion(user: User): Promise<boolean> {
  if (isDemoMode()) return false;

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("profiles")
      .update({ signup_reported_at: new Date().toISOString() })
      .eq("id", user.id)
      .is("signup_reported_at", null)
      .select("id");

    if (error) {
      console.error("[analytics] claim signup conversion", error);
      return false;
    }

    return (data?.length ?? 0) > 0;
  } catch (cause) {
    // Ad measurement never stands between someone and the account they just
    // made, so a failure here is logged and dropped.
    console.error("[analytics] claim signup conversion", cause);
    return false;
  }
}
