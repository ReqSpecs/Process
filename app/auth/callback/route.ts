import { NextResponse, type NextRequest } from "next/server";
import { createAuthClient } from "@/lib/supabase/server";
import { postAuthDestination } from "@/lib/postAuth";
import { DEMO_COOKIE } from "@/lib/demo";

/**
 * Landing point for magic links and for the Google / Microsoft round trip.
 * Exchanges the code for a session, then hands off to the shared routing rules.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? origin;
  const next = searchParams.get("next");

  // The provider bounced us: cancelled consent, blocked app, expired secret.
  const providerError = searchParams.get("error");
  if (providerError) {
    const reason = providerError === "access_denied" ? "denied" : "provider";
    return NextResponse.redirect(`${siteUrl}/login?error=${reason}`);
  }

  const code = searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(`${siteUrl}/login?error=auth`);
  }

  const supabase = await createAuthClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${siteUrl}/login?error=auth`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${siteUrl}/login?error=auth`);
  }

  const destination = await postAuthDestination(supabase, user, next);
  const response = NextResponse.redirect(`${siteUrl}${destination}`);
  // A real session wins over any leftover demo one.
  response.cookies.delete(DEMO_COOKIE);
  return response;
}
