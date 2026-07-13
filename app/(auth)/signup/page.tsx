"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup } from "@/app/(auth)/actions";
import { AuthCard, Field, FormError, SubmitButton } from "@/components/auth/AuthCard";

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, null);

  return (
    <AuthCard
      title="Create your workspace"
      subtitle="Free for 7 days. No credit card required."
    >
      <form action={formAction} className="space-y-4">
        <FormError message={state?.error} />
        <Field
          label="Work email"
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
          autoComplete="new-password"
          placeholder="At least 8 characters"
          minLength={8}
          required
        />
        <SubmitButton pending={pending}>Start free trial</SubmitButton>
      </form>
      <p className="mt-5 text-center text-[13px] text-ink-faint">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-cobalt hover:underline">
          Log in
        </Link>
      </p>
      <p className="mt-3 text-center text-[12px] leading-relaxed text-ink-faint">
        By signing up you agree to our{" "}
        <Link href="/terms" className="underline">Terms</Link> and{" "}
        <Link href="/privacy" className="underline">Privacy Policy</Link>.
      </p>
    </AuthCard>
  );
}
