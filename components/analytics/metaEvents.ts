/**
 * The conversions we report to Meta.
 *
 * Both are expensive to get wrong in either direction, so each one carries an
 * explicit idea of what "once" means: a trial is once per browser forever; a
 * registration is once per account, and that is decided on the server.
 */

/** The pixel snippet loads after hydration, so `fbq` may not be here yet. */
const POLL_MS = 250;

/** With a tracker blocker it never arrives at all, so waiting has to end. */
const GIVE_UP_MS = 5000;

type Conversion = { value?: number; currency?: string };

/** Returns a cleanup for the caller's effect. */
function track(
  event: string,
  conversion: Conversion | undefined,
  onSent: () => void
): () => void {
  const noop = () => {};

  const attempt = () => {
    if (!window.fbq) return false;
    // Meta reads a bare track as "no value applies", which is not the same
    // claim as a value of zero — so an empty payload is omitted, not sent.
    if (conversion) window.fbq("track", event, conversion);
    else window.fbq("track", event);
    onSent();
    return true;
  };

  if (attempt()) return noop;

  let waited = 0;
  const timer = setInterval(() => {
    waited += POLL_MS;
    if (attempt() || waited >= GIVE_UP_MS) clearInterval(timer);
  }, POLL_MS);

  return () => clearInterval(timer);
}

/* -------------------------------------------------------------- StartTrial */

const TRIAL_KEY = "prodraw:meta-start-trial";

export type TrialConversion = Conversion;

/**
 * A completed checkout, reported as StartTrial.
 *
 * Once per browser, ever. One trial is allowed per person, and the page that
 * calls this is reachable by a refresh or by pasting the URL — without the flag
 * a reload would report a second conversion that never happened.
 */
export function fireStartTrialOnce(conversion: TrialConversion): () => void {
  if (alreadyFired()) return () => {};

  const payload =
    conversion.value && conversion.currency ? conversion : undefined;

  return track("StartTrial", payload, markFired);
}

/** Private browsing and disabled storage throw rather than return null. */
function alreadyFired(): boolean {
  try {
    return localStorage.getItem(TRIAL_KEY) === "1";
  } catch {
    return false;
  }
}

function markFired(): void {
  try {
    localStorage.setItem(TRIAL_KEY, "1");
  } catch {}
}

/* ------------------------------------------------------ CompleteRegistration */

/**
 * Guards against a second attempt while the first is still polling for the
 * pixel. Deliberately not persisted, unlike the trial above: whether this
 * account has been counted is answered by profiles.signup_reported_at, and a
 * browser-wide flag would silently swallow the second signup on a shared
 * machine.
 */
let registrationStarted = false;

/**
 * A completed signup: the account exists and the email behind it is verified.
 *
 * No value is sent. Nothing has been paid at this point, and an invented figure
 * would compete with the real one on StartTrial for the same campaign's value
 * optimisation.
 *
 * `onSent` is where the caller clears the URL marker — on success only, so a
 * signup whose pixel was still loading can be retried by a reload.
 */
export function fireCompleteRegistration(onSent: () => void): () => void {
  if (registrationStarted) return () => {};
  registrationStarted = true;

  return track("CompleteRegistration", undefined, onSent);
}
