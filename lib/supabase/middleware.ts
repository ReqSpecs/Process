import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DEMO_COOKIE, isDemoMode } from "@/lib/demo";

const PROTECTED_PREFIXES = [
  "/checkout",
  "/process-library",
  "/project",
  "/projects",
  "/processes",
  "/settings",
  "/start-trial",
  "/welcome",
  "/reset-password",
];

export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Dev-only demo mode: the demo cookie stands in for an authenticated session,
  // so we skip Supabase entirely (there's no real backend to talk to). Without
  // the cookie we fall through to the real checks below, so real accounts still
  // work while the flag is on.
  if (isDemoMode() && request.cookies.get(DEMO_COOKIE)?.value === "1") {
    if (path === "/login" || path === "/signup") {
      const url = request.nextUrl.clone();
      url.pathname = "/process-library";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and the claims check —
  // it can cause random logouts.
  //
  // This runs on every request, so it's the one auth call we most want to keep
  // off the network. getClaims() verifies the token's signature locally when the
  // project uses asymmetric signing keys; getUser() always asked the Auth server,
  // which cost 200ms typically and once 5.2s under load. All we need here is
  // whether there's a valid session, which the token itself can answer.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims ?? null;

  const isProtected = PROTECTED_PREFIXES.some((p) => path.startsWith(p));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user && (path === "/login" || path === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/process-library";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
