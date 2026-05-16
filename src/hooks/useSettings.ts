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
      const rollback: Partial<UserPrivacy> = {};
      setData((prev) => {
        if (!prev?.privacy) return prev;
        for (const key of Object.keys(patch) as (keyof UserPrivacy)[]) {
          (rollback as Record<string, unknown>)[key] = prev.privacy[key];
        }
        return { ...prev, privacy: { ...prev.privacy, ...patch } };
      });
      try {
        const { privacy } = await updatePrivacyApi(patch);
        setData((prev) => (prev ? { ...prev, privacy } : prev));
      } catch (err) {
        setData((prev) =>
          prev?.privacy ? { ...prev, privacy: { ...prev.privacy, ...rollback } } : prev,
        );
        throw err;
      }
    },
    [setData],
  );

  const updateNotificationPrefs = useCallback(
    async (patch: Partial<NotificationPrefs>) => {
      const rollback: Partial<NotificationPrefs> = {};
      setData((prev) => {
        if (!prev?.notifications) return prev;
        for (const key of Object.keys(patch) as (keyof NotificationPrefs)[]) {
          (rollback as Record<string, unknown>)[key] = prev.notifications[key];
        }
        return { ...prev, notifications: { ...prev.notifications, ...patch } };
      });
      try {
        const { notifications } = await updateNotifApi(patch);
        setData((prev) => (prev ? { ...prev, notifications } : prev));
      } catch (err) {
        setData((prev) =>
          prev?.notifications
            ? { ...prev, notifications: { ...prev.notifications, ...rollback } }
            : prev,
        );
        throw err;
      }
    },
    [setData],
  );

  return { settings: data, loading, error, refetch, updatePrivacy, updateNotificationPrefs };
}
