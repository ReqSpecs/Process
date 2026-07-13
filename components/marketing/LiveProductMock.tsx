"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowsLeftRight,
  CaretDown,
  CaretRight,
  ChartLineUp,
  CreditCard,
  FilePlus,
  ListChecks,
  MagnifyingGlass,
  Monitor,
  Package,
  PaperPlaneTilt,
  Receipt,
  SealCheck,
  ShieldCheck,
  UserPlus,
  Users,
  type Icon,
} from "@phosphor-icons/react";

// Vibrant palette — mirrors the animated headline pill.
const LIME = "#7a9e00"; // darker lime so it reads on white
const LIME_CHIP = "#AEF029";
const VIOLET = "#7C3AED";
const COBALT = "#0047AB";
const ORANGE = "#FF5722";
const MAGENTA = "#E81E62";
const TEAL = "#0F9E7A";
const NAVY = "#12244d";

type Proc = { label: string; Icon: Icon; isPO?: boolean };
type Stage = {
  label: string;
  color: string;
  ink: string; // icon / accent colour that reads on white
  light?: boolean; // chevron needs dark text
  processes: Proc[];
};

// Procure-to-Pay value chain — varied number of processes per stage.
const STAGES: Stage[] = [
  {
    label: "Identify Need",
    color: LIME_CHIP,
    ink: LIME,
    light: true,
    processes: [
      { label: "Raise Requisition", Icon: FilePlus },
      { label: "Budget Check", Icon: ChartLineUp },
      { label: "Needs Assessment", Icon: ListChecks },
    ],
  },
  {
    label: "Select Supplier",
    color: VIOLET,
    ink: VIOLET,
    processes: [
      { label: "Vendor Shortlist", Icon: ListChecks },
      { label: "RFQ Sent", Icon: PaperPlaneTilt },
      { label: "Supplier Scoring", Icon: ShieldCheck },
      { label: "Contract Review", Icon: Receipt },
    ],
  },
  {
    label: "Procure to Pay",
    color: COBALT,
    ink: COBALT,
    processes: [
      { label: "PO Approval", Icon: SealCheck, isPO: true },
      { label: "3-Way Match", Icon: ArrowsLeftRight },
      { label: "PO Dispatch", Icon: PaperPlaneTilt },
    ],
  },
  {
    label: "Receive Goods",
    color: ORANGE,
    ink: ORANGE,
    processes: [
      { label: "Goods Receipt", Icon: Package },
      { label: "Quality Check", Icon: ShieldCheck },
    ],
  },
  {
    label: "Invoice Processing",
    color: MAGENTA,
    ink: MAGENTA,
    processes: [
      { label: "Invoice Match", Icon: Receipt },
      { label: "Payment Run", Icon: CreditCard },
      { label: "Dispute Handling", Icon: MagnifyingGlass },
    ],
  },
];

// Groups shown expanded in the process-map sidebar (rest collapse).
const EXPANDED = new Set(["Identify Need", "Select Supplier", "Procure to Pay"]);

// Phase machine (ms). A = high-level, B = process map. Slower + readable.
//  0 cursor pops in on PO · 1 rest · 2 click · 3 fade→B (build starts)
//  4 flow finishes drawing · 5 hold B (read) · 6 fade→A · 7 hold A (read)
const DURATIONS = [900, 550, 650, 1100, 2600, 3000, 1100, 1600];

export function LiveProductMock() {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState(0);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setVisible(e.isIntersecting),
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduced || !visible) return;
    const id = setTimeout(
      () => setPhase((p) => (p + 1) % DURATIONS.length),
      DURATIONS[phase],
    );
    return () => clearTimeout(id);
  }, [phase, visible, reduced]);

  const showB = phase >= 3 && phase <= 5;
  const hoverPO = phase === 1 || phase === 2;
  const clickPO = phase === 2;
  const building = phase >= 3 && phase <= 5;
  const cursorOn = phase <= 2; // visible only while acting on screen A

  return (
    <div ref={ref} className="mx-auto max-w-5xl">
      <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-surface shadow-float">
        {/* window chrome */}
        <div className="flex items-center gap-2 border-b border-black/[0.07] bg-mist/40 px-4 py-2.5">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          <div className="ml-3 min-w-0 flex-1 truncate text-xs text-ink-faint">
            {showB
              ? "Finance Transformation / Procure to Pay"
              : "Finance Transformation"}
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e7f6ec] px-2.5 py-1 text-[11px] font-medium text-[#1a7f45]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#28c840]" />
            Saved
          </span>
        </div>

        {/* body — two screens cross-fade in place */}
        <div className="relative aspect-[16/7]">
          <ScreenHighLevel
            active={!showB}
            hoverPO={hoverPO}
            clickPO={clickPO}
            cursorOn={cursorOn}
          />
          <ScreenProcess active={showB} building={building} />
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Screen A */

const PROJECTS: { label: string; Icon: Icon; color: string }[] = [
  { label: "Finance Transformation", Icon: ChartLineUp, color: COBALT },
  { label: "Procurement Review", Icon: MagnifyingGlass, color: VIOLET },
  { label: "HR Onboarding", Icon: Users, color: MAGENTA },
  { label: "Customer Onboarding", Icon: UserPlus, color: ORANGE },
  { label: "IT Change Management", Icon: Monitor, color: TEAL },
];

function ScreenHighLevel({
  active,
  hoverPO,
  clickPO,
  cursorOn,
}: {
  active: boolean;
  hoverPO: boolean;
  clickPO: boolean;
  cursorOn: boolean;
}) {
  // Cursor simply pops in on the PO Approval card (no travel) and clicks —
  // (first card under the "Procure to Pay" chevron — middle column, top row).
  const cursorStyle: React.CSSProperties = {
    left: "48%",
    top: "23%",
    opacity: cursorOn ? 1 : 0,
    transform: cursorOn
      ? clickPO
        ? "scale(0.9)"
        : "scale(1)"
      : "scale(0.7)",
    transition:
      "opacity 0.28s ease, transform 0.3s cubic-bezier(0.34,1.5,0.64,1)",
  };

  return (
    <div
      className="absolute inset-0 flex transition-opacity duration-700 ease-out"
      style={{ opacity: active ? 1 : 0, pointerEvents: "none" }}
      aria-hidden="true"
    >
      {/* sidebar */}
      <aside className="w-[23%] shrink-0 border-r border-black/[0.06] bg-paper/40 p-3">
        <p className="px-2 pb-2 text-[11px] font-semibold tracking-wide text-ink-faint">
          Projects
        </p>
        <ul className="space-y-0.5">
          {PROJECTS.map((p, i) => (
            <li
              key={p.label}
              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] ${
                i === 0
                  ? "bg-white font-semibold text-ink shadow-soft ring-1 ring-black/[0.04]"
                  : "text-ink-soft"
              }`}
            >
              <p.Icon size={14} weight="bold" color={p.color} />
              <span className="truncate">{p.label}</span>
            </li>
          ))}
        </ul>
      </aside>

      {/* main */}
      <div className="relative flex-1 p-4">
        <h3 className="mb-3 text-[15px] font-semibold text-ink">
          Finance Transformation
        </h3>

        {/* chevron chain */}
        <div className="mb-3 flex">
          {STAGES.map((s, i) => (
            <div
              key={s.label}
              className="relative flex h-10 flex-1 items-center justify-center px-1 text-center text-[10px] font-semibold leading-tight"
              style={{
                background: s.color,
                color: s.light ? NAVY : "#fff",
                clipPath:
                  i === 0
                    ? "polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)"
                    : "polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%, 10px 50%)",
                marginLeft: i === 0 ? 0 : -5,
                zIndex: STAGES.length - i,
                borderRadius: 3,
              }}
            >
              {s.label}
            </div>
          ))}
        </div>

        {/* process cards — one column per chevron */}
        <div className="grid grid-cols-5 gap-1.5">
          {STAGES.map((s) => (
            <div key={s.label} className="flex flex-col gap-1.5">
              {s.processes.map((proc) => (
                <div
                  key={proc.label}
                  className="flex items-center gap-1.5 rounded-lg border bg-white px-1.5 py-1.5 shadow-soft transition-all duration-200"
                  style={{
                    borderColor:
                      proc.isPO && hoverPO ? s.ink : "rgba(0,0,0,0.07)",
                    boxShadow:
                      proc.isPO && hoverPO
                        ? `0 0 0 2px ${s.ink}33, 0 8px 18px ${s.ink}22`
                        : undefined,
                    transform: proc.isPO && clickPO ? "scale(0.96)" : undefined,
                  }}
                >
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                    style={{ background: `${s.ink}1a` }}
                  >
                    <proc.Icon size={12} weight="bold" color={s.ink} />
                  </span>
                  <span className="text-[10px] font-medium leading-tight text-ink">
                    {proc.label}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* cursor */}
        <div className="pointer-events-none absolute z-30" style={cursorStyle}>
          <div className="relative">
            <Pointer />
            {clickPO && (
              <span className="absolute -left-1 -top-1 h-6 w-6 animate-ping rounded-full bg-cobalt/30" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Pointer() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 2.5 L5 19 L9.2 15 L12 21 L15 19.6 L12.2 13.8 L18 13.6 Z"
        fill="#fff"
        stroke={NAVY}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ---------------------------------------------------------------- Screen B */

function ScreenProcess({
  active,
  building,
}: {
  active: boolean;
  building: boolean;
}) {
  return (
    <div
      className="absolute inset-0 flex transition-opacity duration-700 ease-out"
      style={{ opacity: active ? 1 : 0, pointerEvents: "none" }}
      aria-hidden="true"
    >
      {/* grouped process tree */}
      <aside className="w-[26%] shrink-0 overflow-hidden border-r border-black/[0.06] bg-paper/40 p-2.5">
        <p className="px-1.5 pb-1.5 text-[11px] font-semibold tracking-wide text-ink-faint">
          Processes
        </p>
        <ul className="space-y-0.5">
          {STAGES.map((s) => {
            const open = EXPANDED.has(s.label);
            return (
              <li key={s.label}>
                <div className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-semibold text-ink-soft">
                  {open ? (
                    <CaretDown size={11} weight="bold" />
                  ) : (
                    <CaretRight size={11} weight="bold" />
                  )}
                  <span
                    className="h-2 w-2 shrink-0 rounded-[3px]"
                    style={{ background: s.color }}
                  />
                  <span className="truncate">{s.label}</span>
                  <span className="ml-auto text-[10px] font-normal text-ink-faint">
                    {s.processes.length}
                  </span>
                </div>
                {open && (
                  <ul className="mb-0.5 ml-[9px] border-l border-black/[0.08] pl-2">
                    {s.processes.map((proc) => (
                      <li
                        key={proc.label}
                        className={`truncate rounded-md px-2 py-1 text-[11px] ${
                          proc.isPO
                            ? "bg-white font-semibold shadow-soft ring-1 ring-black/[0.05]"
                            : "text-ink-soft"
                        }`}
                        style={proc.isPO ? { color: NAVY } : undefined}
                      >
                        {proc.label}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </aside>

      {/* canvas */}
      <div
        className="relative flex-1"
        style={{
          backgroundImage:
            "radial-gradient(rgba(18,36,77,0.10) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      >
        <BpmnFlow building={building} />
      </div>
    </div>
  );
}

/** Monochrome navy BPMN flow that draws itself in sequence when `building`. */
function BpmnFlow({ building }: { building: boolean }) {
  const node = (delay: number) =>
    ({
      opacity: building ? 1 : 0,
      transform: building ? "scale(1)" : "scale(0.9)",
      transformBox: "fill-box",
      transformOrigin: "center",
      transition: `opacity 0.4s ease ${delay}ms, transform 0.45s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
    }) as React.CSSProperties;

  const edge = (delay: number) =>
    ({
      strokeDasharray: 1,
      strokeDashoffset: building ? 0 : 1,
      opacity: building ? 1 : 0,
      transition: `stroke-dashoffset 0.45s ease ${delay}ms, opacity 0.01s linear ${building ? delay : 0}ms`,
    }) as React.CSSProperties;

  const label: React.CSSProperties = { fill: NAVY, fontSize: 11, fontWeight: 600 };

  return (
    <svg
      viewBox="0 0 640 300"
      className="absolute inset-0 h-full w-full p-3"
      style={{ color: NAVY }}
    >
      <defs>
        <marker
          id="mk-arrow"
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth="6.5"
          markerHeight="6.5"
          orient="auto-start-reverse"
        >
          <path d="M0 0 L10 5 L0 10 Z" fill={NAVY} />
        </marker>
      </defs>

      <g fill="none" stroke={NAVY} strokeWidth="2" markerEnd="url(#mk-arrow)">
        <path d="M56 150 H92" pathLength={1} style={edge(120)} />
        <path d="M188 150 H226" pathLength={1} style={edge(500)} />
        <path d="M258 128 V80 H366" pathLength={1} style={edge(900)} />
        <path d="M258 172 V220 H366" pathLength={1} style={edge(900)} />
        <path d="M494 80 H540 V119" pathLength={1} style={edge(1500)} />
        <path d="M494 220 H540 V181" pathLength={1} style={edge(1500)} />
        <path d="M571 150 H600" pathLength={1} style={edge(1900)} />
      </g>

      {/* Start */}
      <g style={node(0)}>
        <circle cx="40" cy="150" r="16" fill="#fff" stroke={NAVY} strokeWidth="2" />
      </g>
      <text x="40" y="184" textAnchor="middle" style={label}>
        Start
      </text>

      {/* Raise PO */}
      <g style={node(300)}>
        <rect x="92" y="126" width="96" height="48" rx="10" fill="#fff" stroke={NAVY} strokeWidth="2" />
        <text x="140" y="154" textAnchor="middle" style={label}>
          Raise PO
        </text>
      </g>

      {/* Gateway 1 */}
      <g style={node(650)}>
        <rect x="234" y="126" width="48" height="48" rx="6" transform="rotate(45 258 150)" fill="#fff" stroke={NAVY} strokeWidth="2" />
        <text x="258" y="155" textAnchor="middle" style={{ ...label, fontSize: 16, fontWeight: 700 }}>
          X
        </text>
      </g>
      <text x="258" y="196" textAnchor="middle" style={label}>
        Approved?
      </text>

      {/* Send to Vendor */}
      <g style={node(1050)}>
        <rect x="366" y="56" width="128" height="48" rx="10" fill="#fff" stroke={NAVY} strokeWidth="2" />
        <text x="430" y="84" textAnchor="middle" style={label}>
          Send to Vendor
        </text>
      </g>

      {/* Revise & Resubmit */}
      <g style={node(1050)}>
        <rect x="366" y="196" width="128" height="48" rx="10" fill="#fff" stroke={NAVY} strokeWidth="2" />
        <text x="430" y="224" textAnchor="middle" style={label}>
          Revise &amp; Resubmit
        </text>
      </g>

      {/* Gateway 2 (join) */}
      <g style={node(1650)}>
        <rect x="516" y="126" width="48" height="48" rx="6" transform="rotate(45 540 150)" fill="#fff" stroke={NAVY} strokeWidth="2" />
        <text x="540" y="155" textAnchor="middle" style={{ ...label, fontSize: 16, fontWeight: 700 }}>
          X
        </text>
      </g>

      {/* End */}
      <g style={node(2050)}>
        <circle cx="616" cy="150" r="16" fill="#fff" stroke={NAVY} strokeWidth="3.5" />
      </g>
      <text x="616" y="184" textAnchor="middle" style={label}>
        End
      </text>
    </svg>
  );
}
