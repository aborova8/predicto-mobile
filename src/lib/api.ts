// Token + 401 handling are dependency-injected via `configureApi` so the
// auth context can wire them in without creating a circular import.

import type { Platform as RNPlatform } from 'react-native';
import { Platform } from 'react-native';

const RAW_BASE = process.env.EXPO_PUBLIC_API_URL;
if (!RAW_BASE) {
  // eslint-disable-next-line no-console
  console.warn('[api] EXPO_PUBLIC_API_URL is not set. Network calls will fail.');
}

// Refuse to ship insecure HTTP in staging/production builds — bearer tokens
// over plain HTTP can be intercepted on hostile networks. Dev builds keep
// http://localhost working so the simulator can hit a local backend.
const APP_ENV = process.env.EXPO_PUBLIC_APP_ENV;
if (
  RAW_BASE &&
  RAW_BASE.startsWith('http://') &&
  (APP_ENV === 'production' || APP_ENV === 'staging')
) {
  throw new Error(
    `[api] Refusing to use insecure HTTP base URL "${RAW_BASE}" in ${APP_ENV} build. Use https://`,
  );
}

// On Android emulators, host-machine localhost is reachable as 10.0.2.2.
// We auto-rewrite localhost-pointing URLs so devs don't have to remember.
function resolveBase(raw: string | undefined): string {
  if (!raw) return '';
  const trimmed = raw.replace(/\/$/, '');
  if ((Platform as typeof RNPlatform).OS === 'android') {
    return trimmed.replace(/(https?:\/\/)(localhost|127\.0\.0\.1)/, '$110.0.2.2');
  }
  return trimmed;
}

const BASE = resolveBase(RAW_BASE);

// 30s should comfortably cover the slowest legitimate request (avatar upload
// over a 3G link); anything past this is more likely a hung connection.
const DEFAULT_TIMEOUT_MS = 30_000;

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Surfaced when a FormData request 401s and the access token has just been
// refreshed — callers should rebuild and re-send the request to pick up the
// fresh bearer. FormData can't be transparently retried because RN's fetch
// may consume the underlying stream on first send.
export const API_RETRY_AFTER_REFRESH = 'RETRY_AFTER_REFRESH';

interface ApiConfig {
  getToken: () => string | null;
  // Returns a fresh access token. Throws if refresh is impossible (no
  // refresh token, or the refresh-token endpoint itself returns 401).
  refreshAccessToken: () => Promise<string>;
  onUnauthorized: () => void;
}

let config: ApiConfig = {
  getToken: () => null,
  refreshAccessToken: () => Promise.reject(new Error('refreshAccessToken not configured')),
  onUnauthorized: () => {},
};

export function configureApi(next: ApiConfig) {
  config = next;
}

// Single-flight refresh: concurrent 401s share one in-flight refresh promise
// instead of stampeding /auth/refresh and racing each other's rotations
// (which would invalidate one another).
let inflightRefresh: Promise<string> | null = null;

function attemptRefresh(): Promise<string> {
  if (inflightRefresh) return inflightRefresh;
  inflightRefresh = config
    .refreshAccessToken()
    .finally(() => {
      inflightRefresh = null;
    });
  return inflightRefresh;
}

interface RequestOpts {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  formData?: FormData;
  noAuth?: boolean;
  // Per-request override for the default fetch timeout.
  timeoutMs?: number;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function request<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const url = `${BASE}${path}`;
  const headers: Record<string, string> = { Accept: 'application/json' };

  let body: BodyInit | undefined;
  if (opts.formData) {
    body = opts.formData;
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }

  if (!opts.noAuth) {
    const token = config.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetchWithTimeout(
      url,
      { method: opts.method ?? (body ? 'POST' : 'GET'), headers, body },
      opts.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    );
  } catch (err) {
    if ((err as { name?: string })?.name === 'AbortError') {
      throw new ApiError(
        0,
        'Request timed out. Check your connection and try again.',
        'TIMEOUT',
        err,
      );
    }
    throw new ApiError(0, 'Network request failed. Check your connection and try again.', 'NETWORK_ERROR', err);
  }

  if (res.status === 204) return undefined as T;

  // 401 handling: attempt a single, shared refresh, then retry the original
  // request once with the new access token. If refresh fails (no refresh
  // token, expired refresh token, or refresh endpoint returns 401) we fall
  // through to onUnauthorized() which the auth context turns into a sign-out.
  // We skip the retry for explicitly-noAuth calls (no token to refresh, and
  // the refresh endpoint itself is noAuth so this also breaks the loop) and
  // for FormData bodies — React Native's fetch may consume the FormData on
  // the first send, so replaying could upload empty payloads.
  if (res.status === 401 && !opts.noAuth && !opts.formData) {
    try {
      const fresh = await attemptRefresh();
      const retryHeaders = { ...headers, Authorization: `Bearer ${fresh}` };
      res = await fetchWithTimeout(
        url,
        { method: opts.method ?? (body ? 'POST' : 'GET'), headers: retryHeaders, body },
        opts.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      );
    } catch {
      // Refresh impossible — fall through to the standard 401 handling below.
    }
  } else if (res.status === 401 && !opts.noAuth && opts.formData) {
    // FormData bodies can't be transparently retried (see above), but we can
    // still refresh the token so the *next* attempt succeeds. Signal to the
    // caller with a distinct error code that the upload should be re-issued
    // with a fresh access token. If the refresh itself fails, fall through to
    // the standard 401 path (sign-out via onUnauthorized).
    try {
      await attemptRefresh();
      throw new ApiError(
        401,
        'Token refreshed — please retry the upload.',
        API_RETRY_AFTER_REFRESH,
      );
    } catch (err) {
      if (err instanceof ApiError) throw err;
      // Refresh impossible — fall through to standard 401 handling below.
    }
  }

  const text = await res.text();
  let json: unknown = undefined;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      throw new ApiError(res.status, text || `Request failed (${res.status})`);
    }
  }

  if (!res.ok) {
    const err = (json as { error?: { message?: string; code?: string; details?: unknown } } | undefined)?.error;
    if (res.status === 401) {
      config.onUnauthorized();
    }
    throw new ApiError(
      res.status,
      err?.message ?? `Request failed (${res.status})`,
      err?.code,
      err?.details,
    );
  }

  return json as T;
}

export const api = {
  get: <T>(path: string, opts?: Omit<RequestOpts, 'method' | 'body' | 'formData'>) =>
    request<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOpts, 'method' | 'body' | 'formData'>) =>
    request<T>(path, { ...opts, method: 'POST', body }),
  postForm: <T>(
    path: string,
    formData: FormData,
    opts?: Omit<RequestOpts, 'body' | 'formData' | '_isRetry'> & { method?: 'POST' | 'PUT' | 'PATCH' },
  ) => request<T>(path, { ...opts, method: opts?.method ?? 'POST', formData }),
  put: <T>(path: string, body?: unknown, opts?: Omit<RequestOpts, 'method' | 'body' | 'formData'>) =>
    request<T>(path, { ...opts, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, opts?: Omit<RequestOpts, 'method' | 'body' | 'formData'>) =>
    request<T>(path, { ...opts, method: 'PATCH', body }),
  delete: <T>(path: string, body?: unknown, opts?: Omit<RequestOpts, 'method' | 'body' | 'formData'>) =>
    request<T>(path, { ...opts, method: 'DELETE', body }),
};

type QueryValue = string | number | boolean | Date | null | undefined;

export function buildQuery(params: { [key: string]: QueryValue }): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    const serialized = value instanceof Date ? value.toISOString() : String(value);
    parts.push(`${key}=${encodeURIComponent(serialized)}`);
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.message) return err.message;
  return fallback;
}
