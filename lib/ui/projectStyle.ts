import {
  ArrowsLeftRight,
  Bank,
  Briefcase,
  Buildings,
  Calendar,
  ChartBar,
  ChartLineUp,
  ChartPieSlice,
  ChatCircle,
  CheckCircle,
  ClipboardText,
  Clock,
  Cloud,
  Coins,
  Compass,
  CreditCard,
  CurrencyDollar,
  Database,
  Envelope,
  Factory,
  FilePlus,
  FileText,
  Flag,
  FlowArrow,
  FolderSimple,
  Gear,
  Globe,
  GraduationCap,
  Handshake,
  IdentificationCard,
  Kanban,
  Leaf,
  Lightbulb,
  ListChecks,
  Lock,
  MagnifyingGlass,
  Megaphone,
  Monitor,
  Package,
  PaperPlaneTilt,
  PuzzlePiece,
  Receipt,
  Rocket,
  Scales,
  SealCheck,
  ShieldCheck,
  ShoppingCart,
  Stack,
  Star,
  Storefront,
  Target,
  TreeStructure,
  Trophy,
  Truck,
  UserPlus,
  Users,
  UsersThree,
  Wallet,
  Wrench,
  type Icon,
} from "@phosphor-icons/react";
import type { ProjectStatus, StageColor } from "@/lib/types";

// Chevron/stage colours — shared so the board and the process sidebar match.
export const STAGE_COLORS: Record<
  StageColor,
  { fill: string; ink: string; light?: boolean }
> = {
  lime: { fill: "#AEF029", ink: "#7a9e00", light: true },
  violet: { fill: "#7C3AED", ink: "#7C3AED" },
  cobalt: { fill: "#0047AB", ink: "#0047AB" },
  ember: { fill: "#FF5722", ink: "#FF5722" },
  magenta: { fill: "#E81E62", ink: "#E81E62" },
  teal: { fill: "#0F9E7A", ink: "#0F9E7A" },
  gold: { fill: "#b45309", ink: "#b45309" },
};

export function stageColor(color: StageColor) {
  return STAGE_COLORS[color] ?? STAGE_COLORS.cobalt;
}

// Project status options — shared so the project header and the projects
// dashboard render status identically.
export const PROJECT_STATUSES: {
  value: ProjectStatus;
  label: string;
  dot: string;
  bg: string;
  text: string;
}[] = [
  { value: "draft", label: "Draft", dot: "#94a3b8", bg: "#f1f5f9", text: "#475569" },
  { value: "active", label: "Active", dot: "#0047AB", bg: "#e7effb", text: "#0047AB" },
  { value: "in_review", label: "In review", dot: "#b45309", bg: "#fbf0df", text: "#b45309" },
  { value: "complete", label: "Complete", dot: "#0F9E7A", bg: "#e2f4ee", text: "#0b7d61" },
  { value: "archived", label: "Archived", dot: "#94a3b8", bg: "#eef1f4", text: "#64748b" },
];

// Vibrant accent palette shared across the app UI (sidebar, project view,
// process library) — mirrors the marketing hero/capture mockups.
export const ACCENTS = [
  "#0047AB", // cobalt
  "#7C3AED", // violet
  "#E81E62", // magenta
  "#FF5722", // orange
  "#0F9E7A", // teal
  "#7a9e00", // lime
  "#b45309", // gold
];

const PROJECT_ICONS: Icon[] = [
  ChartLineUp,
  MagnifyingGlass,
  Users,
  UserPlus,
  Monitor,
  Package,
  Receipt,
  FolderSimple,
];

const PROC_ICONS: Icon[] = [
  FilePlus,
  ListChecks,
  SealCheck,
  ArrowsLeftRight,
  PaperPlaneTilt,
  ShieldCheck,
  Receipt,
  Package,
  CreditCard,
  MagnifyingGlass,
  ChartLineUp,
  IdentificationCard,
];

/** Stable hash so an id always maps to the same colour/icon. */
export function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

export function projectAccent(id: string): string {
  return ACCENTS[hashId(id) % ACCENTS.length];
}

export function projectIcon(id: string): Icon {
  return PROJECT_ICONS[hashId(id) % PROJECT_ICONS.length];
}

// ---- user-selectable icon & colour library (project customisation) ----

/** Curated icon library the user can pick from for a project. */
export const PROJECT_ICON_LIBRARY: { key: string; Icon: Icon }[] = [
  { key: "chart-line-up", Icon: ChartLineUp },
  { key: "chart-bar", Icon: ChartBar },
  { key: "chart-pie", Icon: ChartPieSlice },
  { key: "target", Icon: Target },
  { key: "flag", Icon: Flag },
  { key: "rocket", Icon: Rocket },
  { key: "lightbulb", Icon: Lightbulb },
  { key: "trophy", Icon: Trophy },
  { key: "star", Icon: Star },
  { key: "briefcase", Icon: Briefcase },
  { key: "buildings", Icon: Buildings },
  { key: "factory", Icon: Factory },
  { key: "storefront", Icon: Storefront },
  { key: "bank", Icon: Bank },
  { key: "currency-dollar", Icon: CurrencyDollar },
  { key: "coins", Icon: Coins },
  { key: "wallet", Icon: Wallet },
  { key: "receipt", Icon: Receipt },
  { key: "credit-card", Icon: CreditCard },
  { key: "shopping-cart", Icon: ShoppingCart },
  { key: "package", Icon: Package },
  { key: "truck", Icon: Truck },
  { key: "users", Icon: Users },
  { key: "users-three", Icon: UsersThree },
  { key: "user-plus", Icon: UserPlus },
  { key: "handshake", Icon: Handshake },
  { key: "id-card", Icon: IdentificationCard },
  { key: "graduation", Icon: GraduationCap },
  { key: "monitor", Icon: Monitor },
  { key: "database", Icon: Database },
  { key: "cloud", Icon: Cloud },
  { key: "gear", Icon: Gear },
  { key: "wrench", Icon: Wrench },
  { key: "shield", Icon: ShieldCheck },
  { key: "lock", Icon: Lock },
  { key: "flow-arrow", Icon: FlowArrow },
  { key: "tree", Icon: TreeStructure },
  { key: "kanban", Icon: Kanban },
  { key: "puzzle", Icon: PuzzlePiece },
  { key: "stack", Icon: Stack },
  { key: "folder", Icon: FolderSimple },
  { key: "file", Icon: FileText },
  { key: "file-plus", Icon: FilePlus },
  { key: "clipboard", Icon: ClipboardText },
  { key: "checklist", Icon: ListChecks },
  { key: "check-circle", Icon: CheckCircle },
  { key: "calendar", Icon: Calendar },
  { key: "clock", Icon: Clock },
  { key: "envelope", Icon: Envelope },
  { key: "chat", Icon: ChatCircle },
  { key: "megaphone", Icon: Megaphone },
  { key: "magnifier", Icon: MagnifyingGlass },
  { key: "globe", Icon: Globe },
  { key: "compass", Icon: Compass },
  { key: "scales", Icon: Scales },
  { key: "leaf", Icon: Leaf },
];

const PROJECT_ICON_MAP: Record<string, Icon> = Object.fromEntries(
  PROJECT_ICON_LIBRARY.map((i) => [i.key, i.Icon]),
);

/** Colour palette a user can pick for a project icon. */
export const PROJECT_COLOR_LIBRARY: string[] = [
  "#0047AB", // cobalt
  "#2563EB", // blue
  "#0F9E7A", // teal
  "#16A34A", // green
  "#7a9e00", // lime
  "#CA8A04", // gold
  "#EA580C", // orange
  "#FF5722", // ember
  "#E81E62", // magenta
  "#DB2777", // pink
  "#7C3AED", // violet
  "#6366F1", // indigo
  "#0891B2", // cyan
  "#475569", // slate
];

/** Resolve the icon to render: the user's pick, else the hash-based default. */
export function resolveProjectIcon(id: string, iconKey?: string | null): Icon {
  if (iconKey && PROJECT_ICON_MAP[iconKey]) return PROJECT_ICON_MAP[iconKey];
  return projectIcon(id);
}

/** Resolve the colour to render: the user's pick, else the hash-based default. */
export function resolveProjectColor(id: string, color?: string | null): string {
  return color || projectAccent(id);
}

export function processIcon(id: string): Icon {
  return PROC_ICONS[hashId(id) % PROC_ICONS.length];
}

/** "Sarah Johnson" -> "SJ"; "" -> "". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Split a multi-owner field ("Sarah Johnson, Marcus Lee & Ana") into names. */
export function splitOwners(owner: string): string[] {
  return owner
    .split(/,|&|\band\b/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Deterministic avatar colour per person, from the shared accent palette. */
export function ownerColor(name: string): string {
  return ACCENTS[hashId(name.toLowerCase()) % ACCENTS.length];
}

/** Compact relative time from an ISO string. */
export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours === 1 ? "1h ago" : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}
