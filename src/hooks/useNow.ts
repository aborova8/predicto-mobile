import { useEffect, useState } from 'react';

// 30s default is the worst-case window where a just-kicked-off match still
// looks pickable. Tighter would be churn; coarser would be UX.
export function useNow(intervalMs: number = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
