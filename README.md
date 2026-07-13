# ProDraw

The modern home for your business processes. A lightweight process repository
for Business Analysts and Process Analysts — chevron process architecture,
BPMN 2.0 canvas, documentation, autosave, and PDF export in one calm workspace.

## Stack

- **Next.js 16** (App Router, TypeScript) + **Tailwind CSS v4**
- **Supabase** — Postgres, Auth, Row Level Security
- **bpmn-js** — BPMN 2.0 modelling canvas (themed to match the app)
- **Stripe** — subscriptions with multi-currency pricing (AUD/USD/EUR/GBP)
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
3. In **Auth → Providers → Email**: disable "Confirm email" (users can verify
   later; the MX-record gate at signup blocks throwaway addresses).
4. Copy the project URL, anon key, and service-role key into `.env.local`.

### 2. Stripe

1. Create one product ("ProDraw Early Adopter") with four recurring monthly
   prices: A$10 AUD, $10 USD, €10 EUR, £10 GBP.
2. Put the four price IDs in `.env.local` (`STRIPE_PRICE_*`).
3. Add a webhook endpoint pointing at `/api/stripe/webhook` with events:
   `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`. Copy the signing secret to
   `STRIPE_WEBHOOK_SECRET`.
4. Enable the customer portal (Settings → Billing → Customer portal).

### 3. Deploy (Cloudflare)

```bash
npm install -D @opennextjs/cloudflare wrangler
npm run deploy
```

Set the env vars as Worker secrets (`wrangler secret put NAME`). Cloudflare
automatically provides the `cf-ipcountry` header used for currency detection.

## How access works

- Signup auto-creates a workspace with a **7-day trial** (database trigger).
- Signup validates the email domain: disposable domains are blocked and the
  domain must have MX records.
- When the trial ends without a subscription, the app becomes **read-only**
  (work is kept; editing is paused) until the user subscribes.
- Currency is locked to the workspace at first checkout.

## Project structure

```
app/
  (marketing)/       landing, terms, privacy
  (auth)/            login, signup, forgot/reset password
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
