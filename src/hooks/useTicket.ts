import { useCallback, useEffect, useRef, useState } from 'react';

import { useStaleRefetch } from '@/hooks/useStaleRefetch';
import { getTicket } from '@/lib/api/tickets';
import { backendTicketToTicket, formatRelativeTime } from '@/lib/mappers';
import type { BackendTicket, Ticket } from '@/types/domain';

export interface UseTicketResult {
  ticket: Ticket | null;
  raw: BackendTicket | null;
  createdAtRelative: string | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useTicket(id: string | null): UseTicketResult {
  const [raw, setRaw] = useState<BackendTicket | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(id));
  const [error, setError] = useState<Error | null>(null);
  const reqRef = useRef(0);

  const baseRefetch = useCallback(async () => {
    if (!id) return;
    const reqId = ++reqRef.current;
    setLoading(true);
    setError(null);
    try {
      const { ticket } = await getTicket(id);
      if (reqRef.current !== reqId) return;
      setRaw(ticket);
    } catch (err) {
      if (reqRef.current !== reqId) return;
      setError(err instanceof Error ? err : new Error('Failed to load ticket'));
    } finally {
      if (reqRef.current === reqId) setLoading(false);
    }
  }, [id]);

  const { refetch } = useStaleRefetch(baseRefetch, { enabled: !!id });

  useEffect(() => {
    if (!id) {
      setRaw(null);
      setLoading(false);
      return;
    }
    void refetch();
  }, [id, refetch]);

  const ticket = raw ? backendTicketToTicket(raw) : null;
  const createdAtRelative = raw ? formatRelativeTime(raw.createdAt) : null;

  return { ticket, raw, createdAtRelative, loading, error, refetch };
}
