"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validateEmail } from "@/lib/validateEmail";
import {
  DEMO_COOKIE,
  DEMO_EMAIL,
  DEMO_PASSWORD,
  isDemoMode,
} from "@/lib/demo";

const DEMO_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/** Form action for the marketing "Try the demo" button. */
export async function goToDemoDashboard(): Promise<never> {
  return enterDemo("/process-library");
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

export type AuthFormState = { error: string } | null;

export async function signup(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const emailCheck = await validateEmail(email);
  if (!emailCheck.ok) {
    return { error: emailCheck.reason };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/process-library");
}

export async function login(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  // Dev-only demo credentials — no real backend required.
  if (isDemoMode() && email === DEMO_EMAIL && password === DEMO_PASSWORD) {
    const next = String(formData.get("next") ?? "");
    await enterDemo(next);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Invalid email or password." };
  }

  const next = String(formData.get("next") ?? "") || "/process-library";
  redirect(next.startsWith("/") ? next : "/process-library");
}

export async function requestPasswordReset(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const supabase = await createClient();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/reset-password`,
  });

  // Always report success to avoid leaking which emails exist.
  return null;
}

export async function updatePassword(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: error.message };
  }

  redirect("/process-library");
}

export async function logout() {
  const cookieStore = await cookies();
  if (cookieStore.get(DEMO_COOKIE)) {
    cookieStore.delete(DEMO_COOKIE);
    redirect("/");
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
