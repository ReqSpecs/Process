"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlignBottom,
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignLeft,
  AlignRight,
  AlignTop,
  ArrowsHorizontal,
  ArrowsVertical,
  CaretDown,
  CaretUp,
  Copy,
  PaintBrush,
  PaintBucket,
  Rectangle,
  Stamp,
  TextAa,
  TextB,
  TextItalic,
  TextUnderline,
  type Icon,
} from "@phosphor-icons/react";
import type { BpmnApi, SelectionSummary } from "@/components/app/BpmnCanvas";
import type { BorderWeight, CornerStyle } from "@/lib/bpmn/stencil";

export function ProcessRibbon({
  api,
  selection,
  borderWeight,
  onBorderWeight,
  connectorWeight,
  onConnectorWeight,
  cornerStyle,
  onCornerStyle,
  open,
  onToggle,
}: {
  api: BpmnApi | null;
  selection: SelectionSummary;
  borderWeight: BorderWeight;
  onBorderWeight: (weight: BorderWeight) => void;
  connectorWeight: BorderWeight;
  onConnectorWeight: (weight: BorderWeight) => void;
  cornerStyle: CornerStyle;
  onCornerStyle: (style: CornerStyle) => void;
  open: boolean;
  onToggle: () => void;
}) {
  const one = selection.count >= 1;
  const two = selection.count >= 2;
  const three = selection.count >= 3;
  const shape = selection.hasShape;
  const size = selection.fontSize ?? 12;

  return (
    <ShowLabelsCtx.Provider value={open}>
    <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-hairline bg-paper px-3 py-1.5">
      {/* Style */}
      <Group label="Shapes">
        <Btn
          icon={Rectangle}
          iconWeight={borderWeight === "thick" ? "bold" : "thin"}
          label={
            borderWeight === "thick"
              ? "Thick borders — click for thin (whole diagram)"
              : "Thin borders — click for thick (whole diagram)"
          }
          active={borderWeight === "thick"}
          onClick={() =>
            onBorderWeight(borderWeight === "thick" ? "thin" : "thick")
          }
        />
        <ColorPicker
          label="Fill colour"
          disabled={!shape}
          onPick={(c) => api?.setFill(c)}
          swatch="#fde047"
          allowNoFill
          split
        />
      </Group>

      {/* Text */}
      <Group label="Font">
        <Btn
          icon={TextB}
          label="Bold"
          active={selection.bold}
          disabled={!one}
          onClick={() => api?.setTextStyle({ bold: !selection.bold })}
        />
        <Btn
          icon={TextItalic}
          label="Italic"
          active={selection.italic}
          disabled={!one}
          onClick={() => api?.setTextStyle({ italic: !selection.italic })}
        />
        <Btn
          icon={TextUnderline}
          label="Underline"
          active={selection.underline}
          disabled={!one}
          onClick={() => api?.setTextStyle({ underline: !selection.underline })}
        />
        <ColorPicker
          label="Text colour"
          disabled={!one}
          onPick={(c) => api?.setTextStyle({ color: c })}
          swatch="#1d1c1a"
          icon={TextAa}
          split
        />
        <div className="flex items-center gap-0.5">
          <Btn
            icon={CaretDown}
            label="Smaller text"
            disabled={!one}
            onClick={() => api?.bumpFontSize(-1)}
            compact
          />
          <FontSizeInput
            value={size}
            disabled={!one}
            onChange={(n) => api?.setFontSize(n)}
          />
          <Btn
            icon={CaretUp}
            label="Larger text"
            disabled={!one}
            onClick={() => api?.bumpFontSize(1)}
            compact
          />
        </div>
      </Group>

      {/* Arrange */}
      <Group label="Align">
        <Btn icon={AlignLeft} label="Align left" disabled={!two} onClick={() => api?.align("left")} />
        <Btn icon={AlignCenterHorizontal} label="Align centre" disabled={!two} onClick={() => api?.align("center")} />
        <Btn icon={AlignRight} label="Align right" disabled={!two} onClick={() => api?.align("right")} />
        <Divider />
        <Btn icon={AlignTop} label="Align top" disabled={!two} onClick={() => api?.align("top")} />
        <Btn icon={AlignCenterVertical} label="Align middle" disabled={!two} onClick={() => api?.align("middle")} />
        <Btn icon={AlignBottom} label="Align bottom" disabled={!two} onClick={() => api?.align("bottom")} />
        <Divider />
        <Btn icon={ArrowsHorizontal} label="Distribute horizontally" disabled={!three} onClick={() => api?.distribute("horizontal")} />
        <Btn icon={ArrowsVertical} label="Distribute vertically" disabled={!three} onClick={() => api?.distribute("vertical")} />
        <TextBtn label="Match W" disabled={!two} onClick={() => api?.matchSize("width")} />
        <TextBtn label="Match H" disabled={!two} onClick={() => api?.matchSize("height")} />
      </Group>

      {/* Connectors — diagram-wide toggles */}
      <Group label="Connectors">
        <IconToggleBtn
          onClick={() =>
            onConnectorWeight(connectorWeight === "thick" ? "thin" : "thick")
          }
          label={
            connectorWeight === "thick"
              ? "Thick connectors — click for thin (whole diagram)"
              : "Thin connectors — click for thick (whole diagram)"
          }
        >
          <LineIcon thick={connectorWeight === "thick"} />
        </IconToggleBtn>
        <IconToggleBtn
          onClick={() =>
            onCornerStyle(cornerStyle === "round" ? "sharp" : "round")
          }
          label={
            cornerStyle === "round"
              ? "Rounded corners — click for sharp (whole diagram)"
              : "Sharp corners — click for rounded (whole diagram)"
          }
        >
          <CornerIcon round={cornerStyle === "round"} />
        </IconToggleBtn>
      </Group>

      {/* Clipboard */}
      <Group label="Clipboard" last>
        <Btn icon={PaintBrush} label="Copy style" disabled={!one} onClick={() => api?.copyFormat()} />
        <Btn icon={Stamp} label="Paste style" disabled={!one} onClick={() => api?.applyFormat()} />
        <Btn icon={Copy} label="Duplicate" disabled={!one} onClick={() => api?.duplicate()} />
      </Group>

      <button
        onClick={onToggle}
        aria-label={open ? "Hide tool labels" : "Show tool labels"}
        title={open ? "Hide tool labels" : "Show tool labels"}
        className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-soft hover:bg-mist"
      >
        {open ? (
          <CaretUp size={14} weight="bold" />
        ) : (
          <CaretDown size={14} weight="bold" />
        )}
      </button>
    </div>
    </ShowLabelsCtx.Provider>
  );
}

/** Controls whether the mini section labels under each ribbon Group show. */
const ShowLabelsCtx = createContext(true);

/** Thin vertical rule to visually cluster buttons inside a Group. */
function Divider() {
  return <span className="mx-0.5 h-5 w-px shrink-0 self-center bg-hairline" />;
}

/**
 * Icon toggle button (same footprint/behaviour as Btn) for diagram-wide
 * connector settings. Renders arbitrary SVG children so we can draw thin/thick
 * lines and sharp/round corners that reflect the current state.
 */
function IconToggleBtn({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex h-7 w-7 items-center justify-center rounded-md text-ink transition-colors hover:bg-mist"
    >
      {children}
    </button>
  );
}

/** Horizontal line whose stroke reflects the thin/thick connector weight. */
function LineIcon({ thick }: { thick: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <line
        x1="2"
        y1="8"
        x2="14"
        y2="8"
        stroke="currentColor"
        strokeWidth={thick ? 3 : 1.25}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Elbow path drawn with a sharp or rounded corner. */
function CornerIcon({ round }: { round: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d={round ? "M3 13 L3 8 Q3 4 7 4 L13 4" : "M3 13 L3 4 L13 4"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin={round ? "round" : "miter"}
      />
    </svg>
  );
}

function Group({
  children,
  label,
  last,
}: {
  children: React.ReactNode;
  label: string;
  last?: boolean;
}) {
  const showLabels = useContext(ShowLabelsCtx);
  return (
    <div
      className={`flex flex-col ${
        last ? "" : "border-r border-hairline pr-1.5 mr-0.5"
      }`}
    >
      <div className="flex items-center gap-0.5">{children}</div>
      {showLabels && (
        <span className="mt-0.5 text-center text-[9px] font-medium uppercase tracking-wide text-ink-faint">
          {label}
        </span>
      )}
    </div>
  );
}

function Btn({
  icon: I,
  iconWeight = "bold",
  label,
  onClick,
  active,
  disabled,
  compact,
}: {
  icon: Icon;
  iconWeight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`flex ${compact ? "h-7 w-6" : "h-7 w-7"} items-center justify-center rounded-md transition-colors disabled:opacity-30 ${
        active
          ? "bg-cobalt-wash text-cobalt"
          : "text-ink-soft hover:bg-mist hover:text-ink"
      }`}
    >
      <I size={15} weight={iconWeight} />
    </button>
  );
}

function FontSizeInput({
  value,
  disabled,
  onChange,
}: {
  value: number;
  disabled?: boolean;
  onChange: (n: number) => void;
}) {
  const [text, setText] = useState(String(value));

  // Keep in sync when the selection / size changes (e.g. via the steppers).
  useEffect(() => setText(String(value)), [value]);

  const commit = () => {
    const n = parseInt(text, 10);
    if (!Number.isNaN(n)) onChange(Math.max(6, Math.min(96, n)));
    else setText(String(value));
  };

  return (
    <input
      type="number"
      min={6}
      max={96}
      value={text}
      disabled={disabled}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      aria-label="Font size"
      title="Font size"
      className="h-7 w-9 rounded-md border border-hairline bg-surface text-center text-[11px] tabular-nums text-ink-soft outline-none focus:border-cobalt disabled:opacity-30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
    />
  );
}

function TextBtn({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className="flex h-7 items-center rounded-md px-2 text-[11.5px] font-medium text-ink-soft transition-colors hover:bg-mist hover:text-ink disabled:opacity-30"
    >
      {label}
    </button>
  );
}

const SWATCHES = [
  "#1d1c1a", "#4b5563", "#9ca3af", "#d1d5db", "#f3f4f6", "#ffffff",
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e",
  "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
  "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e", "#78716c",
];

function fillBarStyle(color: string): React.CSSProperties {
  return {
    background:
      color === "none"
        ? "linear-gradient(to top right, #fff 43%, #ef4444 44%, #ef4444 56%, #fff 57%)"
        : color,
  };
}

function ColorPicker({
  label,
  onPick,
  disabled,
  swatch,
  icon: I,
  allowNoFill,
  split,
}: {
  label: string;
  onPick: (color: string) => void;
  disabled?: boolean;
  swatch: string;
  icon?: Icon;
  allowNoFill?: boolean;
  split?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [recent, setRecent] = useState(swatch);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    // Capture phase: the diagram canvas stops propagation on its own clicks, so
    // a bubbling listener would miss them and the panel would never close.
    document.addEventListener("mousedown", onDown, true);
    return () => document.removeEventListener("mousedown", onDown, true);
  }, [open]);

  const openPanel = () => {
    if (disabled) return;
    if (!open) {
      const r = wrapRef.current?.getBoundingClientRect();
      if (r)
        setPos({
          top: r.bottom + 4,
          left: Math.min(r.left, window.innerWidth - 200),
        });
    }
    setOpen((o) => !o);
  };

  // Apply + remember; keep the popover open so the user can try several
  // colours. It closes only when they click outside.
  const pick = (c: string) => {
    setRecent(c);
    onPick(c);
  };

  return (
    <div ref={wrapRef} className="relative flex items-center">
      {split ? (
        <div
          className={`flex items-stretch overflow-hidden rounded-md ${
            disabled ? "opacity-30" : ""
          }`}
        >
          <button
            type="button"
            title={`${label}: ${recent === "none" ? "no fill" : recent}`}
            aria-label={`Apply last ${label.toLowerCase()}`}
            disabled={disabled}
            onClick={() => !disabled && onPick(recent)}
            className="flex h-7 w-7 flex-col items-center justify-center gap-[1px] text-ink-soft hover:bg-mist hover:text-ink"
          >
            {I ? (
              <I size={14} weight="bold" />
            ) : (
              <PaintBucket size={14} weight="bold" />
            )}
            <span
              className="h-[3px] w-4 rounded-sm ring-1 ring-black/10"
              style={fillBarStyle(recent)}
            />
          </button>
          <button
            type="button"
            title={label}
            aria-label={label}
            disabled={disabled}
            onClick={openPanel}
            className={`flex h-7 w-4 items-center justify-center transition-colors ${
              open
                ? "bg-cobalt-wash text-cobalt"
                : "text-ink-faint hover:bg-mist hover:text-ink"
            }`}
          >
            <CaretDown size={9} weight="bold" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          title={label}
          aria-label={label}
          disabled={disabled}
          onClick={openPanel}
          className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors disabled:opacity-30 ${
            open
              ? "bg-cobalt-wash text-cobalt"
              : "text-ink-soft hover:bg-mist hover:text-ink"
          }`}
        >
          {I ? (
            <I size={15} weight="bold" />
          ) : (
            <span
              className="h-4 w-4 rounded-[3px] ring-1 ring-black/10"
              style={{ background: swatch }}
            />
          )}
        </button>
      )}

      {open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: "fixed", top: pos.top, left: pos.left }}
            className="z-50 w-[188px] rounded-lg border border-hairline bg-surface p-2 shadow-float"
          >
            <div className="grid grid-cols-6 gap-1">
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  onClick={() => pick(c)}
                  className="h-5 w-5 rounded-[4px] ring-1 ring-black/10 transition-transform hover:scale-110"
                  style={{ background: c }}
                />
              ))}
            </div>

            <div className="mt-2 flex items-center gap-1.5">
              {allowNoFill && (
                <button
                  type="button"
                  onClick={() => pick("none")}
                  className="flex h-7 flex-1 items-center justify-center gap-1.5 rounded-md border border-hairline text-[11px] font-medium text-ink-soft hover:bg-mist hover:text-ink"
                >
                  <span className="relative h-3.5 w-3.5 overflow-hidden rounded-[3px] bg-white ring-1 ring-black/15">
                    <span className="absolute left-1/2 top-1/2 h-px w-[20px] -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-red-500" />
                  </span>
                  No fill
                </button>
              )}
              <label className="relative flex h-7 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-hairline text-[11px] font-medium text-ink-soft hover:bg-mist hover:text-ink">
                <PaintBrush size={13} weight="bold" />
                Custom
                <input
                  type="color"
                  onInput={(e) => pick((e.target as HTMLInputElement).value)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  aria-label="Custom colour"
                />
              </label>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
