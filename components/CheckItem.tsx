/** Ticked feature bullet, shared by the pricing page and the trial screen. */
export function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-[14.5px] text-ink">
      <svg
        viewBox="0 0 20 20"
        className="mt-[3px] h-4 w-4 shrink-0"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M4.5 10.5l3.5 3.5L15.5 6"
          stroke="var(--color-ink)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {children}
    </li>
  );
}
