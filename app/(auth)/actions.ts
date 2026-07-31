"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  createAuthClient,
  createClient,
  createServiceClient,
} from "@/lib/supabase/server";
import { validateEmail } from "@/lib/validateEmail";
import { siteUrl } from "@/lib/site";
import { postAuthDestination, safeNext } from "@/lib/postAuth";
import { DEMO_COOKIE, DEMO_EMAIL, isDemoMode } from "@/lib/demo";

const DEMO_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const MIN_PASSWORD_LENGTH = 8;

const UNREACHABLE =
  "We couldn't reach our servers. Check your connection and try again.";

/**
 * An unreachable backend surfaces as a bare "fetch failed" (Node) or "Failed to
 * fetch" (browser), sometimes thrown and sometimes returned. Neither string
 * means anything to a user, and it must not be mistaken for a rejected
 * credential.
 */
function isUnreachable(reason: unknown): boolean {
  const message =
    reason && typeof reason === "object" && "message" in reason
      ? String((reason as { message?: unknown }).message ?? "")
      : String(reason ?? "");
  const lowered = message.toLowerCase();
  return (
    lowered.includes("fetch failed") ||
    lowered.includes("failed to fetch") ||
    lowered.includes("network")
  );
}

type MaybeAuthError = { code?: string; status?: number; message?: string } | null;

/**
 * Turn a Supabase auth failure into something true, and leave a trace.
 *
 * "That code is invalid or has expired" was covering several unrelated problems —
 * a genuinely old code, a code that a later resend silently replaced, and the
 * hourly cap on Supabase's built-in email service, which stops mail going out at
 * all. They need different words, and the underlying code needs to reach the
 * logs, because a message that fits every failure tells you nothing about any of
 * them.
 */
function authFailure(
  context: string,
  error: MaybeAuthError,
  fallback: string
): string {
  console.error(`[auth] ${context}`, {
    code: error?.code,
    status: error?.status,
    message: error?.message,
  });

  if (isUnreachable(error)) return UNREACHABLE;

  switch (error?.code) {
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      // Supabase's own message names the exact wait, so keep it.
      return (
        error.message ||
        "Too many requests for now. Wait a minute, then try again."
      );
    case "otp_expired":
      // Supabase returns this for a mistyped code as well as a stale one, so the
      // message can't claim the code expired. Requesting a code also invalidates
      // the previous one, and people reach for whichever email is already open.
      return "That code didn't work. Check every digit against the most recent email — only the newest code is valid — or send yourself a new one.";
    case "email_provider_disabled":
      return "Email sign-in is switched off for this project.";
    default:
      return fallback;
  }
}

/** Set the demo session cookie (dev-only, in-memory backend). */
export async function enterDemo(next?: string): Promise<never> {
  const cookieStore = await cookies();
  cookieStore.set(DEMO_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: DEMO_COOKIE_MAX_AGE,
  });
  const target = next && next.startsWith("/") ? next : "/process-library";
  redirect(target);
}

/**
 * Drop the demo session once a real one exists. Without this the rest of the
 * app keeps reading the in-memory demo store and the user never sees their own
 * workspace.
 */
async function clearDemoSession(): Promise<void> {
  if (!isDemoMode()) return;
  const cookieStore = await cookies();
  if (cookieStore.get(DEMO_COOKIE)) cookieStore.delete(DEMO_COOKIE);
}

export type AuthStep = "email" | "password" | "code";
export type AuthFormState =
  | { error?: string; step?: AuthStep; sent?: boolean }
  | null;

/** "unknown" means the lookup itself failed — never block sign-in over that. */
type AccountState = "none" | "passwordless" | "password" | "unknown";

function callbackUrl(next: string): string {
  return `${siteUrl()}/auth/callback?next=${encodeURIComponent(safeNext(next))}`;
}

/**
 * Whether the address has an account, and whether that account has a password.
 * Drives which step the form shows next. This is an account-existence oracle by
 * nature — rate-limit the route at the edge.
 */
async function accountState(email: string): Promise<AccountState> {
  if (!email || isDemoMode()) return "unknown";
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("email_account_state", {
      p_email: email,
    });
    if (error) return "unknown";
    return data === "none" || data === "passwordless" || data === "password"
      ? data
      : "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Step one of the email flow: validate, then branch. Accounts with a password
 * get a password field; everyone else gets a code emailed straight away, so a
 * brand-new signup is one round trip rather than two. Logging in with an
 * address we've never seen says so instead of quietly opening an account.
 */
export async function continueWithEmail(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = String(formData.get("next") ?? "");
  const isLogin = formData.get("mode") === "login";

  if (isDemoMode() && email === DEMO_EMAIL) {
    await enterDemo(next);
  }

  const emailCheck = await validateEmail(email);
  if (!emailCheck.ok) {
    return { error: emailCheck.reason };
  }

  const state = await accountState(email);

  if (state === "password") {
    return { step: "password" };
  }

  if (isLogin && state === "none") {
    return {
      error: "We couldn't find an account for that email. Create one instead?",
    };
  }

  return sendCode(email, next, { createUser: !isLogin });
}

/** Kick off Google / Microsoft sign-in. */
export async function signInWithProvider(formData: FormData) {
  const raw = String(formData.get("provider") ?? "");
  if (raw !== "google" && raw !== "azure") {
    redirect("/login?error=provider");
  }
  const next = String(formData.get("next") ?? "");

  const supabase = await createAuthClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: raw,
    options: {
      redirectTo: callbackUrl(next),
      // Supabase rejects Microsoft sign-ins that don't return an email claim.
      scopes: raw === "azure" ? "openid profile email" : undefined,
    },
  });

  if (error || !data.url) {
    redirect("/login?error=provider");
  }

  redirect(data.url);
}

/**
 * Sends an email containing both a magic link and a numeric code. The code is
 * what survives corporate link scanners and lets people finish in the tab they
 * started in, rather than whichever device happened to open the mail.
 */
async function sendCode(
  email: string,
  next: string,
  options?: { createUser?: boolean }
): Promise<AuthFormState> {
  const supabase = await createAuthClient();

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: options?.createUser ?? true,
        emailRedirectTo: callbackUrl(next),
      },
    });
    if (error) {
      return { error: authFailure("send code", error, error.message) };
    }
  } catch (cause) {
    if (!isUnreachable(cause)) throw cause;
    return { error: UNREACHABLE };
  }

  return { step: "code", sent: true };
}

/** Resend from the code step, and the entry point used by the standalone pages. */
export async function sendMagicLink(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = String(formData.get("next") ?? "");

  // Dev-only demo shortcut — no real backend required.
  if (isDemoMode() && email === DEMO_EMAIL) {
    await enterDemo(next);
  }

  const emailCheck = await validateEmail(email);
  if (!emailCheck.ok) {
    return { error: emailCheck.reason };
  }

  return sendCode(email, next);
}

/** "Forgot password?" — same email, but the code lands them on /reset-password. */
export async function startPasswordReset(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const emailCheck = await validateEmail(email);
  if (!emailCheck.ok) {
    return { error: emailCheck.reason };
  }
  return sendCode(email, "/reset-password");
}

export async function signInWithPassword(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  const supabase = await createAuthClient();

  let user: User;
  // redirect() throws, so the network guard has to stop at the await above it.
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user) {
      return {
        error: isUnreachable(error)
          ? UNREACHABLE
          : "That email and password don't match.",
      };
    }
    user = data.user;
  } catch (cause) {
    if (!isUnreachable(cause)) throw cause;
    return { error: UNREACHABLE };
  }

  await clearDemoSession();
  redirect(await postAuthDestination(supabase, user, next));
}

/** Verify the numeric code from the sign-in email. */
export async function verifyEmailCode(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  // Codes get copied out of an email, so they arrive wearing whatever the mail
  // client wrapped them in — spaces, a stray hyphen, a zero-width character that
  // \s doesn't match. The code is always digits, so keep only those.
  const token = String(formData.get("code") ?? "").replace(/\D/g, "");
  const next = String(formData.get("next") ?? "");

  if (!token) return { error: "Enter the code from your email." };

  const supabase = await createAuthClient();

  let user: User;
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    if (error || !data.user) {
      return {
        error: authFailure(
          "verify code",
          error,
          "That code isn't right. Check the latest email and try again."
        ),
      };
    }
    user = data.user;
  } catch (cause) {
    if (!isUnreachable(cause)) throw cause;
    return { error: UNREACHABLE };
  }

  await clearDemoSession();
  redirect(await postAuthDestination(supabase, user, next));
}

/** /welcome — name, plus a password for email signups. */
export async function completeProfile(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const wantsPassword = formData.get("wants_password") === "1";
  const productUpdates = formData.get("product_updates") === "1";
  const next = String(formData.get("next") ?? "");

  if (!name) return { error: "Please tell us what to call you." };
  if (wantsPassword && password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Passwords need at least ${MIN_PASSWORD_LENGTH} characters.` };
  }

  const supabase = await createAuthClient();
  const { data, error } = await supabase.auth.updateUser({
    data: { full_name: name, product_updates: productUpdates },
    ...(wantsPassword ? { password } : {}),
  });

  if (error || !data.user) {
    return { error: error?.message ?? "We couldn't save that. Please try again." };
  }

  redirect(await postAuthDestination(supabase, data.user, next));
}

/** Used by /reset-password and by Settings. */
export async function updatePassword(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const next = String(formData.get("next") ?? "");
  const stay = formData.get("stay") === "1";

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Passwords need at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (password !== confirm) {
    return { error: "Those passwords don't match." };
  }

  const supabase = await createAuthClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  if (stay) return { sent: true };
  redirect(safeNext(next));
}

export async function logout() {
  const cookieStore = await cookies();
  if (isDemoMode() && cookieStore.get(DEMO_COOKIE)) {
    cookieStore.delete(DEMO_COOKIE);
    redirect("/");
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
