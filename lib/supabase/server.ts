import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createDemoClient, DEMO_COOKIE, isDemoMode } from "@/lib/demo";

/**
 * Concrete client type. Taken from a real call rather than
 * `ReturnType<typeof createServerClient>`, which instantiates that generic's
 * type parameters as `unknown` and silently degrades `.from()` to untyped.
 */
export type SupabaseServerClient = ReturnType<typeof createServiceClient>;

export async function createClient(): Promise<SupabaseServerClient> {
  const cookieStore = await cookies();

  // Dev-only demo mode: serve an in-memory, Supabase-shaped client so the app
  // is fully clickable without a real backend. Never active in production.
  if (isDemoMode() && cookieStore.get(DEMO_COOKIE)?.value === "1") {
    return createDemoClient() as unknown as SupabaseServerClient;
  }

  return createAuthClient();
}

/**
 * Always the live Supabase client, even while a demo session cookie is present.
 * Auth flows need this: the demo stand-in only fakes `getUser`/`signOut`, so
 * signing up from inside the demo would otherwise hit a client with no
 * `signInWithOtp` at all.
 */
export async function createAuthClient(): Promise<SupabaseServerClient> {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
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
    process.env.SUPABASE_SECRET_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  );
}
