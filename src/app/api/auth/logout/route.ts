import { authCookieOptions } from "@/lib/auth";
import { ok } from "@/lib/apiResponse";

export async function POST() {
  const res = ok({ message: "Logged out" });
  const cookieOpts = authCookieOptions();
  res.cookies.set(cookieOpts.name, "", { ...cookieOpts, maxAge: 0 });
  return res;
}
