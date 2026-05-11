import { useCallback, useEffect, useRef, useState } from 'react';

import { getLeaderboard } from '@/lib/api/leaderboard';
import type { LeaderboardBoard, LeaderboardEntry, LeaderboardScope } from '@/types/domain';

const PAGE_SIZE = 50;

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
// computes rank from skip = (page - 1) * pageSize.
export function useLeaderboard(
  scope: LeaderboardScope,
  board: LeaderboardBoard,
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

  const refetch = useCallback(async () => {
    const reqId = ++refreshReqRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await getLeaderboard({ scope, board, page: 1, pageSize: PAGE_SIZE });
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
  }, [scope, board]);

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
  }, [scope, board, page, hasMore, loadingMore, loading]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { items, viewer, loading, loadingMore, hasMore, error, refetch, fetchMore };
}
