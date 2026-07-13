"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { requestPasswordReset } from "@/app/(auth)/actions";
import { AuthCard, Field, SubmitButton } from "@/components/auth/AuthCard";

export default function ForgotPasswordPage() {
  const [, formAction, pending] = useActionState(requestPasswordReset, null);
  const [sent, setSent] = useState(false);

  return (
    <AuthCard
      title="Reset your password"
      subtitle="We'll email you a link to set a new one."
    >
      {sent ? (
        <p className="rounded-lg bg-cobalt-wash px-4 py-3 text-[14px] text-ink-soft">
          If an account exists for that email, a reset link is on its way.
        </p>
      ) : (
        <form
          action={formAction}
          onSubmit={() => setSent(true)}
          className="space-y-4"
        >
          <Field
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            required
          />
          <SubmitButton pending={pending}>Send reset link</SubmitButton>
        </form>
      )}
      <p className="mt-5 text-center text-[13px] text-ink-faint">
        <Link href="/login" className="font-semibold text-cobalt hover:underline">
          Back to log in
        </Link>
      </p>
    </AuthCard>
  );
}
