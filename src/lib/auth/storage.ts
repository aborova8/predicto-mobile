// SecureStore is iOS/Android only — fall back to AsyncStorage on web so
// `expo start --web` keeps working in dev.

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AuthUser } from '@/types/domain';

const TOKEN_KEY = 'predicto.session.token';
const REFRESH_TOKEN_KEY = 'predicto.session.refreshToken';
const USER_KEY = 'predicto.session.user';

const isWeb = Platform.OS === 'web';

async function readKey(key: string): Promise<string | null> {
  if (isWeb) return AsyncStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

async function writeKey(key: string, value: string): Promise<void> {
  if (isWeb) return AsyncStorage.setItem(key, value);
  return SecureStore.setItemAsync(key, value);
}

async function deleteKey(key: string): Promise<void> {
  if (isWeb) return AsyncStorage.removeItem(key);
  return SecureStore.deleteItemAsync(key);
}

export interface PersistedSession {
  token: string;
  // refreshToken is optional only to ease the upgrade path: builds that
  // signed in before this version was deployed have no refresh token stored.
  // Those sessions fall through to a forced sign-out the next time the access
  // token expires, which is correct.
  refreshToken?: string;
  user: AuthUser;
}

export async function getSession(): Promise<PersistedSession | null> {
  const [token, refreshToken, userJson] = await Promise.all([
    readKey(TOKEN_KEY),
    readKey(REFRESH_TOKEN_KEY),
    readKey(USER_KEY),
  ]);
  if (!token || !userJson) return null;
  try {
    const user = JSON.parse(userJson) as AuthUser;
    return { token, refreshToken: refreshToken ?? undefined, user };
  } catch {
    // Corrupted snapshot — drop it so we don't trip on every launch.
    await clearSession();
    return null;
  }
}

export async function setSession(session: PersistedSession): Promise<void> {
  await Promise.all([
    writeKey(TOKEN_KEY, session.token),
    session.refreshToken
      ? writeKey(REFRESH_TOKEN_KEY, session.refreshToken)
      : deleteKey(REFRESH_TOKEN_KEY),
    writeKey(USER_KEY, JSON.stringify(session.user)),
  ]);
}

export async function updateCachedUser(user: AuthUser): Promise<void> {
  await writeKey(USER_KEY, JSON.stringify(user));
}

export async function getRefreshToken(): Promise<string | null> {
  return readKey(REFRESH_TOKEN_KEY);
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    deleteKey(TOKEN_KEY),
    deleteKey(REFRESH_TOKEN_KEY),
    deleteKey(USER_KEY),
  ]);
}
