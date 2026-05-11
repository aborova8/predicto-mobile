import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/atoms/Avatar';
import { Icon } from '@/components/atoms/Icon';
import { Ticket } from '@/components/ticket/Ticket';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';
import type { Post } from '@/types/domain';

interface FeedPostCompactProps {
  post: Post;
  onLike: (id: string) => void;
  onComment: (id: string) => void;
  onShare: (id: string) => void;
  onOpenUser: (userId: string) => void;
  onOpenMenu?: (post: Post) => void;
}

function FeedPostCompactImpl({
  post,
  onLike,
  onComment,
  onShare,
  onOpenUser,
  onOpenMenu,
}: FeedPostCompactProps) {
  const theme = useTheme();
  const { username, avatarUrl } = post.author;

  return (
    <View style={[styles.wrap, { borderBottomColor: theme.lineSoft }]}>
      <Pressable onPress={() => onOpenUser(post.userId)}>
        <Avatar author={{ username, avatarUrl }} size={34} />
      </Pressable>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={styles.head}>
          <Pressable onPress={() => onOpenUser(post.userId)}>
            <Text style={[styles.name, { color: theme.text }]}>{username}</Text>
          </Pressable>
          <Pressable onPress={() => onOpenUser(post.userId)}>
            <Text style={[styles.handle, { color: theme.text3 }]}>@{username}</Text>
          </Pressable>
          <Text style={{ color: theme.text3, fontSize: 11 }}>·</Text>
          <Text style={[styles.handle, { color: theme.text3 }]}>{post.timeAgo}</Text>
          <View style={{ flex: 1 }} />
          <Pressable
            onPress={() => onOpenMenu?.(post)}
            hitSlop={8}
            style={styles.dotsBtn}
            accessibilityRole="button"
            accessibilityLabel="More actions"
          >
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: theme.text3 }}
              />
            ))}
          </Pressable>
        </View>
        {post.caption ? (
          <Text style={[styles.caption, { color: theme.text }]}>{post.caption}</Text>
        ) : null}
        <Ticket ticket={post.ticket} onPress={() => onComment(post.id)} />
        <View style={styles.actions}>
          <Pressable style={styles.action} onPress={() => onComment(post.id)}>
            <Icon name="comment" size={16} color={theme.text3} />
            <Text style={[styles.actionTxt, { color: theme.text3 }]}>{post.comments}</Text>
          </Pressable>
          <Pressable style={styles.action} onPress={() => onLike(post.id)}>
            <Icon
              name="heart"
              size={16}
              color={post.liked ? theme.neon : theme.text3}
              stroke={post.liked ? 2.2 : 1.7}
            />
            <Text style={[styles.actionTxt, { color: post.liked ? theme.neon : theme.text3 }]}>
              {post.likes}
            </Text>
          </Pressable>
          <Pressable style={styles.action} onPress={() => onShare(post.id)}>
            <Icon name="share" size={16} color={theme.text3} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    marginBottom: 4,
  },
  name: {
    fontFamily: Fonts.dispBold,
    fontSize: 13,
  },
  handle: {
    fontFamily: Fonts.monoRegular,
    fontSize: 11,
  },
  caption: {
    fontFamily: Fonts.uiRegular,
    fontSize: 13.5,
    lineHeight: 19,
    marginBottom: 9,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
    marginTop: 9,
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
  dotsBtn: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 4,
  },
});

export const FeedPostCompact = memo(FeedPostCompactImpl);
