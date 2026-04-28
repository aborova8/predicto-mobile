import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/atoms/Avatar';
import { Icon } from '@/components/atoms/Icon';
import { Ticket } from '@/components/ticket/Ticket';
import { USERS } from '@/data/users';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';
import type { Post } from '@/types/domain';

interface FeedPostCardProps {
  post: Post;
  onLike: (id: string) => void;
  onComment: (id: string) => void;
  onShare: (id: string) => void;
  onTicketPress: (id: string) => void;
  onOpenUser: (userId: string) => void;
}

function FeedPostCardImpl({
  post,
  onLike,
  onComment,
  onShare,
  onTicketPress,
  onOpenUser,
}: FeedPostCardProps) {
  const theme = useTheme();
  const u = USERS[post.userId];
  if (!u) return null;

  return (
    <View style={[styles.wrap, { borderBottomColor: theme.lineSoft }]}>
      <View style={styles.author}>
        <Pressable onPress={() => onOpenUser(u.id)}>
          <Avatar user={u} size={38} />
        </Pressable>
        <Pressable style={{ flex: 1, minWidth: 0 }} onPress={() => onOpenUser(u.id)}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: theme.text }]}>{u.name}</Text>
            <Text style={[styles.level, { color: theme.text3 }]}>L{u.level}</Text>
            {u.streak >= 5 ? (
              <View style={styles.streak}>
                <Icon name="flame" size={11} stroke={2.2} color={theme.neon} />
                <Text style={[styles.streakTxt, { color: theme.neon }]}>{u.streak}</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.handle, { color: theme.text3 }]}>
            @{u.handle} · {post.timeAgo}
          </Text>
        </Pressable>
        <View style={styles.dotsBtn}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: theme.text3 }}
            />
          ))}
        </View>
      </View>

      {post.caption ? (
        <Text style={[styles.caption, { color: theme.text }]}>{post.caption}</Text>
      ) : null}

      <Ticket ticket={post.ticket} onPress={() => onTicketPress(post.ticket.id)} />

      <View style={styles.actions}>
        <Pressable style={styles.action} onPress={() => onLike(post.id)}>
          <Icon
            name="heart"
            size={18}
            color={post.liked ? theme.neon : theme.text2}
            stroke={post.liked ? 2.2 : 1.7}
          />
          <Text style={[styles.actionTxt, { color: post.liked ? theme.neon : theme.text2 }]}>
            {post.likes}
          </Text>
        </Pressable>
        <Pressable style={styles.action} onPress={() => onComment(post.id)}>
          <Icon name="comment" size={18} color={theme.text2} />
          <Text style={[styles.actionTxt, { color: theme.text2 }]}>{post.comments}</Text>
        </Pressable>
        <Pressable style={styles.action} onPress={() => onShare(post.id)}>
          <Icon name="share" size={18} color={theme.text2} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  author: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  name: {
    fontFamily: Fonts.dispBold,
    fontSize: 14,
  },
  level: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  streakTxt: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
  },
  handle: {
    fontFamily: Fonts.monoRegular,
    fontSize: 11,
    marginTop: 2,
  },
  dotsBtn: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 4,
  },
  caption: {
    fontFamily: Fonts.uiRegular,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginTop: 12,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionTxt: {
    fontFamily: Fonts.monoSemi,
    fontSize: 12,
  },
});

export const FeedPostCard = memo(FeedPostCardImpl);
