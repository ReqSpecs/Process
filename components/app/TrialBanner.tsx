import Link from "next/link";
import type { AccessState } from "@/lib/access";

/**
 * Only states the user has to act on. A running trial isn't one of them: the
 * card is already on file, the charge is expected, and a permanent countdown
 * reads as a nag to cancel. The pre-charge notice the card networks require is
 * an email, sent from the trial_will_end webhook three days out.
 */
export function TrialBanner({ access }: { access: AccessState }) {
  // Nothing to warn a granted account about — no card, no charge coming.
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

  // Editing has stopped. This one has to stay: without it the app looks broken
  // rather than locked.
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

  return null;
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
