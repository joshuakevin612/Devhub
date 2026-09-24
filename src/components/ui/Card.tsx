export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={`rounded border border-hairline bg-surface ${className}`}>{children}</div>;
}
