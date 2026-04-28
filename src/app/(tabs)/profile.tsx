import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/atoms/Avatar';
import { Icon } from '@/components/atoms/Icon';
import { Pill } from '@/components/atoms/Pill';
import { SectionHeader } from '@/components/atoms/SectionHeader';
import { BADGES } from '@/data/badges';
import { PAST_PREDICTIONS, PAST_TICKETS } from '@/data/leaderboard';
import { USERS } from '@/data/users';
import { withAlpha } from '@/lib/colors';
import {
  legStatusColor,
  statusGlyph as statusGlyphFn,
  ticketStatusColor,
  ticketStatusLabel,
} from '@/lib/status';
import { useAppState } from '@/state/AppStateContext';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';
import type { PastTicket, PastPrediction, TicketStatus } from '@/types/domain';

const TICKETS_WON = PAST_TICKETS.filter((t) => t.status === 'won').length;
const TICKETS_LOST = PAST_TICKETS.filter((t) => t.status === 'lost').length;
const TICKETS_PENDING = PAST_TICKETS.filter((t) => t.status === 'pending').length;
const TICKET_HIT = Math.round((TICKETS_WON / (TICKETS_WON + TICKETS_LOST)) * 100);
const AVG_ODDS = PAST_TICKETS.reduce((a, t) => a + t.multiplier, 0) / PAST_TICKETS.length;

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setAuthed } = useAppState();
  const [filter, setFilter] = useState<TicketStatus | 'all'>('all');

  const u = USERS.u1;
  const tickets = useMemo(
    () => (filter === 'all' ? PAST_TICKETS : PAST_TICKETS.filter((t) => t.status === filter)),
    [filter],
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingBottom: 120 }}
    >
      <LinearGradient
        colors={[theme.neonDim, 'transparent']}
        locations={[0, 0.8]}
        style={[styles.heroGrad, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.iconRow}>
          <Pressable
            onPress={() => router.push('/settings')}
            style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: theme.line }]}
          >
            <Icon name="settings" size={18} color={theme.text2} />
          </Pressable>
          <Pressable
            onPress={() => setAuthed(false)}
            style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: theme.line }]}
          >
            <Icon name="logout" size={18} color={theme.text2} />
          </Pressable>
        </View>

        <View style={styles.heroRow}>
          <Avatar user={u} size={72} ring />
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: theme.text }]}>{u.name}</Text>
            <Text style={[styles.handle, { color: theme.text2 }]}>@{u.handle}</Text>
            <View style={styles.pillRow}>
              <Pill color={theme.neon}>{`LVL ${u.level}`}</Pill>
              <Pill>{`🔥 ${u.streak} STREAK`}</Pill>
            </View>
          </View>
        </View>
      </LinearGradient>

      <View style={{ paddingHorizontal: 16, paddingTop: 4 }}>
        <View style={styles.gridRow2}>
          <StatBox label="Ticket Hit" value={`${TICKET_HIT}%`} valueColor={theme.neon} />
          <StatBox label="Avg Odds" value={`${AVG_ODDS.toFixed(2)}×`} valueColor={theme.text} />
        </View>
        <View style={[styles.gridRow3, { marginTop: 8 }]}>
          <StatBox label="Won" value={`${TICKETS_WON}`} valueColor={theme.win} small />
          <StatBox label="Lost" value={`${TICKETS_LOST}`} valueColor={theme.loss} small />
          <StatBox label="Tickets" value={`${u.tickets}`} valueColor={theme.text2} small />
        </View>

        <View
          style={[
            styles.xpCard,
            { backgroundColor: theme.surface, borderColor: theme.line },
          ]}
        >
          <View style={styles.xpHead}>
            <Text style={[styles.xpLabel, { color: theme.text3 }]}>NEXT LEVEL</Text>
            <Text style={[styles.xpAmount, { color: theme.text2 }]}>1,687 / 2,000 XP</Text>
          </View>
          <View style={[styles.xpBar, { backgroundColor: theme.surface2 }]}>
            <View style={[styles.xpFill, { backgroundColor: theme.neon, shadowColor: theme.neon }]} />
          </View>
        </View>
      </View>

      <View style={{ marginTop: 18 }}>
        <SectionHeader title="Badges" action="See all" />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        style={{ marginBottom: 18 }}
      >
        {BADGES.map((b) => (
          <View
            key={b.id}
            style={[
              styles.badgeCard,
              {
                backgroundColor: theme.surface,
                borderColor: b.earned ? withAlpha(theme.neon, 0.33) : theme.line,
                opacity: b.earned ? 1 : 0.5,
              },
            ]}
          >
            <View
              style={[
                styles.badgeIcon,
                {
                  backgroundColor: b.earned ? theme.neonDim : theme.surface2,
                },
              ]}
            >
              <Text style={{ fontSize: 22 }}>{b.emoji ?? '🔒'}</Text>
            </View>
            <Text style={[styles.badgeName, { color: theme.text }]}>{b.name}</Text>
            {b.earned ? (
              <Text style={[styles.badgeMeta, { color: theme.text3 }]}>EARNED</Text>
            ) : (
              <View style={{ marginTop: 4, width: '100%' }}>
                <View style={[styles.progressBar, { backgroundColor: theme.surface2 }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: theme.neon,
                        width: `${((b.progress ?? 0) / (b.max ?? 1)) * 100}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.badgeMeta, { color: theme.text3 }]}>
                  {b.progress}/{b.max}
                </Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.historyHead}>
        <Text style={[styles.historyTitle, { color: theme.text }]}>Ticket history</Text>
        <Text style={[styles.historyMeta, { color: theme.text3 }]}>
          {PAST_TICKETS.length} TOTAL · POINTS ONLY ON FULL WINS
        </Text>
      </View>

      <View style={styles.filterRow}>
        {([
          { id: 'all', label: 'All', count: PAST_TICKETS.length },
          { id: 'won', label: 'Won', count: TICKETS_WON },
          { id: 'lost', label: 'Lost', count: TICKETS_LOST },
          { id: 'pending', label: 'Pending', count: TICKETS_PENDING },
        ] as const).map((f) => {
          const a = filter === f.id;
          return (
            <Pressable
              key={f.id}
              onPress={() => setFilter(f.id)}
              style={[
                styles.filterPill,
                {
                  backgroundColor: a ? theme.neon : 'transparent',
                  borderColor: a ? theme.neon : theme.line,
                },
              ]}
            >
              <Text style={[styles.filterTxt, { color: a ? '#06091A' : theme.text2 }]}>
                {f.label.toUpperCase()} <Text style={{ opacity: 0.65 }}>{f.count}</Text>
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ paddingHorizontal: 16, gap: 10 }}>
        {tickets.length === 0 ? (
          <View style={[styles.emptyCard, { borderColor: theme.line }]}>
            <Text style={{ color: theme.text3, fontFamily: Fonts.monoMedium, fontSize: 11, letterSpacing: 0.5 }}>
              NO {filter.toUpperCase()} TICKETS
            </Text>
          </View>
        ) : null}
        {tickets.map((t) => (
          <TicketHistoryCard key={t.id} ticket={t} />
        ))}
      </View>
    </ScrollView>
  );
}

function StatBox({
  label,
  value,
  valueColor,
  small,
}: {
  label: string;
  value: string;
  valueColor: string;
  small?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <Text style={[styles.statLabel, { color: theme.text3 }]}>{label.toUpperCase()}</Text>
      <Text
        style={[
          styles.statValue,
          { color: valueColor, fontSize: small ? 18 : 26 },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function TicketHistoryCard({ ticket }: { ticket: PastTicket }) {
  const theme = useTheme();
  const router = useRouter();
  const legs: PastPrediction[] = ticket.legIds
    .map((id) => PAST_PREDICTIONS.find((p) => p.id === id))
    .filter((p): p is PastPrediction => Boolean(p));
  const legsWon = legs.filter((l) => l.status === 'won').length;
  const c = ticketStatusColor(theme, ticket.status);
  const statusLabel = ticketStatusLabel(ticket.status);
  const statusGlyph = statusGlyphFn(ticket.status);

  return (
    <Pressable
      onPress={() => router.push(`/ticket/${ticket.id}`)}
      style={[
        styles.histCard,
        { backgroundColor: theme.surface, borderColor: theme.line },
      ]}
    >
      <View style={styles.histTop}>
        <View
          style={[
            styles.histGlyph,
            { backgroundColor: withAlpha(c, 0.13), borderColor: withAlpha(c, 0.33) },
          ]}
        >
          <Text style={[styles.histGlyphTxt, { color: c }]}>{statusGlyph}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.histStatus, { color: c }]}>{statusLabel}</Text>
          <Text style={[styles.histInfo, { color: theme.text }]}>
            {legs.length}-leg · {ticket.multiplier.toFixed(2)}×{' '}
            <Text style={{ color: theme.text3 }}>· {ticket.date}</Text>
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.histPoints, { color: c }]}>
            {ticket.status === 'won' ? `+${ticket.points}` : ticket.status === 'lost' ? '0' : '···'}
          </Text>
          <Text style={[styles.histPointsLabel, { color: theme.text3 }]}>POINTS</Text>
        </View>
      </View>

      {legs.length > 0 ? (
        <View style={[styles.histLegs, { borderTopColor: theme.lineSoft }]}>
          {legs.map((l) => {
            const lc = legStatusColor(theme, l.status);
            const pickLabel = l.pick === '1' ? l.home : l.pick === '2' ? l.away : 'DRAW';
            return (
              <View key={l.id} style={styles.legLine}>
                <View
                  style={[
                    styles.legGlyph,
                    { backgroundColor: withAlpha(lc, 0.13), borderColor: withAlpha(lc, 0.33) },
                  ]}
                >
                  <Text style={{ color: lc, fontFamily: Fonts.monoBlack, fontSize: 9 }}>
                    {statusGlyphFn(l.status)}
                  </Text>
                </View>
                <Text style={{ color: theme.text, fontFamily: Fonts.monoBold, fontSize: 11 }}>
                  {l.home}
                  <Text style={{ color: theme.text3, fontFamily: Fonts.monoRegular }}> vs </Text>
                  {l.away}
                </Text>
                <View style={{ flex: 1 }} />
                <Text style={{ color: theme.text3, fontFamily: Fonts.monoRegular, fontSize: 11 }}>
                  {pickLabel} · {l.odds.toFixed(2)}×
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}

      {ticket.status !== 'pending' ? (
        <View style={styles.histFoot}>
          <Text style={[styles.histFootTxt, { color: theme.text3 }]}>
            {legsWon}/{legs.length} LEGS HIT
          </Text>
          <Text style={[styles.histFootTxt, { color: theme.text3 }]}>
            STAKE {ticket.stake} · TAP FOR SLIP ›
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heroGrad: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  name: {
    fontFamily: Fonts.dispBlack,
    fontSize: 22,
    letterSpacing: -0.4,
  },
  handle: {
    fontFamily: Fonts.monoMedium,
    fontSize: 12,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  gridRow2: {
    flexDirection: 'row',
    gap: 8,
  },
  gridRow3: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 12,
  },
  statLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 0.6,
  },
  statValue: {
    fontFamily: Fonts.dispBlack,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  xpCard: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 12,
  },
  xpHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  xpLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 0.6,
  },
  xpAmount: {
    fontFamily: Fonts.monoMedium,
    fontSize: 11,
  },
  xpBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpFill: {
    width: '84%',
    height: '100%',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 4,
  },
  badgeCard: {
    width: 100,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
  },
  badgeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  badgeName: {
    fontFamily: Fonts.dispBold,
    fontSize: 11,
    textAlign: 'center',
  },
  badgeMeta: {
    fontFamily: Fonts.monoMedium,
    fontSize: 9,
    marginTop: 2,
    textAlign: 'center',
  },
  progressBar: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  historyHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
  },
  historyTitle: {
    fontFamily: Fonts.dispBold,
    fontSize: 16,
    letterSpacing: -0.2,
  },
  historyMeta: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 0.6,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexWrap: 'wrap',
  },
  filterPill: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterTxt: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    letterSpacing: 0.4,
  },
  emptyCard: {
    paddingVertical: 24,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  histCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  histTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  histGlyph: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  histGlyphTxt: {
    fontFamily: Fonts.monoBlack,
    fontSize: 12,
  },
  histStatus: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  histInfo: {
    fontFamily: Fonts.dispBold,
    fontSize: 13,
    marginTop: 3,
  },
  histPoints: {
    fontFamily: Fonts.dispBlack,
    fontSize: 18,
    letterSpacing: -0.3,
  },
  histPointsLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  histLegs: {
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  legLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legGlyph: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  histFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  histFootTxt: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
