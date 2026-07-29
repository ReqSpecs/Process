import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next 16 deprecates this file in favour of proxy.ts, but proxy.ts is Node-only
// and @opennextjs/cloudflare can only package Edge middleware. Revisit once the
// adapter supports Node middleware.
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Everything except static assets, images, and route handlers. `/api` does
     * its own auth, so session refresh there is dead weight — and it would put
     * a Supabase round trip in front of every Stripe webhook.
     */
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
