import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "./db";

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

export const AUTH_COOKIE_NAME = "devhub_token";
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface AuthTokenPayload {
  sub: string; // user id
  email: string;
  username: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signAuthToken(payload: AuthTokenPayload): Promise<string> {
  return new SignJWT({ email: payload.email, username: payload.username })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifyAuthToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (!payload.sub || typeof payload.email !== "string" || typeof payload.username !== "string") {
      return null;
    }
    return {
      sub: payload.sub,
      email: payload.email,
      username: payload.username,
    };
  } catch {
    return null;
  }
}

export function authCookieOptions() {
  return {
    name: AUTH_COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: TOKEN_TTL_SECONDS,
  };
}

/**
 * Reads and verifies the auth token from an incoming Route Handler request.
 */
export async function getAuthFromRequest(request: NextRequest): Promise<AuthTokenPayload | null> {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAuthToken(token);
}

/**
 * Reads and verifies the auth token via the Next.js `cookies()` helper.
 * Usable in Server Components / Route Handlers without a request object.
 */
export async function getAuthFromCookies(): Promise<AuthTokenPayload | null> {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAuthToken(token);
}

/**
 * Resolves the full authenticated User record for a Route Handler request,
 * or null if the request is unauthenticated / the token is invalid.
 */
export async function requireUser(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return null;
  return prisma.user.findUnique({ where: { id: auth.sub } });
}
