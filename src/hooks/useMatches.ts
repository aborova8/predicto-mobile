import { useCallback, useEffect, useRef, useState } from 'react';

import { useStaleRefetch } from '@/hooks/useStaleRefetch';
import { listMatches } from '@/lib/api/matches';
import { dayLabelFromIndex, matchToFixture } from '@/lib/mappers';
import { setMatches } from '@/lib/matchCache';
import type { Fixture } from '@/types/domain';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export interface DaySection {
  index: number;
  label: string;
  count: number;
}

export interface UseMatchesResult {
  fixtures: Fixture[];
  byDay: Record<number, Record<string, Fixture[]>>;
  days: DaySection[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  lastFetchedAt: Date | null;
}

export function useMatches(): UseMatchesResult {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const reqRef = useRef(0);

  const baseRefetch = useCallback(async () => {
    const reqId = ++reqRef.current;
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const { items } = await listMatches({
        from: now,
        to: new Date(now.getTime() + SEVEN_DAYS_MS),
        limit: 200,
      });
      if (reqRef.current !== reqId) return;
      const mapped = items.map((m) => matchToFixture(m, now));
      setMatches(mapped);
      setFixtures(mapped);
    } catch (err) {
      if (reqRef.current !== reqId) return;
      setError(err instanceof Error ? err : new Error('Failed to load matches'));
    } finally {
      if (reqRef.current === reqId) setLoading(false);
    }
  }, []);

  const { refetch, lastFetchedAt } = useStaleRefetch(baseRefetch);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const byDay: Record<number, Record<string, Fixture[]>> = {};
  const dayCounts = new Map<number, number>();
  for (const f of fixtures) {
    if (f.day < 0 || f.day > 6) continue;
    (byDay[f.day] ??= {});
    (byDay[f.day][f.league] ??= []).push(f);
    dayCounts.set(f.day, (dayCounts.get(f.day) ?? 0) + 1);
  }
  const now = new Date();
  const days: DaySection[] = Array.from(dayCounts.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([index, count]) => ({ index, label: dayLabelFromIndex(index, now), count }));

  return { fixtures, byDay, days, loading, error, refetch, lastFetchedAt };
}
