"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { AuthShell } from "@/components/auth/AuthShell";

function SignupForm() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");
  const next =
    plan === "yearly" || plan === "monthly"
      ? `/start-trial?plan=${plan}`
      : "/start-trial";

  return (
    <AuthShell error={searchParams.get("error")}>
      <AuthPanel mode="signup" next={next} />
    </AuthShell>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
