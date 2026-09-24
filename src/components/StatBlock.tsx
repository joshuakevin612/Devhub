export function StatBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-2xl font-semibold text-ivory">{value}</span>
      <span className="text-xs text-muted">{label}</span>
    </div>
  );
}
