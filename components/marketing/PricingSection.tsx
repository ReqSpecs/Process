"use client";

import Image from "next/image";
import { useState } from "react";
import { AuthCta } from "@/components/marketing/AuthCta";
import { CheckItem } from "@/components/CheckItem";
import {
  CURRENCY_SYMBOLS,
  EARLY_ADOPTER_FEATURES,
  ENTERPRISE_FEATURES,
  PLAN_PRICING,
  type BillingInterval,
  type Currency,
} from "@/lib/constants";
import { formatPrice, planPrice, yearlyTotal } from "@/lib/pricing";

// Same pre-trimmed logo set as the homepage brand strip.
const TRUST_LOGOS: { src: string; name: string; h: string }[] = [
  { src: "macquarie-k", name: "Macquarie", h: "h-[15px] sm:h-[17px]" },
  { src: "westpac-k", name: "Westpac", h: "h-[22px] sm:h-6" },
  { src: "qantas-k", name: "Qantas", h: "h-[18px] sm:h-5" },
  { src: "google-k", name: "Google", h: "h-[18px] sm:h-5" },
  { src: "atlassian-k", name: "Atlassian", h: "h-[13px] sm:h-[15px]" },
];

export function PricingTable({
  initialCurrency,
}: {
  initialCurrency: Currency;
}) {
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const currency = initialCurrency;

  const symbol = CURRENCY_SYMBOLS[currency];
  const plan = PLAN_PRICING[currency];
  const early = planPrice(currency, interval);
  const annual = yearlyTotal(currency);

  return (
    <section className="relative overflow-x-clip bg-surface px-5 py-14 sm:px-8 sm:py-20">
      <div className="relative mx-auto max-w-6xl">
        {/* heading — big, left-aligned, full stop */}
        <h1 className="whitespace-nowrap font-[family-name:var(--font-inter)] text-[clamp(28px,4.6vw,64px)] font-bold leading-[1.06] tracking-[-0.025em] text-ink">
          One home for all process
          <span className="text-[#aef029]">.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-ink">
          Lock in the founding price for life, as long as your plan stays
          active.
        </p>

        {/* social proof reminder */}
        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
          <span className="text-[13px] text-ink">
            Trusted by analysts at
          </span>
          {TRUST_LOGOS.map((brand) => (
            <Image
              key={brand.src}
              src={`/logos/${brand.src}.png`}
              alt={brand.name}
              width={200}
              height={64}
              unoptimized
              className={`${brand.h} w-auto select-none object-contain opacity-[0.55] brightness-0 transition-opacity duration-200 hover:opacity-90`}
            />
          ))}
        </div>

        {/* controls row */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div
              role="group"
              aria-label="Billing interval"
              className="inline-flex rounded-full bg-mist p-[3px]"
            >
              <ToggleBtn
                active={interval === "monthly"}
                onClick={() => setInterval("monthly")}
              >
                Pay monthly
              </ToggleBtn>
              <ToggleBtn
                active={interval === "yearly"}
                onClick={() => setInterval("yearly")}
              >
                Pay yearly
              </ToggleBtn>
            </div>
            <button
              type="button"
              onClick={() => setInterval("yearly")}
              className="text-[14px] font-medium text-[#2383e2] hover:underline"
            >
              Save up to 20% with yearly
            </button>
          </div>

          <span className="text-[13px] text-ink">
            Priced in {currency}
          </span>
        </div>

        {/* cards — identical section structure so CTAs / rules / lists align */}
        <div className="relative mt-5">
          <div className="grid items-stretch gap-5 lg:grid-cols-2">
            {/* Early Adopter */}
            <article className="relative flex h-full flex-col overflow-visible rounded-2xl border border-hairline bg-surface p-7 sm:p-9">
              <div
                className="pointer-events-none absolute -right-4 top-5 z-20 h-[175px] w-[220px] sm:-right-5 sm:top-6 sm:h-[195px] sm:w-[250px]"
                aria-hidden="true"
              >
                <Image
                  src="/doodles/pricing-gateway.png"
                  alt=""
                  width={512}
                  height={512}
                  unoptimized
                  className="absolute left-5 top-5 z-[5] w-[78px] rotate-[2deg] sm:left-7 sm:w-[90px]"
                />
                <Image
                  src="/doodles/pricing-event.png"
                  alt=""
                  width={512}
                  height={512}
                  unoptimized
                  className="absolute right-10 top-0 z-20 w-[84px] -rotate-[83deg] sm:right-12 sm:w-[98px]"
                />
                <Image
                  src="/doodles/pricing-chevron.png"
                  alt=""
                  width={1032}
                  height={738}
                  unoptimized
                  className="absolute left-[58%] top-[4.75rem] z-10 w-[109px] -translate-x-1/2 rotate-[6deg] sm:top-[5.25rem] sm:w-[126px]"
                />
              </div>

              <h2 className="min-h-[calc(1.15em*2)] pr-[9.5rem] text-[28px] font-bold leading-[1.15] tracking-[-0.02em] text-ink sm:pr-[11rem] sm:text-[32px]">
                <span className="block whitespace-nowrap">Essentials for</span>
                <span className="block whitespace-nowrap">
                  organizing process.
                </span>
              </h2>

              <div className="mt-9 flex min-h-[34px] items-center gap-2.5">
                <span className="text-[17px] font-bold text-ink">
                  Early adopter
                </span>
                <span className="rounded-full bg-[#aef029] px-3.5 py-1 text-[13px] font-bold tracking-[-0.01em] text-ink">
                  Founding price
                </span>
              </div>

              <div className="mt-1.5 min-h-[72px]">
                <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                  <span className="text-[34px] font-bold tracking-tight text-ink">
                    {symbol}
                    {formatPrice(early)}
                  </span>
                  <span className="text-[15px] text-ink line-through">
                    {symbol}
                    {formatPrice(plan.regularMonthly)}
                  </span>
                  <span className="text-[14px] text-ink">per month</span>
                </p>
                <p className="mt-1 text-[13px] text-ink">
                  {interval === "yearly"
                    ? `Billed yearly (${symbol}${formatPrice(annual)}).`
                    : "Billed monthly."}{" "}
                  Cancel anytime.
                </p>
              </div>

              <p className="mt-3 min-h-[22px] text-[14.5px] text-ink lg:whitespace-nowrap">
                For analysts mapping, documenting and sharing their processes.
              </p>

              <div className="mt-6 min-h-[72px]">
                <AuthCta
                  next={`/start-trial?plan=${interval}`}
                  className="inline-block rounded-lg bg-cobalt px-6 py-2.5 text-[14.5px] font-semibold text-white shadow-soft transition-colors hover:bg-cobalt-deep"
                >
                  Start 7-day free trial
                </AuthCta>
                <p className="mt-2.5 text-[12.5px] text-ink">
                  Card required. You won&apos;t be charged during the trial.
                </p>
              </div>

              <div className="mt-8 flex flex-1 flex-col border-t border-hairline pt-6">
                <p className="text-[14px] font-semibold text-ink">Includes:</p>
                <ul className="mt-3.5 space-y-2.5">
                  {EARLY_ADOPTER_FEATURES.map((f) => (
                    <CheckItem key={f}>{f}</CheckItem>
                  ))}
                </ul>
              </div>
            </article>

            {/* Enterprise */}
            <article className="relative flex h-full flex-col rounded-2xl bg-[#f2f9ff] p-7 sm:p-9">
              <h2 className="min-h-[calc(1.15em*2)] text-[28px] font-bold leading-[1.15] tracking-[-0.02em] text-ink sm:text-[32px]">
                <span className="block whitespace-nowrap">Run your whole</span>
                <span className="block whitespace-nowrap">organization.</span>
              </h2>

              <div className="mt-9 flex min-h-[34px] items-center gap-2.5">
                <span className="text-[17px] font-bold text-ink">
                  Enterprise
                </span>
                <span className="rounded-full bg-surface px-3.5 py-1 text-[13px] font-bold tracking-[-0.01em] text-cobalt shadow-soft">
                  Coming soon
                </span>
              </div>

              <div className="mt-1.5 min-h-[72px]">
                <p className="text-[34px] font-bold tracking-tight text-ink">
                  Pricing TBA
                </p>
                <p className="mt-1 text-[13px] text-ink">Announced at launch.</p>
              </div>

              <p className="mt-3 min-h-[22px] text-[14.5px] text-ink lg:whitespace-nowrap">
                For teams managing people and projects across the whole
                organization.
              </p>

              <div className="mt-6 min-h-[72px]">
                <button
                  type="button"
                  disabled
                  className="inline-block cursor-not-allowed rounded-lg border border-hairline bg-surface px-6 py-2.5 text-[14.5px] font-semibold text-ink"
                >
                  Coming soon
                </button>
                <p className="mt-2.5 text-[12.5px] text-ink">
                  Upgrade from Early Adopter anytime to add your team.
                </p>
              </div>

              <div className="mt-8 flex flex-1 flex-col border-t border-cobalt-tint pt-6">
                <p className="text-[14px] font-semibold text-ink">
                  Everything in Early Adopter, and:
                </p>
                <ul className="mt-3.5 space-y-2.5">
                  {ENTERPRISE_FEATURES.map((f) => (
                    <CheckItem key={f}>{f}</CheckItem>
                  ))}
                </ul>
                <p className="mt-auto pt-7 text-[12px] leading-relaxed text-ink">
                  Enterprise features are in active development and may change
                  before launch.
                </p>
              </div>
            </article>
          </div>
        </div>

        <p className="mt-10 text-center text-[13px] text-ink">
          After your 7-day free trial you&apos;ll be billed automatically.
          Cancel anytime.
        </p>
      </div>
    </section>
  );
}

function ToggleBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-4 py-1.5 text-[14px] font-semibold transition-all ${
        active
          ? "border border-hairline bg-surface text-ink shadow-[0_1px_3px_rgba(29,28,26,0.08)]"
          : "border border-transparent text-ink hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
