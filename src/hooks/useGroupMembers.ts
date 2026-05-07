import { useCallback } from 'react';

import { useAsyncResource } from '@/hooks/useAsyncResource';
import {
  changeMemberRole as changeMemberRoleApi,
  listGroupMembers,
  removeMember as removeMemberApi,
} from '@/lib/api/groups';
import type { GroupMember } from '@/types/domain';

export interface UseGroupMembersResult {
  members: GroupMember[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  changeRole: (userId: string, role: 'ADMIN' | 'MEMBER') => Promise<void>;
  remove: (userId: string) => Promise<void>;
}

export function useGroupMembers(id: string): UseGroupMembersResult {
  const { data, loading, error, refetch, setData } = useAsyncResource(
    async () => (await listGroupMembers(id)).items,
    [id],
    { fallbackErrorMessage: 'Failed to load members' },
  );

  const changeRole = useCallback(
    async (userId: string, role: 'ADMIN' | 'MEMBER') => {
      const { member } = await changeMemberRoleApi(id, userId, role);
      setData((prev) =>
        prev?.map((m) => (m.userId === userId ? { ...m, role: member.role } : m)) ?? null,
      );
    },
    [id, setData],
  );

  const remove = useCallback(
    async (userId: string) => {
      await removeMemberApi(id, userId);
      setData((prev) => prev?.filter((m) => m.userId !== userId) ?? null);
    },
    [id, setData],
  );

  return { members: data ?? [], loading, error, refetch, changeRole, remove };
}
