"use client";

import { useActionState } from "react";
import { updatePassword } from "@/app/(auth)/actions";
import { AuthCard, Field, FormError, SubmitButton } from "@/components/auth/AuthCard";

export default function ResetPasswordPage() {
  const [state, formAction, pending] = useActionState(updatePassword, null);

  return (
    <AuthCard title="Choose a new password">
      <form action={formAction} className="space-y-4">
        <FormError message={state?.error} />
        <Field
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          minLength={8}
          required
        />
        <SubmitButton pending={pending}>Update password</SubmitButton>
      </form>
    </AuthCard>
  );
}
