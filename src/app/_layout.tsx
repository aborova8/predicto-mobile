import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
  JetBrainsMono_700Bold,
  JetBrainsMono_800ExtraBold,
} from '@expo-google-fonts/jetbrains-mono';
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppStateProvider, useAppState } from '@/state/AppStateContext';
import { DataEpochProvider } from '@/state/DataEpochContext';
import { ThemeProvider, useTheme, useThemeCtx } from '@/theme/ThemeContext';

SplashScreen.preventAutoHideAsync().catch(() => {});

function AuthGate() {
  const { authed, authLoading, user } = useAppState();
  const segments = useSegments();
  const router = useRouter();
  const inAuthGroup = segments[0] === '(auth)';
  const onVerifyScreen = segments[0] === 'verify-email';
  // Only email/password signups need to verify — Google and Apple flows
  // already pass `emailVerified: true` on creation (auth.service.ts).
  const needsEmailVerify = !!user && user.provider === 'LOCAL' && !user.emailVerified;

  useEffect(() => {
    if (authLoading) return;
    if (!authed) {
      if (!inAuthGroup) {
        // Pop every detail/modal screen on top of the stack before redirecting
        // so the user can't hit back from sign-in and land in a tab they no
        // longer have access to. `dismissAll` is a no-op when there's nothing
        // to dismiss, so it's safe to call unconditionally.
        try {
          router.dismissAll();
        } catch (e) {
          if (__DEV__) {
            console.warn('[AuthGate] dismissAll failed', e);
          }
        }
        router.replace('/(auth)/sign-in');
      }
      return;
    }
    if (needsEmailVerify) {
      if (!onVerifyScreen) router.replace('/verify-email');
      return;
    }
    if (inAuthGroup || onVerifyScreen) {
      router.replace('/(tabs)');
    }
  }, [authed, authLoading, inAuthGroup, onVerifyScreen, needsEmailVerify, router]);

  return null;
}

function InnerErrorBoundary({ children }: { children: React.ReactNode }) {
  const { signOut } = useAppState();
  return (
    <ErrorBoundary
      onSignOut={() => {
        signOut().catch(() => {});
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

function RootStack() {
  const theme = useTheme();
  return (
    <>
      <AuthGate />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.bg },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="ticket/[id]" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="group/[id]" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="group-feed/[id]" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="create-group" options={{ presentation: 'modal' }} />
        <Stack.Screen name="search" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="notifications" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="friends" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="settings" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="edit-profile" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="change-password" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="legal" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="verify-email" options={{ presentation: 'card', animation: 'fade' }} />
        <Stack.Screen name="comments" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="review" options={{ presentation: 'transparentModal', animation: 'fade' }} />
        <Stack.Screen name="paywall" options={{ presentation: 'transparentModal', animation: 'fade' }} />
        <Stack.Screen name="user/[id]" options={{ presentation: 'transparentModal', animation: 'fade' }} />
      </Stack>
    </>
  );
}

function SplashGate() {
  const { authLoading } = useAppState();
  useEffect(() => {
    if (!authLoading) SplashScreen.hideAsync().catch(() => {});
  }, [authLoading]);
  return null;
}

function ThemedShell() {
  const { name } = useThemeCtx();
  return (
    <>
      <StatusBar style={name === 'light' ? 'dark' : 'light'} />
      <SplashGate />
      <RootStack />
    </>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
    JetBrainsMono_700Bold,
    JetBrainsMono_800ExtraBold,
  });

  if (!loaded) return null;

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <DataEpochProvider>
              <AppStateProvider>
                <InnerErrorBoundary>
                  <ThemedShell />
                </InnerErrorBoundary>
              </AppStateProvider>
            </DataEpochProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
