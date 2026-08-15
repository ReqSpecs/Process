import Image from "next/image";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { CheckItem } from "@/components/CheckItem";
import { AuthCta } from "@/components/marketing/AuthCta";
import { LiveProductMock } from "@/components/marketing/LiveProductMock";
import { OfferMockFrame } from "@/components/marketing/OfferMockFrame";
import { BpmnObjectSuite } from "@/components/marketing/offer/BpmnObjectSuite";
import { ProcessCanvasMock } from "@/components/marketing/offer/ProcessCanvasMock";
import {
  CURRENCY_SYMBOLS,
  TRIAL_DAYS,
  type Currency,
  type PlanPrice,
} from "@/lib/constants";
import { formatPrice } from "@/lib/pricing";

const CTA_CLASS =
  "inline-flex w-full items-center justify-center rounded-lg bg-cobalt px-5 py-3.5 text-[15.5px] font-semibold text-white shadow-[0_10px_24px_-12px_rgba(30,64,175,0.7)] transition-all hover:-translate-y-px hover:bg-cobalt-deep hover:shadow-[0_14px_28px_-12px_rgba(30,64,175,0.8)] active:translate-y-px";

const TRIAL_LINE = `${TRIAL_DAYS} day free trial. Card required, nothing charged today.`;

const VALUE_POINTS = [
  {
    label: "BPMN 2.0",
    body: "Every task, event, gateway and object the spec defines",
  },
  {
    label: "Process library",
    body: "One searchable place for every process, across every project",
  },
  {
    label: "High level",
    body: "Chevron architecture linked to the detail underneath",
  },
  {
    label: "Unlimited",
    body: "Projects and processes, no caps",
  },
  {
    label: "Save and share",
    body: "Autosave so nothing is lost, PDF export when you need to send it",
  },
  {
    label: "Founding price",
    body: "Lock it in now; it stays yours while you stay subscribed",
  },
  {
    label: "AI and automation",
    body: "Gap analysis, draft from a sentence and import. On the roadmap, included.",
  },
] as const;

const TRUST_LOGOS: { src: string; name: string; h: string }[] = [
  { src: "macquarie-k", name: "Macquarie", h: "h-[14px] sm:h-4" },
  { src: "westpac-k", name: "Westpac", h: "h-5 sm:h-[22px]" },
  { src: "qantas-k", name: "Qantas", h: "h-4 sm:h-[18px]" },
  { src: "google-k", name: "Google", h: "h-4 sm:h-[18px]" },
  { src: "atlassian-k", name: "Atlassian", h: "h-[12px] sm:h-3.5" },
];

export function FoundingOfferPage({
  currency,
  plan,
}: {
  currency: Currency;
  plan: PlanPrice;
}) {
  const symbol = CURRENCY_SYMBOLS[currency];

  return (
    <>
      <section className="overflow-x-clip bg-surface px-5 pb-6 pt-5 sm:px-8 sm:pb-8 sm:pt-8">
        <div className="mx-auto max-w-6xl">
          <div className="relative z-20 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-stretch lg:gap-10">
            <div className="relative min-w-0">
              <h1 className="font-[family-name:var(--font-inter)] text-[clamp(27px,4.2vw,42px)] font-bold leading-[1.06] tracking-[-0.025em] text-ink">
                Your process maps
                <br />
                deserve a proper home.
              </h1>
              <p className="mt-2.5 max-w-2xl text-[15.5px] leading-snug text-ink-soft">
                A lightweight BPMN 2.0 process repository for anyone who maps
                work.
              </p>
              <ul className="mt-4 space-y-2">
                {VALUE_POINTS.map((point) => (
                  <CheckItem key={point.label}>
                    <span>
                      <span className="font-semibold">{point.label}</span>
                      <span className="text-ink-soft">: {point.body}</span>
                    </span>
                  </CheckItem>
                ))}
              </ul>

              <Image
                src="/doodles/offer-gateway.png"
                alt=""
                width={512}
                height={512}
                className="pointer-events-none absolute -right-10 top-6 hidden w-[168px] rotate-[16deg] mix-blend-multiply lg:block xl:-right-6 xl:w-[196px]"
                aria-hidden="true"
              />
            </div>

            <div className="relative min-w-0">
              <OfferCard currency={currency} symbol={symbol} plan={plan} />
            </div>
          </div>

          <div className="relative z-10 mt-3">
            <Image
              src="/doodles/offer-start.png"
              alt=""
              width={512}
              height={512}
              className="pointer-events-none absolute right-[4%] -top-8 z-0 hidden w-[168px] -rotate-[10deg] mix-blend-multiply lg:block"
              aria-hidden="true"
            />
            <Image
              src="/doodles/offer-task.png"
              alt=""
              width={512}
              height={512}
              className="pointer-events-none absolute left-[4%] top-[58%] z-0 hidden w-[180px] -rotate-[8deg] mix-blend-multiply lg:block"
              aria-hidden="true"
            />
            <div className="relative z-10">
              <OfferMockFrame width={1120}>
                <ProcessCanvasMock />
              </OfferMockFrame>
            </div>
          </div>

          <TrustLogos />
        </div>
      </section>

      <section className="border-t border-hairline bg-paper px-5 py-10 sm:px-8 sm:py-12">
        <div className="mx-auto max-w-6xl">
          <BpmnObjectSuite />
        </div>
      </section>

      <section className="border-t border-hairline bg-surface px-5 py-10 sm:px-8 sm:py-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-[family-name:var(--font-inter)] text-[clamp(21px,2.6vw,27px)] font-bold leading-[1.15] tracking-[-0.02em] text-ink">
            Architecture on top, detail underneath.
          </h2>
          <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-ink-soft">
            Map the value chain as chevrons, then open any process and work it
            in BPMN 2.0 on the canvas.
          </p>

          <div className="mt-6 flex justify-center">
            <div className="w-full">
              <OfferMockFrame width={1152}>
                <LiveProductMock className="w-full" />
              </OfferMockFrame>
            </div>
          </div>
        </div>
      </section>

      <ImproveLink />

      <section className="border-t border-hairline bg-surface px-5 py-12 sm:px-8 sm:py-14">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-[family-name:var(--font-inter)] text-[clamp(22px,3vw,30px)] font-bold leading-[1.13] tracking-[-0.02em] text-ink">
            Give your process maps a proper home.
          </h2>
          <p className="mt-2.5 text-[14.5px] leading-relaxed text-ink-soft">
            {symbol}
            {formatPrice(plan.monthly)} a month while you stay subscribed,
            normally {symbol}
            {formatPrice(plan.regularMonthly)}.
          </p>
          <div className="mx-auto mt-6 max-w-xs">
            <AuthCta next="/start-trial" className={CTA_CLASS}>
              Start free trial
            </AuthCta>
            <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink-faint">
              {TRIAL_LINE}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function OfferCard({
  currency,
  symbol,
  plan,
}: {
  currency: Currency;
  symbol: string;
  plan: PlanPrice;
}) {
  return (
    <article className="relative flex h-full min-w-0 flex-col overflow-hidden rounded-[22px] border border-hairline bg-surface px-6 pb-7 pt-6 shadow-[0_22px_50px_-28px_rgba(30,64,175,0.45)] sm:px-7 sm:pb-8 sm:pt-7">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-[#aef029]/30 blur-3xl"
      />

      <div className="relative flex items-center justify-between gap-3">
        <h2 className="text-[13px] font-semibold tracking-[0.04em] text-ink-soft">
          Early Adopter
        </h2>
        <span className="rounded-full bg-[#aef029] px-2.5 py-0.5 text-[11px] font-bold tracking-[-0.01em] text-ink">
          Save 65%
        </span>
      </div>

      <p className="relative mt-5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span className="text-[56px] font-bold leading-none tracking-[-0.04em] text-ink tabular-nums">
          {symbol}
          {formatPrice(plan.monthly)}
        </span>
        <span className="text-[15px] text-ink-faint line-through tabular-nums">
          {symbol}
          {formatPrice(plan.regularMonthly)}
        </span>
        <span className="text-[13px] text-ink-faint">/ month</span>
      </p>

      <div className="relative mt-6">
        <AuthCta next="/start-trial" className={CTA_CLASS}>
          Start free trial
        </AuthCta>
      </div>

      <p className="relative mt-auto pt-6 text-center text-[12.5px] leading-snug text-ink-faint">
        {TRIAL_LINE}
        <br />
        Locked in while you stay subscribed. Priced in {currency} at checkout.
      </p>
    </article>
  );
}

function TrustLogos() {
  return (
    <div className="mt-8 flex flex-col items-center gap-3 border-t border-hairline pt-6">
      <p className="text-center text-[12px] text-ink-faint">
        Trusted by analysts at
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 sm:gap-x-10">
        {TRUST_LOGOS.map((brand) => (
          <Image
            key={brand.src}
            src={`/logos/${brand.src}.png`}
            alt={brand.name}
            width={200}
            height={64}
            unoptimized
            className={`${brand.h} w-auto select-none object-contain opacity-[0.72] brightness-0 transition-opacity duration-200 hover:opacity-100`}
          />
        ))}
      </div>
    </div>
  );
}

function ImproveLink() {
  return (
    <section className="border-t border-hairline bg-paper px-5 py-10 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="font-[family-name:var(--font-inter)] text-[clamp(21px,2.6vw,27px)] font-bold leading-[1.15] tracking-[-0.02em] text-ink">
          See what's coming.
        </h2>
        <p className="mt-2.5 text-[14.5px] leading-relaxed text-ink-soft">
          Gap analysis, imports and process health reporting live on the
          homepage, included while you stay subscribed.
        </p>
        <a
          href="/#improve"
          className="mt-5 inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-cobalt transition-colors hover:text-cobalt-deep"
        >
          Improve every handoff
          <ArrowRight size={16} weight="bold" />
        </a>
      </div>
    </section>
  );
}
