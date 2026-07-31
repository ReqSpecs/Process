import type { Metadata } from "next";
import { SUPPORT_EMAIL } from "@/lib/support";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl px-5 py-16 sm:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-ink">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-ink-faint">Last updated: August 2026</p>

      <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-ink-soft">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink">Who we are</h2>
          <p>
            ProDraw is a web-based process repository. This policy covers the
            ProDraw website and app. For anything to do with your data, email us
            at{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="font-medium text-cobalt underline underline-offset-2"
            >
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink">What we collect</h2>
          <p>
            Your name and email address, the content you create (projects,
            processes, diagrams, documentation), and anything you write in the
            feedback form. If you subscribe, we store the Stripe customer and
            subscription identifiers needed to manage your plan — card details
            go directly to Stripe and never reach our servers.
          </p>
          <p className="mt-3">
            We also see the technical data any website receives, such as your IP
            address, which Cloudflare processes to serve the site and block
            abuse. Your country is inferred from it to decide which currency to
            display; we don&apos;t store that country against your account.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink">How we use it</h2>
          <p>
            To operate the service: signing you in, storing your work, sending
            the emails the service depends on (sign-in codes, billing notices),
            processing subscriptions, and answering the feedback you send us. We
            do not sell your data, and we do not use it for advertising or to
            train machine-learning models.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink">
            Who else handles it
          </h2>
          <p>
            We use a small number of providers, each doing one job:{" "}
            <strong className="font-medium text-ink">Supabase</strong> stores
            your account and content in Postgres, with row-level security so
            only your account can read it;{" "}
            <strong className="font-medium text-ink">Cloudflare</strong> serves
            and protects the site;{" "}
            <strong className="font-medium text-ink">Stripe</strong> processes
            payments; and{" "}
            <strong className="font-medium text-ink">Resend</strong> delivers
            our email. They may process your data outside Australia. We share
            your data with no one else.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink">Cookies</h2>
          <p>
            Essential cookies only — the session cookies that keep you logged
            in. No analytics, tracking, or advertising cookies, and no
            third-party trackers on the site.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink">
            How long we keep it
          </h2>
          <p>
            Your content stays until you delete it or close your account.
            Deleting your account removes your workspace, your content, and your
            feedback records. Two things reasonably survive: emails you&apos;ve
            already sent us stay in our inbox, and Stripe keeps its own record
            of payments, which tax law requires it to.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink">Your rights</h2>
          <p>
            You can export any project or process as a PDF at any time, and you
            can delete your account yourself from Settings, which cancels any
            subscription and erases your data. You can also ask us for a copy of
            your data, ask us to correct it, or complain about how we&apos;ve
            handled it — email{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="font-medium text-cobalt underline underline-offset-2"
            >
              {SUPPORT_EMAIL}
            </a>{" "}
            and we&apos;ll respond within 30 days. If you&apos;re in Australia
            and we can&apos;t resolve it, you can escalate to the Office of the
            Australian Information Commissioner.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink">
            Changes to this policy
          </h2>
          <p>
            If we change how we handle your data, we&apos;ll update this page
            and the date at the top, and tell you by email when the change is
            significant.
          </p>
        </section>
      </div>
    </article>
  );
}
