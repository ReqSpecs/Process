import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";

export function Footer() {
  return (
    <footer className="bg-surface px-5 pb-10 pt-2 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
        <div>
          <Wordmark className="h-5" />
          <p className="mt-2 text-sm text-ink-faint">
            The modern home for your business processes.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-8 gap-y-2 text-sm font-medium text-ink-soft">
          <a href="/#product" className="transition-colors hover:text-ink">
            Product
          </a>
          <Link href="/pricing" className="transition-colors hover:text-ink">
            Pricing
          </Link>
          <Link href="/terms" className="transition-colors hover:text-ink">
            Terms
          </Link>
          <Link href="/privacy" className="transition-colors hover:text-ink">
            Privacy
          </Link>
        </nav>
      </div>
      <p className="mx-auto mt-6 max-w-6xl text-xs text-ink-faint">
        &copy; {new Date().getFullYear()} ProDraw. All rights reserved.
      </p>
    </footer>
  );
}
