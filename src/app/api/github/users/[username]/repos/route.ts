import { NextRequest } from "next/server";
import { getUserRepos, GitHubApiError, GitHubRateLimitError } from "@/lib/github";
import { ok, fail, notFound, tooManyRequests, serverError } from "@/lib/apiResponse";

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const perPage = Math.min(Number(searchParams.get("per_page") ?? "30"), 100);

  try {
    const { data: repos, rateLimit } = await getUserRepos(params.username, page, perPage);
    const res = ok({ repos, page, perPage });
    if (rateLimit) res.headers.set("X-GitHub-RateLimit-Remaining", String(rateLimit.remaining));
    return res;
  } catch (err) {
    if (err instanceof GitHubRateLimitError) {
      return tooManyRequests(
        "GitHub API rate limit exceeded.",
        Math.max(0, err.rateLimit!.reset - Math.floor(Date.now() / 1000))
      );
    }
    if (err instanceof GitHubApiError) {
      if (err.status === 404) return notFound(`GitHub user "${params.username}" not found`);
      return fail(err.message, err.status);
    }
    console.error("GET /api/github/users/[username]/repos error", err);
    return serverError();
  }
}
