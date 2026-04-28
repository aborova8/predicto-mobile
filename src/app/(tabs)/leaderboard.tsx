import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/atoms/Avatar';
import { LEADERBOARD } from '@/data/leaderboard';
import { USERS } from '@/data/users';
import { withAlpha } from '@/lib/colors';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';
import type { LeaderboardEntry } from '@/types/domain';

type Board = 'points' | 'bigOdds' | 'streak';
type Scope = 'global' | 'friends' | 'groups';

const BOARDS: { id: Board; label: string; unit: string; fmt: (v: number) => string }[] = [
  { id: 'points', label: 'Points', unit: 'PTS', fmt: (v) => v.toLocaleString() },
  { id: 'bigOdds', label: 'Big Win', unit: '× ODDS', fmt: (v) => `${v.toFixed(2)}×` },
  { id: 'streak', label: 'Streak', unit: 'IN A ROW', fmt: (v) => `${v} 🔥` },
];

const SUBTITLES: Record<Board, string> = {
  points: 'Season closes in 14 days.',
  bigOdds: 'Biggest cashed ticket this season.',
  streak: 'Consecutive winning tickets.',
};

export default function LeaderboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [scope, setScope] = useState<Scope>('global');
  const [board, setBoard] = useState<Board>('points');
  const cfg = BOARDS.find((b) => b.id === board)!;

  const rows = useMemo(() => {
    const base = scope === 'friends' ? LEADERBOARD.filter((r) => r.friend || r.isMe) : LEADERBOARD;
    return [...base]
      .sort((a, b) => (b[board] as number) - (a[board] as number))
      .map((r, i) => ({ ...r, rank: i + 1 }));
  }, [scope, board]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingBottom: 120, paddingTop: insets.top + 6 }}
    >
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
                style={[
                  styles.toggleBtn,
                  { backgroundColor: a ? theme.neon : 'transparent' },
                ]}
              >
                <Text style={[styles.toggleTxt, { color: a ? '#06091A' : theme.text2 }]}>
                  {b.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ flexDirection: 'row', gap: 6 }}>
          {(['global', 'friends', 'groups'] as const).map((s) => {
            const a = s === scope;
            return (
              <Pressable
                key={s}
                onPress={() => setScope(s)}
                style={[
                  styles.scopePill,
                  {
                    backgroundColor: a ? theme.text : 'transparent',
                    borderColor: a ? theme.text : theme.line,
                  },
                ]}
              >
                <Text style={[styles.scopeTxt, { color: a ? theme.bg : theme.text2 }]}>{s}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Podium rows={rows} board={board} cfg={cfg} onOpenUser={(id) => router.push(`/user/${id}`)} />

      <View style={{ paddingHorizontal: 16, marginTop: 4 }}>
        {rows
          .filter((r) => r.rank > 3)
          .map((r) => {
            const u = USERS[r.userId];
            if (!u) return null;
            return (
              <Pressable
                key={r.userId}
                onPress={() => router.push(`/user/${u.id}`)}
                style={[
                  styles.row,
                  {
                    backgroundColor: r.isMe ? theme.neonDim : theme.surface,
                    borderColor: r.isMe ? withAlpha(theme.neon, 0.33) : theme.line,
                  },
                ]}
              >
                <Text style={[styles.rank, { color: theme.text2 }]}>{r.rank}</Text>
                <Avatar user={u} size={36} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowName, { color: theme.text }]}>
                    {u.name}
                    {r.isMe ? <Text style={{ color: theme.neon, fontSize: 11 }}>  YOU</Text> : null}
                  </Text>
                  <Text style={[styles.rowMeta, { color: theme.text3 }]}>
                    @{u.handle} · {u.hitRate}% HIT
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.rowValue, { color: theme.text }]}>
                    {cfg.fmt(r[board] as number)}
                  </Text>
                  <Text style={[styles.rowUnit, { color: theme.text3 }]}>{cfg.unit}</Text>
                </View>
              </Pressable>
            );
          })}
      </View>
    </ScrollView>
  );
}

function Podium({
  rows,
  cfg,
  onOpenUser,
  board,
}: {
  rows: (LeaderboardEntry & { rank: number })[];
  cfg: (typeof BOARDS)[number];
  onOpenUser: (id: string) => void;
  board: Board;
}) {
  const theme = useTheme();
  const order: number[] = [2, 1, 3];
  const sizes: Record<number, number> = { 1: 56, 2: 44, 3: 44 };
  const heights: Record<number, number> = { 1: 80, 2: 56, 3: 40 };
  return (
    <LinearGradient
      colors={[theme.surface, theme.neonDim]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.podium, { borderColor: theme.line }]}
    >
      {order.map((rank) => {
        const r = rows.find((x) => x.rank === rank);
        if (!r) return null;
        const u = USERS[r.userId];
        if (!u) return null;
        return (
          <Pressable
            key={rank}
            onPress={() => onOpenUser(u.id)}
            style={{ alignItems: 'center', gap: 6 }}
          >
            <Avatar user={u} size={sizes[rank]} ring={rank === 1} />
            <Text style={[styles.podiumName, { color: theme.text }]}>
              {u.name.split(' ')[0]}
            </Text>
            <Text style={[styles.podiumValue, { color: theme.neon }]}>
              {cfg.fmt(r[board] as number)}
            </Text>
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
  scopeTxt: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  podium: {
    marginHorizontal: 16,
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
});
