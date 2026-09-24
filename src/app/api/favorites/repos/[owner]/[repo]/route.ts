import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, unauthorized, notFound, serverError } from "@/lib/apiResponse";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { owner: string; repo: string } }
) {
  const user = await requireUser(request);
  if (!user) return unauthorized();

  try {
    const existing = await prisma.favoriteRepo.findUnique({
      where: {
        userId_owner_repoName: { userId: user.id, owner: params.owner, repoName: params.repo },
      },
    });
    if (!existing) return notFound("Favorite not found");

    await prisma.favoriteRepo.delete({ where: { id: existing.id } });
    return ok({ message: "Removed from favorites" });
  } catch (err) {
    console.error("DELETE /api/favorites/repos/[owner]/[repo] error", err);
    return serverError();
  }
}
