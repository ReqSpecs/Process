"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { AuthShell } from "@/components/auth/AuthShell";

function LoginForm() {
  const searchParams = useSearchParams();
  const failed = searchParams.get("error");

  return (
    <AuthShell error={failed}>
      <AuthPanel mode="login" next={searchParams.get("next") ?? ""} />
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
