import { useCallback } from 'react';

import { useAsyncResource } from '@/hooks/useAsyncResource';
import {
  deleteGroup as deleteGroupApi,
  getGroup,
  leaveGroup as leaveGroupApi,
  rotateInviteCode as rotateInviteCodeApi,
  transferOwnership as transferOwnershipApi,
  updateGroup as updateGroupApi,
} from '@/lib/api/groups';
import { backendGroupToGroup } from '@/lib/mappers';
import type { Group } from '@/types/domain';

export interface UseGroupResult {
  group: Group | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  update: (patch: { name?: string; description?: string }) => Promise<void>;
  remove: () => Promise<void>;
  leave: () => Promise<void>;
  rotateCode: () => Promise<string>;
  // transfer flips roles on multiple GroupMember rows — caller must refetch
  // members alongside the group to keep the views consistent.
  transfer: (newOwnerId: string) => Promise<void>;
}

export function useGroup(id: string): UseGroupResult {
  const { data, loading, error, refetch, setData } = useAsyncResource(
    async () => backendGroupToGroup((await getGroup(id)).group),
    [id],
    { fallbackErrorMessage: 'Failed to load group' },
  );

  const update = useCallback(
    async (patch: { name?: string; description?: string }) => {
      const { group: updated } = await updateGroupApi(id, patch);
      const mapped = backendGroupToGroup(updated);
      setData((prev) =>
        prev
          ? { ...mapped, viewerRole: prev.viewerRole, inviteCode: prev.inviteCode ?? mapped.inviteCode }
          : mapped,
      );
    },
    [id, setData],
  );

  const remove = useCallback(async () => {
    await deleteGroupApi(id);
    setData(null);
  }, [id, setData]);

  const leave = useCallback(async () => {
    await leaveGroupApi(id);
    setData((prev) => (prev ? { ...prev, viewerRole: null, inviteCode: undefined } : prev));
  }, [id, setData]);

  const rotateCode = useCallback(async () => {
    const { inviteCode } = await rotateInviteCodeApi(id);
    setData((prev) => (prev ? { ...prev, inviteCode } : prev));
    return inviteCode;
  }, [id, setData]);

  const transfer = useCallback(
    async (newOwnerId: string) => {
      await transferOwnershipApi(id, newOwnerId);
    },
    [id],
  );

  return { group: data, loading, error, refetch, update, remove, leave, rotateCode, transfer };
}
