import { prisma } from "./db";
import type {
  GitHubUser,
  GitHubRepo,
  GitHubContributor,
  GitHubEvent,
  RateLimitInfo,
  LanguageDistribution,
  GitHubSearchUsersResult,
  GitHubSearchReposResult,
} from "@/types/github";

const GITHUB_API_BASE = "https://api.github.com";

export class GitHubApiError extends Error {
  status: number;
  rateLimit?: RateLimitInfo;

  constructor(message: string, status: number, rateLimit?: RateLimitInfo) {
    super(message);
    this.name = "GitHubApiError";
    this.status = status;
    this.rateLimit = rateLimit;
  }
}

export class GitHubRateLimitError extends GitHubApiError {
  constructor(rateLimit: RateLimitInfo) {
    super("GitHub API rate limit exceeded", 429, rateLimit);
    this.name = "GitHubRateLimitError";
  }
}

function parseRateLimit(headers: Headers): RateLimitInfo {
  return {
    limit: Number(headers.get("x-ratelimit-limit") ?? 0),
    remaining: Number(headers.get("x-ratelimit-remaining") ?? 0),
    reset: Number(headers.get("x-ratelimit-reset") ?? 0),
    used: Number(headers.get("x-ratelimit-used") ?? 0),
  };
}

interface RawFetchResult<T> {
  data: T;
  etag: string | null;
  rateLimit: RateLimitInfo;
  notModified: boolean;
}

/**
 * Low-level call to the GitHub REST API with optional conditional-request
 * (ETag) support and structured rate-limit handling. Uses GITHUB_TOKEN if
 * present (5000 req/hr) and otherwise falls back to unauthenticated
 * requests (60 req/hr) — the cache layer below is what makes the
 * unauthenticated tier viable for real usage.
 */
async function githubRequest<T>(
  path: string,
  options: { etag?: string | null } = {}
): Promise<RawFetchResult<T>> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.etag) headers["If-None-Match"] = options.etag;

  const res = await fetch(`${GITHUB_API_BASE}${path}`, { headers, cache: "no-store" });
  const rateLimit = parseRateLimit(res.headers);
  const etag = res.headers.get("etag");

  if (res.status === 304) {
    return { data: null as T, etag, rateLimit, notModified: true };
  }

  if (res.status === 403 && rateLimit.remaining === 0) {
    throw new GitHubRateLimitError(rateLimit);
  }

  if (res.status === 404) {
    throw new GitHubApiError("GitHub resource not found", 404, rateLimit);
  }

  if (!res.ok) {
    let message = `GitHub API error (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      // ignore parse failure, keep default message
    }
    throw new GitHubApiError(message, res.status, rateLimit);
  }

  const data = (await res.json()) as T;
  return { data, etag, rateLimit, notModified: false };
}

/**
 * Fetch-and-cache wrapper backed by the GithubCache table.
 *
 * Flow:
 *  1. If we have a fresh (non-expired) cache row, serve it with zero
 *     GitHub API calls.
 *  2. If the cache is stale, issue a conditional request using the stored
 *     ETag. A 304 costs no rate-limit quota on GitHub's side and just
 *     refreshes our local expiry.
 *  3. On a real 200, update the cache with the new payload + ETag.
 *  4. If GitHub is rate-limited or erroring and we have *any* cached
 *     payload (even expired), serve that stale copy rather than failing.
 */
async function cachedGithubRequest<T>(
  cacheKey: string,
  path: string,
  ttlSeconds: number
): Promise<{ data: T; rateLimit: RateLimitInfo | null; fromCache: boolean }> {
  const cached = await prisma.githubCache.findUnique({ where: { cacheKey } });
  const now = new Date();

  if (cached && cached.expiresAt > now) {
    return { data: cached.payload as T, rateLimit: null, fromCache: true };
  }

  try {
    const result = await githubRequest<T>(path, { etag: cached?.etag ?? null });

    if (result.notModified && cached) {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
      await prisma.githubCache.update({
        where: { cacheKey },
        data: { expiresAt, fetchedAt: now },
      });
      return { data: cached.payload as T, rateLimit: result.rateLimit, fromCache: true };
    }

    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    await prisma.githubCache.upsert({
      where: { cacheKey },
      create: {
        cacheKey,
        endpoint: path,
        payload: result.data as object,
        etag: result.etag,
        expiresAt,
      },
      update: {
        payload: result.data as object,
        etag: result.etag,
        expiresAt,
        fetchedAt: now,
      },
    });

    return { data: result.data, rateLimit: result.rateLimit, fromCache: false };
  } catch (err) {
    if (cached && err instanceof GitHubApiError) {
      // Serve stale cache rather than propagating the failure, e.g. when
      // GitHub's rate limit is exhausted.
      return { data: cached.payload as T, rateLimit: err.rateLimit ?? null, fromCache: true };
    }
    throw err;
  }
}

// ---- Cache TTLs (seconds) — tuned per endpoint volatility ----
const TTL = {
  user: 60 * 15, // 15 min
  repo: 60 * 15,
  repoList: 60 * 10,
  languages: 60 * 60, // 1 hour — rarely changes
  contributors: 60 * 60,
  events: 60 * 5, // 5 min — activity changes often
  search: 60 * 5,
};

export async function getUser(username: string) {
  return cachedGithubRequest<GitHubUser>(
    `user:${username.toLowerCase()}`,
    `/users/${encodeURIComponent(username)}`,
    TTL.user
  );
}

export async function getUserRepos(username: string, page = 1, perPage = 30) {
  return cachedGithubRequest<GitHubRepo[]>(
    `user-repos:${username.toLowerCase()}:${page}:${perPage}`,
    `/users/${encodeURIComponent(
      username
    )}/repos?sort=updated&direction=desc&per_page=${perPage}&page=${page}`,
    TTL.repoList
  );
}

export async function getUserEvents(username: string, page = 1) {
  return cachedGithubRequest<GitHubEvent[]>(
    `user-events:${username.toLowerCase()}:${page}`,
    `/users/${encodeURIComponent(username)}/events/public?per_page=30&page=${page}`,
    TTL.events
  );
}

export async function getRepo(owner: string, repo: string) {
  return cachedGithubRequest<GitHubRepo>(
    `repo:${owner.toLowerCase()}/${repo.toLowerCase()}`,
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
    TTL.repo
  );
}

export async function getRepoLanguages(owner: string, repo: string) {
  return cachedGithubRequest<LanguageDistribution>(
    `repo-languages:${owner.toLowerCase()}/${repo.toLowerCase()}`,
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/languages`,
    TTL.languages
  );
}

export async function getRepoContributors(owner: string, repo: string) {
  return cachedGithubRequest<GitHubContributor[]>(
    `repo-contributors:${owner.toLowerCase()}/${repo.toLowerCase()}`,
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
      repo
    )}/contributors?per_page=30&anon=false`,
    TTL.contributors
  );
}

export async function searchUsers(query: string, page = 1, perPage = 20) {
  return cachedGithubRequest<GitHubSearchUsersResult>(
    `search-users:${query.toLowerCase()}:${page}:${perPage}`,
    `/search/users?q=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`,
    TTL.search
  );
}

export async function searchRepos(query: string, page = 1, perPage = 20) {
  return cachedGithubRequest<GitHubSearchReposResult>(
    `search-repos:${query.toLowerCase()}:${page}:${perPage}`,
    `/search/repositories?q=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`,
    TTL.search
  );
}

/**
 * Lightweight language distribution: counts each non-fork repo's primary
 * language. This costs one GitHub call (the repo list) per user rather
 * than one /languages call per repo, which matters a lot under a 60/hr
 * unauthenticated quota. For byte-accurate distribution on a single repo,
 * use getRepoLanguages instead.
 */
export function computeLanguageDistribution(repos: GitHubRepo[]): LanguageDistribution {
  const dist: LanguageDistribution = {};
  for (const repo of repos) {
    if (repo.fork || !repo.language) continue;
    dist[repo.language] = (dist[repo.language] ?? 0) + 1;
  }
  return dist;
}

export function sumStars(repos: GitHubRepo[]): number {
  return repos.reduce((acc, r) => acc + r.stargazers_count, 0);
}

export function sumForks(repos: GitHubRepo[]): number {
  return repos.reduce((acc, r) => acc + r.forks_count, 0);
}
