"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchBar } from "@/components/SearchBar";
import { DeveloperCard } from "@/components/DeveloperCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { apiGet, ApiError } from "@/lib/api";
import type { UserSearchResponse } from "@/types/api";

function DevelopersSearchInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const [result, setResult] = useState<UserSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);

  const runSearch = useCallback(async (query: string, pageNum: number) => {
    if (!query) {
      setResult(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<UserSearchResponse>(
        `/api/github/search/users?q=${encodeURIComponent(query)}&page=${pageNum}`
      );
      setResult(data);
    } catch (err) {
      setError({
        message: err instanceof ApiError ? err.message : "Something went wrong",
        status: err instanceof ApiError ? err.status : undefined,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    runSearch(q, page);
  }, [q, page, runSearch]);

  function handleSubmit(query: string) {
    router.push(`/developers?q=${encodeURIComponent(query)}`);
  }

  function goToPage(nextPage: number) {
    router.push(`/developers?q=${encodeURIComponent(q)}&page=${nextPage}`);
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-mono text-2xl font-semibold text-ivory">Find a developer</h1>
      <p className="mt-1 text-sm text-muted">Search by GitHub username.</p>

      <div className="mt-6 max-w-lg">
        <SearchBar placeholder="e.g. gaearon" onSubmit={handleSubmit} initialValue={q} />
      </div>

      <div className="mt-8">
        {loading && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        )}

        {!loading && error && (
          <ErrorState message={error.message} status={error.status} onRetry={() => runSearch(q, page)} />
        )}

        {!loading && !error && result && result.items.length === 0 && (
          <p className="text-sm text-muted">No developers found for &quot;{q}&quot;.</p>
        )}

        {!loading && !error && result && result.items.length > 0 && (
          <>
            <p className="mb-4 text-xs text-muted">
              {result.totalCount.toLocaleString()} result{result.totalCount === 1 ? "" : "s"}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {result.items.map((user) => (
                <DeveloperCard key={user.id} user={user} />
              ))}
            </div>
            <div className="mt-6 flex justify-center gap-3">
              <button
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
                className="rounded border border-hairline px-3 py-1.5 text-sm text-muted disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-2 py-1.5 text-sm text-muted">Page {page}</span>
              <button
                disabled={result.items.length < result.perPage}
                onClick={() => goToPage(page + 1)}
                className="rounded border border-hairline px-3 py-1.5 text-sm text-muted disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </>
        )}

        {!loading && !error && !result && (
          <p className="text-sm text-muted">Search for a GitHub username to get started.</p>
        )}
      </div>
    </main>
  );
}

export default function DevelopersSearchPage() {
  return (
    <Suspense fallback={null}>
      <DevelopersSearchInner />
    </Suspense>
  );
}
