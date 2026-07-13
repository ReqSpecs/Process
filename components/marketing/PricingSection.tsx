import Link from "next/link";
import { type Currency, CURRENCY_SYMBOLS, EARLY_ADOPTER_PRICE } from "@/lib/constants";

const FEATURES = [
  "Unlimited projects & processes",
  "Chevron process architecture",
  "Full BPMN 2.0 canvas",
  "Process documentation",
  "PDF export — single process or whole project",
  "Autosave & version snapshots",
  "Suggest features, shape the roadmap",
];

export function PricingSection({ currency }: { currency: Currency }) {
  const symbol = CURRENCY_SYMBOLS[currency];

  return (
    <section id="pricing" className="bg-paper px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-[32px] font-bold tracking-[-0.02em] text-ink sm:text-[42px]">
          One plan. Early adopter price
          <span className="text-cobalt">.</span>
        </h2>
        <p className="mx-auto mt-3 max-w-md text-center text-lg text-ink-soft">
          Everything included while we build. Lock in the price before it goes
          up.
        </p>

        <div className="mx-auto mt-10 max-w-md rounded-panel border border-hairline bg-surface p-8 shadow-float">
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold text-ink">Early adopter</p>
            <span className="rounded-full bg-gold-tint px-3 py-1 text-xs font-semibold text-gold">
              Founding price
            </span>
          </div>

          <p className="mt-5 flex items-baseline gap-1.5">
            <span className="text-5xl font-bold tracking-tight text-ink">
              {symbol}
              {EARLY_ADOPTER_PRICE}
            </span>
            <span className="text-ink-faint">{currency} / month</span>
          </p>
          <p className="mt-1.5 text-sm text-ink-faint">
            7-day free trial. No credit card to start.
          </p>

          <ul className="mt-6 space-y-2.5">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[15px] text-ink-soft">
                <svg viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 shrink-0" fill="none" aria-hidden="true">
                  <circle cx="10" cy="10" r="9" fill="var(--color-cobalt-wash)" />
                  <path d="M6 10.5l2.5 2.5L14 7.5" stroke="var(--color-cobalt)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {f}
              </li>
            ))}
          </ul>

          <Link
            href="/signup"
            className="mt-8 block rounded-full bg-cobalt py-3 text-center text-[15px] font-semibold text-white shadow-soft transition-colors hover:bg-cobalt-deep"
          >
            Start your free trial
          </Link>
        </div>
      </div>
    </section>
  );
}
