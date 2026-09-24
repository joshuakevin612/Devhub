import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { favoriteDeveloperSchema } from "@/lib/validation";
import { ok, created, fail, unauthorized, serverError } from "@/lib/apiResponse";

export async function GET(request: NextRequest) {
  const user = await requireUser(request);
  if (!user) return unauthorized();

  try {
    const favorites = await prisma.favoriteDeveloper.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return ok({ favorites });
  } catch (err) {
    console.error("GET /api/favorites/developers error", err);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  const user = await requireUser(request);
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const parsed = favoriteDeveloperSchema.safeParse(body);
    if (!parsed.success) return fail("Invalid data", 422, parsed.error.flatten());

    const { githubUsername, note } = parsed.data;

    const existing = await prisma.favoriteDeveloper.findUnique({
      where: { userId_githubUsername: { userId: user.id, githubUsername } },
    });
    if (existing) return fail("Developer already in favorites", 409);

    const favorite = await prisma.favoriteDeveloper.create({
      data: { userId: user.id, githubUsername, note },
    });
    return created({ favorite });
  } catch (err) {
    console.error("POST /api/favorites/developers error", err);
    return serverError();
  }
}
