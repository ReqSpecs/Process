"use client";

import { useEffect, useState } from "react";
import { Warning } from "@phosphor-icons/react";

/**
 * Destructive-action confirmation. The delete button stays disabled until the
 * user types the confirmation word (default "DELETE"). Submits via a server
 * action passed in `action`; render any hidden fields as children.
 */
export function ConfirmDeleteModal({
  open,
  title,
  description,
  confirmWord = "DELETE",
  confirmLabel = "Delete",
  action,
  onCancel,
  children,
}: {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmWord?: string;
  confirmLabel?: string;
  action: (formData: FormData) => void | Promise<void>;
  onCancel: () => void;
  children?: React.ReactNode;
}) {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (open) setTyped("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const armed = typed.trim().toUpperCase() === confirmWord.toUpperCase();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-[1px]"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-hairline bg-surface p-5 shadow-float">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ember-tint">
            <Warning size={18} weight="fill" className="text-signal" />
          </span>
          <div className="min-w-0">
            <h2 className="text-[16px] font-semibold text-ink">{title}</h2>
            <div className="mt-1 text-[13px] leading-relaxed text-ink-soft">
              {description}
            </div>
          </div>
        </div>

        <form action={action} className="mt-4">
          {children}
          <label className="block text-[12px] font-medium text-ink-soft">
            Type{" "}
            <span className="rounded bg-mist px-1.5 py-0.5 font-mono text-[11px] font-semibold text-ink">
              {confirmWord}
            </span>{" "}
            to confirm
          </label>
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoFocus
            autoComplete="off"
            spellCheck={false}
            className="mt-1.5 w-full rounded-lg border border-hairline bg-surface px-3 py-2 text-[14px] outline-none focus:border-signal"
            placeholder={confirmWord}
          />

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-ink-soft transition-colors hover:bg-mist"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!armed}
              className="rounded-lg bg-signal px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
