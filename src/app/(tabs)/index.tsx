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
import { ProHint } from '@/components/atoms/ProHint';
import { FeedHeader } from '@/components/feed/FeedHeader';
import { FeedPostCard } from '@/components/feed/FeedPostCard';
import { FeedPostCompact } from '@/components/feed/FeedPostCompact';
import { PostActionSheet } from '@/components/sheets/PostActionSheet';
import { useFeed } from '@/hooks/useFeed';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { sharePost } from '@/lib/share';
import { useAppState } from '@/state/AppStateContext';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';
import type { Post } from '@/types/domain';

export default function FeedScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { filter, setFilter, feedLayout } = useAppState();
  const { posts, loading, loadingMore, error, hasMore, refetch, fetchMore, like, toggleSave } =
    useFeed({ scope: filter });
  const { unread } = useUnreadNotifications();
  const [refreshing, setRefreshing] = useState(false);
  // Track which post the action sheet is open for. Lives on this screen so
  // the sheet can call toggleSave from the same useFeed hook (the optimistic
  // update needs to land in the same posts state).
  const [menuPost, setMenuPost] = useState<Post | null>(null);

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

  const onShare = useCallback((id: string) => {
    // FlatList passes us the post id; look up the row from current state.
    // Posts come from useFeed and stay referentially stable per render.
    const target = posts.find((p) => p.id === id);
    if (!target) return;
    void sharePost(target);
  }, [posts]);

  const onOpenMenu = useCallback((p: Post) => setMenuPost(p), []);

  const renderItem = useCallback<ListRenderItem<Post>>(
    ({ item }) => (
      <PostComponent
        post={item}
        onLike={like}
        onComment={onComment}
        onShare={onShare}
        onOpenUser={onOpenUser}
        onOpenMenu={onOpenMenu}
      />
    ),
    [PostComponent, like, onComment, onShare, onOpenUser, onOpenMenu],
  );

  const showFirstLoad = loading && posts.length === 0 && !error;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        ListHeaderComponent={
          <View style={{ backgroundColor: theme.bg }}>
            <FeedHeader
              filter={filter}
              onFilter={setFilter}
              onOpenSearch={() => router.push('/search')}
              onOpenNotifications={() => router.push('/notifications')}
              unreadNotifications={unread > 0}
            />
            <ProHint
              variant="tip"
              title="Go Pro"
              subtitle="Unlimited slips, no ads"
              style={styles.proHint}
            />
          </View>
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

      <PostActionSheet
        post={menuPost}
        onClose={() => setMenuPost(null)}
        onToggleSave={toggleSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  proHint: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },
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
