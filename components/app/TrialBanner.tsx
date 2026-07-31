import Link from "next/link";
import type { AccessState } from "@/lib/access";

export function TrialBanner({ access }: { access: AccessState }) {
  // Nothing to warn a granted account about, and no trial clock to count down.
  if (access.isFreePlan) return null;

  // A failed or stalled charge outranks everything else: it's the only state
  // the user can still fix before editing stops.
  if (access.billingAlert === "payment_failed") {
    return (
      <AlertBar
        action="Update card"
        message="We couldn't charge your card. Update it to keep editing."
      />
    );
  }

  if (access.billingAlert === "action_required") {
    return (
      <AlertBar
        action="Confirm payment"
        message="Your bank needs you to confirm this payment before it goes through."
      />
    );
  }

  if (access.isSubscribed) return null;

  if (!access.canEdit) {
    return (
      <div className="flex items-center justify-center gap-3 border-b border-hairline bg-ember-tint px-4 py-2.5 text-[13px] font-medium text-ink">
        Your free trial has ended — your work is safe, but editing is paused.
        <Link
          href="/settings"
          className="rounded-full bg-cobalt px-3.5 py-1 text-[12px] font-semibold text-white hover:bg-cobalt-deep"
        >
          Subscribe
        </Link>
      </div>
    );
  }

  const endingSoon = access.billingAlert === "trial_ending";

  return (
    <div className="flex items-center justify-center gap-3 border-b border-hairline bg-gold-tint px-4 py-2 text-[13px] font-medium text-ink">
      {access.trialDaysLeft} day{access.trialDaysLeft === 1 ? "" : "s"} left in
      your free trial
      {endingSoon
        ? " — your card will be charged automatically when it ends."
        : " — cancel anytime before it ends."}
      <Link
        href="/settings?tab=billing"
        className="font-semibold text-cobalt hover:underline"
      >
        Manage billing
      </Link>
    </div>
  );
}

function AlertBar({ message, action }: { message: string; action: string }) {
  return (
    <div className="flex items-center justify-center gap-3 border-b border-hairline bg-ember-tint px-4 py-2.5 text-[13px] font-medium text-ink">
      {message}
      <Link
        href="/settings?tab=billing"
        className="rounded-full bg-cobalt px-3.5 py-1 text-[12px] font-semibold text-white transition-colors hover:bg-cobalt-deep"
      >
        {action}
      </Link>
    </div>
  );
}
