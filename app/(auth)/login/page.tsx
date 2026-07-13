"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState } from "react";
import { login } from "@/app/(auth)/actions";
import { AuthCard, Field, FormError, SubmitButton } from "@/components/auth/AuthCard";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

function LoginForm() {
  const [state, formAction, pending] = useActionState(login, null);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";

  return (
    <AuthCard title="Welcome back">
      {DEMO_MODE && (
        <p className="mb-4 rounded-lg bg-cobalt-wash px-3 py-2 text-[13px] text-cobalt">
          Demo mode — sign in with{" "}
          <span className="font-semibold">test@prodraw.ai</span> /{" "}
          <span className="font-semibold">123</span>.
        </p>
      )}
      <form action={formAction} className="space-y-4">
        <FormError message={state?.error} />
        <input type="hidden" name="next" value={next} />
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          required
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          required
        />
        <SubmitButton pending={pending}>Log in</SubmitButton>
      </form>
      <div className="mt-5 flex items-center justify-between text-[13px]">
        <Link href="/forgot-password" className="text-ink-faint hover:text-ink">
          Forgot password?
        </Link>
        <Link href="/signup" className="font-semibold text-cobalt hover:underline">
          Create account
        </Link>
      </div>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
