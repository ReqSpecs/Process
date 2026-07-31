import type { Metadata } from "next";
import { SUPPORT_EMAIL } from "@/lib/support";
import { TRIAL_DAYS } from "@/lib/constants";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-2xl px-5 py-16 sm:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-ink">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-ink-faint">Last updated: August 2026</p>

      <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-ink-soft">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink">1. The service</h2>
          <p>
            ProDraw provides a web-based process repository for mapping,
            documenting, and exporting business processes. By creating an
            account you agree to these terms.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink">2. Accounts</h2>
          <p>
            You are responsible for your account credentials and for all
            activity under your account. You must provide a valid email address
            that can receive mail. Accounts created to circumvent trial limits
            may be suspended.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink">
            3. Free trial
          </h2>
          <p>
            New workspaces get a {TRIAL_DAYS}-day free trial, one per person.
            Starting it requires a valid card, which is held by Stripe and not
            charged during the trial.
          </p>
          <p className="mt-3">
            <strong className="font-medium text-ink">
              When the {TRIAL_DAYS} days are up, the subscription begins
              automatically and your card is charged
            </strong>{" "}
            at the price shown when you signed up. To avoid that charge, cancel
            before the trial ends — you can do it yourself in Settings. We show
            a reminder in the app three days before it happens.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink">
            4. Subscriptions and payment
          </h2>
          <p>
            Subscriptions are billed in advance, monthly or annually depending
            on the plan you choose, and renew automatically until cancelled.
            Prices are shown in Australian dollars, US dollars, or pounds
            sterling based on where you are, and are charged in that currency by
            Stripe. If we change the price of a plan, we&apos;ll tell you before
            it applies to you.
          </p>
          <p className="mt-3">
            Cancel whenever you like, from Settings. Your subscription stays
            active until the end of the period you&apos;ve already paid for,
            then stops. After it ends you keep read access to your work and can
            still export it, but creating and editing require an active
            subscription.
          </p>
          <p className="mt-3">
            If a payment fails we&apos;ll let you know and retry. Access may be
            suspended if it stays unpaid.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink">5. Refunds</h2>
          <p>
            If you&apos;re charged and you&apos;re not happy, email{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="font-medium text-cobalt underline underline-offset-2"
            >
              {SUPPORT_EMAIL}
            </a>{" "}
            within 14 days of the charge and we&apos;ll refund it in full, no
            questions asked. This is on top of any refund you&apos;re entitled
            to by law.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink">6. Your content</h2>
          <p>
            You own the processes, diagrams, and documentation you create. We
            claim no rights to your content beyond what is needed to operate the
            service (storage, backups, rendering exports). You can export it as
            PDF at any time, and deleting your account erases it.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink">
            7. Acceptable use
          </h2>
          <p>
            Don&apos;t abuse the service: no unlawful content, no attempts to
            breach security or access other users&apos; data, and no automated
            scraping of the platform.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink">
            8. Availability and changes
          </h2>
          <p>
            ProDraw is an actively developed product. Features may change. We
            aim for high availability but do not guarantee uninterrupted
            service. We will give reasonable notice of material changes to these
            terms, and if you don&apos;t accept them you can cancel.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink">9. Liability</h2>
          <p>
            Nothing in these terms excludes, restricts, or modifies any
            guarantee, right, or remedy you have under the Australian Consumer
            Law or any other law that cannot be excluded. Subject to that, the
            service is provided &ldquo;as is&rdquo;, and to the maximum extent
            permitted by law our total liability is limited to the amount you
            paid us in the 12 months before the claim.
          </p>
          <p className="mt-3">
            Keep your own copies of anything critical. The export tools are
            there for exactly that.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink">
            10. Governing law
          </h2>
          <p>
            These terms are governed by the laws of Australia, and the courts of
            Australia have jurisdiction over any dispute.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink">11. Contact</h2>
          <p>
            Questions about these terms? Email{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="font-medium text-cobalt underline underline-offset-2"
            >
              {SUPPORT_EMAIL}
            </a>{" "}
            or use the feedback form in the app.
          </p>
        </section>
      </div>
    </article>
  );
}
