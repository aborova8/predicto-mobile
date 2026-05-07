import { useAsyncResource } from '@/hooks/useAsyncResource';
import { getLeaderboard } from '@/lib/api/leaderboard';
import type { LeaderboardBoard, LeaderboardEntry, LeaderboardScope } from '@/types/domain';

export interface UseLeaderboardResult {
  items: LeaderboardEntry[];
  viewer: LeaderboardEntry | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useLeaderboard(scope: LeaderboardScope, board: LeaderboardBoard): UseLeaderboardResult {
  const { data, loading, error, refetch } = useAsyncResource(
    () => getLeaderboard({ scope, board }),
    [scope, board],
    { fallbackErrorMessage: 'Failed to load standings' },
  );
  return {
    items: data?.items ?? [],
    viewer: data?.viewer ?? null,
    loading,
    error,
    refetch,
  };
}
