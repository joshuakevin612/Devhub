import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { favoriteRepoSchema } from "@/lib/validation";
import { ok, created, fail, unauthorized, serverError } from "@/lib/apiResponse";

export async function GET(request: NextRequest) {
  const user = await requireUser(request);
  if (!user) return unauthorized();

  try {
    const favorites = await prisma.favoriteRepo.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return ok({ favorites });
  } catch (err) {
    console.error("GET /api/favorites/repos error", err);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  const user = await requireUser(request);
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const parsed = favoriteRepoSchema.safeParse(body);
    if (!parsed.success) return fail("Invalid data", 422, parsed.error.flatten());

    const { owner, repoName, note } = parsed.data;

    const existing = await prisma.favoriteRepo.findUnique({
      where: { userId_owner_repoName: { userId: user.id, owner, repoName } },
    });
    if (existing) return fail("Repository already in favorites", 409);

    const favorite = await prisma.favoriteRepo.create({
      data: { userId: user.id, owner, repoName, note },
    });
    return created({ favorite });
  } catch (err) {
    console.error("POST /api/favorites/repos error", err);
    return serverError();
  }
}
