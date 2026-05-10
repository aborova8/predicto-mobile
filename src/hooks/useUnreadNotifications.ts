import { useCallback, useEffect, useRef, useState } from 'react';

import { getUnreadNotifications } from '@/lib/api/notifications';
import { useAppState } from '@/state/AppStateContext';
import { useDataEpoch } from '@/state/DataEpochContext';

const DEFAULT_POLL_MS = 60_000;

export interface UseUnreadNotificationsResult {
  unread: number;
  refresh: () => Promise<void>;
}

export function useUnreadNotifications(opts: { pollIntervalMs?: number } = {}): UseUnreadNotificationsResult {
  const { pollIntervalMs = DEFAULT_POLL_MS } = opts;
  const { authed } = useAppState();
  const dataEpoch = useDataEpoch();
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

  // Poll while signed in.
  useEffect(() => {
    if (!authed) {
      setUnread(0);
      return;
    }
    void refresh();
    const interval = setInterval(() => void refresh(), pollIntervalMs);
    return () => clearInterval(interval);
  }, [authed, refresh, pollIntervalMs]);

  // Refresh on app foreground via DataEpochContext (single shared listener).
  // Skip the initial render so we don't double-fire alongside the poll's
  // immediate `refresh()`.
  const prevEpochRef = useRef(dataEpoch);
  useEffect(() => {
    if (prevEpochRef.current === dataEpoch) return;
    prevEpochRef.current = dataEpoch;
    if (!authed) return;
    void refresh();
  }, [dataEpoch, authed, refresh]);

  return { unread, refresh };
}
