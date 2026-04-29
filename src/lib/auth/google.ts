import { useEffect } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

// Lets the in-app browser hand its response back when the user cancels
// with the system gesture on iOS/Android.
WebBrowser.maybeCompleteAuthSession();

export interface UseGoogleAuthOptions {
  onIdToken: (idToken: string) => void;
  onError?: (error: unknown) => void;
}

export function useGoogleAuth({ onIdToken, onError }: UseGoogleAuthOptions) {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
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
