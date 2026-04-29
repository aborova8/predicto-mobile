import { api } from '@/lib/api';
import type { BackendComment, BackendCommentCreated } from '@/types/domain';

export function listComments(postId: string): Promise<{ items: BackendComment[] }> {
  return api.get<{ items: BackendComment[] }>(
    `/api/comments/post/${encodeURIComponent(postId)}`,
  );
}

export function createComment(
  postId: string,
  body: string,
  parentId?: string,
): Promise<{ comment: BackendCommentCreated }> {
  return api.post<{ comment: BackendCommentCreated }>(
    `/api/comments/post/${encodeURIComponent(postId)}`,
    parentId ? { body, parentId } : { body },
  );
}

export function deleteComment(commentId: string): Promise<{ ok: true }> {
  return api.delete<{ ok: true }>(`/api/comments/${encodeURIComponent(commentId)}`);
}

export function likeComment(commentId: string): Promise<{ ok: true }> {
  return api.post<{ ok: true }>(`/api/comments/${encodeURIComponent(commentId)}/like`);
}

export function unlikeComment(commentId: string): Promise<{ ok: true }> {
  return api.delete<{ ok: true }>(`/api/comments/${encodeURIComponent(commentId)}/like`);
}
