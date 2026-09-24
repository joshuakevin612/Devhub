import { languageColor } from "@/lib/languageColors";

interface LanguageBarProps {
  distribution: Record<string, number>;
}

/**
 * Renders a language distribution as a stacked horizontal bar plus a
 * legend. Works for both a developer's repo-count breakdown and a repo's
 * byte-count breakdown — both arrive as { language: number }.
 */
export function LanguageBar({ distribution }: LanguageBarProps) {
  const entries = Object.entries(distribution).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);

  if (total === 0) {
    return <p className="text-sm text-muted">No language data available.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-raised">
        {entries.map(([language, value]) => (
          <div
            key={language}
            style={{ width: `${(value / total) * 100}%`, backgroundColor: languageColor(language) }}
            title={`${language} — ${((value / total) * 100).toFixed(1)}%`}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
        {entries.slice(0, 8).map(([language, value]) => (
          <li key={language} className="flex items-center gap-1.5 text-xs text-muted">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: languageColor(language) }} />
            {language}
            <span className="text-muted/60">{((value / total) * 100).toFixed(0)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
