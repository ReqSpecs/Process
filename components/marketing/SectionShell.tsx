import type { ReactNode } from "react";

type Props = {
  id?: string;
  eyebrow?: string;
  eyebrowColor?: string;
  comingSoon?: boolean;
  heading: ReactNode;
  subhead?: string;
  bgClass?: string;
  headingWidthClass?: string;
  subheadWidthClass?: string;
  paddingClass?: string;
  bodyGapClass?: string;
  children: ReactNode;
};

/**
 * Shared shell for the homepage feature sections: background, padding, a
 * left-aligned big display heading with an optional coloured eyebrow and
 * "Coming soon" badge, then the section body.
 */
export function SectionShell({
  id,
  eyebrow,
  eyebrowColor = "var(--color-cobalt)",
  comingSoon,
  heading,
  subhead,
  bgClass = "bg-surface",
  headingWidthClass = "max-w-3xl",
  subheadWidthClass = "max-w-xl",
  paddingClass = "py-20 sm:py-28",
  bodyGapClass = "mt-12 sm:mt-14",
  children,
}: Props) {
  return (
    <section id={id} className={`px-5 sm:px-8 ${paddingClass} ${bgClass}`}>
      <div className="mx-auto max-w-6xl">
        <div className={headingWidthClass}>
          {(eyebrow || comingSoon) && (
            <div className="mb-3 flex items-center gap-2.5">
              {eyebrow && (
                <span
                  className="text-sm font-semibold"
                  style={{ color: eyebrowColor }}
                >
                  {eyebrow}
                </span>
              )}
              {comingSoon && (
                <span className="rounded-full bg-ember-tint px-2.5 py-0.5 text-[11px] font-semibold text-ember">
                  Coming soon
                </span>
              )}
            </div>
          )}
          <h2 className="font-display text-[34px] font-bold leading-[1.04] tracking-[-0.025em] text-ink sm:text-[52px]">
            {heading}
          </h2>
          {subhead && (
            <p
              className={`mt-5 text-lg leading-relaxed text-ink-soft ${subheadWidthClass}`}
            >
              {subhead}
            </p>
          )}
        </div>
        <div className={bodyGapClass}>{children}</div>
      </div>
    </section>
  );
}
