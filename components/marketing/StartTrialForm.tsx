"use client";

import { useState } from "react";
import { startCheckout } from "@/app/(app)/settings/actions";
import { CheckItem } from "@/components/CheckItem";
import {
  CURRENCY_SYMBOLS,
  EARLY_ADOPTER_FEATURES,
  ENTERPRISE_FEATURES,
  TRIAL_DAYS,
  type BillingInterval,
  type Currency,
  type PlanPrice,
} from "@/lib/constants";
import { formatPrice, planPrice } from "@/lib/pricing";

export function StartTrialForm({
  currency,
  plan,
  planName,
  initialInterval = "monthly",
}: {
  currency: Currency;
  plan: PlanPrice;
  planName: string;
  initialInterval?: BillingInterval;
}) {
  const [interval, setInterval] = useState<BillingInterval>(initialInterval);
  const symbol = CURRENCY_SYMBOLS[currency];
  const early = planPrice(plan, interval);
  const annual = plan.yearlyTotal;
  const regular = plan.regularMonthly;

  return (
    <section className="mt-7" aria-label="Compare plans">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-[20px] font-bold tracking-[-0.015em] text-ink">
          Compare plans
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          <div
            role="group"
            aria-label="Billing interval"
            className="inline-flex rounded-full bg-mist p-[3px]"
          >
            <IntervalBtn
              active={interval === "monthly"}
              onClick={() => setInterval("monthly")}
            >
              Pay monthly
            </IntervalBtn>
            <IntervalBtn
              active={interval === "yearly"}
              onClick={() => setInterval("yearly")}
            >
              Pay yearly
            </IntervalBtn>
          </div>
          <span className="text-[13px] text-ink-soft">
            Priced in {currency}
          </span>
        </div>
      </div>

      {/* Both columns share the same block structure and min-heights so the
          prices, buttons and feature lists line up across them. */}
      <div className="mt-5 grid items-stretch gap-5 lg:grid-cols-2">
        <article className="relative flex h-full flex-col rounded-2xl border border-hairline bg-surface p-7 sm:p-8">
          <div className="flex min-h-[34px] flex-wrap items-center gap-2.5">
            <h3 className="text-[17px] font-bold text-ink">{planName}</h3>
            <span className="rounded-full bg-[#aef029] px-3.5 py-1 text-[13px] font-bold tracking-[-0.01em] text-ink">
              Founding price
            </span>
          </div>

          <div className="mt-3 min-h-[76px]">
            <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <span className="text-[36px] font-bold leading-none tracking-[-0.02em] text-ink">
                {symbol}
                {formatPrice(early)}
              </span>
              <span className="text-[15px] text-ink-faint line-through">
                {symbol}
                {formatPrice(regular)}
              </span>
              <span className="text-[14px] text-ink-soft">per month</span>
            </p>
            <p className="mt-2 text-[13px] text-ink-soft">
              {interval === "yearly"
                ? `Billed yearly (${symbol}${formatPrice(annual)}). `
                : "Billed monthly. "}
              Locked in for as long as your plan stays active.
            </p>
          </div>

          <p className="mt-3 min-h-[44px] text-[14.5px] leading-relaxed text-ink-soft">
            For analysts mapping, documenting and sharing their processes.
          </p>

          <div className="mt-6 min-h-[92px]">
            <form action={startCheckout}>
              <input type="hidden" name="interval" value={interval} />
              <button
                type="submit"
                className="h-11 w-full rounded-lg bg-cobalt text-[15px] font-semibold text-white transition-[background-color,transform] duration-200 hover:bg-cobalt-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt active:translate-y-px"
              >
                Start {TRIAL_DAYS}-day free trial
              </button>
            </form>
            <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink-faint">
              Card required, nothing charged today. Cancel before day{" "}
              {TRIAL_DAYS + 1} and you pay nothing. Secure checkout by Stripe.
            </p>
          </div>

          <div className="mt-7 flex flex-1 flex-col border-t border-hairline pt-6">
            <p className="text-[14px] font-semibold text-ink">Includes:</p>
            <ul className="mt-3.5 space-y-2.5">
              {EARLY_ADOPTER_FEATURES.map((f) => (
                <CheckItem key={f}>{f}</CheckItem>
              ))}
            </ul>
          </div>
        </article>

        <article className="relative flex h-full flex-col rounded-2xl bg-cobalt-wash p-7 sm:p-8">
          <div className="flex min-h-[34px] flex-wrap items-center gap-2.5">
            <h3 className="text-[17px] font-bold text-ink">Enterprise</h3>
            <span className="rounded-full bg-surface px-3.5 py-1 text-[13px] font-bold tracking-[-0.01em] text-cobalt">
              Coming soon
            </span>
          </div>

          <div className="mt-3 min-h-[76px]">
            <p className="text-[36px] font-bold leading-none tracking-[-0.02em] text-ink">
              Pricing TBA
            </p>
            <p className="mt-2 text-[13px] text-ink-soft">
              Announced at launch. Nothing to decide today.
            </p>
          </div>

          <p className="mt-3 min-h-[44px] text-[14.5px] leading-relaxed text-ink-soft">
            For teams managing people and projects across a whole organization.
          </p>

          <div className="mt-6 min-h-[92px]">
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="h-11 w-full cursor-not-allowed rounded-lg border border-cobalt-tint bg-surface/70 text-[15px] font-semibold text-ink-faint"
            >
              Not yet available
            </button>
            <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink-faint">
              Start on {planName} and move your workspace across when Enterprise
              opens up.
            </p>
          </div>

          <div className="mt-7 flex flex-1 flex-col border-t border-cobalt-tint pt-6">
            <p className="text-[14px] font-semibold text-ink">
              Everything in {planName}, and:
            </p>
            <ul className="mt-3.5 space-y-2.5">
              {ENTERPRISE_FEATURES.map((f) => (
                <CheckItem key={f}>{f}</CheckItem>
              ))}
            </ul>
            <p className="mt-auto pt-7 text-[12px] leading-relaxed text-ink-faint">
              Enterprise features are in active development and may change
              before launch.
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}

function IntervalBtn({
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
      className={`rounded-full px-4 py-1.5 text-[14px] font-semibold transition-all duration-200 ${
        active
          ? "border border-hairline bg-surface text-ink shadow-[0_1px_3px_rgb(29_28_26_/_0.08)]"
          : "border border-transparent text-ink-soft hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
