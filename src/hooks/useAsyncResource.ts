import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DependencyList,
  type Dispatch,
  type SetStateAction,
} from 'react';

export interface UseAsyncResourceOptions {
  enabled?: boolean;
  fallbackErrorMessage?: string;
}

export interface UseAsyncResourceResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  setData: Dispatch<SetStateAction<T | null>>;
}

// Shared async-fetch hook used by every per-resource hook in `src/hooks/group*`.
// Owns: race-protected refetch, loading/error state, `enabled` short-circuit,
// and `setData` for optimistic mutations. Mirrors the established pattern from
// useFeed/useMatches/useEligibility — those predate this helper and could be
// migrated separately.
export function useAsyncResource<T>(
  fetcher: () => Promise<T>,
  deps: DependencyList,
  options: UseAsyncResourceOptions = {},
): UseAsyncResourceResult<T> {
  const { enabled = true, fallbackErrorMessage = 'Request failed' } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);
  const reqRef = useRef(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refetch = useCallback(async () => {
    if (!enabled) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    const reqId = ++reqRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      if (reqRef.current !== reqId) return;
      setData(result);
    } catch (err) {
      if (reqRef.current !== reqId) return;
      setError(err instanceof Error ? err : new Error(fallbackErrorMessage));
    } finally {
      if (reqRef.current === reqId) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch, setData };
}
