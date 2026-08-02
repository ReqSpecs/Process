/**
 * Reporting a completed checkout to Meta as StartTrial.
 *
 * Fires once per browser, ever. One trial is allowed per person, and the page
 * that calls this is reachable by refresh or by pasting the URL — without the
 * flag, a reload would report a second conversion that never happened.
 */

const FIRED_KEY = "prodraw:meta-start-trial";

/** The pixel snippet loads after hydration, so it may not be here yet. */
const POLL_MS = 250;
const GIVE_UP_MS = 5000;

export type TrialConversion = { value?: number; currency?: string };

/** Returns a cleanup for the caller's effect. */
export function fireStartTrialOnce(conversion: TrialConversion): () => void {
  const noop = () => {};
  if (alreadyFired()) return noop;

  const payload =
    conversion.value && conversion.currency ? conversion : undefined;

  const attempt = () => {
    if (!window.fbq) return false;
    window.fbq("track", "StartTrial", payload);
    markFired();
    return true;
  };

  if (attempt()) return noop;

  let waited = 0;
  const timer = setInterval(() => {
    waited += POLL_MS;
    // Ad blockers stop the pixel arriving at all, so this has to give up.
    if (attempt() || waited >= GIVE_UP_MS) clearInterval(timer);
  }, POLL_MS);

  return () => clearInterval(timer);
}

/** Private browsing and disabled storage throw rather than return null. */
function alreadyFired(): boolean {
  try {
    return localStorage.getItem(FIRED_KEY) === "1";
  } catch {
    return false;
  }
}

function markFired(): void {
  try {
    localStorage.setItem(FIRED_KEY, "1");
  } catch {}
}
