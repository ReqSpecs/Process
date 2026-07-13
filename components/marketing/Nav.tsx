"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Wordmark } from "@/components/Wordmark";
import { goToDemoDashboard } from "@/app/(auth)/actions";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
        scrolled
          ? "border-hairline bg-surface/85 backdrop-blur-md"
          : "border-transparent bg-surface"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label="ProDraw home">
          <Wordmark className="h-6" />
        </Link>

        <div className="hidden items-center gap-8 text-[15px] font-medium text-ink-soft sm:flex">
          <a href="#product" className="transition-colors hover:text-ink">
            Product
          </a>
          <Link href="/pricing" className="transition-colors hover:text-ink">
            Pricing
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {DEMO_MODE && (
            <form action={goToDemoDashboard}>
              <button
                type="submit"
                className="rounded-lg px-3 py-2 text-[15px] font-medium text-cobalt transition-colors hover:bg-cobalt-wash"
              >
                Try the demo
              </button>
            </form>
          )}
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-[15px] font-medium text-ink-soft transition-colors hover:bg-mist hover:text-ink"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-cobalt px-4 py-2 text-[15px] font-semibold text-white shadow-soft transition-colors hover:bg-cobalt-deep"
          >
            Start free
          </Link>
        </div>
      </nav>
    </header>
  );
}
