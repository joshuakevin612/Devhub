"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { apiGet, apiDelete, ApiError } from "@/lib/api";
import type { FavoriteDeveloper, FavoriteRepo } from "@/types/api";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [developers, setDevelopers] = useState<FavoriteDeveloper[] | null>(null);
  const [repos, setRepos] = useState<FavoriteRepo[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [devRes, repoRes] = await Promise.all([
        apiGet<{ favorites: FavoriteDeveloper[] }>("/api/favorites/developers"),
        apiGet<{ favorites: FavoriteRepo[] }>("/api/favorites/repos"),
      ]);
      setDevelopers(devRes.favorites);
      setRepos(repoRes.favorites);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  async function removeDeveloper(username: string) {
    await apiDelete(`/api/favorites/developers/${username}`);
    setDevelopers((prev) => prev?.filter((d) => d.githubUsername !== username) ?? null);
  }

  async function removeRepo(owner: string, repoName: string) {
    await apiDelete(`/api/favorites/repos/${owner}/${repoName}`);
    setRepos((prev) => prev?.filter((r) => !(r.owner === owner && r.repoName === repoName)) ?? null);
  }

  if (authLoading || (loading && !error)) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <Skeleton className="h-8 w-48" />
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <ErrorState message={error} onRetry={load} />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-mono text-2xl font-semibold text-ivory">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">Everything you&apos;ve saved, in one place.</p>

      <section className="mt-10">
        <h2 className="font-mono text-sm font-medium text-ivory">Saved developers</h2>
        {developers && developers.length === 0 && (
          <p className="mt-3 text-sm text-muted">
            Nothing saved yet.{" "}
            <Link href="/developers" className="text-signal hover:underline">
              Find a developer
            </Link>
            .
          </p>
        )}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {developers?.map((dev) => (
            <Card key={dev.id} className="flex items-center justify-between p-4">
              <Link
                href={`/developers/${dev.githubUsername}`}
                className="font-mono text-sm text-ivory hover:text-signal"
              >
                {dev.githubUsername}
              </Link>
              <Button variant="ghost" onClick={() => removeDeveloper(dev.githubUsername)}>
                Remove
              </Button>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-mono text-sm font-medium text-ivory">Saved repositories</h2>
        {repos && repos.length === 0 && (
          <p className="mt-3 text-sm text-muted">
            Nothing saved yet.{" "}
            <Link href="/repos" className="text-signal hover:underline">
              Find a repository
            </Link>
            .
          </p>
        )}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {repos?.map((repo) => (
            <Card key={repo.id} className="flex items-center justify-between p-4">
              <Link
                href={`/repos/${repo.owner}/${repo.repoName}`}
                className="font-mono text-sm text-ivory hover:text-signal"
              >
                {repo.owner}/{repo.repoName}
              </Link>
              <Button variant="ghost" onClick={() => removeRepo(repo.owner, repo.repoName)}>
                Remove
              </Button>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
