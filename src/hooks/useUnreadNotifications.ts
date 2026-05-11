import { useAppState } from '@/state/AppStateContext';

export interface UseUnreadNotificationsResult {
  unread: number;
  refresh: () => Promise<void>;
}

export function useUnreadNotifications(): UseUnreadNotificationsResult {
  const { unreadNotifications, refreshUnreadNotifications } = useAppState();
  return { unread: unreadNotifications, refresh: refreshUnreadNotifications };
}
