import Image from "next/image";
import Link from "next/link";
import { LiveProductMock } from "@/components/marketing/LiveProductMock";
import { AnimatedProcessLine } from "@/components/marketing/AnimatedProcessLine";

// Mixed order — people and BPMN 2.0 objects interleaved, not grouped.
const AVATARS = [
  "/avatars/avatar-fuchsia.png",
  "/avatars/bpmn-task-violet.png",
  "/avatars/avatar-teal.png",
  "/avatars/bpmn-event-amber.png",
  "/avatars/avatar-rose.png",
  "/avatars/bpmn-gateway-emerald.png",
  "/avatars/avatar-cobalt.png",
];

export function Hero() {
  return (
    <section className="relative overflow-x-clip px-5 pt-14 sm:px-8 sm:pt-18">
      <div className="relative mx-auto max-w-6xl">
        {/* Higgsfield avatar + BPMN badge strip — overlapping circles, rotate on hover */}
        <div className="mb-8 flex justify-center" aria-hidden="true">
          {AVATARS.map((src, i) => (
            <div
              key={src}
              className={`group relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-surface shadow-soft ring-[3px] ring-surface transition-transform duration-300 ease-out hover:z-20 hover:-translate-y-1.5 hover:scale-110 sm:h-[78px] sm:w-[78px] ${
                i === 0 ? "" : "-ml-3.5 sm:-ml-4"
              } ${i % 2 === 0 ? "hover:rotate-[10deg]" : "hover:-rotate-[10deg]"}`}
              style={{ zIndex: AVATARS.length - i }}
            >
              <Image
                src={src}
                alt=""
                fill
                priority={i < 4}
                sizes="78px"
                className="scale-105 object-cover"
              />
            </div>
          ))}
        </div>

        <h1 className="mx-auto max-w-6xl text-center font-[family-name:var(--font-inter)] text-[clamp(38px,7vw,90px)] font-bold leading-[1.04] tracking-[-0.022em] text-ink">
          <span className="block">Your teams modern home</span>
          <AnimatedProcessLine />
        </h1>

        <p className="mx-auto mt-6 max-w-3xl text-center text-lg leading-relaxed text-ink-soft">
          Map your architecture, document BPMN 2.0, and keep every process in
          one calm workspace.
        </p>

        {/* CTA — buttons directly under the subheading; doodles scattered around */}
        <div className="relative mx-auto mt-7 flex max-w-3xl items-center justify-center gap-3">
          <Link
            href="/signup"
            className="rounded-lg bg-cobalt px-6 py-3 text-[15px] font-semibold text-white shadow-soft transition-all hover:-translate-y-px hover:bg-cobalt-deep hover:shadow-float"
          >
            Get ProDraw free
          </Link>
          <a
            href="#product"
            className="rounded-lg bg-cobalt-wash px-6 py-3 text-[15px] font-semibold text-cobalt transition-colors hover:bg-cobalt-tint/70"
          >
            See it in action
          </a>

          {/* squiggle — to the left of the primary button, pointing right at it */}
          <Image
            src="/doodles/squiggle-arrow.png"
            alt=""
            width={512}
            height={512}
            className="pointer-events-none absolute left-[calc(50%-18rem)] top-[-0.75rem] hidden w-[108px] rotate-[14deg] sm:block md:w-[124px]"
            aria-hidden="true"
          />
          {/* mini BPMN — floating above-right of secondary button (2× size) */}
          <Image
            src="/doodles/mini-bpmn.png"
            alt=""
            width={512}
            height={512}
            className="pointer-events-none absolute -top-24 -right-10 hidden w-[240px] rotate-[25deg] sm:block md:-right-16 md:w-[280px]"
            aria-hidden="true"
          />
        </div>

        <p className="mt-4 text-center text-sm text-ink-faint">
          Free for 7 days. No credit card required.
        </p>

        {/* mockup with process-themed marginalia */}
        <div className="relative mt-6 overflow-visible pb-4 sm:mt-8">
          <Image
            src="/doodles/chevron-stack.png"
            alt=""
            width={512}
            height={512}
            className="pointer-events-none absolute -left-12 top-[8%] hidden w-[132px] -rotate-[10deg] lg:block xl:-left-24 xl:w-[156px]"
            aria-hidden="true"
          />
          {/* clipboard mirrors the chevron-stack arrows on the left: anchored
              to the same fixed-width container, so its distance from the mock
              never changes on wide screens, and on narrow screens it slides
              behind the mock (it's before the mock in the DOM, no z-index) */}
          <Image
            src="/doodles/clipboard-bpmn.png"
            alt=""
            width={512}
            height={512}
            className="pointer-events-none absolute -right-[120px] bottom-[4%] hidden w-[210px] rotate-[8deg] lg:block xl:-right-[150px] xl:w-[240px]"
            aria-hidden="true"
          />

          <LiveProductMock />
        </div>
      </div>
    </section>
  );
}
