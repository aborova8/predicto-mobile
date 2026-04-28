import type { AppNotification } from '@/types/domain';

export const NOTIFICATIONS: AppNotification[] = [
  { id: 'n1',  kind: 'win',     time: '2m',  read: false, userId: 'u1', text: 'Your slip cashed for 425 pts',          sub: 'INT vs JUV · Apr 23',         meta: '+425' },
  { id: 'n2',  kind: 'like',    time: '14m', read: false, userId: 'u3', text: 'Anya Volkov liked your slip',           sub: '"Just locked it in. Let\'s ride."' },
  { id: 'n3',  kind: 'comment', time: '32m', read: false, userId: 'u2', text: 'Marco Reyes commented on your slip',    sub: '"PSG always rotate before CL 👀"' },
  { id: 'n4',  kind: 'friend',  time: '1h',  read: false, userId: 'u9', text: 'Zara Okafor sent you a friend request', sub: 'LVL 36 · 70% hit rate' },
  { id: 'n5',  kind: 'group',   time: '2h',  read: true,  userId: 'u6', text: 'Tariq invited you to PL Diehards',      sub: '5,621 members' },
  { id: 'n6',  kind: 'leader',  time: '3h',  read: true,  userId: null, text: 'You moved up 3 spots on the leaderboard', sub: 'Now ranked #8 globally', meta: '▲ 3' },
  { id: 'n7',  kind: 'kickoff', time: '5h',  read: true,  userId: null, text: 'PSG vs Marseille kicks off in 30 min',  sub: 'You picked PSG · 1.40×' },
  { id: 'n8',  kind: 'badge',   time: '1d',  read: true,  userId: null, text: 'New badge earned: Globetrotter',        sub: 'Predict in 5 different leagues', meta: '🌍' },
  { id: 'n9',  kind: 'loss',    time: '1d',  read: true,  userId: null, text: "Your 4-leg slip didn't cash",           sub: 'CHE 2-2 AVL broke the run' },
  { id: 'n10', kind: 'follow',  time: '2d',  read: true,  userId: 'u5', text: 'Sara Lindqvist started following you' },
];
