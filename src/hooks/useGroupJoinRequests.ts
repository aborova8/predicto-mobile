import { useCallback } from 'react';

import { useAsyncResource } from '@/hooks/useAsyncResource';
import {
  listJoinRequests,
  respondToJoinRequest as respondApi,
} from '@/lib/api/groups';
import type { GroupJoinRequest } from '@/types/domain';

export interface UseGroupJoinRequestsResult {
  requests: GroupJoinRequest[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  respond: (requestId: string, action: 'approve' | 'reject') => Promise<void>;
}

// `enabled` skips the fetch when the viewer isn't admin+ — backend would 403.
export function useGroupJoinRequests(id: string, enabled: boolean): UseGroupJoinRequestsResult {
  const { data, loading, error, refetch, setData } = useAsyncResource(
    async () => (await listJoinRequests(id)).items,
    [id],
    { enabled, fallbackErrorMessage: 'Failed to load join requests' },
  );

  const respond = useCallback(
    async (requestId: string, action: 'approve' | 'reject') => {
      await respondApi(id, requestId, action);
      setData((prev) => prev?.filter((r) => r.id !== requestId) ?? null);
    },
    [id, setData],
  );

  return { requests: data ?? [], loading, error, refetch, respond };
}
