import type { Post } from '@/types/domain';

export const POSTS: Post[] = [
  {
    id: 'p1', userId: 'u3', timeAgo: '8m', likes: 47, liked: false, comments: 12,
    caption: 'El Clásico day. trusting the home form 🏟️',
    ticket: {
      id: 't1', status: 'pending', potential: 845,
      legs: [
        { matchId: 'm7', pick: '1' },
        { matchId: 'm3', pick: '1' },
        { matchId: 'm9', pick: '1' },
      ],
    },
  },
  {
    id: 'p2', userId: 'u2', timeAgo: '24m', likes: 89, liked: true, comments: 23,
    caption: 'Derby weekend. all draws, all banger.',
    ticket: {
      id: 't2', status: 'pending', potential: 1240,
      legs: [
        { matchId: 'm10', pick: 'X' },
        { matchId: 'm12', pick: 'X' },
        { matchId: 'm6',  pick: 'X' },
      ],
    },
  },
  {
    id: 'p3', userId: 'u6', timeAgo: '1h', likes: 156, liked: false, comments: 34,
    caption: 'Bayern away? thanks but no thanks. Leipzig take it.',
    ticket: {
      id: 't3', status: 'pending', potential: 370,
      legs: [
        { matchId: 'm11', pick: '2' },
      ],
    },
  },
  {
    id: 'p4', userId: 'u5', timeAgo: '2h', likes: 28, liked: false, comments: 7,
    caption: "Safe-ish accumulator. let's eat. one in the bag already.",
    ticket: {
      id: 't4', status: 'pending', potential: 412,
      legs: [
        { matchId: 'm2', pick: '1', status: 'won', result: '2-0' },
        { matchId: 'm5', pick: '1' },
        { matchId: 'm8', pick: '1' },
      ],
    },
  },
  {
    id: 'p5', userId: 'u9', timeAgo: '4h', likes: 312, liked: true, comments: 78,
    caption: "Yesterday's slip cashed. up 4 in a row 🔥",
    ticket: {
      id: 't5', status: 'won', potential: 1950,
      legs: [
        { matchId: 'm1', pick: '1', status: 'won', result: '3-1' },
        { matchId: 'm4', pick: '2', status: 'won', result: '0-2' },
        { matchId: 'm7', pick: 'X', status: 'won', result: '1-1' },
      ],
    },
  },
  {
    id: 'p6', userId: 'u7', timeAgo: '6h', likes: 19, liked: false, comments: 4,
    caption: 'rolling the dice on PSG away. could be carnage.',
    ticket: {
      id: 't6', status: 'pending', potential: 350,
      legs: [
        { matchId: 'm9', pick: '2' },
      ],
    },
  },
  {
    id: 'p7', userId: 'u4', timeAgo: '12h', likes: 64, liked: false, comments: 11,
    caption: 'Slip went down on the last leg. brutal.',
    ticket: {
      id: 't7', status: 'lost', potential: 0,
      legs: [
        { matchId: 'm1',  pick: '1', status: 'won',  result: '2-1' },
        { matchId: 'm10', pick: '1', status: 'lost', result: '0-1' },
      ],
    },
  },
];
