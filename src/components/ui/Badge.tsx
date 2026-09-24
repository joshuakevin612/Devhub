type Tone = "default" | "signal" | "positive" | "negative";

const toneClasses: Record<Tone, string> = {
  default: "border-hairline text-muted",
  signal: "border-signal/40 text-signal",
  positive: "border-positive/40 text-positive",
  negative: "border-negative/40 text-negative",
};

export function Badge({ children, tone = "default" }: { children: React.ReactNode; tone?: Tone }) {
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}
