import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl px-5 py-16 sm:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-ink">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-ink-faint">Last updated: July 2026</p>

      <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-ink-soft">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink">What we collect</h2>
          <p>
            Your email address and the content you create (projects, processes,
            diagrams, documentation). For billing we collect your country to
            show local pricing; payment details are handled entirely by Stripe
            and never touch our servers.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink">How we use it</h2>
          <p>
            To operate the service: authentication, storing your work,
            processing subscriptions, and responding to feedback you send us.
            We do not sell your data or use it for advertising.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink">Where it lives</h2>
          <p>
            Content is stored in Supabase (Postgres) with row-level security so
            only your account can read your data. The app is served via
            Cloudflare. Payments are processed by Stripe.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink">Cookies</h2>
          <p>
            We use essential cookies only — session cookies that keep you
            logged in. No tracking or advertising cookies.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-ink">Your rights</h2>
          <p>
            You can export your work as PDF at any time. To delete your account
            and all associated data, contact us via the in-app feedback form
            and we&apos;ll action it promptly.
          </p>
        </section>
      </div>
    </article>
  );
}
