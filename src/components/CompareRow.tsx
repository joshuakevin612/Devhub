export function CompareRow({
  label,
  value,
  winner,
}: {
  label: string;
  value: number;
  winner: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className={`font-mono ${winner ? "text-positive" : "text-ivory"}`}>
        {value.toLocaleString()}
        {winner && <span className="ml-1 text-xs">▲</span>}
      </span>
    </div>
  );
}
