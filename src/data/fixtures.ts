import type { Fixture } from '@/types/domain';

export const FIXTURES: Fixture[] = [
  { id: 'm1',  league: 'Premier League', home: 'ARS', away: 'CHE', kickoff: 'Today 20:45', day: 0, odds: { '1': 1.85, X: 3.40, '2': 4.20 } },
  { id: 'm2',  league: 'Premier League', home: 'LIV', away: 'NEW', kickoff: 'Today 18:30', day: 0, odds: { '1': 1.60, X: 4.10, '2': 5.50 } },
  { id: 'm3',  league: 'La Liga',        home: 'RMA', away: 'SEV', kickoff: 'Today 21:00', day: 0, odds: { '1': 1.45, X: 4.50, '2': 6.80 } },
  { id: 'm4',  league: 'Serie A',        home: 'NAP', away: 'JUV', kickoff: 'Today 20:00', day: 0, odds: { '1': 2.10, X: 3.20, '2': 3.40 } },
  { id: 'm5',  league: 'Premier League', home: 'MCI', away: 'TOT', kickoff: 'Sat 16:00',   day: 1, odds: { '1': 1.55, X: 4.20, '2': 5.80 } },
  { id: 'm6',  league: 'Premier League', home: 'MUN', away: 'AVL', kickoff: 'Sat 14:00',   day: 1, odds: { '1': 1.95, X: 3.50, '2': 3.80 } },
  { id: 'm7',  league: 'La Liga',        home: 'BAR', away: 'ATM', kickoff: 'Sat 21:00',   day: 1, odds: { '1': 1.70, X: 3.80, '2': 4.60 } },
  { id: 'm8',  league: 'Bundesliga',     home: 'BAY', away: 'BVB', kickoff: 'Sat 18:30',   day: 1, odds: { '1': 1.50, X: 4.40, '2': 6.00 } },
  { id: 'm9',  league: 'Ligue 1',        home: 'PSG', away: 'MAR', kickoff: 'Sat 21:00',   day: 1, odds: { '1': 1.40, X: 4.80, '2': 7.20 } },
  { id: 'm10', league: 'Serie A',        home: 'INT', away: 'MIL', kickoff: 'Sun 20:45',   day: 2, odds: { '1': 2.20, X: 3.30, '2': 3.10 } },
  { id: 'm11', league: 'Bundesliga',     home: 'RBL', away: 'BAY', kickoff: 'Sun 17:30',   day: 2, odds: { '1': 4.20, X: 3.60, '2': 1.85 } },
  { id: 'm12', league: 'Premier League', home: 'CHE', away: 'LIV', kickoff: 'Sun 16:30',   day: 2, odds: { '1': 2.80, X: 3.40, '2': 2.50 } },
];

export const fixtureMap: Record<string, Fixture> = Object.fromEntries(
  FIXTURES.map((f) => [f.id, f]),
);
