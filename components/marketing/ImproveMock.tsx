import { Sparkle, Warning, WarningCircle, Lightbulb } from "@phosphor-icons/react/dist/ssr";

const NAVY = "#12244d";
const NAVY_SOFT = "#3a5488";
const AMBER = "#f59e0b";
const RED = "#e11d48";
const VIOLET = "#7C3AED";

const FINDINGS = [
  {
    Icon: WarningCircle,
    color: RED,
    tint: "#fde3ec",
    title: "No rejection path",
    body: "The approval gateway has no outgoing path for a declined offer.",
  },
  {
    Icon: Warning,
    color: AMBER,
    tint: "#fef3d6",
    title: "Missing SLA",
    body: "\u201CProvision Access\u201D has no timeout or escalation defined.",
  },
  {
    Icon: Lightbulb,
    color: VIOLET,
    tint: "#efe7fe",
    title: "Merge duplicate step",
    body: "\u201CCreate Account\u201D overlaps a step in IT Setup.",
  },
];

/** Static AI gap-analysis preview for the Improve section. */
export function ImproveMock() {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-surface shadow-float">
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-black/[0.07] bg-mist/40 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <div className="ml-3 min-w-0 flex-1 truncate text-xs text-ink-faint">
          Employee Onboarding &middot; AI Review
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-tint px-2.5 py-1 text-[11px] font-semibold text-[#6d28d9]">
          <Sparkle size={11} weight="fill" />3 findings
        </span>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* canvas */}
        <div
          className="relative flex min-w-0 flex-1 items-center justify-center p-4 sm:p-5"
          style={{
            backgroundImage:
              "radial-gradient(rgba(18,36,77,0.10) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        >
          <svg
            viewBox="0 78 560 118"
            className="h-auto w-full"
            role="img"
            aria-label="Process diagram under review"
          >
            <defs>
              <marker
                id="imk-arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M0 0 L10 5 L0 10 Z" fill={NAVY_SOFT} />
              </marker>
            </defs>

            {/* connectors */}
            <g
              fill="none"
              stroke={NAVY_SOFT}
              strokeWidth="2"
              markerEnd="url(#imk-arrow)"
            >
              <path d="M47 125 H61" />
              <path d="M168 125 H176" />
              <path d="M233 125 H245" />
              <path d="M368 125 H395" />
              <path d="M510 125 H522" />
            </g>

            {/* missing rejection path (dashed red) */}
            <path
              d="M206 152 V185 H120"
              stroke={RED}
              strokeWidth="2"
              strokeDasharray="5 5"
              fill="none"
              opacity="0.7"
            />
            <circle cx="120" cy="185" r="4" fill={RED} opacity="0.7" />

            {/* start */}
            <circle cx="30" cy="125" r="17" fill="#fff" stroke={NAVY} strokeWidth="2" />
            <text x="30" y="157" textAnchor="middle" fontSize="12" fill={NAVY} fontWeight="600">Start</text>

            {/* task: send offer */}
            <rect x="64" y="98" width="104" height="54" rx="10" fill="#fff" stroke={NAVY} strokeWidth="2" />
            <text x="116" y="129" textAnchor="middle" fontSize="12" fill={NAVY} fontWeight="600">Send Offer</text>

            {/* gateway (exclusive) */}
            <polygon
              points="179,125 206,98 233,125 206,152"
              fill="#fff"
              stroke={NAVY}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <g stroke={NAVY} strokeWidth="2.5" strokeLinecap="round">
              <line x1="197" y1="116" x2="215" y2="134" />
              <line x1="197" y1="134" x2="215" y2="116" />
            </g>
            <text x="206" y="90" textAnchor="middle" fontSize="12" fill={NAVY} fontWeight="600">Approved?</text>
            {/* red flag on gateway (no rejection path) */}
            <circle cx="228" cy="104" r="9" fill={RED} />
            <text x="228" y="108" textAnchor="middle" fontSize="12" fill="#fff" fontWeight="800">!</text>

            {/* task: provision access (flagged amber) */}
            <rect x="248" y="98" width="120" height="54" rx="10" fill="#fff" stroke={AMBER} strokeWidth="2.5" />
            <text x="308" y="129" textAnchor="middle" fontSize="12" fill={NAVY} fontWeight="600">Provision Access</text>
            <circle cx="368" cy="98" r="9" fill={AMBER} />
            <text x="368" y="102" textAnchor="middle" fontSize="12" fill="#fff" fontWeight="800">!</text>

            {/* task: create account (merge-suggestion, violet) */}
            <rect x="398" y="98" width="112" height="54" rx="10" fill="#fff" stroke={NAVY} strokeWidth="2" />
            <text x="454" y="129" textAnchor="middle" fontSize="12" fill={NAVY} fontWeight="600">Create Account</text>
            <circle cx="510" cy="98" r="8" fill={VIOLET} />

            {/* end */}
            <circle cx="542" cy="125" r="17" fill="#fff" stroke={NAVY} strokeWidth="3" />
            <text x="542" y="157" textAnchor="middle" fontSize="12" fill={NAVY} fontWeight="600">End</text>
          </svg>
        </div>

        {/* findings panel */}
        <aside className="w-full shrink-0 border-t border-black/[0.06] bg-white p-4 sm:p-5 md:w-[36%] md:border-l md:border-t-0">
          <div className="mb-3 flex items-center gap-2">
            <Sparkle size={15} weight="fill" color={VIOLET} />
            <p className="text-[13px] font-semibold text-ink">AI suggestions</p>
          </div>
          <ul className="space-y-2.5">
            {FINDINGS.map((f) => (
              <li
                key={f.title}
                className="flex gap-2.5 rounded-xl border border-black/[0.06] p-2.5"
                style={{ background: `${f.tint}80` }}
              >
                <span
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: f.tint }}
                >
                  <f.Icon size={14} weight="bold" color={f.color} />
                </span>
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-ink">{f.title}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-ink-soft">{f.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
