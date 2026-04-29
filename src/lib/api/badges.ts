import { api } from '@/lib/api';
import type { BadgeDefinition, UserBadgeAwarded } from '@/types/domain';

export function getAllBadges(): Promise<{ items: BadgeDefinition[] }> {
  return api.get<{ items: BadgeDefinition[] }>('/api/badges');
}

export function getMyBadges(): Promise<{ items: UserBadgeAwarded[] }> {
  return api.get<{ items: UserBadgeAwarded[] }>('/api/users/me/badges');
}
