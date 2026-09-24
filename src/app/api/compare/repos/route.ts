import { NextRequest } from "next/server";
import {
  getRepo,
  getRepoLanguages,
  getRepoContributors,
  GitHubApiError,
  GitHubRateLimitError,
} from "@/lib/github";
import { ok, fail, notFound, tooManyRequests, serverError } from "@/lib/apiResponse";

function parseRepoSlug(slug: string): { owner: string; repo: string } | null {
  const parts = slug.split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return { owner: parts[0], repo: parts[1] };
}

async function buildRepoSnapshot(owner: string, repo: string) {
  const [{ data: repoData }, { data: languages }, { data: contributors }] = await Promise.all([
    getRepo(owner, repo),
    getRepoLanguages(owner, repo),
    getRepoContributors(owner, repo),
  ]);

  return {
    fullName: repoData.full_name,
    description: repoData.description,
    stars: repoData.stargazers_count,
    forks: repoData.forks_count,
    openIssues: repoData.open_issues_count,
    watchers: repoData.watchers_count,
    primaryLanguage: repoData.language,
    languages,
    license: repoData.license?.name ?? null,
    contributorCount: contributors.length,
    topContributors: contributors.slice(0, 5),
    createdAt: repoData.created_at,
    lastPushedAt: repoData.pushed_at,
    archived: repoData.archived,
  };
}

type RepoSnapshot = Awaited<ReturnType<typeof buildRepoSnapshot>>;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const a = searchParams.get("a"); // format: owner/repo
  const b = searchParams.get("b");

  if (!a || !b) {
    return fail("Query parameters 'a' and 'b' (each 'owner/repo') are required", 400);
  }
  const repoA = parseRepoSlug(a);
  const repoB = parseRepoSlug(b);
  if (!repoA || !repoB) {
    return fail("Repo parameters must be in 'owner/repo' format", 400);
  }

  try {
    const [snapA, snapB] = await Promise.all([
      buildRepoSnapshot(repoA.owner, repoA.repo),
      buildRepoSnapshot(repoB.owner, repoB.repo),
    ]);

    const winner = (
      metric: keyof Pick<RepoSnapshot, "stars" | "forks" | "openIssues" | "watchers" | "contributorCount">
    ) =>
      snapA[metric] === snapB[metric]
        ? "tie"
        : snapA[metric] > snapB[metric]
        ? snapA.fullName
        : snapB.fullName;

    return ok({
      repos: [snapA, snapB],
      comparison: {
        stars: winner("stars"),
        forks: winner("forks"),
        openIssues: winner("openIssues"),
        watchers: winner("watchers"),
        contributorCount: winner("contributorCount"),
        moreRecentlyActive:
          new Date(snapA.lastPushedAt).getTime() > new Date(snapB.lastPushedAt).getTime()
            ? snapA.fullName
            : snapB.fullName,
      },
    });
  } catch (err) {
    if (err instanceof GitHubRateLimitError) {
      return tooManyRequests(
        "GitHub API rate limit exceeded.",
        Math.max(0, err.rateLimit!.reset - Math.floor(Date.now() / 1000))
      );
    }
    if (err instanceof GitHubApiError) {
      if (err.status === 404) return notFound("One or both repositories could not be found");
      return fail(err.message, err.status);
    }
    console.error("GET /api/compare/repos error", err);
    return serverError();
  }
}
