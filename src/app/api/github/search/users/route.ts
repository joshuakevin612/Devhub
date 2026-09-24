import { NextRequest } from "next/server";
import { searchUsers, GitHubApiError, GitHubRateLimitError } from "@/lib/github";
import { ok, fail, tooManyRequests, serverError } from "@/lib/apiResponse";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const page = Number(searchParams.get("page") ?? "1");
  const perPage = Math.min(Number(searchParams.get("per_page") ?? "20"), 50);

  if (!q || q.trim().length === 0) {
    return fail("Query parameter 'q' is required", 400);
  }

  try {
    const { data, rateLimit } = await searchUsers(q, page, perPage);
    const res = ok({
      totalCount: data.total_count,
      incomplete: data.incomplete_results,
      items: data.items,
      page,
      perPage,
    });
    if (rateLimit) res.headers.set("X-GitHub-RateLimit-Remaining", String(rateLimit.remaining));
    return res;
  } catch (err) {
    if (err instanceof GitHubRateLimitError) {
      return tooManyRequests(
        "GitHub API rate limit exceeded.",
        Math.max(0, err.rateLimit!.reset - Math.floor(Date.now() / 1000))
      );
    }
    if (err instanceof GitHubApiError) return fail(err.message, err.status);
    console.error("GET /api/github/search/users error", err);
    return serverError();
  }
}
