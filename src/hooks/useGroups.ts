import { useCallback } from 'react';

import { useAsyncResource } from '@/hooks/useAsyncResource';
import {
  joinGroupByCode as joinByCodeApi,
  listGroups,
  type GroupScope,
  type JoinByCodeResult,
} from '@/lib/api/groups';
import { backendGroupToGroup } from '@/lib/mappers';
import type { Group } from '@/types/domain';

export interface UseGroupsResult {
  groups: Group[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  joinByCode: (code: string) => Promise<JoinByCodeResult>;
}

export function useGroups({ scope }: { scope: GroupScope }): UseGroupsResult {
  const { data, loading, error, refetch } = useAsyncResource(
    async () => {
      const { items } = await listGroups(scope);
      return items.map(backendGroupToGroup);
    },
    [scope],
    { fallbackErrorMessage: 'Failed to load groups' },
  );

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

  return { groups: data ?? [], loading, error, refetch, joinByCode };
}
