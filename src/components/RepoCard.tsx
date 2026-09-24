import Link from "next/link";
import type { GitHubRepo } from "@/types/github";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { formatCompactNumber } from "@/lib/format";
import { languageColor } from "@/lib/languageColors";

export function RepoCard({ repo }: { repo: GitHubRepo }) {
  return (
    <Link href={`/repos/${repo.full_name}`}>
      <Card className="flex h-full flex-col gap-2 p-4 transition-colors hover:border-signal">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-mono text-sm font-medium text-ivory">{repo.full_name}</p>
          {repo.language && (
            <Badge>
              <span
                className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
                style={{ backgroundColor: languageColor(repo.language) }}
              />
              {repo.language}
            </Badge>
          )}
        </div>
        {repo.description && <p className="line-clamp-2 text-sm text-muted">{repo.description}</p>}
        <div className="mt-auto flex gap-4 pt-1 text-xs text-muted">
          <span>★ {formatCompactNumber(repo.stargazers_count)}</span>
          <span>⑂ {formatCompactNumber(repo.forks_count)}</span>
          <span>{repo.open_issues_count} issues</span>
        </div>
      </Card>
    </Link>
  );
}
