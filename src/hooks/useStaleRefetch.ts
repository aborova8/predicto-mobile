import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useDataEpoch } from '@/state/DataEpochContext';

const DEFAULT_STALE_AFTER_MS = 5 * 60 * 1000;

export interface UseStaleRefetchOptions {
  staleAfterMs?: number;
  enabled?: boolean;
}

export interface UseStaleRefetchResult {
  /**
   * The caller's `refetch`, wrapped so each successful run updates the
   * freshness timestamp. Use this for explicit user-initiated refreshes
   * (e.g. pull-to-refresh and the initial mount fetch). Always fetches —
   * the stale-window gate only applies to the auto-refetch triggers
   * managed inside the hook.
   */
  refetch: () => Promise<void>;
  lastFetchedAt: Date | null;
}

/**
 * Auto-refetch on tab focus and on app foreground (via DataEpochContext),
 * gated by a stale window so quick toggles don't hammer the API. Pull-to-
 * refresh callers go through the returned `refetch` directly to bypass
 * the gate.
 *
 * Why both `didMountRef` and `prevEpochRef`: skipping the very first run
 * after mount avoids racing the caller's own mount fetch; tracking the
 * previous epoch makes the trigger robust against any initial counter
 * value (we don't depend on `dataEpoch === 0`).
 */
export function useStaleRefetch(
  baseRefetch: () => Promise<void>,
  opts: UseStaleRefetchOptions = {},
): UseStaleRefetchResult {
  const { staleAfterMs = DEFAULT_STALE_AFTER_MS, enabled = true } = opts;
  const dataEpoch = useDataEpoch();
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  const lastFetchedAtRef = useRef<Date | null>(null);
  const didMountRef = useRef(false);
  const prevEpochRef = useRef(dataEpoch);

  const refetch = useCallback(async () => {
    await baseRefetch();
    const now = new Date();
    lastFetchedAtRef.current = now;
    setLastFetchedAt(now);
  }, [baseRefetch]);

  const refetchIfStale = useCallback(() => {
    if (!enabled) return;
    const last = lastFetchedAtRef.current;
    if (!last || Date.now() - last.getTime() > staleAfterMs) {
      void refetch();
    }
  }, [enabled, refetch, staleAfterMs]);

  useFocusEffect(
    useCallback(() => {
      refetchIfStale();
    }, [refetchIfStale]),
  );

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      prevEpochRef.current = dataEpoch;
      return;
    }
    if (prevEpochRef.current === dataEpoch) return;
    prevEpochRef.current = dataEpoch;
    refetchIfStale();
  }, [dataEpoch, refetchIfStale]);

  return { refetch, lastFetchedAt };
}
