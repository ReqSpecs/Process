import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Workspace } from "@/lib/access";

export type SessionUser = { id: string; email: string };

/**
 * Who is making this request, established from the access token's own signature.
 *
 * `getUser()` asks the Auth server every single time it's called, and we called
 * it in the middleware, again in the server action, and again while rendering the
 * page — three network round trips before any real work started. It measured
 * ~200ms on a good day and once 5.2s in the middleware alone.
 *
 * `getClaims()` verifies the JWT locally with WebCrypto instead, provided the
 * project signs tokens with an asymmetric key (a Supabase dashboard setting).
 * With a symmetric secret it falls back to the same server call as `getUser()`,
 * so this is safe either way — it simply gets much faster once the keys are
 * switched over.
 *
 * Use `getUser()` directly only where the full user record is needed (identities
 * and metadata aren't all in the token).
 */
export const sessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { id: claims.sub, email: claims.email ?? "" };
});

/**
 * The caller's workspace. `cache()` matters here: a layout and the page inside it
 * render together and both need it, and this way they share one query instead of
 * issuing the same one twice.
 */
export const sessionWorkspace = cache(async (): Promise<Workspace | null> => {
  const user = await sessionUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("workspaces")
    .select("*")
    .eq("owner_id", user.id)
    .single<Workspace>();

  return data ?? null;
});
