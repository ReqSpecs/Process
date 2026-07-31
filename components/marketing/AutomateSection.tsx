import Image from "next/image";
import { ArrowRight, MagicWand } from "@phosphor-icons/react/dist/ssr";
import { AuthCta } from "@/components/marketing/AuthCta";
import { SectionShell } from "./SectionShell";
import { AutomateMock } from "./AutomateMock";

const CAPABILITIES = [
  {
    icon: "/features/automate-draft-t.png",
    title: "Draft from a sentence",
    body: "Describe the process in plain English. AI asks the right clarifying questions, then builds the flow for you.",
  },
  {
    icon: "/features/automate-refine-t.png",
    title: "Refine by instruction",
    body: "Just say \u201Cadd a finance approval after the manager step\u201D and watch the diagram update itself.",
  },
  {
    icon: "/features/automate-organise-t.png",
    title: "Auto-organise into BPMN 2.0",
    body: "Turn messy notes and bullet points into a clean, standards-compliant BPMN 2.0 diagram automatically.",
  },
  {
    icon: "/features/automate-suggest-t.png",
    title: "Suggest the next step",
    body: "As you build, AI recommends the logical next task, gateway or path so nothing gets missed.",
  },
];

const CARDS = [
  {
    icon: "/features/automate-import-t.png",
    title: "Bulk import",
    body: "Bring in whole folders of Visio and BPMN files at once.",
  },
  {
    icon: "/features/automate-doc-t.png",
    title: "Auto-documentation",
    body: "Owners, systems, inputs and risks drafted for every step.",
  },
  {
    icon: "/features/automate-gaps-t.png",
    title: "Fill the gaps",
    body: "AI completes missing steps and paths so nothing is left hanging.",
  },
];

const PINK = "#E81E62";

const SHOW_STICKER = true;

export function AutomateSection() {
  return (
    <SectionShell
      id="automate"
      bgClass="bg-paper"
      headingWidthClass="max-w-none"
      subheadWidthClass="max-w-3xl"
      paddingClass="pt-6 pb-8 sm:pt-7 sm:pb-10"
      bodyGapClass="mt-5 sm:mt-6"
      heading={
        <span>
          <span style={{ color: PINK }}>Automate</span> the manual work
          <span style={{ color: PINK }}>.</span>
        </span>
      }
      sticker={
        SHOW_STICKER && (
          <Image
            src="/features/coming-soon-automate.png"
            alt="Coming soon"
            width={1024}
            height={576}
            className="pointer-events-none mt-3 w-36 -rotate-2 select-none sm:hidden"
          />
        )
      }
      subhead="Describe a process in plain English, refine it in a sentence, and let AI translate the busywork into clean BPMN 2.0."
    >
      <div className="space-y-4">
        {/* capability list on the left, chat mock on the right */}
        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-2 lg:gap-8">
          <ul className="min-w-0 space-y-4">
            {CAPABILITIES.map((c) => (
              <li key={c.title} className="flex gap-3.5">
                <div className="relative h-12 w-12 shrink-0">
                  <Image
                    src={c.icon}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-contain"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-ink">{c.title}</p>
                  <p className="mt-0.5 text-[13.5px] leading-relaxed text-ink-soft">
                    {c.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="relative min-w-0">
            {SHOW_STICKER && (
              <Image
                src="/features/coming-soon-automate.png"
                alt="Coming soon"
                width={1024}
                height={576}
                className="pointer-events-none absolute bottom-full left-2/3 mb-4 hidden w-44 -translate-x-1/2 -rotate-2 select-none sm:block lg:w-52"
              />
            )}
            <AutomateMock />
          </div>
        </div>

        {/* supporting tiles across the bottom + roadmap CTA */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((c) => (
            <div
              key={c.title}
              className="group flex flex-col rounded-2xl border border-hairline bg-surface p-4 transition-all hover:-translate-y-0.5 hover:shadow-soft"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="relative h-12 w-12 shrink-0">
                  <Image
                    src={c.icon}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-contain"
                    aria-hidden="true"
                  />
                </div>
                <p className="flex min-w-0 items-start gap-1 text-[13.5px] font-bold leading-snug text-ink">
                  {c.title}
                  <ArrowRight
                    size={12}
                    weight="bold"
                    className="mt-0.5 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5"
                  />
                </p>
              </div>
              <p className="mt-2.5 text-[12px] leading-relaxed text-ink-soft">
                {c.body}
              </p>
            </div>
          ))}

          {/* dark roadmap CTA */}
          <AuthCta
            next="/start-trial"
            className="group flex flex-col justify-between rounded-2xl bg-ink p-4 text-left transition-transform hover:-translate-y-0.5"
          >
            <div>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white">
                <MagicWand size={16} weight="bold" />
              </span>
              <p className="mt-3 text-[13.5px] font-bold text-paper">
                Shape the roadmap
              </p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-paper/60">
                Tell us which AI features you need most.
              </p>
            </div>
            <span
              className="mt-3 inline-flex items-center gap-1.5 text-[13.5px] font-bold"
              style={{ color: "#FF5C93" }}
            >
              Suggest a feature
              <ArrowRight
                size={15}
                weight="bold"
                className="transition-transform group-hover:translate-x-0.5"
              />
            </span>
          </AuthCta>
        </div>

        <p className="text-[11px] leading-relaxed text-ink-faint">
          Automate is on our roadmap. Features shown are in active development and
          may change before release.
        </p>
      </div>
    </SectionShell>
  );
}
