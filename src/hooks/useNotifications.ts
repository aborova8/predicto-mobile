import { useCallback, useEffect, useRef, useState } from 'react';

import {
  deleteNotification as deleteApi,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/api/notifications';
import { useAppState } from '@/state/AppStateContext';
import type { BackendNotification } from '@/types/domain';

interface State {
  items: BackendNotification[];
  unreadCount: number;
  nextCursor: string | null;
}

const EMPTY_STATE: State = { items: [], unreadCount: 0, nextCursor: null };

export interface UseNotificationsResult {
  items: BackendNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export function useNotifications(opts: { unreadOnly?: boolean } = {}): UseNotificationsResult {
  const { unreadOnly } = opts;
  const { decrementUnreadNotifications, clearUnreadNotifications } = useAppState();
  const [state, setState] = useState<State>(EMPTY_STATE);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // Separate guards: a long-running loadMore must not cancel a fresh refresh
  // (and vice versa). Each call records its kind+id; results are dropped if
  // a newer refresh has bumped the refresh counter.
  const refreshReqRef = useRef(0);
  const loadMoreReqRef = useRef(0);

  const refresh = useCallback(async () => {
    const reqId = ++refreshReqRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await listNotifications({ unreadOnly });
      if (refreshReqRef.current !== reqId) return;
      setState({
        items: res.items,
        unreadCount: res.unreadCount,
        nextCursor: res.nextCursor,
      });
    } catch (err) {
      if (refreshReqRef.current !== reqId) return;
      setError(err instanceof Error ? err : new Error('Failed to load notifications'));
    } finally {
      if (refreshReqRef.current === reqId) setLoading(false);
    }
  }, [unreadOnly]);

  const loadMore = useCallback(async () => {
    if (!state.nextCursor) return;
    const cursorAtCallTime = state.nextCursor;
    const refreshSnapshot = refreshReqRef.current;
    const reqId = ++loadMoreReqRef.current;
    try {
      const res = await listNotifications({ cursor: cursorAtCallTime, unreadOnly });
      // Drop the page if a refresh happened mid-flight (cursor would be stale)
      // or if a newer loadMore superseded us.
      if (
        loadMoreReqRef.current !== reqId ||
        refreshReqRef.current !== refreshSnapshot
      ) {
        return;
      }
      setState((prev) => ({
        items: [...prev.items, ...res.items],
        unreadCount: res.unreadCount,
        nextCursor: res.nextCursor,
      }));
    } catch (err) {
      if (loadMoreReqRef.current !== reqId) return;
      setError(err instanceof Error ? err : new Error('Failed to load more'));
    }
  }, [state.nextCursor, unreadOnly]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const markRead = useCallback(async (id: string) => {
    let didMutate = false;
    setState((prev) => {
      const target = prev.items.find((n) => n.id === id);
      if (!target || target.readAt) return prev;
      didMutate = true;
      return {
        ...prev,
        unreadCount: Math.max(0, prev.unreadCount - 1),
        items: prev.items.map((n) =>
          n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
        ),
      };
    });
    if (!didMutate) return;
    decrementUnreadNotifications(1);
    try {
      await markNotificationRead(id);
    } catch (err) {
      void refresh();
      throw err;
    }
  }, [refresh, decrementUnreadNotifications]);

  const markAllRead = useCallback(async () => {
    if (state.unreadCount === 0) return;
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      unreadCount: 0,
      items: prev.items.map((n) => (n.readAt ? n : { ...n, readAt: now })),
    }));
    clearUnreadNotifications();
    try {
      await markAllNotificationsRead();
    } catch (err) {
      void refresh();
      throw err;
    }
  }, [refresh, state.unreadCount, clearUnreadNotifications]);

  const remove = useCallback(async (id: string) => {
    let wasUnread = false;
    setState((prev) => {
      const target = prev.items.find((n) => n.id === id);
      wasUnread = !!target && !target.readAt;
      return {
        ...prev,
        items: prev.items.filter((n) => n.id !== id),
        unreadCount: wasUnread ? Math.max(0, prev.unreadCount - 1) : prev.unreadCount,
      };
    });
    if (wasUnread) decrementUnreadNotifications(1);
    try {
      await deleteApi(id);
    } catch (err) {
      void refresh();
      throw err;
    }
  }, [refresh, decrementUnreadNotifications]);

  return {
    items: state.items,
    unreadCount: state.unreadCount,
    isLoading,
    error,
    hasMore: state.nextCursor !== null,
    refresh,
    loadMore,
    markRead,
    markAllRead,
    remove,
  };
}
