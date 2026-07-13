"use client";

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
  LineSegment,
  LineSegments,
  PaintBrush,
  Stamp,
  TextAa,
  TextB,
  TextItalic,
  TextUnderline,
  type Icon,
} from "@phosphor-icons/react";
import type { BpmnApi, SelectionSummary } from "@/components/app/BpmnCanvas";

export function ProcessRibbon({
  api,
  selection,
  open,
  onToggle,
}: {
  api: BpmnApi | null;
  selection: SelectionSummary;
  open: boolean;
  onToggle: () => void;
}) {
  const one = selection.count >= 1;
  const two = selection.count >= 2;
  const three = selection.count >= 3;
  const shape = selection.hasShape;
  const conn = selection.hasConnection;
  const size = selection.fontSize ?? 12;

  if (!open) {
    return (
      <div className="flex shrink-0 items-center justify-between border-b border-hairline bg-paper px-4 py-1">
        <span className="text-[12px] font-medium text-ink-faint">Format</span>
        <button
          onClick={onToggle}
          aria-label="Show formatting ribbon"
          className="flex h-6 items-center gap-1 rounded-md px-2 text-[12px] font-medium text-ink-soft hover:bg-mist"
        >
          <CaretDown size={13} weight="bold" /> Show tools
        </button>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-hairline bg-paper px-3 py-1.5">
      {/* Style */}
      <Group>
        <Btn
          icon={LineSegment}
          label="Thin border"
          active={selection.borderWeight === "thin"}
          disabled={!shape}
          onClick={() => api?.setBorderWeight("thin")}
        />
        <Btn
          icon={LineSegments}
          label="Thick border"
          active={selection.borderWeight === "thick"}
          disabled={!shape}
          onClick={() => api?.setBorderWeight("thick")}
        />
        <ColorBtn
          label="Fill colour"
          disabled={!shape}
          onPick={(c) => api?.setFill(c)}
          swatch="#ffffff"
        />
      </Group>

      {/* Text */}
      <Group>
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
        <ColorBtn
          label="Text colour"
          disabled={!one}
          onPick={(c) => api?.setTextStyle({ color: c })}
          swatch="#1d1c1a"
          icon={TextAa}
        />
        <div className="flex items-center gap-0.5">
          <Btn
            icon={CaretDown}
            label="Smaller text"
            disabled={!one}
            onClick={() => api?.bumpFontSize(-1)}
            compact
          />
          <span className="w-6 text-center text-[11px] tabular-nums text-ink-soft">
            {size}
          </span>
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
      <Group>
        <Btn icon={AlignLeft} label="Align left" disabled={!two} onClick={() => api?.align("left")} />
        <Btn icon={AlignCenterVertical} label="Align centre" disabled={!two} onClick={() => api?.align("center")} />
        <Btn icon={AlignRight} label="Align right" disabled={!two} onClick={() => api?.align("right")} />
        <Btn icon={AlignTop} label="Align top" disabled={!two} onClick={() => api?.align("top")} />
        <Btn icon={AlignCenterHorizontal} label="Align middle" disabled={!two} onClick={() => api?.align("middle")} />
        <Btn icon={AlignBottom} label="Align bottom" disabled={!two} onClick={() => api?.align("bottom")} />
        <Btn icon={ArrowsHorizontal} label="Distribute horizontally" disabled={!three} onClick={() => api?.distribute("horizontal")} />
        <Btn icon={ArrowsVertical} label="Distribute vertically" disabled={!three} onClick={() => api?.distribute("vertical")} />
        <TextBtn label="Match W" disabled={!two} onClick={() => api?.matchSize("width")} />
        <TextBtn label="Match H" disabled={!two} onClick={() => api?.matchSize("height")} />
      </Group>

      {/* Connector */}
      <Group>
        <TextBtn label="Straight" disabled={!conn} onClick={() => api?.setConnectorLayout("straight")} />
        <TextBtn label="Elbow" disabled={!conn} onClick={() => api?.setConnectorLayout("orthogonal")} />
      </Group>

      {/* Clipboard */}
      <Group last>
        <Btn icon={PaintBrush} label="Copy style" disabled={!one} onClick={() => api?.copyFormat()} />
        <Btn icon={Stamp} label="Paste style" disabled={!one} onClick={() => api?.applyFormat()} />
        <Btn icon={Copy} label="Duplicate" disabled={!one} onClick={() => api?.duplicate()} />
      </Group>

      <button
        onClick={onToggle}
        aria-label="Hide formatting ribbon"
        title="Collapse ribbon"
        className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-soft hover:bg-mist"
      >
        <CaretUp size={14} weight="bold" />
      </button>
    </div>
  );
}

function Group({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return (
    <div
      className={`flex items-center gap-0.5 ${
        last ? "" : "border-r border-hairline pr-1.5 mr-0.5"
      }`}
    >
      {children}
    </div>
  );
}

function Btn({
  icon: I,
  label,
  onClick,
  active,
  disabled,
  compact,
}: {
  icon: Icon;
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
      <I size={15} weight="bold" />
    </button>
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

function ColorBtn({
  label,
  onPick,
  disabled,
  swatch,
  icon: I,
}: {
  label: string;
  onPick: (color: string) => void;
  disabled?: boolean;
  swatch: string;
  icon?: Icon;
}) {
  return (
    <label
      title={label}
      className={`relative flex h-7 w-7 items-center justify-center rounded-md ${
        disabled
          ? "opacity-30"
          : "cursor-pointer text-ink-soft hover:bg-mist hover:text-ink"
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
      <input
        type="color"
        disabled={disabled}
        onChange={(e) => onPick(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label={label}
      />
    </label>
  );
}
