import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { ok, unauthorized } from "@/lib/apiResponse";

export async function GET(request: NextRequest) {
  const user = await requireUser(request);
  if (!user) return unauthorized();

  return ok({
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  });
}
