import Link from "next/link";
import type { AccessState } from "@/lib/access";

export function TrialBanner({ access }: { access: AccessState }) {
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

  return (
    <div className="flex items-center justify-center gap-3 border-b border-hairline bg-gold-tint px-4 py-2 text-[13px] font-medium text-ink">
      {access.trialDaysLeft} day{access.trialDaysLeft === 1 ? "" : "s"} left in
      your free trial.
      <Link
        href="/settings"
        className="font-semibold text-cobalt hover:underline"
      >
        Subscribe now
      </Link>
    </div>
  );
}
