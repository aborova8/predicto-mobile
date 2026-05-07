import { useEffect, useRef, useState } from 'react';

import { searchUsers } from '@/lib/api/users';
import type { BackendFriendUser } from '@/types/domain';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LEN = 3; // mirror backend Zod schema (`q.min(3)`).

export interface UseUserSearchResult {
  results: BackendFriendUser[];
  isLoading: boolean;
  error: Error | null;
  // True when the query is set but below the min length the backend accepts.
  belowMinLength: boolean;
}

export function useUserSearch(query: string, limit = 20): UseUserSearchResult {
  const [results, setResults] = useState<BackendFriendUser[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const reqRef = useRef(0);

  const trimmed = query.trim();
  const belowMinLength = trimmed.length > 0 && trimmed.length < MIN_QUERY_LEN;

  useEffect(() => {
    if (trimmed.length < MIN_QUERY_LEN) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }
    const reqId = ++reqRef.current;
    setLoading(true);
    setError(null);
    const handle = setTimeout(async () => {
      try {
        const { items } = await searchUsers(trimmed, limit);
        if (reqRef.current !== reqId) return;
        setResults(items);
      } catch (err) {
        if (reqRef.current !== reqId) return;
        setError(err instanceof Error ? err : new Error('Search failed'));
        setResults([]);
      } finally {
        if (reqRef.current === reqId) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [trimmed, limit]);

  return { results, isLoading, error, belowMinLength };
}
