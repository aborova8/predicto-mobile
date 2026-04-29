import { useCallback, useEffect, useRef, useState } from 'react';

import {
  createComment as createCommentApi,
  deleteComment as deleteCommentApi,
  likeComment as likeCommentApi,
  listComments,
  unlikeComment as unlikeCommentApi,
} from '@/lib/api/comments';
import { backendCommentToFeedComment, createdCommentToFeedComment } from '@/lib/mappers';
import type { FeedComment } from '@/types/domain';

export interface UseCommentsResult {
  comments: FeedComment[];
  total: number;
  loading: boolean;
  submitting: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  submit: (body: string, parentId?: string) => Promise<void>;
  remove: (commentId: string) => Promise<void>;
  toggleLike: (commentId: string) => void;
}

function countTree(nodes: FeedComment[]): number {
  let n = nodes.length;
  for (const node of nodes) n += countTree(node.replies);
  return n;
}

function findAndMap(
  tree: FeedComment[],
  id: string,
  fn: (c: FeedComment) => FeedComment,
): FeedComment[] {
  return tree.map((c) => {
    if (c.id === id) return fn(c);
    if (c.replies.length > 0) {
      const nextReplies = findAndMap(c.replies, id, fn);
      if (nextReplies !== c.replies) return { ...c, replies: nextReplies };
    }
    return c;
  });
}

function findById(tree: FeedComment[], id: string): FeedComment | null {
  for (const c of tree) {
    if (c.id === id) return c;
    if (c.replies.length > 0) {
      const found = findById(c.replies, id);
      if (found) return found;
    }
  }
  return null;
}

function removeById(tree: FeedComment[], id: string): FeedComment[] {
  const next: FeedComment[] = [];
  for (const c of tree) {
    if (c.id === id) continue;
    if (c.replies.length > 0) {
      const nextReplies = removeById(c.replies, id);
      if (nextReplies !== c.replies) {
        next.push({ ...c, replies: nextReplies });
        continue;
      }
    }
    next.push(c);
  }
  return next;
}

export function useComments(
  postId: string | null,
  currentUserId: string | null,
): UseCommentsResult {
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const reqRef = useRef(0);
  const commentsRef = useRef<FeedComment[]>([]);
  commentsRef.current = comments;

  const refetch = useCallback(async () => {
    if (!postId) {
      setComments([]);
      setLoading(false);
      return;
    }
    const reqId = ++reqRef.current;
    setLoading(true);
    setError(null);
    try {
      const { items } = await listComments(postId);
      if (reqRef.current !== reqId) return;
      const now = new Date();
      setComments(items.map((it) => backendCommentToFeedComment(it, currentUserId, now)));
    } catch (err) {
      if (reqRef.current !== reqId) return;
      setError(err instanceof Error ? err : new Error('Failed to load comments'));
    } finally {
      if (reqRef.current === reqId) setLoading(false);
    }
  }, [postId, currentUserId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const submit = useCallback(
    async (body: string, parentId?: string) => {
      if (!postId) return;
      const trimmed = body.trim();
      if (trimmed.length === 0) return;
      setSubmitting(true);
      try {
        const { comment } = await createCommentApi(postId, trimmed, parentId);
        const node = createdCommentToFeedComment(comment, currentUserId);
        setComments((prev) => {
          if (parentId) {
            return findAndMap(prev, parentId, (c) => ({ ...c, replies: [...c.replies, node] }));
          }
          return [...prev, node];
        });
      } finally {
        setSubmitting(false);
      }
    },
    [postId, currentUserId],
  );

  const remove = useCallback(async (commentId: string) => {
    const snapshot = commentsRef.current;
    setComments((prev) => removeById(prev, commentId));
    try {
      await deleteCommentApi(commentId);
    } catch (err) {
      setComments(snapshot);
      throw err;
    }
  }, []);

  const toggleLike = useCallback((commentId: string) => {
    const target = findById(commentsRef.current, commentId);
    if (!target) return;
    const wasLiked = target.liked;
    const prevLikes = target.likes;
    setComments((prev) =>
      findAndMap(prev, commentId, (c) => ({
        ...c,
        liked: !c.liked,
        likes: c.liked ? c.likes - 1 : c.likes + 1,
      })),
    );
    const promise = wasLiked ? unlikeCommentApi(commentId) : likeCommentApi(commentId);
    promise.catch(() => {
      setComments((prev) =>
        findAndMap(prev, commentId, (c) => ({ ...c, liked: wasLiked, likes: prevLikes })),
      );
    });
  }, []);

  return {
    comments,
    total: countTree(comments),
    loading,
    submitting,
    error,
    refetch,
    submit,
    remove,
    toggleLike,
  };
}
