import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasPassword } from "@/lib/onboarding";
import { safeNext } from "@/lib/postAuth";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Getting here means the emailed code was already exchanged for a session.
  if (!user) redirect("/login?error=auth");

  const next = safeNext(
    typeof params.next === "string" ? params.next : undefined
  );

  return (
    <ResetPasswordForm
      next={next}
      email={user.email ?? ""}
      isFirstPassword={!(await hasPassword(user.email ?? ""))}
    />
  );
}
