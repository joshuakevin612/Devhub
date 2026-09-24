import { NextRequest } from "next/server";
import { getUserEvents, GitHubApiError, GitHubRateLimitError } from "@/lib/github";
import { ok, fail, notFound, tooManyRequests, serverError } from "@/lib/apiResponse";

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");

  try {
    const { data: events, rateLimit } = await getUserEvents(params.username, page);

    const summary = events.reduce<Record<string, number>>((acc, e) => {
      acc[e.type] = (acc[e.type] ?? 0) + 1;
      return acc;
    }, {});

    const res = ok({ events, summary, page });
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
    console.error("GET /api/github/users/[username]/activity error", err);
    return serverError();
  }
}
