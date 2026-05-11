import { useCallback, useEffect, useRef, useState } from 'react';

import { listSavedFeed, unsavePost as unsavePostApi } from '@/lib/api/feed';
import { feedItemToPost } from '@/lib/mappers';
import type { Post } from '@/types/domain';

const PAGE_SIZE = 20;

export interface UseSavedPostsOptions {
  // When false, the hook stays idle. Lets a screen mount it eagerly but defer
  // the first network call until the Saved tab is actually shown — Profile
  // sets enabled=true only when its filter pill flips to 'saved'.
  enabled?: boolean;
}

export interface UseSavedPostsResult {
  posts: Post[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  fetchMore: () => Promise<void>;
  toggleSave: (postId: string) => void;
}

export function useSavedPosts({ enabled = true }: UseSavedPostsOptions = {}): UseSavedPostsResult {
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  // `loading` starts false until enabled flips on, so a disabled hook never
  // shows a spinner.
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const reqRef = useRef(0);
  const postsRef = useRef<Post[]>([]);
  postsRef.current = posts;

  const refetch = useCallback(async () => {
    const reqId = ++reqRef.current;
    setLoading(true);
    setError(null);
    try {
      const { items, nextCursor } = await listSavedFeed({ limit: PAGE_SIZE });
      if (reqRef.current !== reqId) return;
      const now = new Date();
      setPosts(items.map((it) => feedItemToPost(it, now)));
      setCursor(nextCursor);
      setHasMore(nextCursor !== null);
    } catch (err) {
      if (reqRef.current !== reqId) return;
      setError(err instanceof Error ? err : new Error('Failed to load saved slips'));
    } finally {
      if (reqRef.current === reqId) setLoading(false);
    }
  }, []);

  const fetchMore = useCallback(async () => {
    if (!hasMore || loadingMore || !cursor) return;
    setLoadingMore(true);
    try {
      const { items, nextCursor } = await listSavedFeed({ cursor, limit: PAGE_SIZE });
      const now = new Date();
      setPosts((prev) => [...prev, ...items.map((it) => feedItemToPost(it, now))]);
      setCursor(nextCursor);
      setHasMore(nextCursor !== null);
    } catch {
      // Swallow — pull-to-refresh recovers the next try.
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, hasMore, loadingMore]);

  useEffect(() => {
    if (!enabled) return;
    void refetch();
  }, [enabled, refetch]);

  // Items in this list are saved by definition; the only meaningful toggle is
  // unsave, which removes the row. Restoring on failure keeps the user's
  // intent visible.
  const toggleSave = useCallback((postId: string) => {
    const snapshot = postsRef.current.find((p) => p.id === postId);
    if (!snapshot || !snapshot.saved) return;
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    unsavePostApi(postId).catch(() => {
      setPosts((prev) => (prev.some((p) => p.id === postId) ? prev : [snapshot, ...prev]));
    });
  }, []);

  return { posts, loading, loadingMore, hasMore, error, refetch, fetchMore, toggleSave };
}
