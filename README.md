# DevHub

A full-stack GitHub Developer & Repository Analytics platform. Search any
GitHub user or repo, see a clean breakdown of languages, stars, forks,
issues and contributors, save the ones you care about, and compare two
developers or two repositories head to head.

**Live deployment:** _add URL here once deployed_
**60-second demo video:** _add link here_

---

## Architecture overview

```
┌──────────────────────┐      ┌──────────────────────────┐      ┌────────────┐
│   Next.js (App Router)│      │   Next.js API routes      │      │  GitHub    │
│   React client pages   │─────▶│   (this app's backend)    │─────▶│  REST API  │
│   Tailwind CSS UI       │      │   src/app/api/**           │      └────────────┘
└──────────────────────┘      │                            │
                                │  lib/auth.ts   — JWT/bcrypt│
                                │  lib/github.ts — proxy+cache│
                                │  lib/db.ts     — Prisma     │
                                └─────────────┬──────────────┘
                                              │
                                       ┌──────▼───────┐
                                       │  PostgreSQL   │
                                       │  (Prisma ORM) │
                                       │  users, favorites,
                                       │  github_cache │
                                       └───────────────┘
```

- **Frontend:** Next.js 14 App Router, React client components, Tailwind CSS.
  Pages call the app's own `/api/*` routes with `credentials: "include"` so
  the auth cookie rides along automatically.
- **Backend:** the same Next.js app's Route Handlers. No separate server —
  `src/app/api/**` *is* the API.
- **Database:** PostgreSQL via Prisma. Four models: `User`,
  `FavoriteDeveloper`, `FavoriteRepo`, and `GithubCache` (the GitHub
  response cache — see below).
- **Auth:** custom JWT (`jose`, HS256) in an httpOnly cookie; passwords
  hashed with bcrypt. No session table, no third-party auth provider.
- **GitHub integration:** every GitHub call goes through a caching proxy
  (`lib/github.ts`) so the app survives on GitHub's 60 req/hr
  unauthenticated quota, and comfortably on the 5000 req/hr quota with a
  token configured.

## Project structure

```
devhub/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── layout.tsx, page.tsx, globals.css     # root layout + landing page
│   │   ├── login/page.tsx                        # auth
│   │   ├── register/page.tsx
│   │   ├── developers/page.tsx                   # search & discovery
│   │   ├── developers/[username]/page.tsx        # analytics profile page
│   │   ├── repos/page.tsx                        # search & discovery
│   │   ├── repos/[owner]/[repo]/page.tsx         # repo details page
│   │   ├── dashboard/page.tsx                    # saved developers/repos
│   │   ├── compare/page.tsx                      # comparison tool
│   │   └── api/                                  # backend — see Prompt 1 README section below
│   ├── components/
│   │   ├── AuthProvider.tsx, Navbar.tsx
│   │   ├── SearchBar.tsx, DeveloperCard.tsx, RepoCard.tsx
│   │   ├── LanguageBar.tsx, StatBlock.tsx, CompareRow.tsx, SaveToggle.tsx
│   │   └── ui/                                   # Button, Input, Card, Badge, Skeleton, Spinner, ErrorState
│   ├── lib/
│   │   ├── db.ts, auth.ts, github.ts, rateLimit.ts, validation.ts, apiResponse.ts
│   │   ├── api.ts            # frontend fetch wrapper (unwraps the API envelope)
│   │   ├── format.ts         # number/date formatting
│   │   └── languageColors.ts # language → color for the language bars
│   └── types/
│       ├── github.ts         # GitHub API response shapes
│       └── api.ts            # this app's own API response shapes
├── .env.example
├── package.json
├── tailwind.config.ts
└── next.config.js
```

## Setup

```bash
cp .env.example .env      # fill in DATABASE_URL, JWT_SECRET, GITHUB_TOKEN
npm install
npx prisma migrate dev --name init
npm run dev
```

Open `http://localhost:3000`.

`GITHUB_TOKEN` is optional but strongly recommended — it raises the GitHub
API quota from 60 requests/hour to 5000/hour. A classic PAT with no scopes
is enough since everything queried here is public data.

## Environment variables

```bash
# .env.example

# PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/devhub?schema=public"

# Long random secret used to sign auth JWTs (e.g. `openssl rand -base64 48`)
JWT_SECRET="replace-with-a-long-random-secret"

# Optional but strongly recommended: GitHub Personal Access Token.
# Raises GitHub API rate limit from 60/hr (unauthenticated) to 5000/hr.
# No special scopes needed for public data.
GITHUB_TOKEN="ghp_your_personal_access_token"

NODE_ENV="development"
```

## How the pieces fit together

**Auth.** Registration hashes passwords with bcrypt (cost 12); login and
registration both issue a JWT signed with `JWT_SECRET` and set it as an
httpOnly, `sameSite=lax` cookie. The frontend's `AuthProvider` calls
`GET /api/auth/me` on mount to hydrate the signed-in user; every protected
API route calls `requireUser(request)` server-side to verify the cookie
independently — the frontend state is a convenience, not the source of
truth.

**GitHub proxy + caching.** Every GitHub call goes through
`cachedGithubRequest` in `lib/github.ts`, backed by the `GithubCache`
table:
1. Fresh cache hit → served from Postgres, zero GitHub calls.
2. Stale cache → a conditional request using the stored ETag. A `304`
   costs no GitHub quota and just refreshes the local expiry.
3. Real `200` → cache updated with the new payload + ETag.
4. If GitHub is rate-limited or erroring and there's *any* cached copy
   (even expired), it's served instead of failing the request, with
   `X-GitHub-RateLimit-Remaining` still attached to the response so the
   client knows it's looking at slightly stale data.

TTLs are tuned per endpoint (profiles 15 min, languages/contributors 1
hour, activity/search 5 min).

**Frontend data flow.** Pages are client components that call the app's
own API through `lib/api.ts`'s `apiGet` / `apiPost` / `apiDelete`, which
unwrap the `{ success, data }` / `{ success: false, error }` envelope and
throw a typed `ApiError` (with `.status`) on failure — that's what lets
every page distinguish a 404 ("not found") from a 429 ("rate limited")
in its `ErrorState`.

**Loading & error states.** Every data-fetching page follows the same
pattern: `Skeleton` placeholders while loading, `ErrorState` (with a
retry button, except on 404s) on failure, and an explicit empty state
when a search or dashboard list comes back with zero results.

**Save/favorite.** `SaveToggle` is a single component reused on both the
developer and repo detail pages — it takes the add/remove endpoints as
props and prompts sign-in if the visitor isn't authenticated.

## Design notes

Dark, dense, terminal-adjacent theme: ink background (`#12141C`), warm
ivory text, and a single amber signal color for primary actions and
active states — chosen to read as a developer tool rather than a generic
SaaS dashboard. Headings and data (usernames, repo names, stat values)
are set in IBM Plex Mono; body copy is Inter. Panels use 1px hairline
borders instead of drop shadows, in keeping with an IDE-panel feel rather
than a stack of soft cards.

Responsive down to a single mobile column; focus rings use the signal
color and are never suppressed; `prefers-reduced-motion` disables the
skeleton pulse and transition animations.

## Backend API reference

### Auth

| Method | Path                 | Body                                | Notes            |
|--------|----------------------|--------------------------------------|-------------------|
| POST   | `/api/auth/register` | `email, username, password, name?`   | Sets auth cookie  |
| POST   | `/api/auth/login`    | `email, password`                    | Sets auth cookie  |
| POST   | `/api/auth/logout`   | —                                     | Clears auth cookie|
| GET    | `/api/auth/me`       | —                                     | Requires auth     |

### GitHub proxy

| Method | Path                                                 |
|--------|-------------------------------------------------------|
| GET    | `/api/github/users/:username`                          |
| GET    | `/api/github/users/:username/repos?page=&per_page=`    |
| GET    | `/api/github/users/:username/activity?page=`           |
| GET    | `/api/github/repos/:owner/:repo`                        |
| GET    | `/api/github/repos/:owner/:repo/contributors`           |
| GET    | `/api/github/search/users?q=`                           |
| GET    | `/api/github/search/repos?q=`                           |

### Favorites (require auth)

| Method | Path                                                       |
|--------|--------------------------------------------------------------|
| GET    | `/api/favorites/developers`                                  |
| POST   | `/api/favorites/developers` `{ githubUsername, note? }`      |
| DELETE | `/api/favorites/developers/:username`                        |
| GET    | `/api/favorites/repos`                                       |
| POST   | `/api/favorites/repos` `{ owner, repoName, note? }`           |
| DELETE | `/api/favorites/repos/:owner/:repo`                           |

### Comparison

| Method | Path                                                  |
|--------|---------------------------------------------------------|
| GET    | `/api/compare/developers?a=user1&b=user2`                |
| GET    | `/api/compare/repos?a=owner1/repo1&b=owner2/repo2`        |

Every response follows the same envelope:

```json
// success
{ "success": true, "data": { ... } }

// error
{ "success": false, "error": "message", "details": null }
```

## What's next

- Deployment (Vercel + a managed Postgres like Neon/Supabase is the
  path of least resistance for this stack) — fill in the Live
  Deployment URL above once shipped
- A background job to pre-warm the cache for popular profiles
- Swap the in-memory app rate limiter (`lib/rateLimit.ts`) for Redis in
  a multi-instance deployment
- Recent-activity timeline on the developer profile page (the
  `/api/github/users/:username/activity` endpoint already exists —
  just not wired into the UI yet)
