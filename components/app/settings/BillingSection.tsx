"use client";

import { useState } from "react";
import { SealCheck } from "@phosphor-icons/react";
import {
  cancelSubscription,
  openBillingPortal,
  startCheckout,
} from "@/app/(app)/settings/actions";
import type { AccessState } from "@/lib/access";
import {
  type BillingInterval,
  type Currency,
  type PlanPrice,
} from "@/lib/constants";
import { formatPrice, planPrice } from "@/lib/pricing";
import { Card, GhostButton, PrimaryButton } from "./ui";

export function BillingSection({
  access,
  symbol,
  currency,
  plan,
  planName,
  hasSubscription,
}: {
  access: AccessState;
  symbol: string;
  currency: Currency;
  plan: PlanPrice;
  planName: string;
  hasSubscription: boolean;
}) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [interval, setInterval] = useState<BillingInterval>("monthly");

  const early = planPrice(plan, interval);
  const annual = plan.yearlyTotal;

  // A trialing workspace already has a Stripe subscription (card captured), so
  // it uses the same manage/cancel controls as a paid one.
  const managed = access.isSubscribed || (access.isTrialing && hasSubscription);

  return (
    <div className="space-y-5">
      <Card
        title="Plan"
        desc={
          access.isFreePlan ? "Your ProDraw access." : "Your ProDraw subscription."
        }
      >
        <div className="py-4">
          {access.isFreePlan ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-[18px] font-bold text-ink">Free</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-gold-tint px-2.5 py-0.5 text-[11px] font-semibold text-gold">
                  <SealCheck size={13} weight="fill" /> Complimentary
                </span>
              </div>
              <p className="mt-1 text-[14px] text-ink-soft">
                Full access, on us — no card, and nothing to pay. There&apos;s
                nothing to manage here.
              </p>
            </>
          ) : managed ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-[18px] font-bold text-ink">{planName}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-gold-tint px-2.5 py-0.5 text-[11px] font-semibold text-gold">
                  <SealCheck size={13} weight="fill" /> Founding price
                </span>
              </div>
              {access.isTrialing ? (
                <p className="mt-1 text-[14px] text-ink-soft">
                  <span className="font-semibold text-ink">
                    {access.trialDaysLeft} day{access.trialDaysLeft === 1 ? "" : "s"}
                  </span>{" "}
                  left in your free trial — then {symbol}
                  {formatPrice(plan.monthly)} {currency}/month. Cancel anytime
                  before it ends and you won&apos;t be charged.
                </p>
              ) : (
                <p className="mt-1 text-[14px] text-ink-soft">
                  Founding price, locked in while you stay subscribed. Manage
                  billing to switch monthly/yearly or update your card.
                </p>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <form action={openBillingPortal}>
                  <GhostButton type="submit">Manage subscription</GhostButton>
                </form>
                {hasSubscription &&
                  (confirmCancel ? (
                    <form action={cancelSubscription} className="flex items-center gap-2">
                      <span className="text-[12.5px] text-ink-soft">Cancel at period end?</span>
                      <button
                        type="submit"
                        className="rounded-full bg-signal px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:brightness-95"
                      >
                        Yes, cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmCancel(false)}
                        className="rounded-full px-3 py-2 text-[13px] font-medium text-ink-soft hover:bg-mist"
                      >
                        Keep
                      </button>
                    </form>
                  ) : (
                    <button
                      onClick={() => setConfirmCancel(true)}
                      className="rounded-full px-4 py-2 text-[13px] font-semibold text-signal transition-colors hover:bg-ember-tint"
                    >
                      Cancel subscription
                    </button>
                  ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-[14px] text-ink-soft">
                {hasSubscription
                  ? "Your subscription has ended. "
                  : "Start your 7-day free trial — a card is required and you'll only be charged after the trial. "}
                Founding price, locked in while you stay subscribed. Cancel
                anytime.
              </p>

              <div
                role="group"
                aria-label="Billing interval"
                className="mt-4 inline-flex rounded-full bg-mist p-1"
              >
                <button
                  type="button"
                  onClick={() => setInterval("monthly")}
                  aria-pressed={interval === "monthly"}
                  className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                    interval === "monthly"
                      ? "bg-surface text-ink shadow-soft"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  Monthly · {symbol}
                  {formatPrice(plan.monthly)}
                </button>
                <button
                  type="button"
                  onClick={() => setInterval("yearly")}
                  aria-pressed={interval === "yearly"}
                  className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                    interval === "yearly"
                      ? "bg-surface text-ink shadow-soft"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  Yearly · {symbol}
                  {formatPrice(plan.yearlyMonthly)}/mo
                </button>
              </div>
              {interval === "yearly" && (
                <p className="mt-2 text-[12.5px] text-ink-faint">
                  Billed {symbol}
                  {formatPrice(annual)}/yr — save 20%.
                </p>
              )}

              <form action={startCheckout} className="mt-5">
                <input type="hidden" name="interval" value={interval} />
                <PrimaryButton type="submit">
                  {hasSubscription
                    ? `Subscribe — ${symbol}${formatPrice(early)}/month`
                    : "Start 7-day free trial"}
                </PrimaryButton>
              </form>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
