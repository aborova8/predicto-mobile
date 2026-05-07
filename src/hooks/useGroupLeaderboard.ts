import { useAsyncResource } from '@/hooks/useAsyncResource';
import { getGroupLeaderboard } from '@/lib/api/groups';
import type { GroupLeaderboardEntry } from '@/types/domain';

export interface UseGroupLeaderboardResult {
  entries: GroupLeaderboardEntry[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useGroupLeaderboard(id: string): UseGroupLeaderboardResult {
  const { data, loading, error, refetch } = useAsyncResource(
    async () => (await getGroupLeaderboard(id)).items,
    [id],
    { fallbackErrorMessage: 'Failed to load leaderboard' },
  );
  return { entries: data ?? [], loading, error, refetch };
}
