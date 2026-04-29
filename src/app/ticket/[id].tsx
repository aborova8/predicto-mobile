import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/atoms/Avatar';
import { Icon } from '@/components/atoms/Icon';
import { ScreenHeader } from '@/components/nav/ScreenHeader';
import { COMMENTS } from '@/data/comments';
import { fixtureMap } from '@/data/fixtures';
import { PAST_PREDICTIONS, PAST_TICKETS } from '@/data/leaderboard';
import { TEAMS } from '@/data/teams';
import { USERS } from '@/data/users';
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
  return leg.fixture ?? getMatch(leg.matchId) ?? fixtureMap[leg.matchId];
}

export default function TicketDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const ticketId = id ?? '';

  // Past mock tickets are kept as a fallback so legacy navigation from the
  // leaderboard / profile (which still use mock data) keeps working until
  // those screens are migrated.
  const past = PAST_TICKETS.find((t) => t.id === ticketId);
  const fetchEnabled = !past && Boolean(ticketId);

  const { ticket, raw, createdAtRelative, loading, error } = useTicket(
    fetchEnabled ? ticketId : null,
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
  let postId: string | null = null;
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
  } else if (past) {
    legs = past.legIds
      .map((legId) => PAST_PREDICTIONS.find((p) => p.id === legId))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .map((l) => ({
        league: l.league,
        home: l.home,
        away: l.away,
        kickoff: l.kickoff,
        pick: l.pick,
        odds: l.odds,
        status: l.status,
        result: l.result,
      }));
    statusKey = past.status;
    multiplier = past.multiplier;
    dateLabel = past.date;
    points = past.points;
    stake = past.stake;
    displayName = USERS.u1?.name;
  }

  if (loading && !past) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <ScreenHeader title="Slip" />
        <View style={styles.center}>
          <ActivityIndicator color={theme.neon} />
        </View>
      </View>
    );
  }

  if (!ticket && !past) {
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
  const comments = postId ? COMMENTS[postId] ?? [] : [];

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScreenHeader
        title={`Slip · #${ticketId.toUpperCase()}`}
        right={<Icon name="share" size={16} color={theme.text2} />}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}>
        {/* Author */}
        <View style={styles.author}>
          {displayAvatarUrl || displayName ? (
            <Avatar
              user={{
                id: 'ticket-author',
                name: displayName ?? '?',
                handle: displayName ?? '',
                avatarHue: 200,
                level: 1,
                streak: 0,
                friend: false,
                wins: 0,
                losses: 0,
                tickets: 0,
                hitRate: 0,
              }}
              size={42}
            />
          ) : null}
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: theme.text }]}>{displayName ?? '—'}</Text>
            {past ? (
              <Text style={[styles.handle, { color: theme.text3 }]}>
                @{USERS.u1?.handle} · LVL {USERS.u1?.level} · {USERS.u1?.hitRate}% HIT RATE
              </Text>
            ) : displayName ? (
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

        {/* Comments inline */}
        <View style={[styles.commentSection, { borderTopColor: theme.lineSoft }]}>
          <Text style={[styles.commentTitle, { color: theme.text }]}>
            Comments{' '}
            <Text style={{ color: theme.text3, fontFamily: Fonts.monoMedium, fontSize: 12 }}>
              {comments.length}
            </Text>
          </Text>
          {comments.length === 0 ? (
            <Text style={[styles.commentEmpty, { color: theme.text3 }]}>
              {postId ? 'No comments yet. Start the conversation.' : "Comments aren't available on this slip."}
            </Text>
          ) : (
            comments.map((c2) => {
              const cu = USERS[c2.userId];
              return (
                <View key={c2.id} style={styles.commentRow}>
                  {cu ? <Avatar user={cu} size={32} /> : null}
                  <View style={{ flex: 1 }}>
                    <View style={styles.commentHead}>
                      <Text style={{ color: theme.text, fontFamily: Fonts.dispBold, fontSize: 13 }}>
                        {cu?.name}
                      </Text>
                      <Text style={{ color: theme.text3, fontFamily: Fonts.monoRegular, fontSize: 10 }}>
                        {c2.time}
                      </Text>
                    </View>
                    <Text style={{ color: theme.text, fontFamily: Fonts.uiRegular, fontSize: 13, marginTop: 2 }}>
                      {c2.text}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
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
  commentSection: {
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  commentTitle: {
    fontFamily: Fonts.dispBold,
    fontSize: 14,
    marginBottom: 12,
  },
  commentEmpty: {
    paddingVertical: 24,
    textAlign: 'center',
    fontFamily: Fonts.uiRegular,
    fontSize: 13,
  },
  commentRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
  },
  commentHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },
});
