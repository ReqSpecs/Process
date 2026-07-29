"use client";

import { useState, useTransition } from "react";
import { Check } from "@phosphor-icons/react";
import { saveWorkspaceSettings, updateWorkspaceProfile } from "@/app/(app)/settings/actions";
import {
  PROJECT_COLOR_LIBRARY,
  PROJECT_ICON_LIBRARY,
} from "@/lib/ui/projectStyle";
import type { WorkspaceSettings } from "@/lib/ui/settings";
import { Card, Field, PrimaryButton, TextInput } from "./ui";

const ICON_MAP = Object.fromEntries(PROJECT_ICON_LIBRARY.map((i) => [i.key, i.Icon]));

export function WorkspaceSection({
  workspaceName,
  description,
  settings,
}: {
  workspaceName: string;
  description: string;
  settings: WorkspaceSettings;
}) {
  const [icon, setIcon] = useState(settings.branding.logoIcon);
  const [color, setColor] = useState(settings.branding.logoColor);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [, startTransition] = useTransition();

  const LogoIcon = ICON_MAP[icon] ?? PROJECT_ICON_LIBRARY[0].Icon;

  const saveBranding = (next: { logoIcon?: string; logoColor?: string }) => {
    startTransition(() => saveWorkspaceSettings({ branding: next }));
  };

  return (
    <div className="space-y-5">
      <Card title="Workspace logo" desc="A visual mark for your workspace.">
        <div className="flex items-center gap-4 py-4">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: `${color}1a` }}
          >
            <LogoIcon size={28} weight="bold" color={color} />
          </span>
          <button
            onClick={() => setPickerOpen((o) => !o)}
            className="rounded-full border border-hairline bg-surface px-4 py-2 text-[13px] font-semibold text-ink transition-colors hover:border-ink-faint"
          >
            {pickerOpen ? "Done" : "Change logo"}
          </button>
        </div>

        {pickerOpen && (
          <div className="space-y-4 border-t border-hairline py-4">
            <div>
              <p className="mb-2 text-[12.5px] font-medium text-ink-soft">Colour</p>
              <div className="flex flex-wrap gap-2">
                {PROJECT_COLOR_LIBRARY.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setColor(c);
                      saveBranding({ logoColor: c });
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-full ring-1 ring-black/10"
                    style={{ background: c }}
                    aria-label={`Colour ${c}`}
                  >
                    {color === c && <Check size={14} weight="bold" color="#fff" />}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[12.5px] font-medium text-ink-soft">Icon</p>
              <div className="grid grid-cols-9 gap-1.5">
                {PROJECT_ICON_LIBRARY.map(({ key, Icon }) => (
                  <button
                    key={key}
                    onClick={() => {
                      setIcon(key);
                      saveBranding({ logoIcon: key });
                    }}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                      icon === key
                        ? "bg-cobalt-wash text-cobalt ring-1 ring-cobalt/30"
                        : "text-ink-soft hover:bg-mist"
                    }`}
                    aria-label={key}
                  >
                    <Icon size={18} weight="bold" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card title="Workspace details" desc="Your workspace is the container above your projects.">
        <form action={updateWorkspaceProfile}>
          <Field label="Workspace name" htmlFor="ws-name">
            <TextInput id="ws-name" name="name" defaultValue={workspaceName} placeholder="Workspace name" />
          </Field>
          <Field label="Description" hint="A short line about this team or client.">
            <textarea
              name="description"
              defaultValue={description}
              rows={3}
              placeholder="e.g. Sydney University Finance Team"
              className="w-full resize-none rounded-lg border border-hairline bg-surface px-3 py-2 text-[14px] text-ink outline-none placeholder:text-ink-faint focus:border-cobalt"
            />
          </Field>
          <div className="flex justify-end py-3.5">
            <PrimaryButton type="submit">Save</PrimaryButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
