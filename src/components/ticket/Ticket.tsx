import { useAppState } from '@/state/AppStateContext';
import type { Ticket as TicketModel, TicketVariant } from '@/types/domain';
import { TicketCard } from './TicketCard';
import { TicketSlip } from './TicketSlip';

interface TicketProps {
  ticket: TicketModel;
  onPress?: () => void;
  variant?: TicketVariant;
}

export function Ticket({ ticket, onPress, variant }: TicketProps) {
  const { ticketVariant } = useAppState();
  const v = variant ?? ticketVariant;
  return v === 'slip' ? (
    <TicketSlip ticket={ticket} onPress={onPress} />
  ) : (
    <TicketCard ticket={ticket} onPress={onPress} />
  );
}
