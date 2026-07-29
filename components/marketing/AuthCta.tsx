"use client";

import { useAuthModal } from "@/components/auth/AuthModal";
import type { AuthMode } from "@/components/auth/AuthPanel";

/**
 * Opens the auth modal from anywhere on the marketing site, so server-rendered
 * sections can keep their CTAs without becoming client components.
 */
export function AuthCta({
  mode = "signup",
  next,
  className,
  children,
}: {
  mode?: AuthMode;
  next?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const auth = useAuthModal();
  return (
    <button
      type="button"
      onClick={() => auth.open(mode, { next })}
      className={className}
    >
      {children}
    </button>
  );
}
