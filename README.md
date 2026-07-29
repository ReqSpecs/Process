# ProDraw

The modern home for your business processes. A lightweight process repository
for Business Analysts and Process Analysts — chevron process architecture,
BPMN 2.0 canvas, documentation, autosave, and PDF export in one calm workspace.

## Stack

- **Next.js 16** (App Router, TypeScript) + **Tailwind CSS v4**
- **Supabase** — Postgres, Auth, Row Level Security
- **bpmn-js** — BPMN 2.0 modelling canvas (themed to match the app)
- **Stripe** — subscriptions with multi-currency pricing (AUD/USD/GBP), monthly or yearly
- **jsPDF + svg2pdf** — client-side PDF export
- **Cloudflare Workers** via `@opennextjs/cloudflare`

## Local development

```bash
npm install
cp .env.example .env.local   # fill in real values
npm run dev
```

The app boots against placeholder env values, but auth/data need a real
Supabase project.

## Setup checklist

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run the migrations in `supabase/migrations/` (SQL editor, in order):
   - `0001_initial_schema.sql` — tables, RLS, signup trigger
   - `0002_blocked_domains_seed.sql` — disposable email blocklist
   - `0003`–`0004` — workspace settings + process/project refinements
   - `0005_project_appearance.sql` — `projects.status/icon/color`
   - `0006_workspace_members.sql` — membership table + membership-aware RLS
   - `0007_card_required_trial.sql` — trial only starts after Stripe checkout
   - `0008`–`0009` — `email_account_state()` lookup behind the sign-in form
   - `0010_billing_alert.sql` — surfaces failed/stalled charges in the app
3. In **Auth → URL Configuration**: set the Site URL and add
   `<your-site>/auth/callback` to the redirect allowlist.
4. In **Auth → Providers → Email**: enable the provider and magic-link sign-in.
   Configure custom SMTP before real traffic.
5. In **Auth → Email Templates**, add `{{ .Token }}` to both **Confirm signup**
   and **Magic Link**. Supabase sends the first template to new addresses and
   the second to returning ones, and neither includes the 6-digit code by
   default — without this the form asks for a code the email never shows:

   ```html
   <h2>Your {{ .SiteURL }} sign-in code</h2>
   <p style="font-size:28px;letter-spacing:0.15em"><strong>{{ .Token }}</strong></p>
   <p>Enter this code in the tab you started in. It expires in 60 minutes.</p>
   <p>Or <a href="{{ .ConfirmationURL }}">sign in with a magic link</a>.</p>
   ```
6. Copy the project URL, **publishable key** and **secret key** into
   `.env.local` (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`).
7. Set `NEXT_PUBLIC_DEMO_MODE=false` so the app talks to Supabase, not the
   in-memory demo store.

### 2. Stripe

1. Create one product ("ProDraw Early Adopter") with **six** recurring prices
   (3 currencies × monthly/yearly):
   - Monthly: A$15 AUD, US$10 USD, £8 GBP
   - Yearly (20% off): A$144/yr, US$96/yr, £76.80/yr
2. Put the six price IDs in `.env.local` as
   `STRIPE_PRICE_{AUD,USD,GBP}_{MONTHLY,YEARLY}`.
3. Add a webhook endpoint pointing at `/api/stripe/webhook` with these events,
   then copy the signing secret to `STRIPE_WEBHOOK_SECRET`:
   - `checkout.session.completed` — records the subscription and trial end
   - `customer.subscription.updated` / `.deleted` — status transitions
   - `customer.subscription.trial_will_end` — 3-day warning before the card is
     charged
   - `invoice.payment_failed` — declined card
   - `invoice.payment_action_required` — 3DS/SCA challenge
   - `invoice.paid` — clears any outstanding billing warning

   The last four drive `workspaces.billing_alert`, which the in-app banner
   reads. Anything not in the route's `switch` is acknowledged and ignored.
4. Enable the customer portal (Settings → Billing → Customer portal) so users
   can cancel anytime.

Checkout requires a card and starts a **7-day free trial**
(`trial_period_days: 7`, `payment_method_collection: "always"`). Stripe
auto-bills when the trial ends; the webhook records `trialing` +
`trial_ends_at`, then syncs to `active` / `past_due` / `canceled`.

The public `/pricing` page shows Early Adopter (purchasable) beside an
Enterprise "Coming soon" card. Display-only regular anchors
(A$39 / US$29 / £19) highlight the founding discount.

### 3. Deploy (Cloudflare)

```bash
npm install -D @opennextjs/cloudflare wrangler
npm run deploy
```

Set the env vars as Worker secrets (`wrangler secret put NAME`). Cloudflare
automatically provides the `cf-ipcountry` header used for currency detection.

## How access works

- One email field starts both flows. `email_account_state()` decides what comes
  next: an address with a password gets a password field, a known passwordless
  address gets an emailed code, and an unknown address gets a code only when it
  came from the signup form — logging in with an unknown address says so rather
  than quietly creating an account.
- The emailed **6-digit code** is the primary path, entered in the tab the user
  started in. The same email also carries a magic link, which lands on
  `/auth/callback` for anyone who prefers clicking.
- `/welcome` collects a display name and, for code-only accounts, an optional
  password so the next sign-in skips the inbox entirely.
- Signup auto-creates an **incomplete** workspace (no trial yet). The user is
  sent to `/start-trial` to begin a **card-backed 7-day free trial** via Stripe
  Checkout. Editing is unlocked once Stripe reports `trialing`.
- Signup validates the email domain: disposable domains are blocked and the
  domain must have MX records.
- Stripe auto-bills after 7 days; users can **cancel anytime** from the
  customer portal. A canceled/expired workspace becomes **read-only** (work is
  kept; editing is paused) until the user resubscribes.
- Currency is locked to the workspace at first checkout.

## Project structure

```
app/
  (marketing)/       landing, terms, privacy
  (auth)/            login, signup (emailed code), password reset
  auth/callback/     magic-link code exchange + routing
  welcome/           name + optional password for new accounts
  start-trial/       card-backed trial start (new workspaces)
  (app)/             dashboard, projects, processes, settings
  api/               autosave PATCH, Stripe webhook
components/
  marketing/         hero, live product mock, showcase, pricing
  app/               sidebar, project view, BPMN editor, doc panel
lib/
  supabase/          server/client/middleware wiring
  export/            PDF export (single process + whole project)
supabase/migrations/ SQL schema + seeds
```
