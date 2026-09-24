export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

interface Envelope<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}

/**
 * Thin wrapper around fetch() that talks to DevHub's own /api routes.
 * Unwraps the { success, data } / { success: false, error } envelope
 * every route handler returns and throws ApiError on failure so callers
 * can branch on `.status` (401, 404, 429, ...) in their UI.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  let body: Envelope<T> | null = null;
  try {
    body = await res.json();
  } catch {
    // No JSON body (e.g. network failure) — fall through to generic error.
  }

  if (!res.ok || !body?.success) {
    const message = body?.error ?? `Request failed (${res.status})`;
    throw new ApiError(message, res.status, body?.details);
  }

  return body.data as T;
}

export function apiGet<T>(path: string) {
  return apiFetch<T>(path, { method: "GET" });
}

export function apiPost<T>(path: string, data?: unknown) {
  return apiFetch<T>(path, {
    method: "POST",
    body: data !== undefined ? JSON.stringify(data) : undefined,
  });
}

export function apiDelete<T>(path: string) {
  return apiFetch<T>(path, { method: "DELETE" });
}
