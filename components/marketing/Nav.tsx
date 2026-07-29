"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Wordmark } from "@/components/Wordmark";
import { useAuthModal } from "@/components/auth/AuthModal";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const auth = useAuthModal();

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
      <nav className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label="ProDraw home" className="relative z-10">
          <Wordmark className="h-6" />
        </Link>

        <div className="pointer-events-none absolute inset-0 hidden items-center justify-center sm:flex">
          <div className="pointer-events-auto flex items-center gap-8 text-[15px] font-medium text-ink">
            <Link href="/" className="transition-colors hover:text-ink">
              Product
            </Link>
            <Link href="/pricing" className="transition-colors hover:text-ink">
              Pricing
            </Link>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            type="button"
            onClick={() => auth.open("login")}
            className="rounded-lg px-3 py-2 text-[15px] font-medium text-ink transition-colors hover:bg-mist"
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => auth.open("signup", { next: "/start-trial" })}
            className="rounded-lg bg-cobalt px-4 py-2 text-[15px] font-semibold text-white shadow-soft transition-colors hover:bg-cobalt-deep"
          >
            Start trial
          </button>
        </div>
      </nav>
    </header>
  );
}
