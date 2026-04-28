import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { FlatList, type ListRenderItem, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/atoms/Icon';
import { FeedHeader } from '@/components/feed/FeedHeader';
import { FeedPostCard } from '@/components/feed/FeedPostCard';
import { FeedPostCompact } from '@/components/feed/FeedPostCompact';
import { USERS } from '@/data/users';
import { useAppState } from '@/state/AppStateContext';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';
import type { Post } from '@/types/domain';

const noop = () => {};

export default function FeedScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { posts, filter, setFilter, likePost, feedLayout } = useAppState();

  const filtered = useMemo(
    () =>
      filter === 'friends'
        ? posts.filter((p) => USERS[p.userId]?.friend || USERS[p.userId]?.isMe)
        : posts,
    [posts, filter],
  );

  const PostComponent = feedLayout === 'compact' ? FeedPostCompact : FeedPostCard;

  const onComment = useCallback(
    (id: string) => router.push({ pathname: '/comments', params: { postId: id } }),
    [router],
  );
  const onTicketPress = useCallback((id: string) => router.push(`/ticket/${id}`), [router]);
  const onOpenUser = useCallback((uid: string) => router.push(`/user/${uid}`), [router]);

  const renderItem = useCallback<ListRenderItem<Post>>(
    ({ item }) => (
      <PostComponent
        post={item}
        onLike={likePost}
        onComment={onComment}
        onShare={noop}
        onTicketPress={onTicketPress}
        onOpenUser={onOpenUser}
      />
    ),
    [PostComponent, likePost, onComment, onTicketPress, onOpenUser],
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        ListHeaderComponent={
          <FeedHeader
            filter={filter}
            onFilter={setFilter}
            onOpenSearch={() => router.push('/search')}
            onOpenNotifications={() => router.push('/notifications')}
          />
        }
        stickyHeaderIndices={[0]}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.surface, borderColor: theme.line }]}>
              <Icon name="people" size={28} color={theme.text3} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No friends posting yet
            </Text>
            <Text style={[styles.emptySub, { color: theme.text2 }]}>
              Add friends to see their slips here.
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    paddingVertical: 60,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: Fonts.dispBold,
    fontSize: 16,
  },
  emptySub: {
    fontFamily: Fonts.uiRegular,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
});
