"use client";

import { useState } from "react";
import type { ProcessDocStatus, ProcessRow } from "@/lib/types";

const STATUS_OPTIONS: { value: ProcessDocStatus; label: string; cls: string }[] = [
  { value: "draft", label: "Draft", cls: "bg-mist text-ink-soft" },
  { value: "in_review", label: "In review", cls: "bg-cobalt text-white" },
  { value: "approved", label: "Approved", cls: "bg-gold-tint text-gold" },
];

const TEXT_FIELDS: { key: keyof ProcessRow; label: string; placeholder: string; rows?: number }[] = [
  { key: "doc_owner", label: "Owner", placeholder: "Who owns this process?" },
  { key: "doc_inputs", label: "Inputs", placeholder: "What triggers or feeds this process?", rows: 2 },
  { key: "doc_outputs", label: "Outputs", placeholder: "What does it produce?", rows: 2 },
  { key: "doc_systems", label: "Systems", placeholder: "ERP, CRM, spreadsheets\u2026", rows: 2 },
  { key: "doc_risks", label: "Risks", placeholder: "Compliance, bottlenecks, single points of failure\u2026", rows: 2 },
  { key: "doc_notes", label: "Notes", placeholder: "Anything else worth knowing\u2026", rows: 4 },
];

export function DocPanel({
  process,
  readOnly,
  onChange,
}: {
  process: ProcessRow;
  readOnly: boolean;
  onChange: (fields: Partial<ProcessRow>) => void;
}) {
  const [status, setStatus] = useState<ProcessDocStatus>(process.doc_status);

  return (
    <aside className="w-72 shrink-0 overflow-y-auto border-l border-hairline bg-surface sm:w-80">
      <div className="border-b border-hairline px-5 py-4">
        <h2 className="text-[14px] font-semibold text-ink">Documentation</h2>
        <p className="mt-0.5 text-[12px] text-ink-faint">
          Saved automatically with the diagram.
        </p>
      </div>

      <div className="space-y-5 px-5 py-5">
        {/* status */}
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
            Status
          </p>
          <div className="flex gap-1.5">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                disabled={readOnly}
                onClick={() => {
                  setStatus(option.value);
                  onChange({ doc_status: option.value });
                }}
                className={`rounded-full px-3 py-1 text-[12px] font-semibold transition-all ${
                  status === option.value
                    ? option.cls
                    : "bg-paper text-ink-faint hover:text-ink"
                } disabled:cursor-not-allowed`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {TEXT_FIELDS.map((field) => (
          <div key={field.key}>
            <label
              htmlFor={`doc-${field.key}`}
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-faint"
            >
              {field.label}
            </label>
            {field.rows ? (
              <textarea
                id={`doc-${field.key}`}
                defaultValue={process[field.key] as string}
                readOnly={readOnly}
                rows={field.rows}
                placeholder={field.placeholder}
                onChange={(e) => onChange({ [field.key]: e.target.value })}
                className="w-full resize-none rounded-lg border border-transparent bg-paper px-3 py-2 text-[13px] leading-relaxed text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-cobalt focus:bg-surface"
              />
            ) : (
              <input
                id={`doc-${field.key}`}
                defaultValue={process[field.key] as string}
                readOnly={readOnly}
                placeholder={field.placeholder}
                onChange={(e) => onChange({ [field.key]: e.target.value })}
                className="w-full rounded-lg border border-transparent bg-paper px-3 py-2 text-[13px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-cobalt focus:bg-surface"
              />
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
