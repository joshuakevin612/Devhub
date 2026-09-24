import { NextRequest } from "next/server";
import {
  getUser,
  getUserRepos,
  computeLanguageDistribution,
  sumStars,
  sumForks,
  GitHubApiError,
  GitHubRateLimitError,
} from "@/lib/github";
import { ok, fail, notFound, tooManyRequests, serverError } from "@/lib/apiResponse";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`github-profile:${ip}`, 60, 60_000);
  if (!rl.allowed) {
    return tooManyRequests(
      "Too many requests, slow down.",
      Math.ceil((rl.resetAt - Date.now()) / 1000)
    );
  }

  try {
    const [{ data: user, rateLimit }, { data: repos }] = await Promise.all([
      getUser(params.username),
      getUserRepos(params.username, 1, 100),
    ]);

    const languageDistribution = computeLanguageDistribution(repos);

    const res = ok({
      profile: user,
      stats: {
        totalStars: sumStars(repos),
        totalForks: sumForks(repos),
        publicRepos: user.public_repos,
        followers: user.followers,
        following: user.following,
        languageDistribution,
      },
      repos: repos.slice(0, 10),
    });
    if (rateLimit) {
      res.headers.set("X-GitHub-RateLimit-Remaining", String(rateLimit.remaining));
      res.headers.set("X-GitHub-RateLimit-Limit", String(rateLimit.limit));
    }
    return res;
  } catch (err) {
    if (err instanceof GitHubRateLimitError) {
      return tooManyRequests(
        "GitHub API rate limit exceeded, please try again later.",
        Math.max(0, err.rateLimit!.reset - Math.floor(Date.now() / 1000))
      );
    }
    if (err instanceof GitHubApiError) {
      if (err.status === 404) return notFound(`GitHub user "${params.username}" not found`);
      return fail(err.message, err.status);
    }
    console.error("GET /api/github/users/[username] error", err);
    return serverError();
  }
}
