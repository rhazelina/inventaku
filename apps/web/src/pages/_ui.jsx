// src/pages/_ui.js
import { useMemo } from "react";

export function PageShell({ title, subtitle, right, children }) {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          {subtitle ? <p className="text-sm text-neutral-600 mt-1">{subtitle}</p> : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      <div className="bg-white rounded-xl border shadow-sm p-4">{children}</div>
    </div>
  );
}

export function LoadingLine({ text = "Memuat..." }) {
  return <div className="text-sm text-neutral-600">{text}</div>;
}

export function ErrorBox({ error }) {
  if (!error) return null;
  return (
    <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
      {String(error?.message || error)}
    </div>
  );
}

export function TextInput({ label, value, onChange, placeholder, type = "text", disabled = false }) {
  return (
    <label className="space-y-1 block">
      <div className="text-xs text-neutral-600">{label}</div>
      <input
        className="w-full px-3 py-2 rounded-lg border outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    </label>
  );
}

export function SelectInput({ label, value, onChange, options, placeholder = "Pilih...", disabled = false }) {
  const normalized = useMemo(() => options || [], [options]);
  return (
    <label className="space-y-1 block">
      <div className="text-xs text-neutral-600">{label}</div>
      <select
        className="w-full px-3 py-2 rounded-lg border outline-none focus:ring-2 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {normalized.map((opt) => (
          <option key={String(opt.value)} value={String(opt.value)}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function PrimaryButton({ children, onClick, disabled }) {
  return (
    <button
      className="px-3 py-2 rounded-lg bg-black text-white text-sm disabled:opacity-50"
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  );
}

export function DangerButton({ children, onClick, disabled }) {
  return (
    <button
      className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm disabled:opacity-50"
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, onClick, disabled }) {
  return (
    <button
      className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50"
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  );
}
