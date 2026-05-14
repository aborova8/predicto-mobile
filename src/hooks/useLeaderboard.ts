import { useCallback, useEffect, useRef, useState } from 'react';

import { getLeaderboard } from '@/lib/api/leaderboard';
import type { LeaderboardBoard, LeaderboardEntry, LeaderboardScope } from '@/types/domain';

const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 300;

export interface UseLeaderboardResult {
  items: LeaderboardEntry[];
  viewer: LeaderboardEntry | null;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  fetchMore: () => Promise<void>;
}

// Page-based (not cursor) so ranks stay continuous across pages — backend
// computes rank from skip = (page - 1) * pageSize. When `q` is set, the
// backend treats the response as a search subset (rank: null).
export function useLeaderboard(
  scope: LeaderboardScope,
  board: LeaderboardBoard,
  q?: string,
): UseLeaderboardResult {
  const [items, setItems] = useState<LeaderboardEntry[]>([]);
  const [viewer, setViewer] = useState<LeaderboardEntry | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // Separate guards so a slow fetchMore can't cancel a fresh refetch.
  const refreshReqRef = useRef(0);
  const fetchMoreReqRef = useRef(0);

  // Debounce the search input here so the screen can pass raw input straight
  // through and not own a second piece of state.
  const [trimmedQ, setTrimmedQ] = useState<string | undefined>(() => q?.trim() || undefined);
  useEffect(() => {
    const next = q?.trim() || undefined;
    const handle = setTimeout(() => setTrimmedQ(next), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [q]);

  const refetch = useCallback(async () => {
    const reqId = ++refreshReqRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await getLeaderboard({
        scope,
        board,
        page: 1,
        pageSize: PAGE_SIZE,
        q: trimmedQ,
      });
      if (refreshReqRef.current !== reqId) return;
      setItems(res.items);
      setViewer(res.viewer);
      setPage(res.page);
      setHasMore(res.hasMore);
    } catch (err) {
      if (refreshReqRef.current !== reqId) return;
      setError(err instanceof Error ? err : new Error('Failed to load standings'));
    } finally {
      if (refreshReqRef.current === reqId) setLoading(false);
    }
  }, [scope, board, trimmedQ]);

  const fetchMore = useCallback(async () => {
    if (!hasMore || loadingMore || loading) return;
    const refreshSnapshot = refreshReqRef.current;
    const reqId = ++fetchMoreReqRef.current;
    setLoadingMore(true);
    try {
      const res = await getLeaderboard({
        scope,
        board,
        page: page + 1,
        pageSize: PAGE_SIZE,
        q: trimmedQ,
      });
      // Bail if a refetch happened mid-flight or a newer fetchMore superseded us.
      if (
        fetchMoreReqRef.current !== reqId ||
        refreshReqRef.current !== refreshSnapshot
      ) {
        return;
      }
      setItems((prev) => [...prev, ...res.items]);
      setPage(res.page);
      setHasMore(res.hasMore);
    } catch (err) {
      if (fetchMoreReqRef.current !== reqId) return;
      setError(err instanceof Error ? err : new Error('Failed to load more'));
    } finally {
      if (fetchMoreReqRef.current === reqId) setLoadingMore(false);
    }
  }, [scope, board, page, hasMore, loadingMore, loading, trimmedQ]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { items, viewer, loading, loadingMore, hasMore, error, refetch, fetchMore };
}
