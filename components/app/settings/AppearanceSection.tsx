"use client";

import { useState, useTransition } from "react";
import { saveWorkspaceSettings } from "@/app/(app)/settings/actions";
import {
  COLOR_STYLES,
  type ColorStyle,
  type WorkspaceSettings,
} from "@/lib/ui/settings";
import { Card, Row, Segmented, Toggle } from "./ui";

const THEMES: { value: string; label: string; disabled?: boolean }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark", disabled: true },
  { value: "system", label: "System", disabled: true },
];

export function AppearanceSection({
  settings,
}: {
  settings: WorkspaceSettings;
}) {
  const [appearance, setAppearance] = useState(settings.appearance);
  const [brandPrimary, setBrandPrimary] = useState(settings.branding.brandPrimary);
  const [brandAccent, setBrandAccent] = useState(settings.branding.brandAccent);
  const [, startTransition] = useTransition();

  const saveAppearance = (patch: Partial<WorkspaceSettings["appearance"]>) => {
    const next = { ...appearance, ...patch };
    setAppearance(next);
    startTransition(() => saveWorkspaceSettings({ appearance: patch }));
  };

  return (
    <div className="space-y-5">
      <Card title="Theme" desc="Dark and system themes are coming soon.">
        <Row label="Theme">
          <div className="inline-flex rounded-full border border-hairline bg-paper p-0.5">
            {THEMES.map((t) => (
              <button
                key={t.value}
                type="button"
                disabled={t.disabled}
                className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
                  appearance.theme === t.value
                    ? "bg-surface text-ink shadow-soft"
                    : t.disabled
                      ? "cursor-not-allowed text-ink-faint"
                      : "text-ink-soft hover:text-ink"
                }`}
              >
                {t.label}
                {t.disabled && <span className="ml-1 text-[10px]">soon</span>}
              </button>
            ))}
          </div>
        </Row>
      </Card>

      <Card title="Icons" desc="Show colourful icons across the app.">
        <Row label="Project icons" hint="Icons on project cards and the sidebar.">
          <Toggle
            checked={appearance.projectIcons}
            onChange={(v) => saveAppearance({ projectIcons: v })}
            label="Project icons"
          />
        </Row>
        <Row label="Process icons" hint="Icons on process cards and lists.">
          <Toggle
            checked={appearance.processIcons}
            onChange={(v) => saveAppearance({ processIcons: v })}
            label="Process icons"
          />
        </Row>
      </Card>

      <Card title="Colour style" desc="How colour is used across your workspace.">
        <Row label="Style">
          <Segmented<ColorStyle>
            options={COLOR_STYLES.map((c) => ({ value: c.value, label: c.label }))}
            value={appearance.colorStyle}
            onChange={(v) => saveAppearance({ colorStyle: v })}
          />
        </Row>
        <Row label="Primary brand colour">
          <ColorSwatch
            value={brandPrimary}
            onChange={(c) => {
              setBrandPrimary(c);
              startTransition(() => saveWorkspaceSettings({ branding: { brandPrimary: c } }));
            }}
          />
        </Row>
        <Row label="Accent brand colour">
          <ColorSwatch
            value={brandAccent}
            onChange={(c) => {
              setBrandAccent(c);
              startTransition(() => saveWorkspaceSettings({ branding: { brandAccent: c } }));
            }}
          />
        </Row>
      </Card>
    </div>
  );
}

function ColorSwatch({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-full border border-hairline bg-surface px-3 py-1.5">
      <span
        className="h-5 w-5 rounded-full ring-1 ring-black/10"
        style={{ background: value }}
      />
      <span className="text-[12.5px] font-medium tabular-nums text-ink-soft">
        {value.toUpperCase()}
      </span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
      />
    </label>
  );
}
