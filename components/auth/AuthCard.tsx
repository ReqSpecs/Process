export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-sm">
      <h1 className="text-center text-[28px] font-bold tracking-tight text-ink">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 text-center text-[15px] text-ink-soft">{subtitle}</p>
      )}
      <div className="mt-8 rounded-panel border border-hairline bg-surface p-6 shadow-soft">
        {children}
      </div>
    </div>
  );
}

export function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">
        {label}
      </span>
      <input
        {...props}
        className="w-full rounded-lg border border-hairline bg-paper px-3.5 py-2.5 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-cobalt focus:bg-surface"
      />
    </label>
  );
}

export function SubmitButton({
  children,
  pending,
}: {
  children: React.ReactNode;
  pending?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-cobalt py-2.5 text-[15px] font-semibold text-white shadow-soft transition-colors hover:bg-cobalt-deep disabled:opacity-60"
    >
      {pending ? "One moment\u2026" : children}
    </button>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="rounded-lg bg-ember-tint px-3 py-2 text-[13px] font-medium text-signal">
      {message}
    </p>
  );
}
