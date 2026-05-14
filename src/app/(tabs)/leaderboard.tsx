import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  type ListRenderItem,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/atoms/Avatar';
import { Icon } from '@/components/atoms/Icon';
import { GroupPickerSheet } from '@/components/leaderboard/GroupPickerSheet';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { withAlpha } from '@/lib/colors';
import { fmtOdds } from '@/lib/format';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';
import type { LeaderboardBoard, LeaderboardEntry, LeaderboardScope } from '@/types/domain';

const BOARDS: { id: LeaderboardBoard; label: string }[] = [
  { id: 'points', label: 'Points' },
  { id: 'bigOdds', label: 'Big Win' },
  { id: 'streak', label: 'Streak' },
];

const VALUES: Record<LeaderboardBoard, { unit: string; fmt: (e: LeaderboardEntry) => string }> = {
  points: { unit: 'PTS', fmt: (e) => e.points.toLocaleString() },
  streak: { unit: 'IN A ROW', fmt: (e) => `${e.streak} 🔥` },
  bigOdds: { unit: '× ODDS', fmt: (e) => `${fmtOdds(e.bigOdds)}×` },
};

const SUBTITLES: Record<LeaderboardBoard, string> = {
  points: 'All-time points leaders.',
  bigOdds: 'Biggest cashed ticket.',
  streak: 'Consecutive winning tickets.',
};

const SCOPES: { id: LeaderboardScope | 'groups'; label: string }[] = [
  { id: 'global', label: 'global' },
  { id: 'friends', label: 'friends' },
  { id: 'groups', label: 'groups' },
];

function hitRate(e: LeaderboardEntry): number {
  return e.ticketsPlayed > 0 ? Math.round((e.wins / e.ticketsPlayed) * 100) : 0;
}

export default function LeaderboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [scope, setScope] = useState<LeaderboardScope>('global');
  const [board, setBoard] = useState<LeaderboardBoard>('points');
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [query, setQuery] = useState('');

  const isSearching = query.trim().length > 0;

  const { items, viewer, loading, loadingMore, hasMore, error, refetch, fetchMore } =
    useLeaderboard(scope, board, query);
  const cfg = VALUES[board];

  const viewerInList = viewer ? items.some((i) => i.user.id === viewer.user.id) : false;
  const showStickyViewer = !isSearching && !!viewer && !viewerInList;
  // Below 3 entries the podium hides AND ListEmptyComponent skips
  // (items.length > 0); fall back to plain rows so early users don't vanish.
  const showPodium = !isSearching && items.length >= 3;
  const listRows = showPodium ? items.filter((i) => (i.rank ?? 0) > 3) : items;

  const renderRow = useCallback<ListRenderItem<LeaderboardEntry>>(
    ({ item }) => (
      <Row
        entry={item}
        cfg={cfg}
        isMe={item.user.id === viewer?.user.id}
        onPress={() => router.push(`/user/${item.user.id}`)}
      />
    ),
    [cfg, viewer?.user.id, router],
  );

  const Header = (
    <View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
        <Text style={[styles.h1, { color: theme.text }]}>Standings</Text>
        <Text style={[styles.sub, { color: theme.text2 }]}>{SUBTITLES[board]}</Text>

        <View style={[styles.toggle, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          {BOARDS.map((b) => {
            const a = b.id === board;
            return (
              <Pressable
                key={b.id}
                onPress={() => setBoard(b.id)}
                style={[styles.toggleBtn, { backgroundColor: a ? theme.neon : 'transparent' }]}
              >
                <Text style={[styles.toggleTxt, { color: a ? '#06091A' : theme.text2 }]}>
                  {b.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ flexDirection: 'row', gap: 6 }}>
          {SCOPES.map((s) => {
            const a = s.id !== 'groups' && s.id === scope;
            return (
              <Pressable
                key={s.id}
                onPress={() => {
                  if (s.id === 'groups') setShowGroupPicker(true);
                  else setScope(s.id);
                }}
                style={[
                  styles.scopePill,
                  {
                    backgroundColor: a ? theme.text : 'transparent',
                    borderColor: a ? theme.text : theme.line,
                  },
                ]}
              >
                <Text style={[styles.scopeTxt, { color: a ? theme.bg : theme.text2 }]}>
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View
          style={[
            styles.searchBar,
            { backgroundColor: theme.surface, borderColor: theme.line },
          ]}
        >
          <Icon name="search" size={16} color={theme.text3} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by username…"
            placeholderTextColor={theme.text3}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            style={{
              flex: 1,
              fontFamily: Fonts.uiRegular,
              fontSize: 13,
              color: theme.text,
              paddingVertical: 0,
            }}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Icon name="x" size={14} color={theme.text3} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {showPodium ? (
        <Podium
          rows={items}
          cfg={cfg}
          viewerId={viewer?.user.id ?? null}
          onOpenUser={(id) => router.push(`/user/${id}`)}
        />
      ) : null}
    </View>
  );

  const Footer = (
    <>
      {loadingMore ? (
        <View style={styles.footerLoader}>
          <ActivityIndicator color={theme.text2} />
        </View>
      ) : null}
      {showStickyViewer ? (
        <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
          <Text style={[styles.stickyLabel, { color: theme.text3 }]}>YOUR RANK</Text>
          <Row
            entry={viewer!}
            cfg={cfg}
            isMe
            onPress={() => router.push(`/user/${viewer!.user.id}`)}
          />
        </View>
      ) : null}
    </>
  );

  return (
    <>
      <FlatList
        style={{ flex: 1, backgroundColor: theme.bg }}
        contentContainerStyle={{
          paddingBottom: 120,
          paddingTop: insets.top + 6,
          paddingHorizontal: 16,
        }}
        data={listRows}
        keyExtractor={(r) => r.user.id}
        renderItem={renderRow}
        ListHeaderComponent={Header}
        ListFooterComponent={Footer}
        ListEmptyComponent={
          loading && items.length === 0 ? (
            <View style={styles.center}>
              <ActivityIndicator color={theme.neon} />
            </View>
          ) : error && items.length === 0 ? (
            <View style={styles.center}>
              <Text style={[styles.errorText, { color: theme.loss }]}>{error.message}</Text>
              <Pressable onPress={refetch} style={[styles.retry, { borderColor: theme.line }]}>
                <Text style={[styles.retryText, { color: theme.text }]}>Retry</Text>
              </Pressable>
            </View>
          ) : items.length === 0 ? (
            <View style={styles.center}>
              <Text style={[styles.emptyText, { color: theme.text2 }]}>
                {isSearching ? 'No players found.' : 'No standings yet.'}
              </Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={loading && items.length > 0}
            onRefresh={refetch}
            tintColor={theme.neon}
          />
        }
        onEndReached={hasMore ? () => void fetchMore() : undefined}
        onEndReachedThreshold={0.6}
      />

      <GroupPickerSheet open={showGroupPicker} onClose={() => setShowGroupPicker(false)} />
    </>
  );
}

interface RowProps {
  entry: LeaderboardEntry;
  cfg: (typeof VALUES)[LeaderboardBoard];
  isMe: boolean;
  onPress: () => void;
}

function Row({ entry, cfg, isMe, onPress }: RowProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.row,
        {
          backgroundColor: isMe ? theme.neonDim : theme.surface,
          borderColor: isMe ? withAlpha(theme.neon, 0.33) : theme.line,
        },
      ]}
    >
      <Text style={[styles.rank, { color: theme.text2 }]}>{entry.rank ?? '—'}</Text>
      <Avatar author={entry.user} size={36} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowName, { color: theme.text }]}>
          {entry.user.username}
          {isMe ? <Text style={{ color: theme.neon, fontSize: 11 }}>  YOU</Text> : null}
        </Text>
        <Text style={[styles.rowMeta, { color: theme.text3 }]}>{hitRate(entry)}% HIT</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.rowValue, { color: theme.text }]}>{cfg.fmt(entry)}</Text>
        <Text style={[styles.rowUnit, { color: theme.text3 }]}>{cfg.unit}</Text>
      </View>
    </Pressable>
  );
}

interface PodiumProps {
  rows: LeaderboardEntry[];
  cfg: (typeof VALUES)[LeaderboardBoard];
  viewerId: string | null;
  onOpenUser: (id: string) => void;
}

function Podium({ rows, cfg, viewerId, onOpenUser }: PodiumProps) {
  const theme = useTheme();
  const order: number[] = [2, 1, 3];
  const sizes: Record<number, number> = { 1: 56, 2: 44, 3: 44 };
  const heights: Record<number, number> = { 1: 80, 2: 56, 3: 40 };
  const byRank = new Map(rows.map((r) => [r.rank, r]));
  return (
    <LinearGradient
      colors={[theme.surface, theme.neonDim]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.podium, { borderColor: theme.line }]}
    >
      {order.map((rank) => {
        const r = byRank.get(rank);
        if (!r) return null;
        const isMe = r.user.id === viewerId;
        return (
          <Pressable
            key={rank}
            onPress={() => onOpenUser(r.user.id)}
            style={{ alignItems: 'center', gap: 6 }}
          >
            <Avatar author={r.user} size={sizes[rank]} ring={rank === 1} />
            <Text style={[styles.podiumName, { color: theme.text }]} numberOfLines={1}>
              {r.user.username}
              {isMe ? <Text style={{ color: theme.neon }}> · YOU</Text> : null}
            </Text>
            <Text style={[styles.podiumValue, { color: theme.neon }]}>{cfg.fmt(r)}</Text>
            <View
              style={{
                width: rank === 1 ? 56 : 44,
                height: heights[rank],
                backgroundColor: rank === 1 ? theme.neon : theme.surface2,
                borderTopLeftRadius: 6,
                borderTopRightRadius: 6,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  fontFamily: Fonts.dispBlack,
                  fontSize: 18,
                  color: rank === 1 ? '#06091A' : theme.text,
                }}
              >
                {rank}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  h1: {
    fontFamily: Fonts.dispBlack,
    fontSize: 26,
    letterSpacing: -0.5,
  },
  sub: {
    fontFamily: Fonts.uiRegular,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 12,
  },
  toggle: {
    flexDirection: 'row',
    gap: 4,
    borderWidth: 1,
    borderRadius: 12,
    padding: 4,
    marginBottom: 10,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: 'center',
  },
  toggleTxt: {
    fontFamily: Fonts.dispBold,
    fontSize: 12,
  },
  scopePill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  searchBar: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 38,
  },
  scopeTxt: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  podium: {
    marginVertical: 16,
    paddingTop: 20,
    paddingHorizontal: 14,
    paddingBottom: 16,
    borderWidth: 1,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 16,
  },
  podiumName: {
    fontFamily: Fonts.dispBold,
    fontSize: 12,
    maxWidth: 80,
  },
  podiumValue: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 6,
  },
  rank: {
    width: 28,
    textAlign: 'center',
    fontFamily: Fonts.monoBold,
    fontSize: 14,
  },
  rowName: {
    fontFamily: Fonts.dispBold,
    fontSize: 14,
  },
  rowMeta: {
    fontFamily: Fonts.monoRegular,
    fontSize: 11,
  },
  rowValue: {
    fontFamily: Fonts.dispBlack,
    fontSize: 15,
  },
  rowUnit: {
    fontFamily: Fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  center: {
    paddingVertical: 48,
    paddingHorizontal: 32,
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    fontFamily: Fonts.uiMedium,
    fontSize: 13,
    textAlign: 'center',
  },
  retry: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  retryText: {
    fontFamily: Fonts.dispBold,
    fontSize: 13,
  },
  emptyText: {
    fontFamily: Fonts.uiRegular,
    fontSize: 13,
  },
  stickyLabel: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 6,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
