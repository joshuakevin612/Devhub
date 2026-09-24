"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SearchBar } from "@/components/SearchBar";

type Mode = "developers" | "repos";

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("developers");

  function handleSubmit(query: string) {
    if (mode === "developers") {
      router.push(`/developers/${encodeURIComponent(query)}`);
      return;
    }
    const [owner, repo] = query.split("/");
    if (owner && repo) {
      router.push(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
    } else {
      router.push(`/repos?q=${encodeURIComponent(query)}`);
    }
  }

  return (
    <main>
      <section className="mx-auto flex max-w-4xl flex-col items-start gap-6 px-6 pb-16 pt-20 sm:pt-28">
        <span className="font-mono text-xs text-signal">devhub</span>
        <h1 className="text-4xl font-semibold leading-tight text-ivory sm:text-5xl">
          Read any GitHub profile or repo like a changelog.
        </h1>
        <p className="max-w-xl text-base text-muted">
          Search a username or a repository, get a clean breakdown of languages,
          stars, forks, contributors, and recent activity — then save it or line
          it up against another.
        </p>

        <div className="mt-4 w-full max-w-xl">
          <div className="mb-3 inline-flex rounded border border-hairline p-1 text-sm">
            {(["developers", "repos"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded px-3 py-1.5 transition-colors ${
                  mode === m ? "bg-signal text-ink" : "text-muted hover:text-ivory"
                }`}
              >
                {m === "developers" ? "Developer" : "Repository"}
              </button>
            ))}
          </div>
          <SearchBar
            placeholder={
              mode === "developers" ? "GitHub username, e.g. torvalds" : "owner/repo, e.g. facebook/react"
            }
            onSubmit={handleSubmit}
          />
        </div>
      </section>

      <section className="border-t border-hairline">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 px-6 py-14 sm:grid-cols-3">
          <Feature
            title="Analyze"
            body="Language breakdown, star and fork totals, and recent activity for any profile or repo."
          />
          <Feature
            title="Compare"
            body="Put two developers or two repositories side by side and see who wins on each metric."
          />
          <Feature
            title="Save"
            body="Bookmark developers and repos you're tracking, and find them again from your dashboard."
          />
        </div>
      </section>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-mono text-sm font-medium text-ivory">{title}</h2>
      <p className="text-sm text-muted">{body}</p>
    </div>
  );
}
