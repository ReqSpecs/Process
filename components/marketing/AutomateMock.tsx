import { Sparkle, PaperPlaneRight } from "@phosphor-icons/react/dist/ssr";

const VIOLET = "#7C3AED";
const NAVY = "#12244d";
const NAVY_SOFT = "#3a5488";

const TASKS = [
  { x: 50, y: 51, w: 66, label: "Send Offer" },
  { x: 196, y: 18, w: 86, label: "Provision IT" },
  { x: 196, y: 84, w: 86, label: "HR Setup" },
  { x: 362, y: 51, w: 72, label: "Day One" },
];

/** Static "draft with AI" preview for the Automate section. */
export function AutomateMock() {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-surface shadow-float">
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-black/[0.07] bg-mist/40 px-4 py-2">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <div className="ml-3 min-w-0 flex-1 truncate text-xs text-ink-faint">
          New process &middot; Draft with AI
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-tint px-2.5 py-1 text-[11px] font-semibold text-[#6d28d9]">
          <Sparkle size={11} weight="fill" />
          AI
        </span>
      </div>

      <div className="p-3.5 sm:p-4">
        {/* conversation */}
        <div className="space-y-2.5">
          {/* user prompt */}
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-cobalt px-3.5 py-2 text-[12px] leading-snug text-white">
              Draft an employee onboarding process, from signed offer to day
              one.
            </div>
          </div>

          {/* AI clarifying question */}
          <div className="flex items-start gap-2">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-tint">
              <Sparkle size={13} weight="fill" color={VIOLET} />
            </span>
            <div className="max-w-[85%]">
              <div className="rounded-2xl rounded-tl-sm bg-mist/70 px-3.5 py-2 text-[12px] leading-snug text-ink">
                Should IT provisioning run in parallel with HR setup?
              </div>
              <div className="mt-1.5 flex gap-1.5">
                <span className="rounded-full bg-violet-tint px-2.5 py-1 text-[11px] font-semibold text-[#6d28d9]">
                  Yes, in parallel
                </span>
                <span className="rounded-full border border-hairline px-2.5 py-1 text-[11px] font-medium text-ink-soft">
                  No, sequential
                </span>
              </div>
            </div>
          </div>

          {/* AI drafting result */}
          <div className="flex items-start gap-2">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-tint">
              <Sparkle size={13} weight="fill" color={VIOLET} />
            </span>
            <div className="w-full max-w-[92%] rounded-2xl rounded-tl-sm border border-violet-tint bg-violet-tint/30 p-2.5">
              <p className="mb-1.5 text-[11px] font-semibold text-[#6d28d9]">
                Drafted 4 steps
              </p>
              {/* generated mini flow — parallel split into two branches */}
              <svg
                viewBox="0 17 484 96"
                className="h-auto w-full"
                role="img"
                aria-label="Generated draft flow with a parallel gateway splitting into Provision IT and HR Setup"
              >
                <defs>
                  <marker
                    id="am-arrow"
                    viewBox="0 0 10 10"
                    refX="10"
                    refY="5"
                    markerWidth="5.5"
                    markerHeight="5.5"
                    orient="auto-start-reverse"
                  >
                    <path d="M0 0 L10 5 L0 10 Z" fill={NAVY_SOFT} />
                  </marker>
                </defs>

                {/* connectors */}
                <g
                  stroke={NAVY_SOFT}
                  strokeWidth="1.5"
                  fill="none"
                  markerEnd="url(#am-arrow)"
                >
                  <path d="M26 65 H50" />
                  <path d="M116 65 H140" />
                  {/* split gateway → out the top & bottom */}
                  <path d="M156 49 V32 H196" />
                  <path d="M156 81 V98 H196" />
                  {/* tasks → into the top & bottom of the join gateway */}
                  <path d="M282 32 H322 V49" />
                  <path d="M282 98 H322 V81" />
                  <path d="M338 65 H362" />
                  <path d="M434 65 H458" />
                </g>

                {/* start */}
                <circle cx="16" cy="65" r="10" fill="#fff" stroke={NAVY} strokeWidth="1.5" />

                {/* parallel split gateway */}
                <polygon points="156,49 172,65 156,81 140,65" fill="#fff" stroke={VIOLET} strokeWidth="1.5" />
                <g stroke={VIOLET} strokeWidth="1.75" strokeLinecap="round">
                  <line x1="156" y1="58" x2="156" y2="72" />
                  <line x1="149" y1="65" x2="163" y2="65" />
                </g>

                {/* parallel join gateway */}
                <polygon points="322,49 338,65 322,81 306,65" fill="#fff" stroke={VIOLET} strokeWidth="1.5" />
                <g stroke={VIOLET} strokeWidth="1.75" strokeLinecap="round">
                  <line x1="322" y1="58" x2="322" y2="72" />
                  <line x1="315" y1="65" x2="329" y2="65" />
                </g>

                {/* end */}
                <circle cx="468" cy="65" r="10" fill="#fff" stroke={NAVY} strokeWidth="2.5" />

                {/* task boxes */}
                {TASKS.map((t) => (
                  <g key={t.label}>
                    <rect
                      x={t.x}
                      y={t.y}
                      width={t.w}
                      height="28"
                      rx="6"
                      fill="#fff"
                      stroke={VIOLET}
                      strokeWidth="1.5"
                    />
                    <text
                      x={t.x + t.w / 2}
                      y={t.y + 18}
                      textAnchor="middle"
                      fontSize="11"
                      fill={NAVY}
                      fontWeight="600"
                    >
                      {t.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </div>

        {/* input bar */}
        <div className="mt-2.5 flex items-center gap-2 rounded-full border border-hairline bg-white px-3.5 py-1.5">
          <span className="flex-1 truncate text-[12px] text-ink-faint">
            Refine this process&hellip;
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cobalt text-white">
            <PaperPlaneRight size={13} weight="fill" />
          </span>
        </div>
      </div>
    </div>
  );
}
