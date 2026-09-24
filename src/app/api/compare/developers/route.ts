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

async function buildDeveloperSnapshot(username: string) {
  const [{ data: profile }, { data: repos }] = await Promise.all([
    getUser(username),
    getUserRepos(username, 1, 100),
  ]);

  const languageDistribution = computeLanguageDistribution(repos);
  const topLanguages = Object.entries(languageDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([language, repoCount]) => ({ language, repoCount }));

  const accountAgeDays = Math.floor(
    (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    username: profile.login,
    name: profile.name,
    avatarUrl: profile.avatar_url,
    bio: profile.bio,
    followers: profile.followers,
    following: profile.following,
    publicRepos: profile.public_repos,
    totalStars: sumStars(repos),
    totalForks: sumForks(repos),
    topLanguages,
    accountAgeDays,
    createdAt: profile.created_at,
  };
}

type DevSnapshot = Awaited<ReturnType<typeof buildDeveloperSnapshot>>;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const a = searchParams.get("a");
  const b = searchParams.get("b");

  if (!a || !b) {
    return fail("Query parameters 'a' and 'b' (GitHub usernames) are required", 400);
  }
  if (a.toLowerCase() === b.toLowerCase()) {
    return fail("Provide two different usernames to compare", 400);
  }

  try {
    const [devA, devB] = await Promise.all([
      buildDeveloperSnapshot(a),
      buildDeveloperSnapshot(b),
    ]);

    const winner = (metric: keyof Pick<DevSnapshot, "followers" | "publicRepos" | "totalStars" | "totalForks">) =>
      devA[metric] === devB[metric] ? "tie" : devA[metric] > devB[metric] ? devA.username : devB.username;

    return ok({
      developers: [devA, devB],
      comparison: {
        followers: winner("followers"),
        publicRepos: winner("publicRepos"),
        totalStars: winner("totalStars"),
        totalForks: winner("totalForks"),
        olderAccount: devA.accountAgeDays > devB.accountAgeDays ? devA.username : devB.username,
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
      if (err.status === 404) return notFound("One or both GitHub users could not be found");
      return fail(err.message, err.status);
    }
    console.error("GET /api/compare/developers error", err);
    return serverError();
  }
}
