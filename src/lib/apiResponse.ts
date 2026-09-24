import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { success: false, error: message, details: details ?? null },
    { status }
  );
}

export function unauthorized(message = "Authentication required") {
  return fail(message, 401);
}

export function notFound(message = "Not found") {
  return fail(message, 404);
}

export function serverError(message = "Internal server error") {
  return fail(message, 500);
}

export function tooManyRequests(message = "Rate limit exceeded", retryAfterSeconds?: number) {
  const res = fail(message, 429);
  if (retryAfterSeconds !== undefined) {
    res.headers.set("Retry-After", String(Math.max(0, retryAfterSeconds)));
  }
  return res;
}
