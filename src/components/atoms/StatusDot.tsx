import { useTheme } from '@/theme/ThemeContext';
import type { TicketStatus } from '@/types/domain';
import { Pill } from './Pill';

interface StatusDotProps {
  status: TicketStatus;
}

export function StatusDot({ status }: StatusDotProps) {
  const theme = useTheme();
  const colors = { won: theme.win, lost: theme.loss, pending: theme.pending };
  const labels = { won: 'WON', lost: 'LOST', pending: 'PENDING' };
  return <Pill color={colors[status]}>{labels[status]}</Pill>;
}
