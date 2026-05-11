import { api, buildQuery } from '@/lib/api';
import type {
  BackendGroup,
  GroupJoinRequest,
  GroupLeaderboardEntry,
  GroupMember,
  GroupVisibility,
} from '@/types/domain';

export type GroupScope = 'mine' | 'public';

export interface ListGroupsResult {
  items: BackendGroup[];
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export type ListGroupsQuery = {
  scope: GroupScope;
  page?: number;
  pageSize?: number;
};

export function listGroups(q: ListGroupsQuery): Promise<ListGroupsResult> {
  return api.get<ListGroupsResult>(`/api/groups${buildQuery({ ...q })}`);
}

export function getGroup(id: string): Promise<{ group: BackendGroup }> {
  return api.get<{ group: BackendGroup }>(`/api/groups/${encodeURIComponent(id)}`);
}

export function createGroup(input: {
  name: string;
  description?: string;
  visibility: GroupVisibility;
}): Promise<{ group: BackendGroup }> {
  return api.post<{ group: BackendGroup }>('/api/groups', input);
}

export function updateGroup(
  id: string,
  patch: { name?: string; description?: string },
): Promise<{ group: BackendGroup }> {
  return api.patch<{ group: BackendGroup }>(`/api/groups/${encodeURIComponent(id)}`, patch);
}

export function deleteGroup(id: string): Promise<{ ok: true }> {
  return api.delete<{ ok: true }>(`/api/groups/${encodeURIComponent(id)}`);
}

// `joined` and `requestPending` and `alreadyMember` are mutually-exclusive
// outcome flags — exactly one of them is set. Mirrors the backend service
// return type in groups.service.ts → joinGroupByCode.
export interface JoinByCodeResult {
  group: BackendGroup;
  joined?: true;
  alreadyMember?: true;
  requestPending?: true;
  requestId?: string;
}

export function joinGroupByCode(inviteCode: string): Promise<JoinByCodeResult> {
  return api.post<JoinByCodeResult>('/api/groups/join', { inviteCode });
}

export function leaveGroup(id: string): Promise<{ ok: true }> {
  return api.post<{ ok: true }>(`/api/groups/${encodeURIComponent(id)}/leave`);
}

export function listGroupMembers(id: string): Promise<{ items: GroupMember[] }> {
  return api.get<{ items: GroupMember[] }>(`/api/groups/${encodeURIComponent(id)}/members`);
}

export function changeMemberRole(
  id: string,
  userId: string,
  role: 'ADMIN' | 'MEMBER',
): Promise<{ member: GroupMember }> {
  return api.patch<{ member: GroupMember }>(
    `/api/groups/${encodeURIComponent(id)}/members/${encodeURIComponent(userId)}`,
    { role },
  );
}

export function removeMember(id: string, userId: string): Promise<{ ok: true }> {
  return api.delete<{ ok: true }>(
    `/api/groups/${encodeURIComponent(id)}/members/${encodeURIComponent(userId)}`,
  );
}

export function listJoinRequests(id: string): Promise<{ items: GroupJoinRequest[] }> {
  return api.get<{ items: GroupJoinRequest[] }>(
    `/api/groups/${encodeURIComponent(id)}/join-requests`,
  );
}

export function respondToJoinRequest(
  id: string,
  requestId: string,
  action: 'approve' | 'reject',
): Promise<{ request: GroupJoinRequest }> {
  return api.post<{ request: GroupJoinRequest }>(
    `/api/groups/${encodeURIComponent(id)}/join-requests/${encodeURIComponent(requestId)}/respond`,
    { action },
  );
}

export function transferOwnership(
  id: string,
  newOwnerId: string,
): Promise<{ group: BackendGroup }> {
  return api.post<{ group: BackendGroup }>(
    `/api/groups/${encodeURIComponent(id)}/transfer`,
    { newOwnerId },
  );
}

export function rotateInviteCode(id: string): Promise<{ inviteCode: string }> {
  return api.post<{ inviteCode: string }>(
    `/api/groups/${encodeURIComponent(id)}/invite-code/rotate`,
  );
}

export function getGroupLeaderboard(id: string): Promise<{ items: GroupLeaderboardEntry[] }> {
  return api.get<{ items: GroupLeaderboardEntry[] }>(
    `/api/groups/${encodeURIComponent(id)}/leaderboard`,
  );
}
