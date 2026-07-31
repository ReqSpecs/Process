"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { X } from "@phosphor-icons/react";
import { Wordmark } from "@/components/Wordmark";
import { AuthPanel, type AuthMode } from "@/components/auth/AuthPanel";
import { clearPendingAuth, readPendingAuth } from "@/components/auth/pendingAuth";

type OpenOptions = { next?: string };

type AuthModalContextValue = {
  open: (mode: AuthMode, options?: OpenOptions) => void;
  close: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function useAuthModal(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext);
  if (!ctx) {
    throw new Error("useAuthModal must be used inside <AuthModalProvider>");
  }
  return ctx;
}

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';

export function AuthModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<{ mode: AuthMode; next: string } | null>(
    null
  );
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusTo = useRef<HTMLElement | null>(null);

  const open = useCallback((mode: AuthMode, options?: OpenOptions) => {
    restoreFocusTo.current = document.activeElement as HTMLElement | null;
    setState({ mode, next: options?.next ?? "" });
  }, []);

  const close = useCallback(() => {
    // Closing is a decision, so don't offer to resume this one later.
    clearPendingAuth();
    setState(null);
    restoreFocusTo.current?.focus?.();
  }, []);

  const value = useMemo(() => ({ open, close }), [open, close]);

  // Reopen a sign-in that was waiting on an emailed code. Going to fetch the code
  // can cost you the page — Chrome reloads tabs it discarded while backgrounded —
  // and without this you'd come back to the marketing page with the code in your
  // clipboard and nowhere to put it.
  useEffect(() => {
    const pending = readPendingAuth();
    if (pending) setState({ mode: pending.mode, next: pending.next });
  }, []);

  // Lock scroll while open, compensating for the scrollbar so the page behind
  // doesn't visibly shift sideways when the modal appears.
  useEffect(() => {
    if (!state) return;
    const { body, documentElement } = document;
    const gap = window.innerWidth - documentElement.clientWidth;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
    };
  }, [state]);

  useEffect(() => {
    if (!state) return;
    const node = panelRef.current;
    node?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key !== "Tab" || !node) return;

      const focusable = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [state, close]);

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      {state && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
            onClick={close}
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={state.mode === "signup" ? "Sign up" : "Log in"}
            className="relative w-full max-w-[400px] rounded-panel border border-hairline bg-surface p-7 shadow-float"
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute right-3.5 top-3.5 rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-mist hover:text-ink"
            >
              <X size={16} weight="bold" />
            </button>

            <div className="mb-6 flex justify-center">
              <Wordmark className="h-6" />
            </div>

            <AuthPanel
              key={state.mode}
              mode={state.mode}
              next={state.next}
              onSwitchMode={(mode) => setState({ ...state, mode })}
            />
          </div>
        </div>
      )}
    </AuthModalContext.Provider>
  );
}
