import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

// Lets the in-app browser hand its response back when the user cancels
// with the system gesture on iOS/Android.
WebBrowser.maybeCompleteAuthSession();

export interface UseGoogleAuthOptions {
  onIdToken: (idToken: string) => void;
  onError?: (error: unknown) => void;
}

const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

// Google.useIdTokenAuthRequest throws synchronously if the current platform's
// client ID is missing, so we can't call it at all until config is present.
// Decide once at module load — the choice is stable for the app's lifetime,
// so swapping the export here doesn't violate the rules of hooks.
const platformClientId =
  Platform.OS === 'ios' ? iosClientId : Platform.OS === 'android' ? androidClientId : webClientId;

function useGoogleAuthDisabled(_options: UseGoogleAuthOptions) {
  return {
    ready: false,
    promptAsync: async () => undefined,
  };
}

function useGoogleAuthEnabled({ onIdToken, onError }: UseGoogleAuthOptions) {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId,
    androidClientId,
    webClientId,
  });

  useEffect(() => {
    if (!response) return;
    if (response.type === 'success') {
      const idToken = response.params?.id_token ?? response.authentication?.idToken;
      if (idToken) {
        onIdToken(idToken);
      } else {
        onError?.(new Error('Google did not return an id_token'));
      }
    } else if (response.type === 'error') {
      onError?.(response.error ?? new Error('Google sign-in failed'));
    }
    // Cancel/dismiss are silent — the user knows what they did.
  }, [response, onIdToken, onError]);

  return {
    ready: !!request,
    promptAsync,
  };
}

export const useGoogleAuth = platformClientId ? useGoogleAuthEnabled : useGoogleAuthDisabled;
