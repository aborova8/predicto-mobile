// Apple Sign-In via expo-apple-authentication. iOS-only; Android consumers
// must call `isAvailable()` and hide the button when it returns false.

import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

export async function isAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

export interface AppleCredentialResult {
  identityToken: string;
  fullName?: { givenName?: string; familyName?: string };
}

export async function signIn(): Promise<AppleCredentialResult> {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  if (!credential.identityToken) {
    throw new Error('Apple did not return an identity token');
  }
  return {
    identityToken: credential.identityToken,
    fullName: credential.fullName
      ? {
          givenName: credential.fullName.givenName ?? undefined,
          familyName: credential.fullName.familyName ?? undefined,
        }
      : undefined,
  };
}

export { AppleAuthentication };
