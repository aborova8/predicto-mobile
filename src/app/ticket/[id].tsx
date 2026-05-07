import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/atoms/Avatar';
import { Icon } from '@/components/atoms/Icon';
import { ScreenHeader } from '@/components/nav/ScreenHeader';
import { TEAMS } from '@/data/teams';
import { useTicket } from '@/hooks/useTicket';
import { withAlpha } from '@/lib/colors';
import { multiplyOdds } from '@/lib/format';
import { getMatch } from '@/lib/matchCache';
import {
  legStatusColor,
  statusGlyph,
  ticketStatusColor,
  ticketStatusLabel,
} from '@/lib/status';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';
import type { Fixture, Leg, TicketStatus } from '@/types/domain';

interface ViewModelLeg {
  league: string;
  home: string;
  away: string;
  kickoff: string;
  pick: '1' | 'X' | '2';
  odds: number;
  status: 'won' | 'lost' | 'pending';
  result?: string;
}

function resolveFixture(leg: Leg): Fixture | undefined {
  return leg.fixture ?? getMatch(leg.matchId);
}

export default function TicketDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const ticketId = id ?? '';

  const { ticket, raw, createdAtRelative, loading, error } = useTicket(
    ticketId ? ticketId : null,
  );
  const authorUsername = raw?.user?.username ?? null;
  const authorAvatarUrl = raw?.user?.avatarUrl ?? null;

  let legs: ViewModelLeg[] = [];
  let statusKey: TicketStatus = 'pending';
  let multiplier = 0;
  let dateLabel = '';
  let points = 0;
  let stake = 0;
  let caption: string | undefined;
  let displayName: string | undefined;
  let displayAvatarUrl: string | null = null;

  if (ticket && raw) {
    legs = ticket.legs.map((l) => {
      const f = resolveFixture(l);
      return {
        league: f?.league ?? 'Match',
        home: f?.home ?? 'HOM',
        away: f?.away ?? 'AWY',
        kickoff: f?.kickoff ?? '',
        pick: l.pick,
        odds: f?.odds[l.pick] ?? 1,
        status: l.status ?? 'pending',
        result: l.result,
      };
    });
    statusKey = ticket.status;
    multiplier = multiplyOdds(legs.map((l) => l.odds));
    dateLabel = createdAtRelative ? `${createdAtRelative} ago` : '';
    points = ticket.potential;
    stake = ticket.stake ?? 10;
    displayName = authorUsername ?? undefined;
    displayAvatarUrl = authorAvatarUrl;
    caption = raw.post?.caption ?? undefined;
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <ScreenHeader title="Slip" />
        <View style={styles.center}>
          <ActivityIndicator color={theme.neon} />
        </View>
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <ScreenHeader title="Slip" />
        <View style={styles.center}>
          <Text style={{ color: theme.text, fontFamily: Fonts.dispBold }}>
            {error ? 'Could not load ticket' : 'Ticket not found'}
          </Text>
          {error ? (
            <Text style={[styles.errorMsg, { color: theme.text2 }]}>{error.message}</Text>
          ) : null}
        </View>
      </View>
    );
  }

  const c = ticketStatusColor(theme, statusKey);
  const statusLabel = ticketStatusLabel(statusKey);
  const sGlyph = statusGlyph(statusKey);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScreenHeader
        title={`Slip · #${ticketId.toUpperCase()}`}
        right={<Icon name="share" size={16} color={theme.text2} />}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}>
        {/* Author */}
        <View style={styles.author}>
          {displayName ? (
            <Avatar
              author={{ username: displayName, avatarUrl: displayAvatarUrl }}
              size={42}
            />
          ) : null}
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: theme.text }]}>{displayName ?? '—'}</Text>
            {displayName ? (
              <Text style={[styles.handle, { color: theme.text3 }]}>@{displayName}</Text>
            ) : null}
          </View>
        </View>

        {/* Status banner */}
        <View
          style={[
            styles.banner,
            {
              backgroundColor: withAlpha(c, 0.08),
              borderColor: withAlpha(c, 0.33),
            },
          ]}
        >
          <View
            style={[
              styles.bannerGlyph,
              { backgroundColor: withAlpha(c, 0.13), borderColor: withAlpha(c, 0.33) },
            ]}
          >
            <Text style={{ color: c, fontFamily: Fonts.monoBlack, fontSize: 12 }}>{sGlyph}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerLabel, { color: c }]}>{statusLabel}</Text>
            <Text style={[styles.bannerInfo, { color: theme.text }]}>
              {legs.length}-leg · {multiplier.toFixed(2)}× · stake {stake}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.bannerPts, { color: c }]}>
              {statusKey === 'won' ? `+${Math.round(points)}` : statusKey === 'lost' ? '0' : '···'}
            </Text>
            <Text style={[styles.bannerSub, { color: theme.text3 }]}>POINTS · {dateLabel}</Text>
          </View>
        </View>

        {/* Legs */}
        <View style={[styles.legsCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          {legs.map((l, i) => {
            const lc = legStatusColor(theme, l.status);
            const pickLabel = l.pick === '1' ? l.home : l.pick === '2' ? l.away : 'DRAW';
            return (
              <View
                key={i}
                style={[
                  styles.legRow,
                  i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.lineSoft },
                ]}
              >
                <View
                  style={[
                    styles.legGlyph,
                    { backgroundColor: withAlpha(lc, 0.13), borderColor: withAlpha(lc, 0.33) },
                  ]}
                >
                  <Text style={{ color: lc, fontFamily: Fonts.monoBlack, fontSize: 10 }}>
                    {statusGlyph(l.status)}
                  </Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.legTeams, { color: theme.text }]} numberOfLines={1}>
                    {(TEAMS[l.home]?.short ?? l.home)}{' '}
                    <Text style={{ color: theme.text3 }}>vs</Text>{' '}
                    {(TEAMS[l.away]?.short ?? l.away)}
                  </Text>
                  <Text style={[styles.legMeta, { color: theme.text3 }]}>
                    {l.league} · {l.kickoff}{l.result ? ` · ${l.result}` : ''}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.legPick, { color: theme.text }]}>{pickLabel}</Text>
                  <Text style={[styles.legOdds, { color: theme.text2 }]}>{l.odds.toFixed(2)}×</Text>
                </View>
              </View>
            );
          })}
        </View>

        {caption ? (
          <Text style={[styles.caption, { color: theme.text2 }]}>{caption}</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorMsg: {
    fontFamily: Fonts.uiRegular,
    fontSize: 13,
    paddingHorizontal: 32,
    textAlign: 'center',
  },
  author: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 14,
  },
  name: {
    fontFamily: Fonts.dispBold,
    fontSize: 15,
  },
  handle: {
    fontFamily: Fonts.monoRegular,
    fontSize: 11,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 12,
  },
  bannerGlyph: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerLabel: {
    fontFamily: Fonts.monoBlack,
    fontSize: 10,
    letterSpacing: 0.7,
  },
  bannerInfo: {
    fontFamily: Fonts.dispBold,
    fontSize: 13,
    marginTop: 2,
  },
  bannerPts: {
    fontFamily: Fonts.dispBlack,
    fontSize: 22,
    letterSpacing: -0.3,
  },
  bannerSub: {
    fontFamily: Fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 0.5,
    marginTop: 3,
  },
  legsCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 4,
    marginBottom: 12,
  },
  legRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  legGlyph: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legTeams: {
    fontFamily: Fonts.dispBold,
    fontSize: 13,
  },
  legMeta: {
    fontFamily: Fonts.monoRegular,
    fontSize: 10,
    letterSpacing: 0.4,
    marginTop: 2,
  },
  legPick: {
    fontFamily: Fonts.dispBold,
    fontSize: 12,
  },
  legOdds: {
    fontFamily: Fonts.monoMedium,
    fontSize: 11,
    marginTop: 1,
  },
  caption: {
    fontFamily: Fonts.uiRegular,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 14,
  },
});
