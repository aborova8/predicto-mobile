import type { LeaderboardEntry, PastTicket, PastPrediction } from '@/types/domain';

export const LEADERBOARD: LeaderboardEntry[] = [
  { userId: 'u6', points: 2840, bigOdds: 18.75, streak: 4,  change: 0,  friend: false },
  { userId: 'u9', points: 2615, bigOdds: 42.30, streak: 3,  change: 1,  friend: false },
  { userId: 'u3', points: 2487, bigOdds: 9.55,  streak: 7,  change: -1, friend: true },
  { userId: 'u2', points: 2304, bigOdds: 12.10, streak: 2,  change: 2,  friend: true },
  { userId: 'u5', points: 2156, bigOdds: 24.80, streak: 5,  change: 0,  friend: true },
  { userId: 'u7', points: 1942, bigOdds: 6.40,  streak: 1,  change: -2, friend: true },
  { userId: 'u4', points: 1823, bigOdds: 31.20, streak: 0,  change: 1,  friend: false },
  { userId: 'u1', points: 1687, bigOdds: 14.56, streak: 6,  change: 3,  friend: true, isMe: true },
  { userId: 'u8', points: 1521, bigOdds: 8.90,  streak: 2,  change: -1, friend: false },
];

export const PAST_TICKETS: PastTicket[] = [
  { id: 'tk_a', date: 'Apr 23', status: 'won',     stake: 50,  multiplier: 5.27,  points: 263, legIds: ['p01', 'p02'] },
  { id: 'tk_b', date: 'Apr 22', status: 'lost',    stake: 75,  multiplier: 11.60, points: 0,   legIds: ['p03', 'p04', 'p05'] },
  { id: 'tk_c', date: 'Apr 21', status: 'lost',    stake: 50,  multiplier: 5.32,  points: 0,   legIds: ['p06', 'p07'] },
  { id: 'tk_d', date: 'Apr 20', status: 'won',     stake: 100, multiplier: 3.63,  points: 363, legIds: ['p08', 'p09'] },
  { id: 'tk_e', date: 'Apr 19', status: 'lost',    stake: 50,  multiplier: 21.60, points: 0,   legIds: ['p10', 'p11', 'p12'] },
  { id: 'tk_f', date: 'Apr 18', status: 'lost',    stake: 60,  multiplier: 3.68,  points: 0,   legIds: ['p13', 'p14'] },
  { id: 'tk_g', date: 'Apr 17', status: 'lost',    stake: 40,  multiplier: 1.55,  points: 0,   legIds: ['p15'] },
  { id: 'tk_h', date: 'Apr 16', status: 'pending', stake: 50,  multiplier: 4.20,  points: 0,   legIds: [] },
];

export const PAST_PREDICTIONS: PastPrediction[] = [
  { id: 'p01', ticketId: 'tk_a', date: 'Apr 23', league: 'PL',     home: 'MCI', away: 'TOT', kickoff: '20:45', pick: '1', result: '2-1', odds: 1.55, status: 'won' },
  { id: 'p02', ticketId: 'tk_a', date: 'Apr 23', league: 'LaLiga', home: 'RMA', away: 'BAR', kickoff: '21:00', pick: 'X', result: '1-1', odds: 3.40, status: 'won' },
  { id: 'p03', ticketId: 'tk_b', date: 'Apr 22', league: 'PL',     home: 'LIV', away: 'NEW', kickoff: '17:30', pick: '1', result: '3-0', odds: 1.45, status: 'won' },
  { id: 'p04', ticketId: 'tk_b', date: 'Apr 22', league: 'SerieA', home: 'INT', away: 'JUV', kickoff: '20:45', pick: '2', result: '0-1', odds: 4.10, status: 'won' },
  { id: 'p05', ticketId: 'tk_b', date: 'Apr 22', league: 'PL',     home: 'CHE', away: 'AVL', kickoff: '15:00', pick: '1', result: '2-2', odds: 1.95, status: 'lost' },
  { id: 'p06', ticketId: 'tk_c', date: 'Apr 21', league: 'CL',     home: 'PSG', away: 'BAY', kickoff: '21:00', pick: 'X', result: '0-2', odds: 3.80, status: 'lost' },
  { id: 'p07', ticketId: 'tk_c', date: 'Apr 21', league: 'PL',     home: 'ARS', away: 'WHU', kickoff: '17:30', pick: '1', result: '4-1', odds: 1.40, status: 'won' },
  { id: 'p08', ticketId: 'tk_d', date: 'Apr 20', league: 'LaLiga', home: 'ATM', away: 'SEV', kickoff: '21:00', pick: '1', result: '3-1', odds: 1.65, status: 'won' },
  { id: 'p09', ticketId: 'tk_d', date: 'Apr 20', league: 'Bund',   home: 'BVB', away: 'LEV', kickoff: '18:30', pick: '2', result: '1-3', odds: 2.20, status: 'won' },
  { id: 'p10', ticketId: 'tk_e', date: 'Apr 19', league: 'PL',     home: 'MUN', away: 'BUR', kickoff: '15:00', pick: '1', result: '2-0', odds: 1.50, status: 'won' },
  { id: 'p11', ticketId: 'tk_e', date: 'Apr 19', league: 'SerieA', home: 'NAP', away: 'ROM', kickoff: '20:45', pick: 'X', result: '1-1', odds: 3.20, status: 'won' },
  { id: 'p12', ticketId: 'tk_e', date: 'Apr 19', league: 'PL',     home: 'BHA', away: 'EVE', kickoff: '17:30', pick: '2', result: '1-0', odds: 4.50, status: 'lost' },
  { id: 'p13', ticketId: 'tk_f', date: 'Apr 18', league: 'CL',     home: 'BAR', away: 'PSG', kickoff: '21:00', pick: '1', result: '1-1', odds: 2.10, status: 'lost' },
  { id: 'p14', ticketId: 'tk_f', date: 'Apr 18', league: 'PL',     home: 'TOT', away: 'NFO', kickoff: '17:30', pick: '1', result: '3-1', odds: 1.75, status: 'won' },
  { id: 'p15', ticketId: 'tk_g', date: 'Apr 17', league: 'LaLiga', home: 'BAR', away: 'GIR', kickoff: '21:00', pick: '1', result: '2-2', odds: 1.55, status: 'lost' },
];
