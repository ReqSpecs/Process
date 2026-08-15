/**
 * BPMN 2.0 object families for the founding-offer page.
 *
 * Each column is a type (tasks, starts, intermediates, gateways, ends) with a
 * fanned stack of variations so a visitor feels the depth without a wall of
 * icons. Colours match the Essentials stencil.
 */

import type { ReactNode } from "react";

const TASK_STROKE = "#29a8e6";
const INK = "#1d1c1a";
const RING = "#ff8c00";
const SHADOW = "drop-shadow(0 1.5px 1.5px rgba(15, 23, 42, 0.35))";

type Family = {
  label: string;
  hint: string;
  glyphs: ReactNode[];
};

export function BpmnObjectSuite() {
  const families: Family[] = [
    {
      label: "Tasks",
      hint: "User, service, send, receive",
      glyphs: [
        <TaskGlyph key="user" kind="user" />,
        <TaskGlyph key="service" kind="service" />,
        <TaskGlyph key="send" kind="send" />,
        <TaskGlyph key="receive" kind="receive" />,
      ],
    },
    {
      label: "Start events",
      hint: "None, message, timer, signal",
      glyphs: [
        <StartGlyph key="s-none" kind="none" />,
        <StartGlyph key="s-msg" kind="message" />,
        <StartGlyph key="s-timer" kind="timer" />,
        <StartGlyph key="s-signal" kind="signal" />,
      ],
    },
    {
      label: "Intermediate",
      hint: "Message, timer, escalation",
      glyphs: [
        <MidGlyph key="m-none" kind="none" />,
        <MidGlyph key="m-msg" kind="message" />,
        <MidGlyph key="m-timer" kind="timer" />,
        <MidGlyph key="m-esc" kind="escalation" />,
      ],
    },
    {
      label: "Gateways",
      hint: "Exclusive, parallel, inclusive",
      glyphs: [
        <GateGlyph key="g-x" kind="exclusive" />,
        <GateGlyph key="g-p" kind="parallel" />,
        <GateGlyph key="g-i" kind="inclusive" />,
        <GateGlyph key="g-e" kind="event" />,
      ],
    },
    {
      label: "End events",
      hint: "None, message, error, terminate",
      glyphs: [
        <EndGlyph key="e-none" kind="none" />,
        <EndGlyph key="e-msg" kind="message" />,
        <EndGlyph key="e-err" kind="error" />,
        <EndGlyph key="e-term" kind="terminate" />,
      ],
    },
  ];

  return (
    <div>
      <h2 className="font-[family-name:var(--font-inter)] text-[clamp(21px,2.6vw,27px)] font-bold leading-[1.15] tracking-[-0.02em] text-ink">
        The full BPMN 2.0 toolkit, without the clutter.
      </h2>
      <p className="mt-2.5 max-w-3xl text-[14.5px] leading-relaxed text-ink-soft">
        The editor has the complete BPMN 2.0 set, every task type, event,
        gateway and artifact. Make life easier with BPMN Essentials, the
        default set that maps 99% of real processes.
      </p>

      <div className="relative mt-7 overflow-hidden rounded-[22px] border border-hairline bg-surface shadow-[0_22px_50px_-28px_rgba(30,64,175,0.35)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-10 top-0 h-32 w-32 rounded-full bg-[#aef029]/20 blur-3xl"
        />
        <ul className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 lg:divide-x lg:divide-hairline">
          {families.map((family) => (
            <li
              key={family.label}
              className="flex flex-col items-center border-b border-hairline px-4 py-6 last:border-b-0 sm:[&:nth-child(n+4)]:border-b-0 lg:border-b-0"
            >
              <Fan glyphs={family.glyphs} />
              <p className="mt-4 text-[13.5px] font-semibold text-ink">
                {family.label}
              </p>
              <p className="mt-0.5 text-center text-[11.5px] leading-snug text-ink-faint">
                {family.hint}
              </p>
            </li>
          ))}
        </ul>
        <p className="relative border-t border-hairline px-5 py-3.5 text-center text-[12.5px] leading-relaxed text-ink-faint">
          Pools, lanes, data objects, annotations, groups and the rest of the
          BPMN 2.0 suite.
        </p>
      </div>
    </div>
  );
}

function Fan({ glyphs }: { glyphs: ReactNode[] }) {
  const n = glyphs.length;
  return (
    <div className="relative h-[68px] w-[108px]">
      {glyphs.map((glyph, i) => {
        const t = i - (n - 1) / 2;
        return (
          <span
            key={i}
            className="absolute left-1/2 top-1/2"
            style={{
              zIndex: i + 1,
              transform: `translate(-50%, -50%) translateX(${t * 14}px) rotate(${t * 6}deg)`,
            }}
          >
            <span className="block transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none hover:-translate-y-px hover:scale-[1.03]">
              {glyph}
            </span>
          </span>
        );
      })}
    </div>
  );
}

const TILE = "h-11 w-14 drop-shadow-sm";

function TaskGlyph({
  kind,
}: {
  kind: "user" | "service" | "send" | "receive";
}) {
  const line = {
    fill: "none" as const,
    stroke: INK,
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg viewBox="0 0 56 40" className={TILE} aria-hidden="true">
      <rect
        x="4"
        y="6"
        width="48"
        height="28"
        rx="6"
        fill="#fff"
        stroke={TASK_STROKE}
        strokeWidth="1.5"
      />
      <g transform="translate(8 10) scale(0.85)">
        {kind === "user" && (
          <>
            <circle cx="8" cy="4.6" r="2.9" {...line} />
            <path
              d="M2.2 14.6c0-3.2 2.6-5.3 5.8-5.3s5.8 2.1 5.8 5.3"
              {...line}
            />
          </>
        )}
        {kind === "service" && (
          <g fill="none" stroke={INK} strokeWidth="1.4" strokeLinejoin="round">
            <path d="M6.7 1.6h2.6l.45 1.85 1.7-.7 1.85 1.85-.7 1.7 1.85.45v2.6l-1.85.45.7 1.7-1.85 1.85-1.7-.7-.45 1.85H6.7l-.45-1.85-1.7.7L2.7 11.7l.7-1.7-1.85-.45V6.95l1.85-.45-.7-1.7 1.85-1.85 1.7.7z" />
            <circle cx="8" cy="8" r="2.15" />
          </g>
        )}
        {kind === "send" && (
          <>
            <rect x="0.8" y="3.6" width="14.4" height="9.6" rx="1" fill={INK} />
            <path
              d="M0.8 3.6 8 9.2l7.2-5.6"
              fill="none"
              stroke="#fff"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
          </>
        )}
        {kind === "receive" && (
          <>
            <rect x="0.8" y="3.6" width="14.4" height="9.6" rx="1" {...line} />
            <path d="M0.8 3.6 8 9.2l7.2-5.6" {...line} />
          </>
        )}
      </g>
    </svg>
  );
}

function StartGlyph({
  kind,
}: {
  kind: "none" | "message" | "timer" | "signal";
}) {
  const id = `bos-start-${kind}`;
  const glyph = { fill: "none" as const, stroke: INK, strokeWidth: 1.25 };

  return (
    <svg viewBox="0 0 40 40" className="h-11 w-11 drop-shadow-sm" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5cf08c" />
          <stop offset="100%" stopColor="#18b84a" />
        </linearGradient>
      </defs>
      <circle
        cx="20"
        cy="20"
        r="14"
        fill={`url(#${id})`}
        stroke="#0f7a34"
        strokeWidth="1.5"
        style={{ filter: SHADOW }}
      />
      {kind === "message" && (
        <>
          <rect x="13" y="15.5" width="14" height="10" rx="1" {...glyph} />
          <path d="M13 15.8 20 21.2l7-5.4" {...glyph} strokeLinejoin="round" />
        </>
      )}
      {kind === "timer" && (
        <>
          <circle cx="20" cy="20" r="7" {...glyph} />
          <path
            d="M20 15.2V20h4"
            {...glyph}
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      {kind === "signal" && (
        <path d="M20 13.2 26.4 26H13.6Z" {...glyph} strokeLinejoin="round" />
      )}
    </svg>
  );
}

function MidGlyph({
  kind,
}: {
  kind: "none" | "message" | "timer" | "escalation";
}) {
  const glyph = { fill: "none" as const, stroke: INK, strokeWidth: 1.25 };

  return (
    <svg viewBox="0 0 40 40" className="h-11 w-11 drop-shadow-sm" aria-hidden="true">
      <g style={{ filter: SHADOW }}>
        <circle cx="20" cy="20" r="14" fill="#fff" stroke={RING} strokeWidth="2.2" />
        <circle cx="20" cy="20" r="11" fill="none" stroke={RING} strokeWidth="2.2" />
      </g>
      {kind === "message" && (
        <>
          <rect x="13.5" y="16" width="13" height="9" rx="1" {...glyph} />
          <path d="M13.5 16.2 20 21l6.5-4.8" {...glyph} strokeLinejoin="round" />
        </>
      )}
      {kind === "timer" && (
        <>
          <circle cx="20" cy="20" r="6.4" {...glyph} />
          <path
            d="M20 15.8V20h3.4"
            {...glyph}
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      {kind === "escalation" && (
        <path d="M20 13.4 25.6 26.4 20 21.4 14.4 26.4Z" fill={INK} />
      )}
    </svg>
  );
}

function EndGlyph({
  kind,
}: {
  kind: "none" | "message" | "error" | "terminate";
}) {
  const id = `bos-end-${kind}`;
  const glyph = { fill: "none" as const, stroke: INK, strokeWidth: 1.25 };

  return (
    <svg viewBox="0 0 40 40" className="h-11 w-11 drop-shadow-sm" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff8a82" />
          <stop offset="100%" stopColor="#ec2b2b" />
        </linearGradient>
      </defs>
      <circle
        cx="20"
        cy="20"
        r="14"
        fill={`url(#${id})`}
        stroke="#9e1414"
        strokeWidth="1.75"
        style={{ filter: SHADOW }}
      />
      {kind === "message" && (
        <>
          <rect x="13" y="15.5" width="14" height="10" rx="1" fill={INK} />
          <path
            d="M13 15.8 20 21.2l7-5.4"
            fill="none"
            stroke="#fff"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </>
      )}
      {kind === "error" && (
        <path d="M14.4 26.2 17.4 13.6l3.2 6.6L23.8 13.4 20.6 26.2 17.4 19.6Z" fill={INK} />
      )}
      {kind === "terminate" && <circle cx="20" cy="20" r="6.4" fill={INK} />}
    </svg>
  );
}

function GateGlyph({
  kind,
}: {
  kind: "exclusive" | "parallel" | "inclusive" | "event";
}) {
  const mark = {
    fill: "none" as const,
    stroke: "#000",
    strokeWidth: 2.2,
    strokeLinecap: "round" as const,
  };

  return (
    <svg viewBox="0 0 40 40" className="h-11 w-11 drop-shadow-sm" aria-hidden="true">
      <path
        d="M20 6 L34 20 L20 34 L6 20 Z"
        fill="#fff"
        stroke="#000"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {kind === "exclusive" && (
        <path d="M14.8 14.8 25.2 25.2M25.2 14.8 14.8 25.2" {...mark} />
      )}
      {kind === "parallel" && <path d="M20 13v14M13 20h14" {...mark} />}
      {kind === "inclusive" && (
        <circle cx="20" cy="20" r="5.6" {...mark} strokeWidth="2" />
      )}
      {kind === "event" && (
        <>
          <circle cx="20" cy="20" r="6.4" {...mark} strokeWidth="1.15" />
          <circle cx="20" cy="20" r="4.8" {...mark} strokeWidth="1.15" />
          <path
            d="M20 16.4 23.2 18.8l-1.2 3.6h-4l-1.2-3.6Z"
            {...mark}
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}
