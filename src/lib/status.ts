import type { Theme } from '@/theme/tokens';
import type { LegStatus, TicketStatus } from '@/types/domain';

type AnyStatus = TicketStatus | LegStatus | undefined;

export function ticketStatusColor(theme: Theme, status: TicketStatus): string {
  return status === 'won' ? theme.win : status === 'lost' ? theme.loss : theme.pending;
}

export function legStatusColor(theme: Theme, status: AnyStatus): string {
  if (status === 'won') return theme.win;
  if (status === 'lost') return theme.loss;
  return theme.pending;
}

export const ticketStatusLabel = (status: TicketStatus): string =>
  status === 'won' ? 'CASHED' : status === 'lost' ? 'BUSTED' : 'PENDING';

export const ticketBannerLabel = (status: TicketStatus): string =>
  status === 'won' ? 'CASHED · WON' : status === 'lost' ? 'BUSTED · LOST' : 'PENDING · LIVE';

export const statusGlyph = (status: AnyStatus): '✓' | '✕' | '◐' | '·' => {
  if (status === 'won') return '✓';
  if (status === 'lost') return '✕';
  if (status === 'pending') return '◐';
  return '·';
};
