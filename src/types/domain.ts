export type ThemeName = 'dark' | 'light' | 'pitch';
export type TicketVariant = 'slip' | 'card';
export type FeedLayout = 'card' | 'compact';
export type Pick = '1' | 'X' | '2';
export type LegStatus = 'won' | 'lost';
export type TicketStatus = 'pending' | 'won' | 'lost';

export interface Team {
  name: string;
  short: string;
  color: string;
  city: string;
}

export type TeamCode = string;

export interface FixtureOdds {
  '1': number;
  X: number;
  '2': number;
}

export interface Fixture {
  id: string;
  league: string;
  home: TeamCode;
  away: TeamCode;
  kickoff: string;
  day: number;
  odds: FixtureOdds;
}

export interface User {
  id: string;
  name: string;
  handle: string;
  avatarHue: number;
  level: number;
  streak: number;
  friend: boolean;
  isMe?: boolean;
  wins: number;
  losses: number;
  tickets: number;
  hitRate: number;
}

// The authenticated user as returned by /api/auth/* endpoints. Distinct from
// the social-graph `User` shape above (which carries feed-specific stats);
// both refer to a person but the backend only owns the auth fields.
export type AuthRole = 'USER' | 'ADMIN';
export type AuthProvider = 'LOCAL' | 'GOOGLE' | 'APPLE';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  role: AuthRole;
  points: number;
  livesBalance: number;
  createdAt: string;
}

export interface Leg {
  matchId: string;
  pick: Pick;
  status?: LegStatus;
  result?: string;
}

export interface Ticket {
  id: string;
  status: TicketStatus;
  potential: number;
  legs: Leg[];
  stake?: number;
}

export interface Post {
  id: string;
  userId: string;
  timeAgo: string;
  likes: number;
  liked: boolean;
  comments: number;
  caption?: string;
  ticket: Ticket;
}

export interface Reply {
  id: string;
  userId: string;
  text: string;
  time: string;
  likes: number;
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  time: string;
  likes: number;
  replies: Reply[];
}

export interface Group {
  id: string;
  name: string;
  members: number;
  private: boolean;
  color: string;
  desc: string;
  joined: boolean;
}

export interface Badge {
  id: string;
  name: string;
  desc: string;
  earned: boolean;
  emoji?: string;
  progress?: number;
  max?: number;
}

export interface LeaderboardEntry {
  userId: string;
  points: number;
  bigOdds: number;
  streak: number;
  change: number;
  friend: boolean;
  isMe?: boolean;
}

export interface PastTicket {
  id: string;
  date: string;
  status: TicketStatus;
  stake: number;
  multiplier: number;
  points: number;
  legIds: string[];
}

export interface PastPrediction {
  id: string;
  ticketId: string;
  date: string;
  league: string;
  home: TeamCode;
  away: TeamCode;
  kickoff: string;
  pick: Pick;
  result: string;
  odds: number;
  status: LegStatus;
}

export type NotificationKind =
  | 'win'
  | 'like'
  | 'comment'
  | 'friend'
  | 'group'
  | 'leader'
  | 'kickoff'
  | 'badge'
  | 'loss'
  | 'follow';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  time: string;
  read: boolean;
  userId: string | null;
  text: string;
  sub?: string;
  meta?: string;
}
