import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/atoms/Icon';
import { FeedPostCard } from '@/components/feed/FeedPostCard';
import { JoinByCodeSheet } from '@/components/groups/JoinByCodeSheet';
import { useFeed } from '@/hooks/useFeed';
import { useGroup } from '@/hooks/useGroup';
import { useGroups } from '@/hooks/useGroups';
import { ApiError, errorMessage } from '@/lib/api';
import { withAlpha } from '@/lib/colors';
import { useAppState } from '@/state/AppStateContext';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';

export default function GroupFeedScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const groupId = id ?? '';

  const { setSlipContext } = useAppState();
  const groupQ = useGroup(groupId);
  const feed = useFeed({ scope: 'global', groupId });
  const mineQ = useGroups({ scope: 'mine' });
  const [joinOpen, setJoinOpen] = useState(false);

  const startPredictForGroup = () => {
    if (!groupQ.group) return;
    setSlipContext({
      kind: 'group',
      groupId: groupQ.group.id,
      groupName: groupQ.group.name,
    });
    router.push('/(tabs)/matches');
  };

  const onRefresh = async () => {
    await Promise.all([groupQ.refetch(), feed.refetch()]);
  };

  const headerColor = groupQ.group?.color ?? theme.surface;
  const groupName = groupQ.group?.name ?? 'Group';
  const memberCount = groupQ.group?.memberCount ?? 0;
  const isForbidden = feed.error instanceof ApiError && feed.error.status === 403;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <LinearGradient
        colors={[withAlpha(headerColor, 0.15), 'transparent']}
        locations={[0, 1]}
        style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: theme.lineSoft }]}
      >
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: theme.line }]}
        >
          <Icon name="chevronL" size={18} color={theme.text2} />
        </Pressable>
        <View style={[styles.crest, { backgroundColor: headerColor }]}>
          <Text style={styles.crestTxt}>{groupName[0]?.toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {groupName}
          </Text>
          <Text style={[styles.meta, { color: theme.text3 }]}>
            GROUP FEED · {memberCount.toLocaleString()} MEMBERS
          </Text>
        </View>
      </LinearGradient>

      <FlatList
        data={feed.posts}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <FeedPostCard
            post={item}
            onLike={feed.like}
            onComment={(pid) => router.push({ pathname: '/comments', params: { postId: pid } })}
            onShare={() => {}}
            onOpenUser={(uid) => router.push(`/user/${uid}`)}
          />
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={feed.loading && feed.posts.length > 0} onRefresh={onRefresh} tintColor={theme.text2} />
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => void feed.fetchMore()}
        ListEmptyComponent={
          feed.loading ? (
            <View style={{ paddingVertical: 60, alignItems: 'center' }}>
              <ActivityIndicator color={theme.text2} />
            </View>
          ) : isForbidden ? (
            <View style={[styles.empty, { borderColor: theme.line }]}>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>This group is private</Text>
              <Text style={[styles.emptySub, { color: theme.text2 }]}>
                Join with an invite code to see the slips members are posting.
              </Text>
              <Pressable
                onPress={() => setJoinOpen(true)}
                style={[styles.joinBtn, { backgroundColor: theme.neon }]}
              >
                <Text style={styles.joinBtnTxt}>Join with invite code</Text>
              </Pressable>
            </View>
          ) : feed.error ? (
            <View style={[styles.empty, { borderColor: theme.line }]}>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>Could not load feed</Text>
              <Text style={[styles.emptySub, { color: theme.text3 }]}>
                {errorMessage(feed.error, 'Try again.').toUpperCase()}
              </Text>
              <Pressable onPress={onRefresh} style={[styles.retryBtn, { borderColor: theme.neon }]}>
                <Text style={[styles.retryTxt, { color: theme.neon }]}>RETRY</Text>
              </Pressable>
            </View>
          ) : (
            <View style={[styles.empty, { borderColor: theme.line }]}>
              <Text style={{ fontSize: 36, marginBottom: 8 }}>📭</Text>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No slips yet</Text>
              <Text style={[styles.emptySub, { color: theme.text3 }]}>
                BE THE FIRST IN {groupName.toUpperCase()}
              </Text>
              <Pressable
                onPress={startPredictForGroup}
                style={[styles.joinBtn, { backgroundColor: theme.neon }]}
              >
                <Text style={styles.joinBtnTxt}>Predict for this group</Text>
              </Pressable>
            </View>
          )
        }
        ListFooterComponent={
          feed.loadingMore ? (
            <View style={{ paddingVertical: 18, alignItems: 'center' }}>
              <ActivityIndicator color={theme.text2} />
            </View>
          ) : null
        }
      />

      <JoinByCodeSheet
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        joinByCode={mineQ.joinByCode}
        onResult={async (result) => {
          if (result.joined || result.alreadyMember) {
            await Promise.all([groupQ.refetch(), feed.refetch(), mineQ.refetch()]);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crest: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crestTxt: {
    fontFamily: Fonts.dispBlack,
    fontSize: 14,
    color: '#06091A',
  },
  title: {
    fontFamily: Fonts.dispBlack,
    fontSize: 16,
    letterSpacing: -0.2,
  },
  meta: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  empty: {
    margin: 24,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
  },
  emptyTitle: {
    fontFamily: Fonts.dispBold,
    fontSize: 16,
  },
  emptySub: {
    fontFamily: Fonts.uiRegular,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  joinBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 8,
  },
  joinBtnTxt: {
    fontFamily: Fonts.dispBold,
    fontSize: 13,
    color: '#06091A',
  },
  retryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  retryTxt: {
    fontFamily: Fonts.dispBold,
    fontSize: 12,
    letterSpacing: 1.4,
  },
});
