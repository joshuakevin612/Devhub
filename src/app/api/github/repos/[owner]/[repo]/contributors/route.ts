import { NextRequest } from "next/server";
import { getRepoContributors, GitHubApiError, GitHubRateLimitError } from "@/lib/github";
import { ok, fail, notFound, tooManyRequests, serverError } from "@/lib/apiResponse";

export async function GET(
  request: NextRequest,
  { params }: { params: { owner: string; repo: string } }
) {
  try {
    const { data: contributors, rateLimit } = await getRepoContributors(
      params.owner,
      params.repo
    );
    const res = ok({ contributors });
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
      if (err.status === 404) {
        return notFound(`Repository "${params.owner}/${params.repo}" not found`);
      }
      return fail(err.message, err.status);
    }
    console.error("GET /api/github/repos/[owner]/[repo]/contributors error", err);
    return serverError();
  }
}
