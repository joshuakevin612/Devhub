import type {
  GitHubUser,
  GitHubUserSummary,
  GitHubRepo,
  GitHubContributor,
  LanguageDistribution,
} from "./github";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  name: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
}

export interface DeveloperProfileResponse {
  profile: GitHubUser;
  stats: {
    totalStars: number;
    totalForks: number;
    publicRepos: number;
    followers: number;
    following: number;
    languageDistribution: LanguageDistribution;
  };
  repos: GitHubRepo[];
}

export interface RepoDetailResponse {
  repo: GitHubRepo;
  languages: LanguageDistribution;
  contributors: GitHubContributor[];
  stats: {
    stars: number;
    forks: number;
    openIssues: number;
    watchers: number;
    contributorCount: number;
  };
}

export interface UserSearchResponse {
  totalCount: number;
  incomplete: boolean;
  items: GitHubUserSummary[];
  page: number;
  perPage: number;
}

export interface RepoSearchResponse {
  totalCount: number;
  incomplete: boolean;
  items: GitHubRepo[];
  page: number;
  perPage: number;
}

export interface FavoriteDeveloper {
  id: string;
  userId: string;
  githubUsername: string;
  note: string | null;
  createdAt: string;
}

export interface FavoriteRepo {
  id: string;
  userId: string;
  owner: string;
  repoName: string;
  note: string | null;
  createdAt: string;
}

export interface DeveloperSnapshot {
  username: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  followers: number;
  following: number;
  publicRepos: number;
  totalStars: number;
  totalForks: number;
  topLanguages: { language: string; repoCount: number }[];
  accountAgeDays: number;
  createdAt: string;
}

export interface DeveloperCompareResponse {
  developers: [DeveloperSnapshot, DeveloperSnapshot];
  comparison: {
    followers: string;
    publicRepos: string;
    totalStars: string;
    totalForks: string;
    olderAccount: string;
  };
}

export interface RepoSnapshot {
  fullName: string;
  description: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  watchers: number;
  primaryLanguage: string | null;
  languages: LanguageDistribution;
  license: string | null;
  contributorCount: number;
  topContributors: GitHubContributor[];
  createdAt: string;
  lastPushedAt: string;
  archived: boolean;
}

export interface RepoCompareResponse {
  repos: [RepoSnapshot, RepoSnapshot];
  comparison: {
    stars: string;
    forks: string;
    openIssues: string;
    watchers: string;
    contributorCount: string;
    moreRecentlyActive: string;
  };
}
