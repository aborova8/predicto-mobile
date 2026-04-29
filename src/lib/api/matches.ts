import { api, buildQuery } from '@/lib/api';
import type { BackendMatch } from '@/types/domain';

export type ListMatchesQuery = {
  from?: Date;
  to?: Date;
  limit?: number;
};

export function listMatches(q: ListMatchesQuery = {}): Promise<{ items: BackendMatch[] }> {
  return api.get<{ items: BackendMatch[] }>(`/api/matches${buildQuery(q)}`);
}

export function getMatch(id: string): Promise<{ match: BackendMatch }> {
  return api.get<{ match: BackendMatch }>(`/api/matches/${encodeURIComponent(id)}`);
}
