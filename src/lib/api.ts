// Token + 401 handling are dependency-injected via `configureApi` so the
// auth context can wire them in without creating a circular import.

import type { Platform as RNPlatform } from 'react-native';
import { Platform } from 'react-native';

const RAW_BASE = process.env.EXPO_PUBLIC_API_URL;
if (!RAW_BASE) {
  // eslint-disable-next-line no-console
  console.warn('[api] EXPO_PUBLIC_API_URL is not set. Network calls will fail.');
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

interface ApiConfig {
  getToken: () => string | null;
  onUnauthorized: () => void;
}

let config: ApiConfig = {
  getToken: () => null,
  onUnauthorized: () => {},
};

export function configureApi(next: ApiConfig) {
  config = next;
}

interface RequestOpts {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  formData?: FormData;
  noAuth?: boolean;
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
    res = await fetch(url, {
      method: opts.method ?? (body ? 'POST' : 'GET'),
      headers,
      body,
    });
  } catch (err) {
    throw new ApiError(0, 'Network request failed. Check your connection and try again.', 'NETWORK_ERROR', err);
  }

  if (res.status === 204) return undefined as T;

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
  postForm: <T>(path: string, formData: FormData, opts?: Omit<RequestOpts, 'method' | 'body' | 'formData'>) =>
    request<T>(path, { ...opts, method: 'POST', formData }),
};

export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.message) return err.message;
  return fallback;
}
