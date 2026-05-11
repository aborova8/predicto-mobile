import { useCallback, useEffect, useRef, useState } from 'react';

import {
  joinGroupByCode as joinByCodeApi,
  listGroups,
  type GroupScope,
  type JoinByCodeResult,
} from '@/lib/api/groups';
import { backendGroupToGroup } from '@/lib/mappers';
import type { Group } from '@/types/domain';

const PAGE_SIZE = 20;

export interface UseGroupsResult {
  groups: Group[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  fetchMore: () => Promise<void>;
  joinByCode: (code: string) => Promise<JoinByCodeResult>;
}

// Client-side text-search runs over loaded pages — fine for typical depth;
// add a backend `q` param if global search becomes a requirement.
export function useGroups({ scope }: { scope: GroupScope }): UseGroupsResult {
  const [groups, setGroups] = useState<Group[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const refreshReqRef = useRef(0);
  const fetchMoreReqRef = useRef(0);

  const refetch = useCallback(async () => {
    const reqId = ++refreshReqRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await listGroups({ scope, page: 1, pageSize: PAGE_SIZE });
      if (refreshReqRef.current !== reqId) return;
      setGroups(res.items.map(backendGroupToGroup));
      setPage(res.page);
      setHasMore(res.hasMore);
    } catch (err) {
      if (refreshReqRef.current !== reqId) return;
      setError(err instanceof Error ? err : new Error('Failed to load groups'));
    } finally {
      if (refreshReqRef.current === reqId) setLoading(false);
    }
  }, [scope]);

  const fetchMore = useCallback(async () => {
    if (!hasMore || loadingMore || loading) return;
    const refreshSnapshot = refreshReqRef.current;
    const reqId = ++fetchMoreReqRef.current;
    setLoadingMore(true);
    try {
      const res = await listGroups({ scope, page: page + 1, pageSize: PAGE_SIZE });
      if (
        fetchMoreReqRef.current !== reqId ||
        refreshReqRef.current !== refreshSnapshot
      ) {
        return;
      }
      setGroups((prev) => [...prev, ...res.items.map(backendGroupToGroup)]);
      setPage(res.page);
      setHasMore(res.hasMore);
    } catch (err) {
      if (fetchMoreReqRef.current !== reqId) return;
      setError(err instanceof Error ? err : new Error('Failed to load more groups'));
    } finally {
      if (fetchMoreReqRef.current === reqId) setLoadingMore(false);
    }
  }, [scope, page, hasMore, loadingMore, loading]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const joinByCode = useCallback(
    async (code: string) => {
      const result = await joinByCodeApi(code);
      if (result.joined || result.alreadyMember) {
        await refetch();
      }
      return result;
    },
    [refetch],
  );

  return { groups, loading, loadingMore, hasMore, error, refetch, fetchMore, joinByCode };
}
