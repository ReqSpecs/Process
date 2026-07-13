export function Wordmark({ className = "h-6" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        viewBox="0 0 24 24"
        className="h-[1.35em] w-[1.35em]"
        fill="none"
        aria-hidden="true"
      >
        {/* chevron glyph — the ProDraw mark */}
        <path d="M3 4h9l6 8-6 8H3l6-8L3 4Z" fill="var(--color-cobalt)" />
        <circle cx="19.5" cy="12" r="2.5" fill="var(--color-ember)" />
      </svg>
      <span className="text-[1.25em] font-bold tracking-tight text-ink">
        ProDraw
      </span>
    </span>
  );
}
