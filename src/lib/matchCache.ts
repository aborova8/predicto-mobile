import type { Fixture } from '@/types/domain';

const cache = new Map<string, Fixture>();

export function setMatch(fixture: Fixture): void {
  cache.set(fixture.id, fixture);
}

export function setMatches(fixtures: Fixture[]): void {
  for (const f of fixtures) cache.set(f.id, f);
}

export function getMatch(id: string): Fixture | undefined {
  return cache.get(id);
}

export function clearMatches(): void {
  cache.clear();
}
