"use client";

import { useEffect } from "react";
import { clearPendingAuth } from "@/components/auth/pendingAuth";

/**
 * Reaching the app means the sign-in finished, so whatever pendingAuth still
 * holds is stale. Most paths clear it themselves, but not all of them get the
 * chance — a code that verifies redirects immediately, and signing in from
 * somewhere else entirely leaves an abandoned record behind. Logging out
 * returns to the marketing pages in the same tab, where anything left over
 * would reopen the auth modal unasked.
 */
export function ClearPendingAuth() {
  useEffect(() => clearPendingAuth(), []);
  return null;
}
