import Image from "next/image";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { SectionShell } from "./SectionShell";
import { ImproveMock } from "./ImproveMock";

const BOXES = [
  {
    icon: "/features/improve-analysis-v3.png",
    title: "AI gap analysis",
    body: "Every diagram gets a plain-English review with concrete, ranked fixes.",
  },
  {
    icon: "/features/improve-upload.png",
    title: "Bring your existing maps",
    body: "Upload a Visio file, PDF or image and let AI turn it into clean BPMN.",
  },
  {
    icon: "/features/improve-reporting.png",
    title: "Process health reporting",
    body: "Dashboards that surface bottlenecks, ageing steps and coverage gaps.",
  },
  {
    icon: "/features/improve-duplicates-v3.png",
    title: "Spot duplicates & overlap",
    body: "AI flags near-identical steps and overlapping processes to simplify.",
  },
];

const MIAMI = "#00a9e0";

const SHOW_STICKER = true;

export function ImproveSection() {
  return (
    <SectionShell
      id="improve"
      bgClass="bg-surface"
      headingWidthClass="max-w-none"
      subheadWidthClass="max-w-3xl"
      paddingClass="pt-6 pb-10 sm:pt-8 sm:pb-12"
      bodyGapClass="mt-6 sm:mt-7"
      heading={
        <span>
          <span style={{ color: MIAMI }}>Improve</span> every handoff
          <span style={{ color: MIAMI }}>.</span>
        </span>
      }
      subhead="Let AI review your processes for missing paths, weak controls and duplicated work, then suggest exactly how to tighten them up."
    >
      {/* mock on the left, 2x2 tile grid (aligned to mock height) on the right */}
      <div className="grid gap-x-5 gap-y-3 lg:grid-cols-12 lg:items-stretch">
        <div className="lg:col-span-8 lg:row-span-1">
          <ImproveMock />
        </div>

        <div className="relative grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-4 lg:row-span-1 lg:grid-rows-2">
          {SHOW_STICKER && (
            <Image
              src="/features/coming-soon-script.png"
              alt="Coming soon"
              width={1024}
              height={576}
              className="pointer-events-none absolute bottom-full left-1/2 mb-4 hidden w-44 -translate-x-1/2 -rotate-2 select-none sm:block lg:w-52"
            />
          )}

          {BOXES.map((b) => (
            <div
              key={b.title}
              className="group flex h-full flex-col justify-center rounded-2xl border border-hairline bg-surface p-4 transition-all hover:-translate-y-0.5 hover:shadow-soft"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="relative h-12 w-12 shrink-0">
                  <Image
                    src={b.icon}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-contain"
                    aria-hidden="true"
                  />
                </div>
                <p className="flex min-w-0 items-start gap-1 text-[13.5px] font-bold leading-snug text-ink">
                  {b.title}
                  <ArrowRight
                    size={12}
                    weight="bold"
                    className="mt-0.5 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5"
                  />
                </p>
              </div>
              <p className="mt-2.5 text-[12px] leading-relaxed text-ink-soft">
                {b.body}
              </p>
            </div>
          ))}
        </div>

        <p className="text-[11px] leading-relaxed text-ink-faint lg:col-span-8">
          Improve is on our roadmap. Features shown are in active development and
          may change before release.
        </p>
      </div>
    </SectionShell>
  );
}
