"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Renders a desktop-width mock at a fixed design width, then scales it to the
 * container on small screens so sidebars and tables stay readable instead of
 * crushing horizontally.
 */
export function OfferMockFrame({
  children,
  width = 900,
}: {
  children: ReactNode;
  /** Intrinsic width the mock was designed for. */
  width?: number;
}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const shell = shellRef.current;
    const inner = innerRef.current;
    if (!shell || !inner) return;

    const measure = () => {
      const next = Math.min(1, shell.clientWidth / width);
      setScale(next);
      setHeight(inner.scrollHeight * next);
      setOffset(Math.max(0, (shell.clientWidth - width * next) / 2));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(shell);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [width]);

  const scaled = scale < 0.999;

  return (
    <div ref={shellRef} className="w-full overflow-hidden">
      <div className="relative" style={scaled ? { height } : undefined}>
        <div
          ref={innerRef}
          className="origin-top-left"
          style={
            scaled
              ? {
                  width,
                  transform: `translateX(${offset}px) scale(${scale})`,
                }
              : { width: "100%", maxWidth: width, margin: "0 auto" }
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
}
