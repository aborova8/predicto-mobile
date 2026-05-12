// Expo Push registration helpers.
//
// Flow:
//   1. After sign-in (or on app start when a session exists), call
//      `registerPushForSession()`. It requests permission, fetches the Expo
//      push token, and POSTs it to the backend.
//   2. On sign-out, call `unregisterPushForSession()` so the backend stops
//      delivering pushes to that token while another user might be signed in.
//
// All public functions swallow errors and never throw — push is advisory.

import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { registerDevice, unregisterDevice } from '@/lib/api/devices';

// Display alerts even when the app is foregrounded — without this, the user
// sees nothing when a push arrives while they're using the app.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

let lastRegisteredToken: string | null = null;
let lastRegisterAt = 0;
// Single-flight register so a sign-in → quick-sign-out can't race a still
// in-flight registration. `unregisterPushForSession()` awaits this before
// clearing state, guaranteeing we don't leave a token registered under the
// prior user after sign-out completes.
let inFlightRegister: Promise<string | null> | null = null;
// Foreground events fire on every app/safari/notification-center toggle.
// One re-register per 30 minutes is enough to refresh lastSeenAt without
// hammering the backend when a user is task-switching frequently.
const REREGISTER_INTERVAL_MS = 30 * 60 * 1000;

function platformForBackend(): 'IOS' | 'ANDROID' | 'WEB' {
  if (Platform.OS === 'ios') return 'IOS';
  if (Platform.OS === 'android') return 'ANDROID';
  return 'WEB';
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Predicto',
    importance: Notifications.AndroidImportance.HIGH,
    lightColor: '#208AEF',
    vibrationPattern: [0, 250, 250, 250],
  });
}

async function requestPermission(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  if (!existing.canAskAgain) return false;
  const next = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowSound: true,
      allowBadge: true,
    },
  });
  return next.granted;
}

function readProjectId(): string | undefined {
  // EAS-published apps surface the projectId on Constants.expoConfig.extra
  // or Constants.easConfig depending on SDK version. Falling back to the env
  // var lets a dev build work without a published EAS config.
  const fromExpo =
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
    (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId;
  return fromExpo ?? process.env.EXPO_PUBLIC_PUSH_PROJECT_ID ?? undefined;
}

/**
 * Request permission, fetch the Expo push token, and register it with the
 * backend. Idempotent — safe to call on every sign-in and every foreground.
 * Returns the token on success, null otherwise. Never throws.
 *
 * Pass `force: true` to bypass the foreground debounce (sign-in flow).
 */
export async function registerPushForSession(opts: { force?: boolean } = {}): Promise<string | null> {
  if (inFlightRegister) return inFlightRegister;
  inFlightRegister = (async () => {
    try {
      if (!Device.isDevice) return null; // simulators have no real push token

      if (
        !opts.force &&
        lastRegisteredToken &&
        Date.now() - lastRegisterAt < REREGISTER_INTERVAL_MS
      ) {
        return lastRegisteredToken;
      }

      const projectId = readProjectId();
      if (!projectId) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn('[push] EXPO_PUBLIC_PUSH_PROJECT_ID not set; skipping registration');
        }
        return null;
      }

      const granted = await requestPermission();
      if (!granted) return null;

      await ensureAndroidChannel();

      const tokenResp = await Notifications.getExpoPushTokenAsync({ projectId });
      const token = tokenResp.data;
      if (!token) return null;

      await registerDevice({
        platform: platformForBackend(),
        expoPushToken: token,
        appVersion: Constants.expoConfig?.version ?? undefined,
        nativeAppBuild:
          Platform.OS === 'ios'
            ? Constants.expoConfig?.ios?.buildNumber
            : Constants.expoConfig?.android?.versionCode != null
              ? String(Constants.expoConfig.android.versionCode)
              : undefined,
      });
      lastRegisteredToken = token;
      lastRegisterAt = Date.now();
      return token;
    } catch {
      return null;
    }
  })();
  try {
    return await inFlightRegister;
  } finally {
    inFlightRegister = null;
  }
}

/**
 * Best-effort unregister of the last-registered token. Called on sign-out so
 * the backend stops delivering pushes to this device under the prior user.
 * Retries up to three times with exponential backoff (1s, 2s, 4s) so a
 * transient network failure during the sign-out flow doesn't leave the token
 * registered — that would cause notifications meant for the previous user to
 * keep arriving on this device.
 */
export async function unregisterPushForSession(): Promise<void> {
  // If a register is still in flight, wait for it to settle so we don't drop
  // the token reference before the device row exists server-side. Otherwise
  // unregister would no-op and the token would survive the sign-out.
  if (inFlightRegister) {
    await inFlightRegister.catch(() => {});
  }
  const token = lastRegisteredToken;
  lastRegisteredToken = null;
  lastRegisterAt = 0;
  if (!token) return;
  const backoffsMs = [1000, 2000, 4000];
  for (let attempt = 0; attempt < backoffsMs.length; attempt++) {
    try {
      await unregisterDevice(token);
      return;
    } catch {
      if (attempt < backoffsMs.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, backoffsMs[attempt]));
      }
      // Final failure falls through — server-side cleanup happens via
      // DeviceNotRegistered on the next push send. Don't block sign-out.
    }
  }
}
