import {
  MagnifyingGlass,
  Plus,
  FunnelSimple,
  SealCheck,
  UserPlus,
  Users,
  Receipt,
  ShieldCheck,
  IdentificationCard,
  CreditCard,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";

const COBALT = "#0047AB";
const VIOLET = "#7C3AED";
const MAGENTA = "#E81E62";
const ORANGE = "#FF5722";
const TEAL = "#0F9E7A";

type Status = "Published" | "In review" | "Draft";

const STATUS_STYLE: Record<Status, { bg: string; dot: string; text: string }> = {
  Published: { bg: "#e7f6ec", dot: "#22a35b", text: "#1a7f45" },
  "In review": { bg: "#fef3d6", dot: "#f59e0b", text: "#b26a02" },
  Draft: { bg: "#ecebe8", dot: "#9a958c", text: "#6b675f" },
};

type Row = {
  name: string;
  Icon: Icon;
  project: string;
  projectColor: string;
  owner: string;
  ownerColor: string;
  edited: string;
  status: Status;
  highlight?: boolean;
};

const ROWS: Row[] = [
  { name: "PO Approval", Icon: SealCheck, project: "Finance Transformation", projectColor: COBALT, owner: "AC", ownerColor: COBALT, edited: "2h ago", status: "Published", highlight: true },
  { name: "Vendor Onboarding", Icon: UserPlus, project: "Procurement Review", projectColor: VIOLET, owner: "JP", ownerColor: VIOLET, edited: "Yesterday", status: "In review" },
  { name: "Employee Onboarding", Icon: Users, project: "HR Onboarding", projectColor: MAGENTA, owner: "SM", ownerColor: MAGENTA, edited: "3d ago", status: "Published" },
  { name: "Invoice Matching", Icon: Receipt, project: "Finance Transformation", projectColor: COBALT, owner: "AC", ownerColor: COBALT, edited: "1w ago", status: "Draft" },
  { name: "Incident Response", Icon: ShieldCheck, project: "IT Change Management", projectColor: TEAL, owner: "RT", ownerColor: TEAL, edited: "2w ago", status: "Published" },
  { name: "Customer KYC", Icon: IdentificationCard, project: "Customer Onboarding", projectColor: ORANGE, owner: "LB", ownerColor: ORANGE, edited: "3w ago", status: "In review" },
  { name: "Expense Approval", Icon: CreditCard, project: "Finance Transformation", projectColor: COBALT, owner: "DK", ownerColor: COBALT, edited: "1mo ago", status: "Published" },
];

/**
 * Static "process library" table for the Capture section — a single source of
 * truth listing every process across projects. Deliberately distinct from the
 * hero's chevron/architecture mockup.
 */
export function CaptureMock() {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-surface shadow-float">
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-black/[0.07] bg-mist/40 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <div className="ml-3 min-w-0 flex-1 truncate text-xs text-ink-faint">
          ProDraw &middot; Process library
        </div>
      </div>

      {/* toolbar */}
      <div className="flex items-center gap-3 border-b border-black/[0.06] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <h3 className="text-[15px] font-semibold text-ink">All processes</h3>
          <span className="rounded-full bg-mist px-2 py-0.5 text-[11px] font-medium text-ink-faint">
            42
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-1.5 rounded-lg border border-hairline px-2.5 py-1.5 text-[12px] text-ink-faint sm:flex">
            <MagnifyingGlass size={13} weight="bold" />
            <span>Search</span>
          </div>
          <div className="hidden items-center gap-1.5 rounded-lg border border-hairline px-2.5 py-1.5 text-[12px] text-ink-soft md:flex">
            <FunnelSimple size={13} weight="bold" />
            <span>Filter</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-cobalt px-2.5 py-1.5 text-[12px] font-semibold text-white">
            <Plus size={13} weight="bold" />
            <span>New</span>
          </div>
        </div>
      </div>

      {/* table header */}
      <div className="grid grid-cols-[1.7fr_1fr_0.7fr] items-center gap-3 border-b border-black/[0.06] px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-ink-faint sm:px-5 md:grid-cols-[1.9fr_1.2fr_1fr_0.7fr_0.7fr]">
        <span>Process</span>
        <span className="hidden md:block">Project</span>
        <span className="hidden md:block">Owner</span>
        <span className="hidden md:block">Edited</span>
        <span className="md:hidden">Project</span>
        <span className="text-right md:text-left">Status</span>
      </div>

      {/* rows */}
      <div>
        {ROWS.map((r) => {
          const s = STATUS_STYLE[r.status];
          return (
            <div
              key={r.name}
              className={`grid grid-cols-[1.7fr_1fr_0.7fr] items-center gap-3 border-b border-black/[0.04] px-4 py-2.5 sm:px-5 md:grid-cols-[1.9fr_1.2fr_1fr_0.7fr_0.7fr] ${
                r.highlight ? "bg-cobalt-wash" : ""
              }`}
            >
              {/* process name */}
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                  style={{ background: `${r.projectColor}1a` }}
                >
                  <r.Icon size={13} weight="bold" color={r.projectColor} />
                </span>
                <span className="truncate text-[13px] font-medium text-ink">
                  {r.name}
                </span>
              </div>

              {/* project chip (desktop) */}
              <div className="hidden min-w-0 md:block">
                <span
                  className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{ background: `${r.projectColor}14`, color: r.projectColor }}
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: r.projectColor }}
                  />
                  <span className="truncate">{r.project}</span>
                </span>
              </div>

              {/* owner (desktop) */}
              <div className="hidden items-center gap-1.5 md:flex">
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white"
                  style={{ background: r.ownerColor }}
                >
                  {r.owner}
                </span>
              </div>

              {/* edited (desktop) */}
              <span className="hidden truncate text-[12px] text-ink-faint md:block">
                {r.edited}
              </span>

              {/* project (mobile compact) */}
              <span className="truncate text-[12px] text-ink-faint md:hidden">
                {r.project}
              </span>

              {/* status */}
              <div className="flex justify-end md:justify-start">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{ background: s.bg, color: s.text }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: s.dot }}
                  />
                  {r.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
