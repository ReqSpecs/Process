"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * Notion-style credibility strip. It is `position: sticky; bottom: 0` inside a
 * wrapper that also contains the hero — so while the hero is on screen the
 * strip stays pinned to the bottom edge of the viewport as a slim white band
 * with a single row of logos. Once the visitor scrolls past the hero it
 * settles into the page flow, the heading fades in above and a second row
 * expands in below.
 */

type Brand = { src: string; name: string; h: string; extra?: string };

// Logos are pre-trimmed to a tight bounding box (scripts/trim-logos.mjs), so
// heights map directly to optical size. Single-line wordmarks share one height;
// stacked lockups (KPMG, Accenture, CommBank) and icon marks get a touch more
// so their text/mark reads at a comparable size.
const ROW_ONE: Brand[] = [
  { src: "macquarie-k", name: "Macquarie", h: "h-4 sm:h-5" },
  { src: "westpac-k", name: "Westpac", h: "h-6 sm:h-7" },
  { src: "qantas-k", name: "Qantas", h: "h-5 sm:h-6" },
  { src: "google-k", name: "Google", h: "h-5 sm:h-6" },
  { src: "atlassian-k", name: "Atlassian", h: "h-4 sm:h-[18px]" },
];

const ROW_TWO: Brand[] = [
  { src: "bupa-k", name: "Bupa", h: "h-5 sm:h-6" },
  { src: "vodafone-k", name: "Vodafone", h: "h-5 sm:h-6" },
  { src: "allianz-k", name: "Allianz", h: "h-4 sm:h-5" },
  { src: "amp-k", name: "AMP", h: "h-6 sm:h-7", extra: "-translate-y-[3px]" },
];

function Logo({ brand }: { brand: Brand }) {
  return (
    <Image
      src={`/logos/${brand.src}.png`}
      alt={brand.name}
      width={200}
      height={64}
      // Eager + unoptimized: row two is hidden until the strip expands, so
      // lazy-loaded logos would fetch/decode mid-animation and jank the first
      // expand. These PNGs are tiny and pre-trimmed, so we serve them as-is
      // and have them decoded before the animation ever runs.
      loading="eager"
      unoptimized
      className={`${brand.h} w-auto select-none object-contain opacity-[0.72] brightness-0 transition-opacity duration-200 hover:opacity-100 ${brand.extra ?? ""}`}
    />
  );
}

export function BrandStrip() {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);

  // The sentinel (1px, directly above the strip) marks the strip's flow
  // position; it's unaffected by the expand/contract, so the geometry below is
  // feedback-free and measured live each frame.
  //
  // Expansion happens right at the viewport edge: the moment the collapsed
  // strip lifts off the bottom of the viewport. The heading fades into a
  // pre-reserved (transparent) space above the logo line, and row two unfolds
  // downward as a SIBLING below the sticky section — see the JSX note.
  useEffect(() => {
    const sent = sentinelRef.current;
    if (!sent) return;
    const COLLAPSED_H = 116; // reserved heading space (56) + logo line (~60)
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const vh = window.innerHeight;
      const sentDocTop = sent.getBoundingClientRect().top + y;
      // scroll position where the collapsed strip un-pins from the bottom edge
      const liftOff = Math.max(0, sentDocTop + COLLAPSED_H - vh);
      if (y > liftOff + 12) setExpanded(true);
      else if (y < liftOff + 4) setExpanded(false);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />

      {/* The sticky section is a CONSTANT height (heading reserve + logo line).
          Because its height never changes, `sticky bottom-0` pins the logo line
          cleanly to the viewport edge with no jump — the earlier jump on
          contraction came from row two living inside here and fighting the pin
          as it collapsed. Row two now sits OUTSIDE, as a sibling below. */}
      <section
        className="sticky bottom-0 z-30 w-full"
        style={{ overflowAnchor: "none" }}
      >
        {/* reserved heading space — transparent, so the mockup's drop shadow
            bleeds through seamlessly; the heading simply fades into it */}
        <div className="flex h-14 items-end justify-center">
          <p
            className={`pb-3 text-center text-sm text-ink-faint transition-opacity duration-500 ${
              expanded ? "opacity-100" : "opacity-0"
            }`}
          >
            Built by analysts who&apos;ve delivered for the world&apos;s
            biggest brands
          </p>
        </div>

        {/* logo line — never moves; the hairline on its top edge fades away
            when expanded so it morphs into the hero */}
        <div
          className={`relative transition-colors duration-500 ${
            expanded ? "bg-transparent" : "bg-surface"
          }`}
        >
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-hairline transition-opacity duration-500 ${
              expanded ? "opacity-0" : "opacity-100"
            }`}
          />
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-12 gap-y-4 px-6 py-4 sm:gap-x-16">
            {ROW_ONE.map((brand) => (
              <Logo key={brand.src} brand={brand} />
            ))}
          </div>
        </div>
      </section>

      {/* row two — sibling below the sticky section, so its height animation
          never fights the sticky-bottom pin (that caused the jump-then-close).
          Revealed with a pure-CSS grid-template-rows transition (0fr -> 1fr)
          instead of a JS height animation — the browser handles it off the
          main thread, so it stays smooth even while the page below reflows. */}
      <div
        className="grid transition-[grid-template-rows] duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        style={{
          gridTemplateRows: expanded ? "1fr" : "0fr",
          overflowAnchor: "none",
        }}
      >
        <div className="overflow-hidden">
          <div
            className={`mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-12 gap-y-5 px-6 pb-6 pt-4 transition-opacity duration-300 sm:gap-x-16 ${
              expanded ? "opacity-100" : "opacity-0"
            }`}
          >
            {ROW_TWO.map((brand) => (
              <Logo key={brand.src} brand={brand} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
