import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, signAuthToken, authCookieOptions } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";
import { created, fail, serverError } from "@/lib/apiResponse";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Invalid registration data", 422, parsed.error.flatten());
    }
    const { email, username, password, name } = parsed.data;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) {
      return fail(
        existing.email === email ? "Email already registered" : "Username already taken",
        409
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, username, password: passwordHash, name },
    });

    const token = await signAuthToken({
      sub: user.id,
      email: user.email,
      username: user.username,
    });

    const res = created({
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
    });
    const cookieOpts = authCookieOptions();
    res.cookies.set(cookieOpts.name, token, cookieOpts);
    return res;
  } catch (err) {
    console.error("POST /api/auth/register error", err);
    return serverError();
  }
}
