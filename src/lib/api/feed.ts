import { api, buildQuery } from '@/lib/api';
import type { BackendFeedItem, FeedScope } from '@/types/domain';

export type { FeedScope } from '@/types/domain';

export type ListFeedQuery = {
  scope?: FeedScope;
  cursor?: string;
  limit?: number;
  // Scopes the feed to posts authored by members of a specific group. The
  // backend enforces membership for PRIVATE groups (403 to non-members).
  groupId?: string;
};

export function listFeed(
  q: ListFeedQuery = {},
): Promise<{ items: BackendFeedItem[]; nextCursor: string | null }> {
  return api.get<{ items: BackendFeedItem[]; nextCursor: string | null }>(
    `/api/feed${buildQuery(q)}`,
  );
}

export function getPost(postId: string): Promise<{ post: BackendFeedItem }> {
  return api.get<{ post: BackendFeedItem }>(
    `/api/feed/posts/${encodeURIComponent(postId)}`,
  );
}

export function likePost(postId: string): Promise<{ ok: true }> {
  return api.post<{ ok: true }>(`/api/feed/posts/${encodeURIComponent(postId)}/like`);
}

export function unlikePost(postId: string): Promise<{ ok: true }> {
  return api.delete<{ ok: true }>(`/api/feed/posts/${encodeURIComponent(postId)}/like`);
}

// Bookmarks (the post-action sheet's Save / Unsave). The Saved tab on the
// Profile screen reads from `listSavedFeed` below — same response shape as
// `listFeed`, so the mobile mapper (feedItemToPost) handles both.
export function savePost(postId: string): Promise<{ ok: true }> {
  return api.post<{ ok: true }>(`/api/feed/posts/${encodeURIComponent(postId)}/save`);
}

export function unsavePost(postId: string): Promise<{ ok: true }> {
  return api.delete<{ ok: true }>(`/api/feed/posts/${encodeURIComponent(postId)}/save`);
}

export function deletePost(postId: string): Promise<void> {
  return api.delete<void>(`/api/feed/posts/${encodeURIComponent(postId)}`);
}

export type ListSavedFeedQuery = {
  cursor?: string;
  limit?: number;
};

export function listSavedFeed(
  q: ListSavedFeedQuery = {},
): Promise<{ items: BackendFeedItem[]; nextCursor: string | null }> {
  return api.get<{ items: BackendFeedItem[]; nextCursor: string | null }>(
    `/api/feed/saved${buildQuery(q)}`,
  );
}
