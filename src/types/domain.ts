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
  // Full team names when known (populated from backend matches). Lets the UI
  // show "Crystal Palace vs West Ham" for teams not in the static TEAMS dict.
  homeName?: string;
  awayName?: string;
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
  streak: number;
  xp: number;
  level: number;
  createdAt: string;
}

export interface MyProfileStats {
  totalTickets: number;
  won: number;
  lost: number;
  pending: number;
  winRate: number;
  lossRate: number;
  avgOdds: number | null;
}

export interface MyProfile {
  id: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  points: number;
  streak: number;
  xp: number;
  level: number;
  xpInLevel: number;
  xpToNextLevel: number;
  createdAt: string;
  stats: MyProfileStats;
}

export interface BadgeDefinition {
  id: string;
  code: string;
  name: string;
  description: string;
  iconUrl: string | null;
}

export interface UserBadgeAwarded {
  id: string;
  userId: string;
  badgeId: string;
  awardedAt: string;
  badge: BadgeDefinition;
}

export interface Leg {
  matchId: string;
  pick: Pick;
  status?: LegStatus;
  result?: string;
  // Inlined fixture data when the leg is sourced from the backend (where each
  // pick already carries its match). Falls back to fixtureMap / matchCache when
  // absent so legacy mock posts keep rendering.
  fixture?: Fixture;
}

export interface Ticket {
  id: string;
  status: TicketStatus;
  potential: number;
  legs: Leg[];
  stake?: number;
}

export interface PostAuthor {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export interface Post {
  id: string;
  userId: string;
  author: PostAuthor;
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

// Live, backend-driven comment shape used by the feed/comments sheet.
// Distinct from the legacy mock-driven `Comment` type which other screens
// (leaderboard, profile) still import.
export interface FeedComment {
  id: string;
  parentId: string | null;
  author: PostAuthor;
  text: string;
  time: string;
  likes: number;
  liked: boolean;
  replies: FeedComment[];
  isMine: boolean;
}

export type GroupVisibility = 'PUBLIC' | 'PRIVATE';
export type GroupRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface Group {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  visibility: GroupVisibility;
  // Present in list responses for PUBLIC groups, in detail when viewer is a
  // member, and in any response for PRIVATE groups the viewer can see.
  inviteCode?: string;
  avatarUrl: string | null;
  createdAt: string;
  memberCount: number;
  viewerRole: GroupRole | null;
  owner?: PostAuthor;
  // Mobile-only derived field. Stable per-group, hashed from id in the mapper —
  // not round-tripped to the backend.
  color: string;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: GroupRole;
  joinedAt: string;
  user: PostAuthor & { points: number };
}

export type JoinRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface GroupJoinRequest {
  id: string;
  groupId: string;
  userId: string;
  status: JoinRequestStatus;
  createdAt: string;
  user: PostAuthor;
}

export interface GroupLeaderboardEntry {
  user: PostAuthor;
  role: GroupRole;
  points: number;
  wins: number;
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

// ── Backend response shapes ─────────────────────────────────────────────────
// These mirror the JSON returned by predicto-backend. Mappers in
// `src/lib/mappers.ts` translate between these and the mobile UI types above.

export type BackendPrediction = 'HOME' | 'DRAW' | 'AWAY';
export type BackendMatchStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED' | 'CANCELLED';
export type BackendMatchOutcome = 'HOME' | 'DRAW' | 'AWAY';
export type BackendTicketStatus = 'PENDING' | 'WON' | 'LOST' | 'VOID';
export type BackendTicketSource = 'FREE' | 'LIFE' | 'SUBSCRIPTION';

export interface BackendMatch {
  id: string;
  externalId: string | null;
  league: string;
  homeTeam: string;
  homeAbbrev: string | null;
  homeLogo: string | null;
  awayTeam: string;
  awayAbbrev: string | null;
  awayLogo: string | null;
  kickoffAt: string;
  status: BackendMatchStatus;
  homeOdds: number;
  drawOdds: number;
  awayOdds: number;
  homeWinPct: number | null;
  drawPct: number | null;
  awayWinPct: number | null;
  homeScore: number | null;
  awayScore: number | null;
  result: BackendMatchOutcome | null;
  fetchedAt: string;
  resultsCheckedAt: string | null;
}

export interface BackendPick {
  id: string;
  ticketId: string;
  matchId: string;
  prediction: BackendPrediction;
  oddsAtPick: number;
  isCorrect: boolean | null;
  match: BackendMatch;
}

export interface BackendTicket {
  id: string;
  userId: string;
  status: BackendTicketStatus;
  source: BackendTicketSource;
  totalOdds: number;
  pointsAwarded: number;
  isLocked: boolean;
  createdAt: string;
  evaluatedAt: string | null;
  picks: BackendPick[];
  user?: { id: string; username: string; avatarUrl: string | null };
}

export interface BackendFeedAuthor {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export interface BackendFeedItem {
  id: string;
  caption: string | null;
  createdAt: string;
  author: BackendFeedAuthor;
  ticket: BackendTicket;
  counts: { likes: number; comments: number };
  viewer: { liked: boolean };
}

// Returned by GET /api/comments/post/:postId. Tree-shaped — root nodes carry
// nested `children`. The `_count.replies` field reflects the full subtree size
// at the DB level even when `children` is empty client-side.
export interface BackendComment {
  id: string;
  postId: string;
  parentId: string | null;
  body: string;
  createdAt: string;
  author: BackendFeedAuthor;
  _count: { likes: number; replies: number };
  viewer: { liked: boolean };
  children: BackendComment[];
}

// Shape returned by POST /api/comments/post/:postId — flatter, no counts/viewer/children.
export interface BackendCommentCreated {
  id: string;
  postId: string;
  parentId: string | null;
  body: string;
  createdAt: string;
  authorId: string;
  author: BackendFeedAuthor;
}

export interface Eligibility {
  hasActiveSubscription: boolean;
  unlimitedTickets: boolean;
  freeTicketsRemaining: number | null;
  livesBalance: number;
  canCreateTicket: boolean;
  nextSource: BackendTicketSource | null;
}

export type FeedScope = 'global' | 'friends';

export interface BackendGroup {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  visibility: GroupVisibility;
  inviteCode?: string;
  avatarUrl: string | null;
  createdAt: string;
  _count?: { members: number };
  // `getGroup` returns this; `listGroups(scope:'mine')` returns `role` instead.
  viewerRole?: GroupRole | null;
  role?: GroupRole;
  owner?: PostAuthor;
}
