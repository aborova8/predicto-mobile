import { useCallback } from 'react';

import { useAsyncResource } from '@/hooks/useAsyncResource';
import {
  blockUser as blockApi,
  listBlocked,
  listFriends,
  listIncomingRequests,
  listOutgoingRequests,
  removeFriend as removeFriendApi,
  respondFriendRequest as respondApi,
  sendFriendRequest as sendApi,
  unblockUser as unblockApi,
} from '@/lib/api/friends';
import type { BackendFriendRequest, BackendFriendUser } from '@/types/domain';

interface FriendsBundle {
  friends: BackendFriendUser[];
  incoming: BackendFriendRequest[];
  outgoing: BackendFriendRequest[];
  blocked: BackendFriendUser[];
}

export interface UseFriendsResult {
  friends: BackendFriendUser[];
  incoming: BackendFriendRequest[];
  outgoing: BackendFriendRequest[];
  blocked: BackendFriendUser[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  sendRequest: (userId: string) => Promise<void>;
  acceptRequest: (id: string) => Promise<void>;
  declineRequest: (id: string) => Promise<void>;
  removeFriend: (userId: string) => Promise<void>;
  block: (userId: string) => Promise<void>;
  unblock: (userId: string) => Promise<void>;
}

export function useFriends(): UseFriendsResult {
  const { data, loading, error, refetch, setData } = useAsyncResource<FriendsBundle>(
    async () => {
      const [friends, incoming, outgoing, blocked] = await Promise.all([
        listFriends(),
        listIncomingRequests(),
        listOutgoingRequests(),
        listBlocked(),
      ]);
      return {
        friends: friends.items,
        incoming: incoming.items,
        outgoing: outgoing.items,
        blocked: blocked.items,
      };
    },
    [],
    { fallbackErrorMessage: 'Failed to load friends' },
  );

  const sendRequest = useCallback(
    async (userId: string) => {
      const { request } = await sendApi(userId);
      // If the request resolved to an immediate accept (other side had already
      // sent one), refetch to pick up the friendship row; otherwise add the
      // pending request to the outgoing list.
      if (request.status === 'ACCEPTED') {
        await refetch();
      } else {
        setData((prev) =>
          prev ? { ...prev, outgoing: [request, ...prev.outgoing] } : prev,
        );
      }
    },
    [refetch, setData],
  );

  const acceptRequest = useCallback(
    async (id: string) => {
      // Optimistic: drop from incoming. On success, refetch to load the new friend.
      setData((prev) =>
        prev ? { ...prev, incoming: prev.incoming.filter((r) => r.id !== id) } : prev,
      );
      try {
        await respondApi(id, 'accept');
        await refetch();
      } catch (err) {
        await refetch();
        throw err;
      }
    },
    [refetch, setData],
  );

  const declineRequest = useCallback(
    async (id: string) => {
      setData((prev) =>
        prev ? { ...prev, incoming: prev.incoming.filter((r) => r.id !== id) } : prev,
      );
      try {
        await respondApi(id, 'decline');
      } catch (err) {
        await refetch();
        throw err;
      }
    },
    [refetch, setData],
  );

  const removeFriend = useCallback(
    async (userId: string) => {
      setData((prev) =>
        prev ? { ...prev, friends: prev.friends.filter((u) => u.id !== userId) } : prev,
      );
      try {
        await removeFriendApi(userId);
      } catch (err) {
        await refetch();
        throw err;
      }
    },
    [refetch, setData],
  );

  const block = useCallback(
    async (userId: string) => {
      await blockApi(userId);
      await refetch();
    },
    [refetch],
  );

  const unblock = useCallback(
    async (userId: string) => {
      setData((prev) =>
        prev ? { ...prev, blocked: prev.blocked.filter((u) => u.id !== userId) } : prev,
      );
      try {
        await unblockApi(userId);
      } catch (err) {
        await refetch();
        throw err;
      }
    },
    [refetch, setData],
  );

  return {
    friends: data?.friends ?? [],
    incoming: data?.incoming ?? [],
    outgoing: data?.outgoing ?? [],
    blocked: data?.blocked ?? [],
    loading,
    error,
    refetch,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
    block,
    unblock,
  };
}
