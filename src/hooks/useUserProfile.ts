import { useAsyncResource } from '@/hooks/useAsyncResource';
import { ApiError } from '@/lib/api';
import { getUserBadges, getUserById, getUserTickets } from '@/lib/api/users';
import type { BackendTicket, MyProfile, UserBadgeAwarded } from '@/types/domain';

interface ProfileBundle {
  profile: MyProfile;
  tickets: BackendTicket[];
  badges: UserBadgeAwarded[];
}

export interface UseUserProfileResult {
  profile: MyProfile | null;
  tickets: BackendTicket[];
  badges: UserBadgeAwarded[];
  loading: boolean;
  error: Error | null;
  // True when the backend refuses to surface this user's profile (private +
  // viewer is not authorized, or blocked). The 404/403 is normalized so callers
  // can render an empty-state instead of a generic error.
  notViewable: boolean;
  refetch: () => Promise<void>;
}

export function useUserProfile(userId: string | undefined): UseUserProfileResult {
  const enabled = Boolean(userId);

  const { data, loading, error, refetch } = useAsyncResource<ProfileBundle | null>(
    async () => {
      if (!userId) return null;
      const { profile } = await getUserById(userId);
      // Tickets/badges may 403 even when the profile loads (e.g. profile is
      // public but tickets are not). Swallow individual list errors so the
      // header still renders.
      const [tickets, badges] = await Promise.all([
        getUserTickets(userId, 1, 20).then((p) => p.items).catch(() => [] as BackendTicket[]),
        getUserBadges(userId).then((p) => p.items).catch(() => [] as UserBadgeAwarded[]),
      ]);
      return { profile, tickets, badges };
    },
    [userId],
    { enabled, fallbackErrorMessage: 'Failed to load profile' },
  );

  const notViewable =
    error instanceof ApiError && (error.status === 403 || error.status === 404);

  return {
    profile: data?.profile ?? null,
    tickets: data?.tickets ?? [],
    badges: data?.badges ?? [],
    loading,
    error: notViewable ? null : error,
    notViewable,
    refetch,
  };
}
