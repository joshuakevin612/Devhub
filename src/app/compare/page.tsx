"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiGet, ApiError } from "@/lib/api";
import type { DeveloperCompareResponse, RepoCompareResponse } from "@/types/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { LanguageBar } from "@/components/LanguageBar";
import { CompareRow } from "@/components/CompareRow";

type Mode = "developers" | "repos";

function CompareInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get("mode") as Mode) ?? "developers";

  const [mode, setMode] = useState<Mode>(initialMode);
  const [a, setA] = useState(searchParams.get("a") ?? "");
  const [b, setB] = useState(searchParams.get("b") ?? "");
  const [devResult, setDevResult] = useState<DeveloperCompareResponse | null>(null);
  const [repoResult, setRepoResult] = useState<RepoCompareResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setDevResult(null);
    setRepoResult(null);
    setError(null);
  }

  async function runCompare(e: FormEvent) {
    e.preventDefault();
    if (!a.trim() || !b.trim()) return;
    setLoading(true);
    setError(null);
    router.push(`/compare?mode=${mode}&a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`);
    try {
      if (mode === "developers") {
        const data = await apiGet<DeveloperCompareResponse>(
          `/api/compare/developers?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`
        );
        setDevResult(data);
      } else {
        const data = await apiGet<RepoCompareResponse>(
          `/api/compare/repos?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`
        );
        setRepoResult(data);
      }
    } catch (err) {
      setError({
        message: err instanceof ApiError ? err.message : "Something went wrong",
        status: err instanceof ApiError ? err.status : undefined,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-mono text-2xl font-semibold text-ivory">Compare</h1>
      <p className="mt-1 text-sm text-muted">Put two developers or two repos head to head.</p>

      <div className="mt-6 inline-flex rounded border border-hairline p-1 text-sm">
        {(["developers", "repos"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`rounded px-3 py-1.5 transition-colors ${
              mode === m ? "bg-signal text-ink" : "text-muted hover:text-ivory"
            }`}
          >
            {m === "developers" ? "Developers" : "Repositories"}
          </button>
        ))}
      </div>

      <form onSubmit={runCompare} className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end">
        <Input
          label={mode === "developers" ? "Developer A" : "Repo A (owner/repo)"}
          value={a}
          onChange={(e) => setA(e.target.value)}
          placeholder={mode === "developers" ? "torvalds" : "facebook/react"}
        />
        <Input
          label={mode === "developers" ? "Developer B" : "Repo B (owner/repo)"}
          value={b}
          onChange={(e) => setB(e.target.value)}
          placeholder={mode === "developers" ? "gaearon" : "vuejs/core"}
        />
        <Button type="submit" loading={loading}>
          Compare
        </Button>
      </form>

      <div className="mt-10">
        {loading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        )}

        {!loading && error && <ErrorState message={error.message} status={error.status} />}

        {!loading && !error && mode === "developers" && devResult && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {devResult.developers.map((dev) => (
              <div key={dev.username} className="rounded border border-hairline p-5">
                <p className="font-mono text-sm font-medium text-ivory">{dev.username}</p>
                {dev.name && <p className="text-xs text-muted">{dev.name}</p>}
                <div className="mt-4 flex flex-col gap-2 text-sm">
                  <CompareRow
                    label="Followers"
                    value={dev.followers}
                    winner={devResult.comparison.followers === dev.username}
                  />
                  <CompareRow
                    label="Public repos"
                    value={dev.publicRepos}
                    winner={devResult.comparison.publicRepos === dev.username}
                  />
                  <CompareRow
                    label="Total stars"
                    value={dev.totalStars}
                    winner={devResult.comparison.totalStars === dev.username}
                  />
                  <CompareRow
                    label="Total forks"
                    value={dev.totalForks}
                    winner={devResult.comparison.totalForks === dev.username}
                  />
                  <CompareRow
                    label="Account age (days)"
                    value={dev.accountAgeDays}
                    winner={devResult.comparison.olderAccount === dev.username}
                  />
                </div>
                {dev.topLanguages.length > 0 && (
                  <div className="mt-4">
                    <LanguageBar
                      distribution={Object.fromEntries(dev.topLanguages.map((l) => [l.language, l.repoCount]))}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && !error && mode === "repos" && repoResult && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {repoResult.repos.map((repo) => (
              <div key={repo.fullName} className="rounded border border-hairline p-5">
                <p className="font-mono text-sm font-medium text-ivory">{repo.fullName}</p>
                {repo.description && <p className="mt-1 text-xs text-muted">{repo.description}</p>}
                <div className="mt-4 flex flex-col gap-2 text-sm">
                  <CompareRow label="Stars" value={repo.stars} winner={repoResult.comparison.stars === repo.fullName} />
                  <CompareRow label="Forks" value={repo.forks} winner={repoResult.comparison.forks === repo.fullName} />
                  <CompareRow
                    label="Open issues"
                    value={repo.openIssues}
                    winner={repoResult.comparison.openIssues === repo.fullName}
                  />
                  <CompareRow
                    label="Watchers"
                    value={repo.watchers}
                    winner={repoResult.comparison.watchers === repo.fullName}
                  />
                  <CompareRow
                    label="Contributors"
                    value={repo.contributorCount}
                    winner={repoResult.comparison.contributorCount === repo.fullName}
                  />
                </div>
                <div className="mt-4">
                  <LanguageBar distribution={repo.languages} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={null}>
      <CompareInner />
    </Suspense>
  );
}
