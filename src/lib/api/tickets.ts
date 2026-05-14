import { api } from '@/lib/api';
import type { BackendPrediction, BackendTicket, Eligibility } from '@/types/domain';

export interface CreateTicketInput {
  picks: { matchId: string; prediction: BackendPrediction }[];
  caption?: string;
  // When set, the ticket is scoped to this group: it stays out of the global
  // feed/leaderboard and appears only in the group's feed/leaderboard. The
  // backend rejects requests for groups the caller isn't a member of.
  groupId?: string;
}

export function getEligibility(): Promise<Eligibility> {
  return api.get<Eligibility>('/api/tickets/eligibility');
}

export function createTicket(input: CreateTicketInput): Promise<{ ticket: BackendTicket }> {
  return api.post<{ ticket: BackendTicket }>('/api/tickets', input);
}

export function getTicket(id: string): Promise<{ ticket: BackendTicket }> {
  return api.get<{ ticket: BackendTicket }>(`/api/tickets/${encodeURIComponent(id)}`);
}
