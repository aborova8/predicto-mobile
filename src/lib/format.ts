import { getMatch } from '@/lib/matchCache';
import type { Leg } from '@/types/domain';

export const fmtOdds = (n: number) => n.toFixed(2);

export function calculateTotalOdds(legs: Leg[]): number {
  return legs.reduce((acc, l) => {
    const f = l.fixture ?? getMatch(l.matchId);
    return acc * (f ? f.odds[l.pick] : 1);
  }, 1);
}

export function multiplyOdds(odds: number[]): number {
  return odds.reduce((acc, n) => acc * n, 1);
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
