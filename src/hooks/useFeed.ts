import { useCallback, useEffect, useRef, useState } from 'react';

import { useStaleRefetch } from '@/hooks/useStaleRefetch';
import {
  likePost as likePostApi,
  listFeed,
  savePost as savePostApi,
  unlikePost as unlikePostApi,
  unsavePost as unsavePostApi,
} from '@/lib/api/feed';
import type { FeedScope } from '@/lib/api/feed';
import { feedItemToPost } from '@/lib/mappers';
import type { Post } from '@/types/domain';

const PAGE_SIZE = 20;

export interface UseFeedOptions {
  scope: FeedScope;
  groupId?: string;
}

export interface UseFeedResult {
  posts: Post[];
  loading: boolean;
  loadingMore: boolean;
  error: Error | null;
  hasMore: boolean;
  refetch: () => Promise<void>;
  fetchMore: () => Promise<void>;
  like: (postId: string) => void;
  toggleSave: (postId: string) => void;
}

export function useFeed({ scope, groupId }: UseFeedOptions): UseFeedResult {
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const reqRef = useRef(0);
  const postsRef = useRef<Post[]>([]);
  postsRef.current = posts;

  const baseRefetch = useCallback(async () => {
    const reqId = ++reqRef.current;
    setLoading(true);
    setError(null);
    try {
      const { items, nextCursor } = await listFeed({ scope, limit: PAGE_SIZE, groupId });
      if (reqRef.current !== reqId) return;
      const now = new Date();
      setPosts(items.map((it) => feedItemToPost(it, now)));
      setCursor(nextCursor);
      setHasMore(nextCursor !== null);
    } catch (err) {
      if (reqRef.current !== reqId) return;
      setError(err instanceof Error ? err : new Error('Failed to load feed'));
    } finally {
      if (reqRef.current === reqId) setLoading(false);
    }
  }, [scope, groupId]);

  // Stamps freshness on every successful run AND auto-refetches on app
  // foreground / login (via the data-epoch bump). Pull-to-refresh and the
  // screen's slip-submit focus refetch go through this so the stamp stays
  // accurate.
  const { refetch } = useStaleRefetch(baseRefetch);

  const fetchMore = useCallback(async () => {
    if (!hasMore || loadingMore || !cursor) return;
    setLoadingMore(true);
    try {
      const { items, nextCursor } = await listFeed({ scope, cursor, limit: PAGE_SIZE, groupId });
      const now = new Date();
      setPosts((prev) => [...prev, ...items.map((it) => feedItemToPost(it, now))]);
      setCursor(nextCursor);
      setHasMore(nextCursor !== null);
    } catch {
      // Swallow — leave existing list intact; user can retry by scrolling again.
    } finally {
      setLoadingMore(false);
    }
  }, [scope, cursor, hasMore, loadingMore, groupId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const like = useCallback((postId: string) => {
    const snapshot: { liked: boolean; likes: number } | null = (() => {
      const target = postsRef.current.find((p) => p.id === postId);
      return target ? { liked: target.liked, likes: target.likes } : null;
    })();
    if (!snapshot) return;
    setPosts((prev) => {
      const idx = prev.findIndex((p) => p.id === postId);
      if (idx === -1) return prev;
      const next = prev.slice();
      const target = next[idx];
      next[idx] = {
        ...target,
        liked: !target.liked,
        likes: target.liked ? target.likes - 1 : target.likes + 1,
      };
      return next;
    });
    const wasLiked = snapshot.liked;
    const promise = wasLiked ? unlikePostApi(postId) : likePostApi(postId);
    promise.catch(() => {
      // Roll back optimistic update on failure.
      setPosts((prev) => {
        const idx = prev.findIndex((p) => p.id === postId);
        if (idx === -1) return prev;
        const next = prev.slice();
        next[idx] = { ...next[idx], liked: snapshot.liked, likes: snapshot.likes };
        return next;
      });
    });
  }, []);

  const toggleSave = useCallback((postId: string) => {
    const snapshot = (() => {
      const t = postsRef.current.find((p) => p.id === postId);
      return t ? { saved: t.saved } : null;
    })();
    if (!snapshot) return;
    setPosts((prev) => {
      const idx = prev.findIndex((p) => p.id === postId);
      if (idx === -1) return prev;
      const next = prev.slice();
      next[idx] = { ...next[idx], saved: !next[idx].saved };
      return next;
    });
    const wasSaved = snapshot.saved;
    const promise = wasSaved ? unsavePostApi(postId) : savePostApi(postId);
    promise.catch(() => {
      // Roll back so the UI doesn't lie about persistence.
      setPosts((prev) => {
        const idx = prev.findIndex((p) => p.id === postId);
        if (idx === -1) return prev;
        const next = prev.slice();
        next[idx] = { ...next[idx], saved: snapshot.saved };
        return next;
      });
    });
  }, []);

  return { posts, loading, loadingMore, error, hasMore, refetch, fetchMore, like, toggleSave };
}
