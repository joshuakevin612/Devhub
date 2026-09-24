import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, unauthorized, notFound, serverError } from "@/lib/apiResponse";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const user = await requireUser(request);
  if (!user) return unauthorized();

  try {
    const existing = await prisma.favoriteDeveloper.findUnique({
      where: {
        userId_githubUsername: { userId: user.id, githubUsername: params.username },
      },
    });
    if (!existing) return notFound("Favorite not found");

    await prisma.favoriteDeveloper.delete({ where: { id: existing.id } });
    return ok({ message: "Removed from favorites" });
  } catch (err) {
    console.error("DELETE /api/favorites/developers/[username] error", err);
    return serverError();
  }
}
