import type { PastTicket, PastPrediction } from '@/types/domain';

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
