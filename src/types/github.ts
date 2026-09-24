export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  bio: string | null;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string; avatar_url: string };
  html_url: string;
  description: string | null;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string | null;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  license: { key: string; name: string } | null;
  default_branch: string;
  topics?: string[];
  archived: boolean;
}

export interface GitHubContributor {
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
}

export interface GitHubEvent {
  id: string;
  type: string;
  actor: { login: string; avatar_url: string };
  repo: { name: string };
  created_at: string;
  payload: Record<string, unknown>;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // unix timestamp (seconds)
  used: number;
}

export interface LanguageDistribution {
  [language: string]: number;
}

/**
 * GitHub's /search/users endpoint returns a much smaller "simple user"
 * object than /users/:username — no bio, followers, company, etc. Using
 * the full GitHubUser type for search results would claim fields that
 * are never actually present on the wire.
 */
export interface GitHubUserSummary {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  type: string;
  score: number;
}

export interface GitHubSearchUsersResult {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubUserSummary[];
}

export interface GitHubSearchReposResult {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubRepo[];
}
