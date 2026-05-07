import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { getUnreadNotifications } from '@/lib/api/notifications';
import { useAppState } from '@/state/AppStateContext';

const DEFAULT_POLL_MS = 60_000;

export interface UseUnreadNotificationsResult {
  unread: number;
  refresh: () => Promise<void>;
}

export function useUnreadNotifications(opts: { pollIntervalMs?: number } = {}): UseUnreadNotificationsResult {
  const { pollIntervalMs = DEFAULT_POLL_MS } = opts;
  const { authed } = useAppState();
  const [unread, setUnread] = useState(0);
  const reqRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!authed) return;
    const reqId = ++reqRef.current;
    try {
      const { unread: u } = await getUnreadNotifications();
      if (reqRef.current !== reqId) return;
      setUnread((prev) => (prev === u ? prev : u));
    } catch {
      // Silent — the badge should not block UX.
    }
  }, [authed]);

  useEffect(() => {
    if (!authed) {
      setUnread(0);
      return;
    }
    void refresh();
    let interval = setInterval(() => void refresh(), pollIntervalMs);
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      // Reset the interval so the next poll is a full window away from this
      // foreground refresh, instead of double-firing right after.
      clearInterval(interval);
      interval = setInterval(() => void refresh(), pollIntervalMs);
      void refresh();
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [authed, refresh, pollIntervalMs]);

  return { unread, refresh };
}
