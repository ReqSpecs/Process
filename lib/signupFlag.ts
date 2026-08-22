/**
 * The marker that carries "this sign-in created the account" from the server,
 * which is the only side that knows, to the browser, which has the pixel.
 *
 * Its own module so both sides can import it: the server route would otherwise
 * pull the analytics client into the bundle, or the client would pull the
 * Supabase server code.
 */

export const SIGNUP_FLAG = "signup";

/**
 * Tags a post-auth destination. Destinations already carry query strings
 * (`/welcome?next=…`, `/start-trial?plan=yearly`), so the separator is decided
 * per call rather than assumed.
 */
export function withSignupFlag(destination: string): string {
  const separator = destination.includes("?") ? "&" : "?";
  return `${destination}${separator}${SIGNUP_FLAG}=1`;
}
