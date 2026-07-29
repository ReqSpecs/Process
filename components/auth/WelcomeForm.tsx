"use client";

import { useActionState, useState } from "react";
import { completeProfile } from "@/app/(auth)/actions";
import { FormError } from "@/components/auth/AuthCard";

export function WelcomeForm({
  next,
  defaultName,
  needsPassword,
  email,
}: {
  next: string;
  defaultName: string;
  needsPassword: boolean;
  email: string;
}) {
  const [state, formAction, pending] = useActionState(completeProfile, null);
  const [name, setName] = useState(defaultName);

  return (
    <div className="w-full max-w-[400px]">
      <div className="flex justify-center">
        <Monogram name={name} />
      </div>

      <h1 className="mt-6 text-balance text-center text-[30px] font-bold leading-[1.15] tracking-[-0.02em] text-ink">
        Set up your profile
      </h1>
      <p className="mt-2 text-pretty text-center text-[15px] leading-relaxed text-ink-soft">
        {needsPassword
          ? "This is how you'll appear in ProDraw. Pick a password while you're here."
          : "This is how you'll appear in ProDraw."}
      </p>

      <form action={formAction} className="mt-8 space-y-5">
        <FormError message={state?.error} />
        <input type="hidden" name="next" value={next} />
        <input
          type="hidden"
          name="wants_password"
          value={needsPassword ? "1" : "0"}
        />

        <OnboardingField
          label="Your name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Priya Raghavan"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
        />

        {needsPassword && (
          <>
            {/* Gives password managers the account to file the new password under. */}
            <input
              type="email"
              name="username"
              value={email}
              autoComplete="username"
              readOnly
              hidden
            />
            <OnboardingField
              label="Password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              minLength={8}
              hint="Signing in stays quicker than waiting for a code, and you can still use a code any time."
              required
            />
          </>
        )}

        <button
          type="submit"
          disabled={pending}
          className="group flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-cobalt text-[15px] font-semibold text-white transition-[background-color,transform] duration-200 hover:bg-cobalt-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt active:translate-y-px disabled:opacity-60"
        >
          {pending ? "One moment\u2026" : "Continue"}
          {!pending && <Arrow />}
        </button>

        <label className="flex cursor-pointer items-start gap-2.5 text-pretty text-[13px] leading-relaxed text-ink-soft">
          <input
            type="checkbox"
            name="product_updates"
            value="1"
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded-[4px] border-hairline accent-cobalt"
          />
          Email me product updates, no more than monthly.
        </label>
      </form>
    </div>
  );
}

/**
 * Stands in for an avatar until uploads exist, and it isn't dead weight: the
 * initial tracks what they type, so the name lands somewhere visible.
 */
function Monogram({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <span
      aria-hidden="true"
      className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-cobalt-wash text-[30px] font-bold text-cobalt"
    >
      {initial || <PersonGlyph />}
    </span>
  );
}

function PersonGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 text-cobalt" fill="none">
      <circle cx="12" cy="8.5" r="3.75" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M4.75 20.25c0-3.6 3.25-6 7.25-6s7.25 2.4 7.25 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Arrow() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 10h11m0 0-4-4m4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function OnboardingField({
  label,
  hint,
  ...props
}: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-2 block text-[14px] font-semibold text-ink">
        {label}
      </span>
      <input
        {...props}
        className="h-12 w-full rounded-lg border border-hairline bg-surface px-3.5 text-[15px] text-ink shadow-[inset_0_1px_2px_rgb(29_28_26_/_0.04)] outline-none transition-colors placeholder:text-ink-faint focus:border-cobalt focus:ring-2 focus:ring-cobalt-tint"
      />
      {hint && (
        <span className="mt-2 block text-[12.5px] leading-relaxed text-ink-faint">
          {hint}
        </span>
      )}
    </label>
  );
}
