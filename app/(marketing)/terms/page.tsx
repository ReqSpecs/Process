import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-2xl px-5 py-16 sm:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-ink">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-ink-faint">Last updated: July 2026</p>

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
          <h2 className="mb-2 text-lg font-semibold text-ink">3. Free trial and billing</h2>
          <p>
            New workspaces receive a 7-day free trial. After the trial, a paid
            subscription is required to continue creating and editing
            processes. Subscriptions are billed monthly via Stripe and can be
            cancelled at any time; access continues to the end of the billing
            period. One free trial per person.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink">4. Your content</h2>
          <p>
            You own the processes, diagrams, and documentation you create. We
            claim no rights to your content beyond what is needed to operate
            the service (storage, backups, rendering exports).
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink">5. Acceptable use</h2>
          <p>
            Don&apos;t abuse the service: no unlawful content, no attempts to
            breach security or access other users&apos; data, and no automated
            scraping of the platform.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink">6. Availability and changes</h2>
          <p>
            ProDraw is an actively developed product. Features may change. We
            aim for high availability but do not guarantee uninterrupted
            service. We will give reasonable notice of material changes to
            these terms.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink">7. Liability</h2>
          <p>
            The service is provided &ldquo;as is&rdquo;. To the maximum extent
            permitted by law, our total liability is limited to the amount you
            paid us in the 12 months before the claim.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink">8. Contact</h2>
          <p>
            Questions about these terms? Use the feedback form in the app and
            we&apos;ll get back to you.
          </p>
        </section>
      </div>
    </article>
  );
}
