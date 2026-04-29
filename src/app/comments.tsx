import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Avatar } from '@/components/atoms/Avatar';
import { Icon } from '@/components/atoms/Icon';
import { BottomSheet } from '@/components/sheets/BottomSheet';
import { Ticket } from '@/components/ticket/Ticket';
import { useComments } from '@/hooks/useComments';
import { getPost } from '@/lib/api/feed';
import { backendTicketToTicket, formatRelativeTime } from '@/lib/mappers';
import { useAppState } from '@/state/AppStateContext';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';
import type { BackendFeedItem, FeedComment } from '@/types/domain';

interface ReplyTarget {
  id: string;
  username: string;
}

export default function CommentsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { user } = useAppState();
  const currentUserId = user?.id ?? null;

  const { comments, total, loading, submitting, error, refetch, submit, remove, toggleLike } =
    useComments(postId ?? null, currentUserId);

  const [post, setPost] = useState<BackendFeedItem | null>(null);
  const [postError, setPostError] = useState<Error | null>(null);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);

  useEffect(() => {
    if (!postId) return;
    let cancelled = false;
    setPostError(null);
    getPost(postId)
      .then((res) => {
        if (!cancelled) setPost(res.post);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setPostError(err instanceof Error ? err : new Error('Failed to load slip'));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  const ticketView = post ? backendTicketToTicket(post.ticket) : null;
  const postTimeAgo = post ? formatRelativeTime(post.createdAt) : '';

  if (!postId) return null;

  const onPostPress = async () => {
    const trimmed = text.trim();
    if (trimmed.length === 0 || submitting) return;
    try {
      await submit(trimmed, replyTo?.id);
      setText('');
      setReplyTo(null);
    } catch {
      // Surface a soft error; keep the draft so the user can retry.
      Alert.alert('Couldn\'t post', 'Please try again.');
    }
  };

  const onDelete = (commentId: string) => {
    Alert.alert('Delete comment?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          remove(commentId).catch(() => {
            Alert.alert('Couldn\'t delete', 'Please try again.');
          });
        },
      },
    ]);
  };

  const onTicketPress = (ticketId: string) => {
    router.push(`/ticket/${ticketId}`);
  };

  const title = (
    <Text style={{ color: theme.text, fontFamily: Fonts.dispBold, fontSize: 16 }}>
      Comments{' '}
      <Text style={{ color: theme.text3, fontFamily: Fonts.monoRegular, fontSize: 12 }}>
        {total}
      </Text>
    </Text>
  );

  return (
    <BottomSheet height="88%" title={title}>
      <ScrollView contentContainerStyle={{ paddingBottom: 8 }} keyboardShouldPersistTaps="handled">
        {/* Ticket header */}
        {ticketView && post ? (
          <View style={[styles.postHead, { borderBottomColor: theme.lineSoft }]}>
            <View style={styles.postAuthor}>
              <Avatar
                author={{ username: post.author.username, avatarUrl: post.author.avatarUrl }}
                size={32}
              />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.authorName, { color: theme.text }]}>
                  {post.author.username}
                </Text>
                <Text style={[styles.authorMeta, { color: theme.text3 }]}>
                  @{post.author.username} · {postTimeAgo}
                </Text>
              </View>
            </View>
            {post.caption ? (
              <Text style={[styles.caption, { color: theme.text }]}>{post.caption}</Text>
            ) : null}
            <Ticket ticket={ticketView} onPress={() => onTicketPress(ticketView.id)} />
          </View>
        ) : postError ? (
          <View style={[styles.postErrorBanner, { borderBottomColor: theme.lineSoft }]}>
            <Text style={{ color: theme.text3, fontFamily: Fonts.uiRegular, fontSize: 12 }}>
              Couldn&apos;t load the slip preview.
            </Text>
          </View>
        ) : (
          <View style={[styles.postLoader, { borderBottomColor: theme.lineSoft }]}>
            <ActivityIndicator color={theme.text2} />
          </View>
        )}

        {/* Thread */}
        {loading && comments.length === 0 ? (
          <View style={styles.threadLoader}>
            <ActivityIndicator color={theme.text2} />
          </View>
        ) : error ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: theme.text2 }]}>{error.message}</Text>
            <Pressable
              onPress={() => void refetch()}
              style={[styles.retry, { borderColor: theme.line, backgroundColor: theme.surface }]}
            >
              <Text style={[styles.retryTxt, { color: theme.text }]}>Try again</Text>
            </Pressable>
          </View>
        ) : comments.length === 0 ? (
          <Text style={[styles.empty, styles.emptyText, { color: theme.text3 }]}>
            No comments yet. Start the conversation.
          </Text>
        ) : (
          comments.map((c) => (
            <CommentRow
              key={c.id}
              comment={c}
              onLike={toggleLike}
              onReply={(target) => setReplyTo(target)}
              onDelete={onDelete}
            />
          ))
        )}
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {replyTo ? (
          <View style={[styles.replyBar, { backgroundColor: theme.surface, borderTopColor: theme.lineSoft }]}>
            <Text style={{ color: theme.text2, fontFamily: Fonts.uiRegular, fontSize: 12 }}>
              Replying to <Text style={{ color: theme.text, fontFamily: Fonts.dispBold }}>@{replyTo.username}</Text>
            </Text>
            <Pressable onPress={() => setReplyTo(null)} hitSlop={8}>
              <Icon name="x" size={16} color={theme.text2} />
            </Pressable>
          </View>
        ) : null}
        <View style={[styles.composer, { borderTopColor: theme.lineSoft }]}>
          <Avatar
            author={user ? { username: user.username, avatarUrl: user.avatarUrl } : null}
            size={32}
          />
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={replyTo ? `Reply to @${replyTo.username}…` : 'Add a comment…'}
            placeholderTextColor={theme.text3}
            editable={!submitting}
            multiline
            maxLength={1000}
            style={[
              styles.input,
              { backgroundColor: theme.surface, borderColor: theme.line, color: theme.text },
            ]}
          />
          <Pressable
            onPress={onPostPress}
            disabled={submitting || text.trim().length === 0}
            style={[
              styles.postBtn,
              { backgroundColor: text.trim().length > 0 && !submitting ? theme.neon : theme.surface2 },
            ]}
          >
            {submitting ? (
              <ActivityIndicator color={theme.text3} size="small" />
            ) : (
              <Text
                style={{
                  fontFamily: Fonts.dispBold,
                  fontSize: 13,
                  color: text.trim().length > 0 ? '#06091A' : theme.text3,
                }}
              >
                Post
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}

interface CommentRowProps {
  comment: FeedComment;
  onLike: (id: string) => void;
  onReply: (target: ReplyTarget) => void;
  onDelete: (id: string) => void;
  // Replies tap-to-reply on the root parent — the backend stores them flat so
  // we never let the chain deepen past one level.
  replyParentId?: string;
}

function CommentRow({ comment, onLike, onReply, onDelete, replyParentId }: CommentRowProps) {
  const theme = useTheme();
  const isReply = replyParentId !== undefined;
  const replyTargetId = replyParentId ?? comment.id;

  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: isReply ? 6 : 10 }}>
      <View style={{ flexDirection: 'row', gap: isReply ? 8 : 10 }}>
        <Avatar
          author={{ username: comment.author.username, avatarUrl: comment.author.avatarUrl }}
          size={isReply ? 26 : 32}
        />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5 }}>
            <Text style={{ color: theme.text, fontFamily: Fonts.dispBold, fontSize: isReply ? 12 : 13 }}>
              {comment.author.username}
            </Text>
            <Text style={{ color: theme.text3, fontFamily: Fonts.monoRegular, fontSize: 10 }}>
              {comment.time}
            </Text>
          </View>
          <Text
            style={{
              color: theme.text,
              fontFamily: Fonts.uiRegular,
              fontSize: isReply ? 12.5 : 13,
              marginTop: 2,
              lineHeight: 18,
            }}
          >
            {comment.text}
          </Text>
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 5, alignItems: 'center' }}>
            <Pressable
              onPress={() => onLike(comment.id)}
              hitSlop={6}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Icon
                name="heart"
                size={13}
                color={comment.liked ? theme.neon : theme.text3}
                stroke={comment.liked ? 2.2 : 1.7}
              />
              <Text
                style={{
                  color: comment.liked ? theme.neon : theme.text3,
                  fontFamily: Fonts.monoRegular,
                  fontSize: 11,
                }}
              >
                {comment.likes}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onReply({ id: replyTargetId, username: comment.author.username })}
              hitSlop={6}
            >
              <Text
                style={{ color: theme.text3, fontFamily: Fonts.monoRegular, fontSize: 11 }}
              >
                Reply
              </Text>
            </Pressable>
            {comment.isMine ? (
              <Pressable onPress={() => onDelete(comment.id)} hitSlop={6}>
                <Text
                  style={{ color: theme.text3, fontFamily: Fonts.monoRegular, fontSize: 11 }}
                >
                  Delete
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
      {!isReply && comment.replies.length > 0 ? (
        <View
          style={{
            marginLeft: 42,
            marginTop: 8,
            borderLeftWidth: 1,
            borderLeftColor: theme.line,
            paddingLeft: 10,
          }}
        >
          {comment.replies.map((r) => (
            <CommentRow
              key={r.id}
              comment={r}
              onLike={onLike}
              onReply={onReply}
              onDelete={onDelete}
              replyParentId={comment.id}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  postHead: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  postAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authorName: {
    fontFamily: Fonts.dispBold,
    fontSize: 13,
  },
  authorMeta: {
    fontFamily: Fonts.monoRegular,
    fontSize: 11,
    marginTop: 1,
  },
  caption: {
    fontFamily: Fonts.uiRegular,
    fontSize: 13.5,
    lineHeight: 19,
  },
  postLoader: {
    paddingVertical: 24,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  postErrorBanner: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  threadLoader: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  empty: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: Fonts.uiRegular,
    fontSize: 13,
    textAlign: 'center',
  },
  retry: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  retryTxt: {
    fontFamily: Fonts.dispBold,
    fontSize: 13,
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  composer: {
    paddingTop: 10,
    paddingBottom: 24,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontFamily: Fonts.uiRegular,
    fontSize: 13,
    maxHeight: 100,
  },
  postBtn: {
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minWidth: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
