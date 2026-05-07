import { api, buildQuery } from '@/lib/api';
import type { LeaderboardBoard, LeaderboardResponse, LeaderboardScope } from '@/types/domain';

export type ListLeaderboardQuery = {
  scope?: LeaderboardScope;
  board?: LeaderboardBoard;
  limit?: number;
};

export function getLeaderboard(q: ListLeaderboardQuery = {}): Promise<LeaderboardResponse> {
  return api.get<LeaderboardResponse>(`/api/leaderboard${buildQuery(q)}`);
}
