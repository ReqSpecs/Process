import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fullName, isEmailOnlyUser, needsOnboarding } from "@/lib/onboarding";
import { safeNext } from "@/lib/postAuth";
import { logout } from "@/app/(auth)/actions";
import { WelcomeForm } from "@/components/auth/WelcomeForm";
import { Wordmark } from "@/components/Wordmark";

export const metadata: Metadata = { title: "Set up your profile" };

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const next = safeNext(
    typeof params.next === "string" ? params.next : undefined
  );

  // Google and Microsoft users arrive with a name and a working credential, so
  // there's nothing to ask them.
  if (!(await needsOnboarding(user))) redirect(next);

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="flex justify-center px-6 py-7">
        <Link href="/" aria-label="ProDraw home">
          <Wordmark className="h-5" />
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 pb-14">
        <WelcomeForm
          next={next}
          defaultName={fullName(user)}
          needsPassword={isEmailOnlyUser(user)}
          email={user.email ?? ""}
        />
      </main>

      <footer className="px-6 pb-8 text-center text-[13px] text-ink-faint">
        Signed in as {user.email}
        <span aria-hidden="true" className="mx-2">
          ·
        </span>
        <form action={logout} className="inline">
          <button
            type="submit"
            className="font-medium text-ink-faint underline decoration-hairline underline-offset-2 transition-colors hover:text-ink"
          >
            Sign out
          </button>
        </form>
      </footer>
    </div>
  );
}
