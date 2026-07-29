"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  continueWithEmail,
  sendMagicLink,
  signInWithPassword,
  signInWithProvider,
  startPasswordReset,
  verifyEmailCode,
  type AuthStep,
} from "@/app/(auth)/actions";
import { Field, FormError, SubmitButton } from "@/components/auth/AuthCard";
import { GoogleIcon, MicrosoftIcon } from "@/components/auth/ProviderIcons";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export type AuthMode = "login" | "signup";

function ProviderButton({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={label}
      className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-hairline bg-surface px-4 py-2.5 text-[14px] font-semibold text-ink transition-colors hover:bg-mist disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function TextButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="font-semibold text-cobalt transition-colors hover:underline disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function AuthPanel({
  mode,
  next,
  onSwitchMode,
}: {
  mode: AuthMode;
  next: string;
  /** Provided by the modal so switching login/signup doesn't navigate away. */
  onSwitchMode?: (mode: AuthMode) => void;
}) {
  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [codeNext, setCodeNext] = useState(next);
  const [isReset, setIsReset] = useState(false);

  const [emailState, emailAction, emailPending] = useActionState(
    continueWithEmail,
    null
  );
  const [pwState, pwAction, pwPending] = useActionState(
    signInWithPassword,
    null
  );
  const [codeState, codeAction, codePending] = useActionState(
    verifyEmailCode,
    null
  );
  const [resendState, resendAction, resendPending] = useActionState(
    sendMagicLink,
    null
  );
  const [resetState, resetAction, resetPending] = useActionState(
    startPasswordReset,
    null
  );

  useEffect(() => {
    if (emailState?.step) setStep(emailState.step);
  }, [emailState]);

  useEffect(() => {
    if (resendState?.sent) setStep("code");
  }, [resendState]);

  useEffect(() => {
    if (resetState?.sent) {
      setIsReset(true);
      setCodeNext("/reset-password");
      setStep("code");
    }
  }, [resetState]);

  const backToEmail = () => {
    setStep("email");
    setIsReset(false);
    setCodeNext(next);
  };

  // ---------------------------------------------------------------- code step
  if (step === "code") {
    return (
      <div>
        <Header
          title="Check your email"
          subtitle={
            isReset
              ? `Enter the code we sent to ${email}, then choose a new password.`
              : `We sent a 6-digit code to ${email}. It expires shortly.`
          }
        />

        <form action={codeAction} className="space-y-4">
          <FormError message={codeState?.error ?? resendState?.error} />
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="next" value={codeNext} />
          <Field
            label="Login code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            maxLength={6}
            autoFocus
            required
          />
          <SubmitButton pending={codePending}>Continue</SubmitButton>
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[13px] text-ink-faint">
          <span>Didn&apos;t get it?</span>
          <form action={resendAction}>
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="next" value={codeNext} />
            <TextButton type="submit" disabled={resendPending}>
              {resendPending ? "Sending\u2026" : "Send a new code"}
            </TextButton>
          </form>
          <span aria-hidden="true">·</span>
          <TextButton type="button" onClick={backToEmail}>
            Use a different email
          </TextButton>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------ password step
  if (step === "password") {
    return (
      <div>
        <Header
          title="Welcome back"
          subtitle={`Signing in as ${email}`}
        />

        <form action={pwAction} className="space-y-4">
          <FormError message={pwState?.error ?? resetState?.error} />
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="next" value={next} />
          <Field
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            autoFocus
            required
          />
          <SubmitButton pending={pwPending}>Log in</SubmitButton>
        </form>

        <div className="mt-5 flex flex-col items-center gap-2 text-[13px] text-ink-faint">
          <form action={resetAction}>
            <input type="hidden" name="email" value={email} />
            <TextButton type="submit" disabled={resetPending}>
              {resetPending ? "Sending\u2026" : "Forgot password?"}
            </TextButton>
          </form>
          <form action={resendAction}>
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="next" value={next} />
            <TextButton type="submit" disabled={resendPending}>
              {resendPending ? "Sending\u2026" : "Email me a code instead"}
            </TextButton>
          </form>
          <TextButton type="button" onClick={backToEmail}>
            Use a different email
          </TextButton>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------- email step
  const isSignup = mode === "signup";

  return (
    <div>
      <Header
        title={isSignup ? "Get started with ProDraw" : "Log in to ProDraw"}
        subtitle={
          isSignup
            ? "One home for every process your team runs."
            : "Welcome back. Let's pick up where you left off."
        }
      />

      {DEMO_MODE && (
        <p className="mb-4 rounded-lg bg-cobalt-wash px-3 py-2 text-[13px] text-cobalt">
          Demo mode — sign in with{" "}
          <span className="font-semibold">test@prodraw.ai</span>.
        </p>
      )}

      <form action={emailAction} className="space-y-4">
        <FormError message={emailState?.error} />
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="mode" value={mode} />
        <Field
          label="Work email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <SubmitButton pending={emailPending}>Continue</SubmitButton>
      </form>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-hairline" />
        <span className="text-[12px] font-medium text-ink-faint">
          or continue with
        </span>
        <span className="h-px flex-1 bg-hairline" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <form action={signInWithProvider}>
          <input type="hidden" name="provider" value="google" />
          <input type="hidden" name="next" value={next} />
          <ProviderButton label="Continue with Google">
            <GoogleIcon />
            Google
          </ProviderButton>
        </form>
        <form action={signInWithProvider}>
          <input type="hidden" name="provider" value="azure" />
          <input type="hidden" name="next" value={next} />
          <ProviderButton label="Continue with Microsoft">
            <MicrosoftIcon />
            Microsoft
          </ProviderButton>
        </form>
      </div>

      <p className="mt-6 text-center text-[13px] text-ink-faint">
        {isSignup ? "Already have an account? " : "New to ProDraw? "}
        {onSwitchMode ? (
          <TextButton
            type="button"
            onClick={() => onSwitchMode(isSignup ? "login" : "signup")}
          >
            {isSignup ? "Log in" : "Create account"}
          </TextButton>
        ) : (
          <Link
            href={isSignup ? "/login" : "/signup"}
            className="font-semibold text-cobalt hover:underline"
          >
            {isSignup ? "Log in" : "Create account"}
          </Link>
        )}
      </p>

      {isSignup && (
        <p className="mt-3 text-center text-[12px] leading-relaxed text-ink-faint">
          7-day free trial, card required, cancel anytime. By continuing you
          agree to our <Link href="/terms" className="underline">Terms</Link> and{" "}
          <Link href="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      )}
    </div>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6 text-center">
      <h2 className="text-[22px] font-bold tracking-tight text-ink">{title}</h2>
      <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">
        {subtitle}
      </p>
    </div>
  );
}
