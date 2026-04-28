import type { Badge } from '@/types/domain';

export const BADGES: Badge[] = [
  { id: 'b1', name: 'Hot Streak',   desc: '5 wins in a row',                   earned: true,  emoji: '🔥' },
  { id: 'b2', name: 'Underdog',     desc: 'Win at 5.0+ odds',                  earned: true,  emoji: '🎯' },
  { id: 'b3', name: 'Centurion',    desc: 'Play 100 tickets',                  earned: false, progress: 92, max: 100 },
  { id: 'b4', name: 'The Oracle',   desc: '70% hit rate (50+ tickets)',        earned: false, progress: 62, max: 70 },
  { id: 'b5', name: 'First Blood',  desc: 'Win your first ticket',             earned: true,  emoji: '🥇' },
  { id: 'b6', name: 'Treble',       desc: 'Win a 3-leg accumulator',           earned: true,  emoji: '⚡' },
  { id: 'b7', name: 'Globetrotter', desc: 'Predict in 5 leagues',              earned: true,  emoji: '🌍' },
  { id: 'b8', name: 'Nine Lives',   desc: 'Win after 5 losses',                earned: false, progress: 3, max: 5 },
];
