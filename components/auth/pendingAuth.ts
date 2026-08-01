"use client";

import type { AuthMode } from "@/components/auth/AuthPanel";

/**
 * A sign-in that's waiting on an emailed code, remembered across a page load.
 *
 * Fetching the code means leaving the page — another tab, another app, a phone.
 * Chrome discards backgrounded tabs to save memory and reloads them on return,
 * which wipes React state: the modal vanishes and the code you just copied has
 * nowhere to go. Keeping the step here means coming back lands you right where
 * you left off, and it covers accidental closes and refreshes for free.
 *
 * sessionStorage rather than localStorage, so it belongs to the one tab that
 * started the sign-in and disappears when that tab does.
 */

const KEY = "prodraw:auth-in-progress";

/**
 * Long enough to go and find the code, short enough that a sign-in finished a
 * while ago doesn't pop the modal open again later in the same tab. The record
 * is cleared on success paths anyway; this is the backstop for the ones that
 * redirect away before any cleanup can run.
 */
const TTL_MS = 30 * 60 * 1000;

export type PendingAuth = {
  mode: AuthMode;
  next: string;
  /**
   * The code step and nothing else. It's the only one that sends you out of the
   * page to fetch something, so it's the only one worth restoring — and the
   * password step actively shouldn't be, because a sign-in that succeeded from
   * there leaves no moment to clean up, and the leftover record would reopen
   * the modal on "Welcome back" the next time the tab saw a marketing page.
   * Logging out lands on exactly such a page.
   */
  step: "code";
  email: string;
  codeNext: string;
  isReset: boolean;
};

type Stored = PendingAuth & { at: number };

export function readPendingAuth(): PendingAuth | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;

    const { at, ...pending } = JSON.parse(raw) as Stored;
    // The step check isn't only belt and braces: a tab open across a deploy can
    // still be holding a record from when other steps were remembered too.
    const stale = !at || Date.now() - at > TTL_MS;
    if (!pending.email || pending.step !== "code" || stale) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    return pending;
  } catch {
    // Private browsing and storage quotas both throw. Losing the resume is fine;
    // breaking the sign-in over it is not.
    return null;
  }
}

export function writePendingAuth(pending: PendingAuth): void {
  try {
    const stored: Stored = { ...pending, at: Date.now() };
    sessionStorage.setItem(KEY, JSON.stringify(stored));
  } catch {}
}

export function clearPendingAuth(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
}
