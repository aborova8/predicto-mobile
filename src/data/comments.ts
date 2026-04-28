import type { Comment } from '@/types/domain';

export const COMMENTS: Record<string, Comment[]> = {
  p1: [
    {
      id: 'c1', userId: 'u2', text: 'Real at home is auto-pick rn', time: '6m', likes: 8,
      replies: [
        { id: 'c1a', userId: 'u3', text: 'exactly my thinking', time: '5m', likes: 2 },
      ],
    },
    {
      id: 'c2', userId: 'u5', text: 'PSG always rotate before champions league tho 👀', time: '4m', likes: 5,
      replies: [],
    },
    {
      id: 'c3', userId: 'u6', text: 'we cooking 🔥', time: '2m', likes: 3,
      replies: [],
    },
  ],
};
