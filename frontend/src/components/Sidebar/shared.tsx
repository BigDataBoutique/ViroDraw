export function SliderRow({ label, value, min, max, step, onChange, unit }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; unit?: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      <span className="w-20 shrink-0">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 h-1.5 accent-indigo-500" />
      <span className="w-12 text-right text-xs text-slate-400 tabular-nums">
        {step < 1 ? value.toFixed(2) : Math.round(value)}{unit ?? ''}
      </span>
    </label>
  );
}

export function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input type="color" value={value} onChange={e => onChange(e.target.value)}
      className="w-6 h-6 rounded border border-slate-200 cursor-pointer p-0" />
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{title}</p>
      {children}
    </div>
  );
}
