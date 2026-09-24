"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { apiGet, ApiError } from "@/lib/api";
import type { DeveloperProfileResponse, FavoriteDeveloper } from "@/types/api";
import { useAuth } from "@/components/AuthProvider";
import { SaveToggle } from "@/components/SaveToggle";
import { LanguageBar } from "@/components/LanguageBar";
import { StatBlock } from "@/components/StatBlock";
import { RepoCard } from "@/components/RepoCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { formatDate } from "@/lib/format";

export default function DeveloperProfilePage() {
  const params = useParams<{ username: string }>();
  const username = params.username;
  const { user } = useAuth();

  const [data, setData] = useState<DeveloperProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);
  const [saved, setSaved] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const profile = await apiGet<DeveloperProfileResponse>(`/api/github/users/${username}`);
      setData(profile);
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
  }, [username]);

  useEffect(() => {
    if (!user) {
      setSaved(false);
      return;
    }
    apiGet<{ favorites: FavoriteDeveloper[] }>("/api/favorites/developers")
      .then(({ favorites }) =>
        setSaved(favorites.some((f) => f.githubUsername.toLowerCase() === username.toLowerCase()))
      )
      .catch(() => setSaved(false));
  }, [user, username]);

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <Skeleton className="h-32 w-full" />
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
        <ErrorState message={error?.message ?? "Profile unavailable"} status={error?.status} onRetry={load} />
      </main>
    );
  }

  const { profile, stats, repos } = data;

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <Image
          src={profile.avatar_url}
          alt={profile.login}
          width={96}
          height={96}
          className="rounded-full border border-hairline"
        />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-semibold text-ivory">{profile.login}</h1>
            {profile.name && <span className="text-muted">{profile.name}</span>}
          </div>
          {profile.bio && <p className="mt-1 max-w-xl text-sm text-muted">{profile.bio}</p>}
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
            {profile.location && <span>{profile.location}</span>}
            {profile.blog && (
              <a href={profile.blog} target="_blank" rel="noreferrer" className="text-signal hover:underline">
                {profile.blog}
              </a>
            )}
            <span>Joined {formatDate(profile.created_at)}</span>
          </div>
        </div>
        <SaveToggle
          saved={saved}
          onChange={setSaved}
          addPath="/api/favorites/developers"
          addBody={{ githubUsername: profile.login }}
          removePath={`/api/favorites/developers/${profile.login}`}
        />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 border-y border-hairline py-6 sm:grid-cols-4">
        <StatBlock label="Followers" value={stats.followers.toLocaleString()} />
        <StatBlock label="Following" value={stats.following.toLocaleString()} />
        <StatBlock label="Public repos" value={stats.publicRepos.toLocaleString()} />
        <StatBlock label="Total stars" value={stats.totalStars.toLocaleString()} />
      </div>

      <section className="mt-8">
        <h2 className="font-mono text-sm font-medium text-ivory">Languages</h2>
        <div className="mt-3">
          <LanguageBar distribution={stats.languageDistribution} />
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-sm font-medium text-ivory">Recent repositories</h2>
          <a
            href={`https://github.com/${profile.login}?tab=repositories`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-muted hover:text-signal"
          >
            View all on GitHub
          </a>
        </div>
        {repos.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No public repositories.</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {repos.map((repo) => (
              <RepoCard key={repo.id} repo={repo} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
