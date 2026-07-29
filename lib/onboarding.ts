import type { User } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo";

/** Display name, wherever it ended up: we set full_name, OAuth providers set name. */
export function fullName(user: User): string {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  return String(meta.full_name ?? meta.name ?? "").trim();
}

/**
 * True when the only way this account can sign in is an emailed code. Google and
 * Microsoft users always have a working credential, so we never ask them to
 * invent a password they'd never use.
 */
export function isEmailOnlyUser(user: User): boolean {
  const identities = user.identities ?? [];
  return identities.length === 0 || identities.every((i) => i.provider === "email");
}

/** Reads auth.users via the definer function from migration 0009. */
export async function hasPassword(email: string): Promise<boolean> {
  if (!email) return false;
  // On failure, claim they have one: a false negative would bounce the user back
  // to /welcome on every request, which is a far worse failure than skipping it.
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("email_account_state", {
      p_email: email,
    });
    if (error) return true;
    return data === "password";
  } catch {
    return true;
  }
}

/**
 * Gate for /welcome. New email signups need a name and a password; OAuth users
 * arrive with both covered and pass straight through.
 */
export async function needsOnboarding(user: User): Promise<boolean> {
  if (isDemoMode()) return false;
  if (!fullName(user)) return true;
  if (!isEmailOnlyUser(user)) return false;
  return !(await hasPassword(user.email ?? ""));
}
