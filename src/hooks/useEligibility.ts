import { useCallback, useEffect, useRef, useState } from 'react';

import { getEligibility } from '@/lib/api/tickets';
import type { Eligibility } from '@/types/domain';

export interface UseEligibilityResult {
  data: Eligibility | null;
  ticketsLeft: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useEligibility(): UseEligibilityResult {
  const [data, setData] = useState<Eligibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const reqRef = useRef(0);

  const refetch = useCallback(async () => {
    const reqId = ++reqRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await getEligibility();
      if (reqRef.current !== reqId) return;
      setData(result);
    } catch (err) {
      if (reqRef.current !== reqId) return;
      setError(err instanceof Error ? err : new Error('Failed to load eligibility'));
    } finally {
      if (reqRef.current === reqId) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const ticketsLeft = !data
    ? 0
    : data.unlimitedTickets
      ? 99
      : (data.freeTicketsRemaining ?? 0) + data.livesBalance;

  return { data, ticketsLeft, loading, error, refetch };
}
