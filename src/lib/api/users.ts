import { api, buildQuery } from '@/lib/api';
import type {
  BackendFriendUser,
  BackendTicket,
  MyProfile,
  UserBadgeAwarded,
} from '@/types/domain';

export function getMyProfile(): Promise<{ profile: MyProfile }> {
  return api.get<{ profile: MyProfile }>('/api/users/me');
}

export function getUserById(id: string): Promise<{ profile: MyProfile }> {
  return api.get<{ profile: MyProfile }>(`/api/users/${encodeURIComponent(id)}`);
}

export interface UpdateMyProfileInput {
  username?: string;
  bio?: string | null;
}

export interface UpdatedProfileSummary {
  id: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  points: number;
}

export function updateMyProfile(
  input: UpdateMyProfileInput,
): Promise<{ user: UpdatedProfileSummary }> {
  return api.patch<{ user: UpdatedProfileSummary }>('/api/users/me', input);
}

// Multipart variant — used when the user picks a new avatar via expo-image-picker.
// Pass the picker asset { uri, mimeType?, fileName? } directly.
export function updateMyProfileMultipart(input: {
  username?: string;
  bio?: string | null;
  avatar: { uri: string; mimeType?: string; fileName?: string | null };
}): Promise<{ user: UpdatedProfileSummary }> {
  const form = new FormData();
  if (input.username !== undefined) form.append('username', input.username);
  if (input.bio !== undefined) form.append('bio', input.bio ?? '');
  // React Native's FormData accepts the {uri, type, name} blob descriptor.
  form.append('avatar', {
    uri: input.avatar.uri,
    type: input.avatar.mimeType ?? 'image/jpeg',
    name: input.avatar.fileName ?? `avatar-${Date.now()}.jpg`,
  } as unknown as Blob);
  return api.postForm<{ user: UpdatedProfileSummary }>('/api/users/me', form, { method: 'PATCH' });
}

export interface MyTicketsPage {
  items: BackendTicket[];
  total: number;
  page: number;
  pageSize: number;
}

export function getMyTickets(page = 1, pageSize = 20): Promise<MyTicketsPage> {
  return api.get<MyTicketsPage>(`/api/users/me/tickets${buildQuery({ page, pageSize })}`);
}

export function getUserTickets(id: string, page = 1, pageSize = 20): Promise<MyTicketsPage> {
  return api.get<MyTicketsPage>(
    `/api/users/${encodeURIComponent(id)}/tickets${buildQuery({ page, pageSize })}`,
  );
}

export function getMyBadges(): Promise<{ items: UserBadgeAwarded[] }> {
  return api.get<{ items: UserBadgeAwarded[] }>('/api/users/me/badges');
}

export function getUserBadges(id: string): Promise<{ items: UserBadgeAwarded[] }> {
  return api.get<{ items: UserBadgeAwarded[] }>(`/api/users/${encodeURIComponent(id)}/badges`);
}

export function searchUsers(
  q: string,
  limit = 20,
): Promise<{ items: BackendFriendUser[] }> {
  return api.get<{ items: BackendFriendUser[] }>(
    `/api/users/search${buildQuery({ q, limit })}`,
  );
}

// Settings ------------------------------------------------------------------

export interface UserPrivacy {
  profilePublic: boolean;
  showOnLeaderboard: boolean;
  allowFriendRequests: boolean;
}

export interface NotificationPrefs {
  pushLikes: boolean;
  pushComments: boolean;
  pushFriendReqs: boolean;
  pushResults: boolean;
  pushGroupInvites: boolean;
  emailDigest: boolean;
}

export interface SettingsResponse {
  user: {
    id: string;
    username: string;
    email: string;
    avatarUrl: string | null;
    bio: string | null;
    livesBalance: number;
    provider: 'LOCAL' | 'GOOGLE' | 'APPLE';
  };
  privacy: UserPrivacy | null;
  notifications: NotificationPrefs | null;
}

export function getSettings(): Promise<{ settings: SettingsResponse }> {
  return api.get<{ settings: SettingsResponse }>('/api/users/me/settings');
}

export function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ ok: true }> {
  return api.post<{ ok: true }>('/api/users/me/settings/password', input);
}

export function updatePrivacy(patch: Partial<UserPrivacy>): Promise<{ privacy: UserPrivacy }> {
  return api.patch<{ privacy: UserPrivacy }>('/api/users/me/settings/privacy', patch);
}

export function updateNotificationPrefs(
  patch: Partial<NotificationPrefs>,
): Promise<{ notifications: NotificationPrefs }> {
  return api.patch<{ notifications: NotificationPrefs }>(
    '/api/users/me/settings/notifications',
    patch,
  );
}

export function deleteAccount(): Promise<{ ok: true }> {
  return api.delete<{ ok: true }>('/api/users/me/settings/account', { confirm: 'DELETE' });
}
