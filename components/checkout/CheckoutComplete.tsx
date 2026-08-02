"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { subscriptionReady } from "@/app/checkout/complete/actions";
import { fireStartTrialOnce } from "@/components/analytics/startTrialEvent";

/** Slow enough not to hammer the database, quick enough not to feel stuck. */
const POLL_MS = 800;

/**
 * A webhook can fail outright — a bad signing secret, an outage. Waiting
 * forever would strand someone who has just paid on a spinner, so hand them to
 * the app instead and let its own guards explain the state.
 */
const GIVE_UP_MS = 20_000;

export function CheckoutComplete({
  isTrial,
  value,
  currency,
}: {
  isTrial: boolean;
  value?: number;
  currency?: string;
}) {
  const router = useRouter();

  // Reported straight away rather than after the wait below: the conversion
  // already happened, and Stripe's webhook has no bearing on whether it did.
  useEffect(() => {
    if (!isTrial) return;
    return fireStartTrialOnce({ value, currency });
  }, [isTrial, value, currency]);

  useEffect(() => {
    let stopped = false;
    let waited = 0;

    const enterApp = () => {
      stopped = true;
      router.replace("/process-library");
    };

    const poll = async () => {
      if (stopped) return;
      if (await subscriptionReady()) return enterApp();

      waited += POLL_MS;
      if (waited >= GIVE_UP_MS) return enterApp();
      timer = setTimeout(poll, POLL_MS);
    };

    let timer = setTimeout(poll, 0);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-surface px-6 text-center">
      <span
        aria-hidden="true"
        className="h-7 w-7 animate-spin rounded-full border-2 border-hairline border-t-cobalt"
      />
      <div>
        <h1 className="text-[18px] font-semibold text-ink">
          {isTrial ? "Your trial is starting" : "Your subscription is starting"}
        </h1>
        <p className="mt-1.5 text-[14px] text-ink-soft">
          Setting up your workspace — this takes a moment.
        </p>
      </div>
    </div>
  );
}
