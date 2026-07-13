import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createDemoClient, DEMO_COOKIE, isDemoMode } from "@/lib/demo";

export async function createClient() {
  const cookieStore = await cookies();

  // Dev-only demo mode: serve an in-memory, Supabase-shaped client so the app
  // is fully clickable without a real backend. Never active in production.
  if (isDemoMode() && cookieStore.get(DEMO_COOKIE)?.value === "1") {
    return createDemoClient() as unknown as ReturnType<typeof createServerClient>;
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component; middleware refreshes sessions.
          }
        },
      },
    }
  );
}

/** Service-role client for webhooks and admin operations. Server only. */
export function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  );
}
