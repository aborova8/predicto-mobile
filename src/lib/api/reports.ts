import { api } from '@/lib/api';

// Mirror of the backend `ReportReason` enum in
// `predicto-backend/prisma/schema.prisma`. Keep these literals in sync if
// the enum is extended — the server rejects unknowns at validation time.
export type ReportReason =
  | 'SPAM'
  | 'HARASSMENT'
  | 'HATE_SPEECH'
  | 'INAPPROPRIATE_CONTENT'
  | 'VIOLENCE'
  | 'IMPERSONATION'
  | 'OTHER';

export interface CreateReportInput {
  targetUserId: string;
  postId?: string | null;
  reason: ReportReason;
  description?: string | null;
}

export interface ReportRecord {
  id: string;
  reporterId: string;
  targetUserId: string;
  postId: string | null;
  reason: ReportReason;
  description: string | null;
  status: 'OPEN' | 'REVIEWED' | 'ACTIONED' | 'DISMISSED';
  createdAt: string;
}

export function createReport(input: CreateReportInput): Promise<{ report: ReportRecord }> {
  return api.post<{ report: ReportRecord }>('/api/reports', input);
}
