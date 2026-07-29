/**
 * The site's base URL with any trailing slash stripped. Every caller appends a
 * rooted path, and Supabase matches OAuth redirect URLs against its allow-list
 * exactly — so a stray slash from the dashboard turns `/auth/callback` into
 * `//auth/callback` and silently breaks every provider sign-in.
 */
export function siteUrl(fallback = "http://localhost:3000"): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return (configured || fallback).replace(/\/+$/, "");
}
