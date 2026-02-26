import React from "react";

export function Panel({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-blaze-line bg-blaze-panel p-5 shadow-[0_0_0_1px_rgba(17,214,163,0.04)]">
      {title ? <div className="mb-4 text-sm tracking-widest text-blaze-muted">{title.toUpperCase()}</div> : null}
      {children}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between">
        <label className="text-sm text-blaze-muted">{label}</label>
        {hint ? <span className="text-xs text-blaze-muted/70">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={"w-full rounded-xl border border-blaze-line bg-blaze-panel2 px-3 py-2 text-sm outline-none focus:border-blaze-accent " + (props.className ?? "")}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={"w-full rounded-xl border border-blaze-line bg-blaze-panel2 px-3 py-2 text-sm outline-none focus:border-blaze-accent " + (props.className ?? "")}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={"w-full rounded-xl border border-blaze-line bg-blaze-panel2 px-3 py-2 text-sm outline-none focus:border-blaze-accent " + (props.className ?? "")}
    />
  );
}

export function Button({ variant = "primary", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const base = "rounded-xl px-4 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "bg-blaze-accent text-black hover:bg-blaze-accent2"
      : variant === "danger"
      ? "bg-blaze-danger text-black hover:opacity-90"
      : "border border-blaze-line bg-transparent text-blaze-text hover:bg-white/5";
  return <button {...props} className={base + " " + styles + " " + (props.className ?? "")} />;
}

export function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-blaze-line bg-white/5 px-3 py-1 text-xs text-blaze-muted">{children}</span>;
}

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-blaze-accent' : 'bg-blaze-line'}`}
    >
      <div className={`w-5 h-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}
