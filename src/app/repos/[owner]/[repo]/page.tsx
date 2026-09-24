"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { apiGet, ApiError } from "@/lib/api";
import type { RepoDetailResponse, FavoriteRepo } from "@/types/api";
import { useAuth } from "@/components/AuthProvider";
import { SaveToggle } from "@/components/SaveToggle";
import { LanguageBar } from "@/components/LanguageBar";
import { StatBlock } from "@/components/StatBlock";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { formatDate, timeAgo } from "@/lib/format";

export default function RepoDetailPage() {
  const params = useParams<{ owner: string; repo: string }>();
  const { owner, repo } = params;
  const { user } = useAuth();

  const [data, setData] = useState<RepoDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);
  const [saved, setSaved] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const detail = await apiGet<RepoDetailResponse>(`/api/github/repos/${owner}/${repo}`);
      setData(detail);
    } catch (err) {
      setError({
        message: err instanceof ApiError ? err.message : "Something went wrong",
        status: err instanceof ApiError ? err.status : undefined,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner, repo]);

  useEffect(() => {
    if (!user) {
      setSaved(false);
      return;
    }
    apiGet<{ favorites: FavoriteRepo[] }>("/api/favorites/repos")
      .then(({ favorites }) =>
        setSaved(
          favorites.some(
            (f) =>
              f.owner.toLowerCase() === owner.toLowerCase() &&
              f.repoName.toLowerCase() === repo.toLowerCase()
          )
        )
      )
      .catch(() => setSaved(false));
  }, [user, owner, repo]);

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <Skeleton className="h-24 w-full" />
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <ErrorState message={error?.message ?? "Repository unavailable"} status={error?.status} onRetry={load} />
      </main>
    );
  }

  const { repo: repoData, languages, contributors, stats } = data;

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-semibold text-ivory">{repoData.full_name}</h1>
            {repoData.archived && <Badge tone="negative">Archived</Badge>}
            {repoData.license && <Badge>{repoData.license.name}</Badge>}
          </div>
          {repoData.description && <p className="mt-2 max-w-xl text-sm text-muted">{repoData.description}</p>}
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
            <span>Created {formatDate(repoData.created_at)}</span>
            <span>Last push {timeAgo(repoData.pushed_at)}</span>
            {repoData.homepage && (
              <a href={repoData.homepage} target="_blank" rel="noreferrer" className="text-signal hover:underline">
                {repoData.homepage}
              </a>
            )}
          </div>
        </div>
        <SaveToggle
          saved={saved}
          onChange={setSaved}
          addPath="/api/favorites/repos"
          addBody={{ owner, repoName: repo }}
          removePath={`/api/favorites/repos/${owner}/${repo}`}
        />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 border-y border-hairline py-6 sm:grid-cols-4">
        <StatBlock label="Stars" value={stats.stars.toLocaleString()} />
        <StatBlock label="Forks" value={stats.forks.toLocaleString()} />
        <StatBlock label="Open issues" value={stats.openIssues.toLocaleString()} />
        <StatBlock label="Contributors" value={stats.contributorCount.toLocaleString()} />
      </div>

      <section className="mt-8">
        <h2 className="font-mono text-sm font-medium text-ivory">Languages</h2>
        <div className="mt-3">
          <LanguageBar distribution={languages} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-mono text-sm font-medium text-ivory">Top contributors</h2>
        {contributors.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No contributor data available.</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {contributors.slice(0, 12).map((contributor) => (
              <a
                key={contributor.login}
                href={contributor.html_url}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center gap-2 rounded border border-hairline p-3 text-center transition-colors hover:border-signal"
              >
                <Image
                  src={contributor.avatar_url}
                  alt={contributor.login}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <span className="truncate text-xs text-ivory">{contributor.login}</span>
                <span className="text-xs text-muted">{contributor.contributions} commits</span>
              </a>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
