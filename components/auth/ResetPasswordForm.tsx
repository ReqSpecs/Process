"use client";

import { useActionState } from "react";
import { updatePassword } from "@/app/(auth)/actions";
import { AuthCard, Field, FormError, SubmitButton } from "@/components/auth/AuthCard";

export function ResetPasswordForm({
  next,
  email,
  isFirstPassword,
}: {
  next: string;
  email: string;
  /** An OAuth user who landed here has no password yet — this is a setup, not a reset. */
  isFirstPassword: boolean;
}) {
  const [state, formAction, pending] = useActionState(updatePassword, null);

  return (
    <AuthCard
      title={isFirstPassword ? "Set a password" : "Choose a new password"}
      subtitle={`for ${email}`}
    >
      <form action={formAction} className="space-y-4">
        <FormError message={state?.error} />
        <input type="hidden" name="next" value={next} />
        <input
          type="email"
          name="username"
          value={email}
          autoComplete="username"
          readOnly
          hidden
        />
        <Field
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          minLength={8}
          autoFocus
          required
        />
        <Field
          label="Confirm password"
          name="confirm"
          type="password"
          autoComplete="new-password"
          placeholder="Type it again"
          minLength={8}
          required
        />
        <SubmitButton pending={pending}>
          {isFirstPassword ? "Set password" : "Update password"}
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
