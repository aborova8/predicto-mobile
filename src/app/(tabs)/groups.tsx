import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/atoms/Icon';
import { SectionHeader } from '@/components/atoms/SectionHeader';
import { JoinByCodeSheet } from '@/components/groups/JoinByCodeSheet';
import { errorMessage } from '@/lib/api';
import { useGroups } from '@/hooks/useGroups';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';
import type { Group } from '@/types/domain';

export default function GroupsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [joinOpen, setJoinOpen] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const mineQ = useGroups({ scope: 'mine' });
  const publicQ = useGroups({ scope: 'public' });

  const q = query.trim().toLowerCase();
  const matches = (g: Group) =>
    !q || g.name.toLowerCase().includes(q) || (g.description ?? '').toLowerCase().includes(q);

  // Backend `mine` already includes joined groups; `public` returns all PUBLIC.
  // Filter the public list to drop ones the viewer already belongs to.
  const mineIds = new Set(mineQ.groups.map((g) => g.id));
  const mine = mineQ.groups.filter(matches);
  const discover = publicQ.groups.filter((g) => !mineIds.has(g.id) && matches(g));

  const refreshAll = async () => {
    await Promise.all([mineQ.refetch(), publicQ.refetch()]);
  };

  const refreshing = (mineQ.loading && mineQ.groups.length > 0) || (publicQ.loading && publicQ.groups.length > 0);
  const initialLoading = mineQ.loading && publicQ.loading && mine.length === 0 && discover.length === 0;
  const hasError = (mineQ.error || publicQ.error) && mine.length === 0 && discover.length === 0;

  // FlatList's onEndReached without restructuring the two-section layout:
  // fetch the next page of the long list (Discover) when the user scrolls
  // near the bottom. The mine list usually fits in a single page so we let
  // it surface its own footer if hasMore — calling fetchMore on the hidden
  // list would burn a request the user can't see the result of.
  const NEAR_BOTTOM_PX = 240;
  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const distanceFromBottom =
        contentSize.height - (contentOffset.y + layoutMeasurement.height);
      if (distanceFromBottom > NEAR_BOTTOM_PX) return;
      if (publicQ.hasMore) void publicQ.fetchMore();
    },
    [publicQ],
  );

  const joinPublic = async (g: Group) => {
    if (!g.inviteCode) {
      setJoinOpen(true);
      return;
    }
    setJoiningId(g.id);
    try {
      const result = await publicQ.joinByCode(g.inviteCode);
      if (result.joined || result.alreadyMember) {
        await mineQ.refetch();
        router.push(`/group/${g.id}`);
      }
    } catch (err) {
      Alert.alert('Could not join', errorMessage(err, 'Try again.'));
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.bg }}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: insets.top + 6 }}
        keyboardShouldPersistTaps="handled"
        onMomentumScrollEnd={onScrollEnd}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshAll}
            tintColor={theme.text2}
          />
        }
      >
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <View style={styles.headRow}>
            <Text style={[styles.h1, { color: theme.text }]}>Groups</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={() => setJoinOpen(true)}
                style={[styles.newBtn, { backgroundColor: theme.surface, borderColor: theme.line, borderWidth: 1 }]}
              >
                <Text style={[styles.joinByCodeTxt, { color: theme.text }]}>Join code</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/create-group')}
                style={[styles.newBtn, { backgroundColor: theme.neon }]}
              >
                <Icon name="plus" size={14} stroke={2.4} color="#06091A" />
                <Text style={styles.newTxt}>New</Text>
              </Pressable>
            </View>
          </View>
          <Text style={[styles.sub, { color: theme.text2 }]}>
            Compete in private leagues with your circle.
          </Text>
          <View style={[styles.search, { backgroundColor: theme.surface, borderColor: theme.line }]}>
            <Icon name="search" size={16} color={theme.text3} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search groups by name"
              placeholderTextColor={theme.text3}
              style={{
                flex: 1,
                fontFamily: Fonts.dispMedium,
                fontSize: 14,
                color: theme.text,
              }}
            />
            {query ? (
              <Pressable onPress={() => setQuery('')}>
                <Icon name="x" size={16} color={theme.text3} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {initialLoading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator color={theme.text2} />
          </View>
        ) : hasError ? (
          <View style={[styles.emptySearch, { borderColor: theme.line, marginHorizontal: 16, gap: 10 }]}>
            <Text style={[styles.emptyTxt, { color: theme.text3 }]}>
              {errorMessage(mineQ.error ?? publicQ.error, 'COULD NOT LOAD GROUPS').toUpperCase()}
            </Text>
            <Pressable onPress={refreshAll} style={[styles.retryBtn, { borderColor: theme.neon }]}>
              <Text style={[styles.retryTxt, { color: theme.neon }]}>RETRY</Text>
            </Pressable>
          </View>
        ) : null}

        {!initialLoading && mine.length === 0 && discover.length === 0 && q ? (
          <View style={[styles.emptySearch, { borderColor: theme.line, marginHorizontal: 16 }]}>
            <Text style={[styles.emptyTxt, { color: theme.text3 }]}>
              NO GROUPS MATCH &quot;{query.toUpperCase()}&quot;
            </Text>
          </View>
        ) : null}

        {!initialLoading && mine.length === 0 && discover.length === 0 && !q && !hasError ? (
          <View style={[styles.emptySearch, { borderColor: theme.line, marginHorizontal: 16, gap: 8 }]}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No groups yet</Text>
            <Text style={[styles.emptyBody, { color: theme.text2 }]}>
              Create your first group or join one with an invite code.
            </Text>
          </View>
        ) : null}

        {mine.length > 0 ? <SectionHeader title="Your groups" /> : null}
        {mine.length > 0 ? (
          <View style={{ paddingHorizontal: 16, gap: 8, marginBottom: 18 }}>
            {mine.map((g) => (
              <Pressable
                key={g.id}
                onPress={() => router.push(`/group/${g.id}`)}
                style={[styles.groupCard, { backgroundColor: theme.surface, borderColor: theme.line }]}
              >
                <View style={[styles.groupBadge, { backgroundColor: g.color }]}>
                  <Text style={styles.groupBadgeTxt}>{g.name[0]?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.groupNameRow}>
                    <Text style={[styles.groupName, { color: theme.text }]}>{g.name}</Text>
                    {g.visibility === 'PRIVATE' ? (
                      <Icon name="lock" size={12} color={theme.text3} stroke={2.2} />
                    ) : null}
                  </View>
                  <Text style={[styles.groupMeta, { color: theme.text3 }]}>
                    {g.memberCount.toLocaleString()} MEMBERS · {g.viewerRole ?? 'MEMBER'}
                  </Text>
                </View>
                <Icon name="chevron" size={16} color={theme.text3} />
              </Pressable>
            ))}
          </View>
        ) : null}

        {discover.length > 0 ? <SectionHeader title="Discover" /> : null}
        {discover.length > 0 ? (
          <View style={{ paddingHorizontal: 16, gap: 8, paddingBottom: 12 }}>
            {discover.map((g) => (
              <Pressable
                key={g.id}
                onPress={() => router.push(`/group/${g.id}`)}
                style={[styles.groupCard, { backgroundColor: theme.surface, borderColor: theme.line }]}
              >
                <View style={[styles.groupBadge, { backgroundColor: g.color }]}>
                  <Text style={styles.groupBadgeTxt}>{g.name[0]?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.groupName, { color: theme.text }]}>{g.name}</Text>
                  <Text style={[styles.groupMeta, { color: theme.text3 }]}>
                    {g.memberCount.toLocaleString()} MEMBERS
                  </Text>
                  {g.description ? (
                    <Text style={[styles.groupDesc, { color: theme.text2 }]} numberOfLines={2}>
                      {g.description}
                    </Text>
                  ) : null}
                </View>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    void joinPublic(g);
                  }}
                  disabled={joiningId === g.id}
                  style={[styles.joinBtn, { borderColor: theme.neon }]}
                >
                  {joiningId === g.id ? (
                    <ActivityIndicator color={theme.neon} size="small" />
                  ) : (
                    <Text style={[styles.joinTxt, { color: theme.neon }]}>Join</Text>
                  )}
                </Pressable>
              </Pressable>
            ))}
          </View>
        ) : null}

        {publicQ.loadingMore ? (
          <View style={styles.footerLoader}>
            <ActivityIndicator color={theme.text2} />
          </View>
        ) : null}
      </ScrollView>

      <JoinByCodeSheet
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        joinByCode={publicQ.joinByCode}
        onResult={async (result) => {
          if (result.joined || result.alreadyMember) {
            await mineQ.refetch();
            router.push(`/group/${result.group.id}`);
          }
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  h1: {
    fontFamily: Fonts.dispBlack,
    fontSize: 26,
    letterSpacing: -0.5,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  newTxt: {
    fontFamily: Fonts.dispBold,
    fontSize: 12,
    color: '#06091A',
  },
  joinByCodeTxt: {
    fontFamily: Fonts.dispBold,
    fontSize: 12,
  },
  sub: {
    fontFamily: Fonts.uiRegular,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 12,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  loaderWrap: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptySearch: {
    paddingVertical: 28,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  emptyTxt: {
    fontFamily: Fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  emptyTitle: {
    fontFamily: Fonts.dispBold,
    fontSize: 16,
  },
  emptyBody: {
    fontFamily: Fonts.uiRegular,
    fontSize: 13,
    textAlign: 'center',
  },
  retryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
  },
  retryTxt: {
    fontFamily: Fonts.dispBold,
    fontSize: 12,
    letterSpacing: 1.4,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 12,
  },
  groupBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupBadgeTxt: {
    fontFamily: Fonts.dispBlack,
    fontSize: 18,
    color: '#06091A',
  },
  groupNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupName: {
    fontFamily: Fonts.dispBold,
    fontSize: 14,
  },
  groupMeta: {
    fontFamily: Fonts.monoMedium,
    fontSize: 11,
    marginBottom: 2,
  },
  groupDesc: {
    fontFamily: Fonts.uiRegular,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  joinBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 8,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinTxt: {
    fontFamily: Fonts.dispBold,
    fontSize: 12,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
