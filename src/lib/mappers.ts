import { setMatch } from '@/lib/matchCache';
import type {
  BackendComment,
  BackendCommentCreated,
  BackendFeedItem,
  BackendMatch,
  BackendPick,
  BackendPrediction,
  BackendTicket,
  FeedComment,
  Fixture,
  Leg,
  LegStatus,
  Pick,
  Post,
  TeamCode,
  Ticket,
  TicketStatus,
} from '@/types/domain';

export function predictionFromPick(pick: Pick): BackendPrediction {
  if (pick === '1') return 'HOME';
  if (pick === '2') return 'AWAY';
  return 'DRAW';
}

export function pickFromPrediction(prediction: BackendPrediction): Pick {
  if (prediction === 'HOME') return '1';
  if (prediction === 'AWAY') return '2';
  return 'X';
}

const ticketStatusMap: Record<BackendTicket['status'], TicketStatus> = {
  PENDING: 'pending',
  WON: 'won',
  LOST: 'lost',
  VOID: 'lost',
};

export function deriveAbbrev(team: string, abbrev: string | null): TeamCode {
  if (abbrev && abbrev.trim().length > 0) return abbrev.trim().toUpperCase();
  const cleaned = team.replace(/[^A-Za-z]/g, '');
  return (cleaned.slice(0, 3) || team.slice(0, 3)).toUpperCase();
}

const SHORT_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function startOfLocalDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function dayIndexFromKickoff(iso: string, now: Date = new Date()): number {
  const start = startOfLocalDay(now).getTime();
  const k = startOfLocalDay(new Date(iso)).getTime();
  return Math.round((k - start) / 86_400_000);
}

function kickoffLabelFromParts(date: Date, dayIdx: number): string {
  const time = `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
  if (dayIdx === 0) return `Today ${time}`;
  if (dayIdx === 1) return `Tomorrow ${time}`;
  if (dayIdx > 1 && dayIdx < 7) return `${SHORT_DAY_NAMES[date.getDay()]} ${time}`;
  return `${SHORT_MONTH_NAMES[date.getMonth()]} ${date.getDate()} ${time}`;
}

export function formatKickoffLabel(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  return kickoffLabelFromParts(date, dayIndexFromKickoff(iso, now));
}

export function dayLabelFromIndex(index: number, now: Date = new Date()): string {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  const d = new Date(startOfLocalDay(now).getTime() + index * 86_400_000);
  return SHORT_DAY_NAMES[d.getDay()];
}

export function matchToFixture(m: BackendMatch, now: Date = new Date()): Fixture {
  const date = new Date(m.kickoffAt);
  const day = dayIndexFromKickoff(m.kickoffAt, now);
  const fixture: Fixture = {
    id: m.id,
    league: m.league,
    home: deriveAbbrev(m.homeTeam, m.homeAbbrev),
    away: deriveAbbrev(m.awayTeam, m.awayAbbrev),
    homeName: m.homeTeam,
    awayName: m.awayTeam,
    kickoff: kickoffLabelFromParts(date, day),
    day,
    odds: { '1': m.homeOdds, X: m.drawOdds, '2': m.awayOdds },
  };
  setMatch(fixture);
  return fixture;
}

function legStatusFromPick(pick: BackendPick): LegStatus | undefined {
  if (pick.isCorrect === true) return 'won';
  if (pick.isCorrect === false) return 'lost';
  return undefined;
}

function resultStringFromMatch(m: BackendMatch): string | undefined {
  if (m.homeScore == null || m.awayScore == null) return undefined;
  return `${m.homeScore}-${m.awayScore}`;
}

export function pickToLeg(pick: BackendPick, now: Date = new Date()): Leg {
  const fixture = matchToFixture(pick.match, now);
  return {
    matchId: pick.matchId,
    pick: pickFromPrediction(pick.prediction),
    status: legStatusFromPick(pick),
    result: resultStringFromMatch(pick.match),
    fixture,
  };
}

export function backendTicketToTicket(t: BackendTicket, now: Date = new Date()): Ticket {
  const legs = t.picks.map((p) => pickToLeg(p, now));
  const status = ticketStatusMap[t.status];
  // For finished tickets the backend has the canonical pointsAwarded; for
  // pending tickets we surface the potential payout (10 base × totalOdds, the
  // same formula the backend uses on settle, capped to int range).
  const POINTS_BASE = 10;
  const potential =
    status === 'won'
      ? t.pointsAwarded
      : Math.max(POINTS_BASE, Math.round(POINTS_BASE * t.totalOdds));
  return {
    id: t.id,
    status,
    potential,
    legs,
    stake: POINTS_BASE,
  };
}

export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const diffMs = now.getTime() - new Date(iso).getTime();
  if (diffMs < 60_000) return 'now';
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w`;
  const months = Math.floor(days / 30);
  return `${months}mo`;
}

export function feedItemToPost(item: BackendFeedItem, now: Date = new Date()): Post {
  return {
    id: item.id,
    userId: item.author.id,
    author: {
      id: item.author.id,
      username: item.author.username,
      avatarUrl: item.author.avatarUrl,
    },
    timeAgo: formatRelativeTime(item.createdAt, now),
    likes: item.counts.likes,
    liked: item.viewer.liked,
    comments: item.counts.comments,
    caption: item.caption ?? undefined,
    ticket: backendTicketToTicket(item.ticket, now),
  };
}

export function backendCommentToFeedComment(
  c: BackendComment,
  currentUserId: string | null,
  now: Date = new Date(),
): FeedComment {
  return {
    id: c.id,
    parentId: c.parentId,
    author: {
      id: c.author.id,
      username: c.author.username,
      avatarUrl: c.author.avatarUrl,
    },
    text: c.body,
    time: formatRelativeTime(c.createdAt, now),
    likes: c._count.likes,
    liked: c.viewer.liked,
    replies: c.children.map((child) => backendCommentToFeedComment(child, currentUserId, now)),
    isMine: currentUserId !== null && c.author.id === currentUserId,
  };
}

// New comment from POST has no counts/viewer/children — synthesise the local view.
export function createdCommentToFeedComment(
  c: BackendCommentCreated,
  currentUserId: string | null,
  now: Date = new Date(),
): FeedComment {
  return {
    id: c.id,
    parentId: c.parentId,
    author: {
      id: c.author.id,
      username: c.author.username,
      avatarUrl: c.author.avatarUrl,
    },
    text: c.body,
    time: formatRelativeTime(c.createdAt, now),
    likes: 0,
    liked: false,
    replies: [],
    isMine: currentUserId !== null && c.author.id === currentUserId,
  };
}
