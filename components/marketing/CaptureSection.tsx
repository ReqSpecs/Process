import Image from "next/image";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { SectionShell } from "./SectionShell";
import { CaptureMock } from "./CaptureMock";

const BOXES = [
  {
    icon: "/features/tile-source.png",
    title: "One source of truth",
    body: "Every process lives in one place, easy to find and never scattered across drives.",
  },
  {
    icon: "/features/tile-arch.png",
    title: "Chevron architecture",
    body: "See your whole operation at a glance, from high-level stages down to the detail.",
  },
  {
    icon: "/features/tile-canvas.png",
    title: "BPMN 2.0 canvas",
    body: "Model every process properly on a clean, standards-based drag-and-drop canvas.",
  },
  {
    icon: "/features/tile-export.png",
    title: "Export to PDF",
    body: "Share a single process or a whole project as a polished PDF in one click.",
  },
  {
    icon: "/features/tile-autosave.png",
    title: "Autosave & versions",
    body: "Every edit saves itself automatically, with version history you can roll back to.",
  },
];

const ACID = "#aef029";

export function CaptureSection() {
  return (
    <SectionShell
      id="capture"
      bgClass="bg-paper"
      headingWidthClass="max-w-none"
      subheadWidthClass="max-w-3xl"
      paddingClass="py-14 sm:py-16"
      bodyGapClass="mt-7 sm:mt-8"
      heading={
        <>
          <span style={{ color: ACID }}>Capture</span> every process in one
          place<span style={{ color: ACID }}>.</span>
        </>
      }
      subhead="Build every process in proper BPMN 2.0, then search, find and share any of them as a polished PDF, project-based or standalone."
    >
      <div className="space-y-6 sm:space-y-8">
        <CaptureMock />

        <div>
          <p className="mb-4 text-[15px] text-ink-soft">See what ProDraw can do</p>
          {/* wide: 5 square tiles in a row (icon + heading beside, subtext below).
              narrower: 3 then 2 per row. narrowest: single column showing just
              the icon + heading (subtext hidden). */}
          {/* 5-across holds down to ~1024px, then 3, then 2, then a single
              column (icon + heading only) at the narrowest. Custom min-[] widths
              are used so the 5-in-a-line layout persists much longer than the
              default xl breakpoint did. */}
          <div className="flex flex-wrap justify-center gap-3">
            {BOXES.map((b) => (
              <div
                key={b.title}
                className="group flex w-full flex-col rounded-2xl border border-hairline bg-surface p-4 transition-all hover:-translate-y-0.5 hover:shadow-soft min-[520px]:w-[calc(50%-0.375rem)] min-[760px]:w-[calc(33.333%-0.5rem)] min-[1024px]:w-[calc(20%-0.6rem)]"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="relative h-14 w-14 shrink-0">
                    <Image
                      src={b.icon}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-contain"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="flex min-w-0 items-start gap-1 text-[14px] font-bold leading-snug text-ink">
                    {b.title}
                    <ArrowRight
                      size={13}
                      weight="bold"
                      className="mt-0.5 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5"
                    />
                  </p>
                </div>
                <p className="mt-3 hidden text-[13px] leading-relaxed text-ink-soft min-[520px]:block">
                  {b.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
