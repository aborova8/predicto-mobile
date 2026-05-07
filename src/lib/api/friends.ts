import { api } from '@/lib/api';
import type { BackendFriendRequest, BackendFriendUser } from '@/types/domain';

export function listFriends(): Promise<{ items: BackendFriendUser[] }> {
  return api.get<{ items: BackendFriendUser[] }>('/api/friends');
}

export function listIncomingRequests(): Promise<{ items: BackendFriendRequest[] }> {
  return api.get<{ items: BackendFriendRequest[] }>('/api/friends/requests/incoming');
}

export function listOutgoingRequests(): Promise<{ items: BackendFriendRequest[] }> {
  return api.get<{ items: BackendFriendRequest[] }>('/api/friends/requests/outgoing');
}

export function sendFriendRequest(userId: string): Promise<{ request: BackendFriendRequest }> {
  return api.post<{ request: BackendFriendRequest }>('/api/friends/requests', { userId });
}

export function respondFriendRequest(
  id: string,
  action: 'accept' | 'decline',
): Promise<{ request: BackendFriendRequest }> {
  return api.post<{ request: BackendFriendRequest }>(
    `/api/friends/requests/${encodeURIComponent(id)}/respond`,
    { action },
  );
}

export function removeFriend(userId: string): Promise<{ ok: true }> {
  return api.delete<{ ok: true }>(`/api/friends/${encodeURIComponent(userId)}`);
}

export function listBlocked(): Promise<{ items: BackendFriendUser[] }> {
  return api.get<{ items: BackendFriendUser[] }>('/api/friends/blocked');
}

export function blockUser(userId: string): Promise<{ ok: true }> {
  return api.post<{ ok: true }>('/api/friends/blocked', { userId });
}

export function unblockUser(userId: string): Promise<{ ok: true }> {
  return api.delete<{ ok: true }>(`/api/friends/blocked/${encodeURIComponent(userId)}`);
}
