import { api, buildQuery } from '@/lib/api';
import type { BackendTicket, MyProfile } from '@/types/domain';

export function getMyProfile(): Promise<{ profile: MyProfile }> {
  return api.get<{ profile: MyProfile }>('/api/users/me');
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

export interface MyTicketsPage {
  items: BackendTicket[];
  total: number;
  page: number;
  pageSize: number;
}

export function getMyTickets(page = 1, pageSize = 20): Promise<MyTicketsPage> {
  return api.get<MyTicketsPage>(`/api/users/me/tickets${buildQuery({ page, pageSize })}`);
}
