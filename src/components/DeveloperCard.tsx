import Link from "next/link";
import Image from "next/image";
import type { GitHubUserSummary } from "@/types/github";
import { Card } from "./ui/Card";

export function DeveloperCard({ user }: { user: GitHubUserSummary }) {
  return (
    <Link href={`/developers/${user.login}`}>
      <Card className="flex items-center gap-4 p-4 transition-colors hover:border-signal">
        <Image
          src={user.avatar_url}
          alt={user.login}
          width={48}
          height={48}
          className="rounded-full border border-hairline"
        />
        <p className="truncate font-mono text-sm font-medium text-ivory">{user.login}</p>
      </Card>
    </Link>
  );
}
