import { FormError } from "@/components/auth/AuthCard";

const MESSAGES: Record<string, string> = {
  auth: "That sign-in link didn't work — it may have expired or already been used. Try again below.",
  provider: "We couldn't complete that sign-in. Please try again.",
  denied: "Sign-in was cancelled.",
};

/** Card wrapper for the standalone /login and /signup pages. */
export function AuthShell({
  error,
  children,
}: {
  error?: string | null;
  children: React.ReactNode;
}) {
  const message = error ? (MESSAGES[error] ?? MESSAGES.auth) : undefined;

  return (
    <div className="w-full max-w-[400px]">
      {message && (
        <div className="mb-4">
          <FormError message={message} />
        </div>
      )}
      <div className="rounded-panel border border-hairline bg-surface p-7 shadow-soft">
        {children}
      </div>
    </div>
  );
}
