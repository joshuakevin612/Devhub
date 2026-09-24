"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

const links = [
  { href: "/developers", label: "Developers" },
  { href: "/repos", label: "Repositories" },
  { href: "/compare", label: "Compare" },
];

export function Navbar() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-ink/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="shrink-0 font-mono text-lg font-semibold tracking-tight text-ivory">
          dev<span className="text-signal">hub</span>
        </Link>

        <nav className="flex flex-1 gap-5 overflow-x-auto text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap transition-colors hover:text-ivory ${
                pathname?.startsWith(link.href) ? "text-ivory" : "text-muted"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          {loading ? null : user ? (
            <>
              <Link
                href="/dashboard"
                className="hidden text-sm text-muted hover:text-ivory sm:inline"
              >
                {user.username}
              </Link>
              <button
                onClick={async () => {
                  await logout();
                  router.push("/");
                }}
                className="rounded border border-hairline px-3 py-1.5 text-sm text-muted transition-colors hover:border-signal hover:text-ivory"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-muted hover:text-ivory">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded bg-signal px-3 py-1.5 text-sm font-medium text-ink transition-opacity hover:opacity-90"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
