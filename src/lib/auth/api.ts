// Typed wrappers around /api/auth/* endpoints. Pure functions — no state,
// no side effects beyond the network call. The auth provider (in
// AppStateContext) owns persistence and global state.

import { api } from '@/lib/api';
import type { AuthUser } from '@/types/domain';

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: AuthUser;
}

export interface SignUpInput {
  username: string;
  email: string;
  password: string;
  bio?: string;
  // Local URI from expo-image-picker; we'll attach it as a multipart blob.
  avatarUri?: string;
}

export function signIn(identifier: string, password: string) {
  return api.post<AuthResponse>('/api/auth/login', { identifier, password });
}

export function signUp(input: SignUpInput) {
  if (!input.avatarUri) {
    return api.post<AuthResponse>('/api/auth/register', {
      username: input.username,
      email: input.email,
      password: input.password,
      bio: input.bio,
    });
  }

  const form = new FormData();
  form.append('username', input.username);
  form.append('email', input.email);
  form.append('password', input.password);
  if (input.bio) form.append('bio', input.bio);

  // RN's FormData accepts the blob-shaped object; cast keeps TS happy under
  // the dom typings used by lib.dom.
  const filename = input.avatarUri.split('/').pop() ?? 'avatar.jpg';
  const ext = filename.split('.').pop()?.toLowerCase();
  const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
  form.append('avatar', { uri: input.avatarUri, name: filename, type: mime } as unknown as Blob);

  return api.postForm<AuthResponse>('/api/auth/register', form);
}

export function signInWithGoogle(idToken: string, username?: string) {
  return api.post<AuthResponse>('/api/auth/google', { idToken, username });
}

export interface AppleSignInPayload {
  identityToken: string;
  username?: string;
  fullName?: { givenName?: string; familyName?: string };
}
export function signInWithApple(payload: AppleSignInPayload) {
  return api.post<AuthResponse>('/api/auth/apple', payload);
}

export function requestPasswordReset(email: string) {
  return api.post<{ ok: true }>('/api/auth/password-reset/request', { email }, { noAuth: true });
}

export function verifyPasswordResetCode(email: string, code: string) {
  return api.post<{ ok: true }>('/api/auth/password-reset/verify-code', { email, code }, { noAuth: true });
}

export function confirmPasswordReset(email: string, code: string, newPassword: string) {
  return api.post<{ ok: true }>(
    '/api/auth/password-reset/confirm',
    { email, code, newPassword },
    { noAuth: true },
  );
}

export function requestEmailVerification() {
  return api.post<{ ok: true; alreadyVerified?: boolean }>('/api/auth/verify-email/request');
}

export function confirmEmailVerification(code: string) {
  return api.post<{ ok: true }>('/api/auth/verify-email/confirm', { code });
}

export async function getMe(): Promise<AuthUser> {
  // Backend wraps the response as `{ user }` — match the same envelope the
  // login/register/oauth endpoints use, just without `token` since the bearer
  // is already in scope.
  const { user } = await api.get<{ user: AuthUser }>('/api/auth/me');
  return user;
}

export function signOutRemote(refreshToken: string) {
  // refreshToken is REQUIRED by the backend — without it the server-side
  // session can't be revoked and a stolen token would survive a "logout".
  // The caller is responsible for handling the missing-token case (e.g.
  // skip the call entirely and proceed with local sign-out).
  return api.post<{ ok: true }>('/api/auth/logout', { refreshToken });
}

// Exchange a refresh token for a fresh access + refresh pair. Single-use:
// the backend revokes the supplied refresh token in the same transaction
// that issues the new one, so a replayed/stolen token is dead. `noAuth`
// because the access token is expired by the time this is called.
export function refreshAccessToken(refreshToken: string) {
  return api.post<AuthResponse>('/api/auth/refresh', { refreshToken }, { noAuth: true });
}

// Revokes every JWT minted before now for this user, then returns a freshly
// signed token for the caller so they aren't locked out by their own action.
export function revokeAllOtherSessions() {
  return api.post<AuthResponse & { revokedAt: string }>('/api/auth/sessions/revoke-all');
}
