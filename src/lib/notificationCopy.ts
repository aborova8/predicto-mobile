import { formatRelativeTime } from '@/lib/mappers';
import type {
  AppNotification,
  BackendNotification,
  BackendNotificationKind,
  NotificationKind,
} from '@/types/domain';

// Maps the backend kind enum to the mobile UI's legacy union, which the icon
// + color tables in `notifications.tsx` already understand.
function legacyKind(kind: BackendNotificationKind): NotificationKind {
  switch (kind) {
    case 'LIKE_POST':
    case 'LIKE_COMMENT':
      return 'like';
    case 'COMMENT_POST':
    case 'COMMENT_REPLY':
      return 'comment';
    case 'FRIEND_REQUEST':
      return 'follow';
    case 'FRIEND_ACCEPTED':
      return 'friend';
    case 'TICKET_WON':
      return 'win';
    case 'TICKET_LOST':
      return 'loss';
    case 'TICKET_VOIDED':
      return 'kickoff';
    case 'GROUP_JOIN_REQUEST':
    case 'GROUP_JOIN_APPROVED':
    case 'GROUP_ROLE_CHANGE':
      return 'group';
    case 'BADGE_EARNED':
      return 'badge';
  }
}

function actorName(n: BackendNotification): string {
  return n.actor?.username ?? 'Someone';
}

function postSnippet(n: BackendNotification): string | undefined {
  if (n.post?.caption) return `"${n.post.caption.slice(0, 80)}"`;
  return undefined;
}

function commentSnippet(n: BackendNotification): string | undefined {
  if (n.comment?.body) return `"${n.comment.body.slice(0, 80)}"`;
  return undefined;
}

function metaField<T>(n: BackendNotification, key: string): T | undefined {
  if (n.metadata && typeof n.metadata === 'object' && key in n.metadata) {
    return (n.metadata as Record<string, T>)[key];
  }
  return undefined;
}

function copyForKind(n: BackendNotification): { text: string; sub?: string } {
  switch (n.kind) {
    case 'LIKE_POST':
      return { text: `${actorName(n)} liked your slip`, sub: postSnippet(n) };
    case 'LIKE_COMMENT':
      return { text: `${actorName(n)} liked your comment`, sub: commentSnippet(n) };
    case 'COMMENT_POST':
      return { text: `${actorName(n)} commented on your slip`, sub: commentSnippet(n) };
    case 'COMMENT_REPLY':
      return { text: `${actorName(n)} replied to your comment`, sub: commentSnippet(n) };
    case 'FRIEND_REQUEST':
      return { text: `${actorName(n)} sent you a friend request` };
    case 'FRIEND_ACCEPTED':
      return { text: `${actorName(n)} accepted your friend request` };
    case 'TICKET_WON': {
      const pts = n.ticket?.pointsAwarded;
      return {
        text: 'You won your slip!',
        sub: pts ? `+${pts} pts` : undefined,
      };
    }
    case 'TICKET_LOST':
      return { text: 'Your slip didn’t hit this time' };
    case 'TICKET_VOIDED':
      return {
        text: 'Match was cancelled — your slip is voided',
        sub: metaField<boolean>(n, 'lifeRefunded') ? 'Life refunded' : undefined,
      };
    case 'GROUP_JOIN_REQUEST':
      return {
        text: `${actorName(n)} wants to join ${n.group?.name ?? 'your group'}`,
      };
    case 'GROUP_JOIN_APPROVED':
      return { text: `You joined ${n.group?.name ?? 'a group'}` };
    case 'GROUP_ROLE_CHANGE': {
      const role = (metaField<string>(n, 'role') ?? 'role').toLowerCase();
      return { text: `Your role in ${n.group?.name ?? 'a group'} is now ${role}` };
    }
    case 'BADGE_EARNED':
      return {
        text: `Badge earned: ${n.badge?.name ?? 'New badge'}`,
        sub: n.badge?.code,
      };
  }
}

/** Convert a backend notification into the legacy `AppNotification` shape. */
export function notificationToApp(n: BackendNotification): AppNotification {
  const { text, sub } = copyForKind(n);
  return {
    id: n.id,
    kind: legacyKind(n.kind),
    time: formatRelativeTime(n.createdAt),
    read: n.readAt !== null,
    userId: n.actor?.id ?? null,
    text,
    sub,
  };
}
