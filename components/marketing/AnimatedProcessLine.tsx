"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

type Item = { word: string; bg: string; fg: string; dot: string };

// Vibrant palette from the Higgsfield ProDraw board (assets/palette-vibrant-v1.png).
// dot = a lighter tint of the pill colour for tonal contrast (not the text colour).
const ITEMS: Item[] = [
  { word: "Map", bg: "#aef029", fg: "#1a2b05", dot: "#dfff9e" },
  { word: "Store", bg: "#7c3aed", fg: "#ffffff", dot: "#c4b5fd" },
  { word: "Share", bg: "#e81e62", fg: "#ffffff", dot: "#f2739e" },
  { word: "Model", bg: "#0047ab", fg: "#ffffff", dot: "#5b8ee6" },
  { word: "Improve", bg: "#ff5722", fg: "#ffffff", dot: "#ff9166" },
];

const INTERVAL_MS = 3000;
const SLIDE = { type: "spring", stiffness: 420, damping: 34 } as const;
// Colours are applied as plain inline styles (deterministic for SSR) and
// recoloured via a CSS transition — this avoids framer-motion `animate`
// injecting client-only styles that would cause a hydration mismatch.
const RECOLOUR = "background-color 0.22s ease, color 0.22s ease";

/**
 * Notion-style animated headline line: "to [Word] process."
 * The word swaps in instantly; the pill then expands/contracts to fit (framer
 * `layout`), and the surrounding words slide along with it. Pill, dot, text and
 * the trailing full stop all recolour per word via CSS transitions.
 */
export function AnimatedProcessLine() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => (i + 1) % ITEMS.length),
      INTERVAL_MS,
    );
    return () => clearInterval(id);
  }, []);

  const cur = ITEMS[index];

  return (
    <span className="flex w-full flex-wrap items-center justify-center gap-x-[0.28em] sm:flex-nowrap">
      <motion.span layout transition={{ layout: SLIDE }}>
        to
      </motion.span>

      <motion.span
        layout
        transition={{ layout: SLIDE }}
        style={{ backgroundColor: cur.bg, transition: RECOLOUR }}
        className="inline-flex translate-y-[0.09em] items-center gap-[0.32em] rounded-[999px] px-[0.44em] pb-[0.18em] pt-[0.12em] align-middle shadow-soft"
      >
        <span
          style={{ backgroundColor: cur.dot, transition: RECOLOUR }}
          className="inline-block h-[0.26em] w-[0.26em] shrink-0 rounded-full"
          aria-hidden="true"
        />
        <span
          style={{ color: cur.fg, transition: RECOLOUR }}
          className="inline-block whitespace-nowrap font-normal leading-none"
        >
          {cur.word}
        </span>
      </motion.span>

      <motion.span layout transition={{ layout: SLIDE }}>
        process
        <span style={{ color: cur.bg, transition: RECOLOUR }}>.</span>
      </motion.span>
    </span>
  );
}
