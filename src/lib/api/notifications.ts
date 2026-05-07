import { api, buildQuery } from '@/lib/api';
import type { BackendNotification } from '@/types/domain';

export interface ListNotificationsResponse {
  items: BackendNotification[];
  nextCursor: string | null;
  unreadCount: number;
}

export function listNotifications(query: {
  cursor?: string;
  limit?: number;
  unreadOnly?: boolean;
} = {}): Promise<ListNotificationsResponse> {
  return api.get<ListNotificationsResponse>(
    `/api/notifications${buildQuery(query)}`,
  );
}

export function getUnreadNotifications(): Promise<{ unread: number }> {
  return api.get<{ unread: number }>('/api/notifications/unread-count');
}

export function markNotificationRead(id: string): Promise<{ ok: true }> {
  return api.post<{ ok: true }>(`/api/notifications/${encodeURIComponent(id)}/read`);
}

export function markAllNotificationsRead(): Promise<{ updated: number }> {
  return api.post<{ updated: number }>('/api/notifications/read-all');
}

export function deleteNotification(id: string): Promise<{ ok: true }> {
  return api.delete<{ ok: true }>(`/api/notifications/${encodeURIComponent(id)}`);
}
