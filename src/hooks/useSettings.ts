import { useCallback } from 'react';

import { useAsyncResource } from '@/hooks/useAsyncResource';
import {
  getSettings,
  updateNotificationPrefs as updateNotifApi,
  updatePrivacy as updatePrivacyApi,
  type NotificationPrefs,
  type SettingsResponse,
  type UserPrivacy,
} from '@/lib/api/users';

export interface UseSettingsResult {
  settings: SettingsResponse | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  updatePrivacy: (patch: Partial<UserPrivacy>) => Promise<void>;
  updateNotificationPrefs: (patch: Partial<NotificationPrefs>) => Promise<void>;
}

export function useSettings(): UseSettingsResult {
  const { data, loading, error, refetch, setData } = useAsyncResource<SettingsResponse>(
    async () => {
      const { settings } = await getSettings();
      return settings;
    },
    [],
    { fallbackErrorMessage: 'Failed to load settings' },
  );

  const updatePrivacy = useCallback(
    async (patch: Partial<UserPrivacy>) => {
      const { privacy } = await updatePrivacyApi(patch);
      setData((prev) => (prev ? { ...prev, privacy } : prev));
    },
    [setData],
  );

  const updateNotificationPrefs = useCallback(
    async (patch: Partial<NotificationPrefs>) => {
      const { notifications } = await updateNotifApi(patch);
      setData((prev) => (prev ? { ...prev, notifications } : prev));
    },
    [setData],
  );

  return { settings: data, loading, error, refetch, updatePrivacy, updateNotificationPrefs };
}
