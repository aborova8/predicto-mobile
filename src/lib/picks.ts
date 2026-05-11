import { getMatch } from '@/lib/matchCache';
import type { Fixture, Pick } from '@/types/domain';

export type PickEntry = [matchId: string, pick: Pick];

export interface StartedPickGroup {
  fresh: PickEntry[];
  startedFixtures: Fixture[];
}

/**
 * Splits a Picks map into picks whose match is still open versus picks whose
 * match has already kicked off. Resolves fixtures from the shared matchCache —
 * picks for matches that aren't cached are treated as fresh (the backend is
 * the source of truth and will reject them if needed).
 */
export function partitionPicksByKickoff(
  picks: Record<string, Pick | null>,
  now: Date = new Date(),
): StartedPickGroup {
  const nowMs = now.getTime();
  const fresh: PickEntry[] = [];
  const startedFixtures: Fixture[] = [];
  for (const [matchId, pick] of Object.entries(picks)) {
    if (!pick) continue;
    const f = getMatch(matchId);
    if (f && new Date(f.kickoffAt).getTime() <= nowMs) {
      startedFixtures.push(f);
    } else {
      fresh.push([matchId, pick]);
    }
  }
  return { fresh, startedFixtures };
}

/**
 * Standard banner text shown when one or more picks were just removed because
 * their match kicked off. Consistent wording across matches/review screens.
 */
export function startedPicksBanner(started: Fixture[]): string {
  if (started.length === 0) return '';
  if (started.length === 1) {
    const f = started[0];
    return `${f.homeName ?? f.home} vs ${f.awayName ?? f.away} kicked off — removed from your slip.`;
  }
  return `${started.length} matches kicked off — removed from your slip.`;
}
