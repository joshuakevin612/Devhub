import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, signAuthToken, authCookieOptions } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { ok, fail, serverError } from "@/lib/apiResponse";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Invalid login data", 422, parsed.error.flatten());
    }
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return fail("Invalid email or password", 401);

    const validPassword = await verifyPassword(password, user.password);
    if (!validPassword) return fail("Invalid email or password", 401);

    const token = await signAuthToken({
      sub: user.id,
      email: user.email,
      username: user.username,
    });

    const res = ok({
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
    });
    const cookieOpts = authCookieOptions();
    res.cookies.set(cookieOpts.name, token, cookieOpts);
    return res;
  } catch (err) {
    console.error("POST /api/auth/login error", err);
    return serverError();
  }
}
