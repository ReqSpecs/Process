"use client";

import Image from "next/image";
import { AuthCta } from "@/components/marketing/AuthCta";
import { SectionShell } from "./SectionShell";

const PURPLE = "#7C3AED";

// Higgsfield-generated ink portraits (public/roles). Ring colours pull from the
// brand palette + the animated-headline pill hues so the set feels cohesive.
const ROLES = [
  { label: "Business Analysts", src: "business-analyst", ring: "#1e40af" },
  { label: "Process Analysts", src: "process-analyst", ring: "#7c5cff" },
  { label: "Operations Leads", src: "operations-manager", ring: "#0d9488" },
  { label: "Transformation Teams", src: "transformation-lead", ring: "#f97316" },
  { label: "Management Consultants", src: "management-consultant", ring: "#e11d64" },
  { label: "Project Managers", src: "project-manager", ring: "#d97706" },
  { label: "Quality & Compliance", src: "quality-compliance", ring: "#16a34a" },
  { label: "Improvement Leads", src: "improvement-lead", ring: "#0284c7" },
];

export function RolesSection() {
  return (
    <SectionShell
      id="built-for"
      bgClass="bg-surface"
      headingWidthClass="max-w-none"
      subheadWidthClass="max-w-none"
      paddingClass="pt-10 pb-8 sm:pt-12 sm:pb-10"
      bodyGapClass="mt-7 sm:mt-9"
      heading={
        <>
          <span style={{ color: PURPLE }}>Built</span> for the people who keep
          things running
          <span style={{ color: PURPLE }}>.</span>
        </>
      }
      subhead="The analysts, operators, and consultants who map how work happens and make it better."
    >
      <div className="grid items-stretch gap-5 lg:grid-cols-2">
        {/* left: colourful grid of roles */}
        <div className="flex">
          <div className="grid h-full w-full grid-cols-1 gap-2.5 sm:auto-rows-fr sm:grid-cols-2">
            {ROLES.map((role) => (
              <div
                key={role.src}
                className="group/role flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-200 ease-out hover:-translate-y-0.5"
                style={{ backgroundColor: `${role.ring}12` }}
              >
                <div
                  className="shrink-0 rounded-full p-[2.5px] transition-transform duration-200 ease-out group-hover/role:scale-110"
                  style={{
                    backgroundColor: role.ring,
                    boxShadow: `0 4px 12px -4px ${role.ring}80`,
                  }}
                >
                  <div className="rounded-full bg-paper p-[2px]">
                    <div className="relative h-12 w-12 overflow-hidden rounded-full bg-surface">
                      <Image
                        src={`/roles/${role.src}.png`}
                        alt={role.label}
                        fill
                        sizes="120px"
                        quality={90}
                        className="object-cover object-center"
                      />
                    </div>
                  </div>
                </div>
                <span
                  className="text-[15px] font-bold leading-tight"
                  style={{ color: role.ring }}
                >
                  {role.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* right card: final sign-up CTA */}
        <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-panel border border-hairline bg-gradient-to-br from-violet-tint via-surface to-cobalt-wash px-6 py-8 text-center sm:px-10">
          <Image
            src="/features/home-cta.png"
            alt=""
            width={512}
            height={512}
            className="pointer-events-none mb-4 h-20 w-20 select-none sm:h-[88px] sm:w-[88px]"
          />
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
            Ready when you are
          </p>
          <h3 className="mt-2 max-w-sm text-[22px] font-bold leading-tight tracking-[-0.02em] text-ink sm:text-[26px]">
            <span className="block">Your processes deserve</span>
            <span className="block">
              a better home
              <span className="text-ember">.</span>
            </span>
          </h3>
          <p className="mt-2.5 max-w-xs text-[15px] leading-relaxed text-ink-soft">
            Set up your workspace in under a minute.
          </p>
          <AuthCta
            next="/start-trial"
            className="mt-5 inline-block rounded-lg bg-[#7c3aed] px-6 py-3 text-[15px] font-semibold text-white shadow-soft transition-all hover:-translate-y-px hover:bg-[#6d28d9] hover:shadow-float"
          >
            Start free
          </AuthCta>
        </div>
      </div>
    </SectionShell>
  );
}
