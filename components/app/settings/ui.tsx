"use client";

import type { ReactNode } from "react";

export function Card({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-panel border border-hairline bg-surface">
      <div className="border-b border-hairline px-5 py-4">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {desc && <p className="mt-0.5 text-[13px] text-ink-soft">{desc}</p>}
      </div>
      <div className="px-5 py-1.5">{children}</div>
    </section>
  );
}

export function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-hairline py-3.5 last:border-0">
      <div className="min-w-0">
        <p className="text-[13.5px] font-medium text-ink">{label}</p>
        {hint && <p className="mt-0.5 text-[12.5px] text-ink-faint">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-hairline py-3.5 last:border-0">
      <label
        htmlFor={htmlFor}
        className="block text-[13.5px] font-medium text-ink"
      >
        {label}
      </label>
      {hint && <p className="mt-0.5 text-[12.5px] text-ink-faint">{hint}</p>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-cobalt" : "bg-mist"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-soft transition-all ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-hairline bg-paper p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
            value === o.value
              ? "bg-surface text-ink shadow-soft"
              : "text-ink-soft hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Select<T extends string>({
  value,
  onChange,
  options,
  id,
}: {
  value: T;
  onChange: (next: T) => void;
  options: { value: T; label: string }[];
  id?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="rounded-lg border border-hairline bg-surface px-3 py-2 text-[13.5px] font-medium text-ink outline-none focus:border-cobalt"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function TextInput({
  id,
  name,
  defaultValue,
  value,
  onChange,
  placeholder,
  readOnly,
  type = "text",
}: {
  id?: string;
  name?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  type?: string;
}) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      defaultValue={defaultValue}
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      placeholder={placeholder}
      readOnly={readOnly}
      autoComplete="off"
      className={`w-full rounded-lg border border-hairline px-3 py-2 text-[14px] text-ink outline-none placeholder:text-ink-faint focus:border-cobalt ${
        readOnly ? "bg-mist text-ink-soft" : "bg-surface"
      }`}
    />
  );
}

export function PrimaryButton({
  children,
  type = "button",
  onClick,
  disabled,
}: {
  children: ReactNode;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="rounded-full bg-cobalt px-5 py-2 text-[13.5px] font-semibold text-white shadow-soft transition-colors hover:bg-cobalt-deep disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  type = "button",
  onClick,
  disabled,
}: {
  children: ReactNode;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="rounded-full border border-hairline bg-surface px-5 py-2 text-[13.5px] font-semibold text-ink transition-colors hover:border-ink-faint disabled:opacity-60"
    >
      {children}
    </button>
  );
}
