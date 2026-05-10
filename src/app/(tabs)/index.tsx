import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  type ListRenderItem,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Icon } from '@/components/atoms/Icon';
import { FeedHeader } from '@/components/feed/FeedHeader';
import { FeedPostCard } from '@/components/feed/FeedPostCard';
import { FeedPostCompact } from '@/components/feed/FeedPostCompact';
import { useFeed } from '@/hooks/useFeed';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { useAppState } from '@/state/AppStateContext';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';
import type { Post } from '@/types/domain';

const noop = () => {};

export default function FeedScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { filter, setFilter, feedLayout } = useAppState();
  const { posts, loading, loadingMore, error, hasMore, refetch, fetchMore, like } = useFeed({
    scope: filter,
  });
  const { unread } = useUnreadNotifications();
  const [refreshing, setRefreshing] = useState(false);

  // Refetch on focus so that a slip submitted on the predict tab shows up
  // when the user navigates back here.
  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const PostComponent = feedLayout === 'compact' ? FeedPostCompact : FeedPostCard;

  const onComment = useCallback(
    (id: string) => router.push({ pathname: '/comments', params: { postId: id } }),
    [router],
  );
  const onOpenUser = useCallback((uid: string) => router.push(`/user/${uid}`), [router]);

  const renderItem = useCallback<ListRenderItem<Post>>(
    ({ item }) => (
      <PostComponent
        post={item}
        onLike={like}
        onComment={onComment}
        onShare={noop}
        onOpenUser={onOpenUser}
      />
    ),
    [PostComponent, like, onComment, onOpenUser],
  );

  const showFirstLoad = loading && posts.length === 0 && !error;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        ListHeaderComponent={
          <FeedHeader
            filter={filter}
            onFilter={setFilter}
            onOpenSearch={() => router.push('/search')}
            onOpenNotifications={() => router.push('/notifications')}
            unreadNotifications={unread > 0}
          />
        }
        stickyHeaderIndices={[0]}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.text2}
          />
        }
        onEndReached={hasMore ? () => void fetchMore() : undefined}
        onEndReachedThreshold={0.6}
        ListEmptyComponent={
          showFirstLoad ? (
            <View style={styles.empty}>
              <ActivityIndicator color={theme.neon} />
            </View>
          ) : error ? (
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: theme.surface, borderColor: theme.line }]}>
                <Icon name="people" size={28} color={theme.text3} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                Couldn't load feed
              </Text>
              <Text style={[styles.emptySub, { color: theme.text2 }]}>{error.message}</Text>
              <Pressable
                onPress={() => void refetch()}
                style={[styles.retry, { borderColor: theme.line, backgroundColor: theme.surface }]}
              >
                <Text style={[styles.retryTxt, { color: theme.text }]}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: theme.surface, borderColor: theme.line }]}>
                <Icon name="people" size={28} color={theme.text3} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                {filter === 'friends' ? 'No friends posting yet' : 'No slips yet'}
              </Text>
              <Text style={[styles.emptySub, { color: theme.text2 }]}>
                {filter === 'friends'
                  ? 'Add friends to see their slips here.'
                  : 'Be the first — head to the Predict tab.'}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator color={theme.text2} />
            </View>
          ) : null
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
  retry: {
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  retryTxt: {
    fontFamily: Fonts.dispBold,
    fontSize: 13,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
