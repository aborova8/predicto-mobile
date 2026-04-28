import type { User } from '@/types/domain';

export const USERS: Record<string, User> = {
  u1: { id: 'u1', name: 'You',           handle: 'you',      avatarHue: 60,  level: 14, streak: 4,  friend: true,  isMe: true,  wins: 47,  losses: 31,  tickets: 92,  hitRate: 62 },
  u2: { id: 'u2', name: 'Marco Reyes',   handle: 'marcoR',   avatarHue: 12,  level: 28, streak: 7,  friend: true,                wins: 142, losses: 78,  tickets: 240, hitRate: 71 },
  u3: { id: 'u3', name: 'Anya Volkov',   handle: 'anya.v',   avatarHue: 280, level: 32, streak: 11, friend: true,                wins: 189, losses: 96,  tickets: 305, hitRate: 66 },
  u4: { id: 'u4', name: 'Kojo Mensah',   handle: 'kojo10',   avatarHue: 142, level: 19, streak: 2,  friend: false,               wins: 68,  losses: 51,  tickets: 124, hitRate: 58 },
  u5: { id: 'u5', name: 'Sara Lindqvist', handle: 'saralq',  avatarHue: 200, level: 25, streak: 5,  friend: true,                wins: 102, losses: 68,  tickets: 178, hitRate: 60 },
  u6: { id: 'u6', name: 'Tariq Hassan',  handle: 't.hassan', avatarHue: 35,  level: 41, streak: 14, friend: false,               wins: 244, losses: 110, tickets: 365, hitRate: 69 },
  u7: { id: 'u7', name: 'Mei Chen',      handle: 'meic',     avatarHue: 320, level: 22, streak: 3,  friend: true,                wins: 88,  losses: 62,  tickets: 158, hitRate: 59 },
  u8: { id: 'u8', name: 'Lucas Pereira', handle: 'lucasp',   avatarHue: 100, level: 17, streak: 1,  friend: false,               wins: 54,  losses: 49,  tickets: 110, hitRate: 53 },
  u9: { id: 'u9', name: 'Zara Okafor',   handle: 'zaraok',   avatarHue: 240, level: 36, streak: 9,  friend: false,               wins: 198, losses: 87,  tickets: 290, hitRate: 70 },
};
