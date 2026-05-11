import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MatchRow } from '@/components/MatchRow';
import { Pill } from '@/components/atoms/Pill';
import { useEligibility } from '@/hooks/useEligibility';
import { useMatches } from '@/hooks/useMatches';
import { useNow } from '@/hooks/useNow';
import { partitionPicksByKickoff, startedPicksBanner } from '@/lib/picks';
import { useAppState } from '@/state/AppStateContext';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';
import type { Fixture } from '@/types/domain';

export default function MatchesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { picks, setPick, pickCount } = useAppState();
  const { byDay, days, loading, error, refetch, lastFetchedAt } = useMatches();
  const {
    data: eligibility,
    ticketsLeft,
    refetch: refetchEligibility,
  } = useEligibility();

  // Ticks every 30s so a fixture whose kickoff just passed disappears from the
  // list without requiring the user to pull-to-refresh. The matching effect
  // below also clears any picks for those now-stale matches so the slip stays
  // submittable.
  const now = useNow(30_000);
  const nowMs = now.getTime();
  const [day, setDay] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [staleNotice, setStaleNotice] = useState<string | null>(null);

  useEffect(() => {
    setDay((prev) => {
      if (days.length === 0) return null;
      if (prev !== null && days.some((d) => d.index === prev)) return prev;
      return days[0].index;
    });
  }, [days]);

  // Auto-clear picks once their match kicks off so the slip never holds an
  // unsubmittable pick. Banner surfaces the removal — backend would reject
  // these on Lock-in anyway, this just avoids the confusing 400.
  useEffect(() => {
    const { startedFixtures } = partitionPicksByKickoff(picks, new Date(nowMs));
    if (startedFixtures.length === 0) return;
    for (const f of startedFixtures) setPick(f.id, null);
    setStaleNotice(startedPicksBanner(startedFixtures));
  }, [nowMs, picks, setPick]);

  useEffect(() => {
    if (!staleNotice) return;
    const id = setTimeout(() => setStaleNotice(null), 4000);
    return () => clearTimeout(id);
  }, [staleNotice]);

  // Refetch eligibility whenever the screen regains focus (e.g., returning
  // from /review after a successful submit).
  useFocusEffect(
    useCallback(() => {
      void refetchEligibility();
    }, [refetchEligibility]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetch(), refetchEligibility()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetch, refetchEligibility]);

  // Filter out fixtures whose kickoff has already passed before grouping.
  // `useMatches` only refetches on tab focus + 5-min staleness; without this
  // client-side gate, a user sitting on the screen past kickoff would still
  // see (and be able to tap) a started match.
  const groupedRaw = day != null ? (byDay[day] ?? {}) : {};
  const grouped: Record<string, Fixture[]> = {};
  for (const [league, list] of Object.entries(groupedRaw)) {
    const open = list.filter((f) => new Date(f.kickoffAt).getTime() > nowMs);
    if (open.length > 0) grouped[league] = open;
  }
  const showLoading = loading && days.length === 0;
  const canCreateTicket = eligibility?.canCreateTicket ?? false;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: theme.text }]}>Build your slip</Text>
          <Pill color={ticketsLeft > 0 ? theme.neon : theme.loss} size="md">
            {eligibility?.unlimitedTickets
              ? 'UNLIMITED'
              : `${ticketsLeft} TICKET${ticketsLeft === 1 ? '' : 'S'} LEFT`}
          </Pill>
        </View>
        <Text style={[styles.sub, { color: theme.text2 }]}>
          Pick 1 (home), X (draw) or 2 (away). Stack them up.
        </Text>
        {lastFetchedAt ? (
          <Text style={[styles.updatedAt, { color: theme.text3 }]}>
            UPDATED {lastFetchedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        ) : null}
        {staleNotice ? (
          <View
            style={[
              styles.staleBanner,
              { backgroundColor: theme.surface, borderColor: theme.loss },
            ]}
          >
            <Text style={[styles.staleBannerText, { color: theme.text }]} numberOfLines={2}>
              {staleNotice}
            </Text>
          </View>
        ) : null}
      </View>

      {days.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.daysRow, { borderBottomColor: theme.lineSoft }]}
          contentContainerStyle={styles.daysRowContent}
        >
          {days.map((d) => {
            const active = d.index === day;
            return (
              <Pressable
                key={d.index}
                onPress={() => setDay(d.index)}
                style={[
                  styles.dayBtn,
                  {
                    backgroundColor: active ? theme.surface : 'transparent',
                    borderColor: active ? theme.line : 'transparent',
                  },
                ]}
              >
                <Text style={[styles.dayLabel, { color: active ? theme.text : theme.text3 }]}>
                  {d.label.toUpperCase()}
                </Text>
                <Text style={[styles.dayCount, { color: theme.text3 }]}>{d.count}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 200 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.text2}
          />
        }
      >
        {showLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={theme.neon} />
            <Text style={[styles.centerHint, { color: theme.text3 }]}>LOADING MATCHES…</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={[styles.errorTitle, { color: theme.text }]}>Couldn't load matches</Text>
            <Text style={[styles.errorMsg, { color: theme.text2 }]}>{error.message}</Text>
            <Pressable
              onPress={() => void refetch()}
              style={[styles.retry, { borderColor: theme.line, backgroundColor: theme.surface }]}
            >
              <Text style={[styles.retryTxt, { color: theme.text }]}>Try again</Text>
            </Pressable>
          </View>
        ) : days.length === 0 ? (
          <View style={styles.center}>
            <Text style={[styles.errorTitle, { color: theme.text }]}>
              No matches scheduled
            </Text>
            <Text style={[styles.errorMsg, { color: theme.text2 }]}>
              Check back soon — matches load 7 days ahead.
            </Text>
          </View>
        ) : Object.keys(grouped).length === 0 ? (
          <View style={styles.center}>
            <Text style={[styles.errorTitle, { color: theme.text }]}>
              All matches have kicked off
            </Text>
            <Text style={[styles.errorMsg, { color: theme.text2 }]}>
              Pick another day or pull to refresh.
            </Text>
          </View>
        ) : (
          Object.entries(grouped).map(([league, matches]) => (
            <View key={league} style={{ marginBottom: 18 }}>
              <Text style={[styles.leagueLabel, { color: theme.text3 }]}>
                {league.toUpperCase()}
              </Text>
              <View style={{ gap: 8 }}>
                {matches.map((m) => (
                  <MatchRow key={m.id} match={m} pick={picks[m.id] ?? null} onPick={setPick} />
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {pickCount > 0 ? (
        <View style={[styles.bottomBar, { bottom: 96 + insets.bottom }]}>
          <View
            style={[
              styles.bottomCard,
              { backgroundColor: theme.surface, borderColor: theme.line, shadowColor: '#000' },
            ]}
          >
            <View style={[styles.countBadge, { backgroundColor: theme.neon }]}>
              <Text style={styles.countTxt}>{pickCount}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.bottomTitle, { color: theme.text }]}>
                {pickCount} pick{pickCount > 1 ? 's' : ''} on your slip
              </Text>
              <Text style={[styles.bottomSub, { color: theme.text2 }]}>
                {canCreateTicket ? 'Ready when you are' : 'Out of tickets'}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push(canCreateTicket ? '/review' : '/paywall')}
              style={[styles.cta, { backgroundColor: theme.neon }]}
            >
              <Text style={styles.ctaTxt}>{canCreateTicket ? 'Review' : 'Get ticket'} →</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: Fonts.dispBlack,
    fontSize: 24,
    letterSpacing: -0.4,
  },
  sub: {
    fontFamily: Fonts.uiRegular,
    fontSize: 13,
    marginTop: 4,
  },
  updatedAt: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 0.6,
    marginTop: 6,
  },
  staleBanner: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 8,
  },
  staleBannerText: {
    fontFamily: Fonts.uiRegular,
    fontSize: 12,
  },
  daysRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexGrow: 0,
  },
  daysRowContent: {
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dayBtn: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
  },
  dayLabel: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    letterSpacing: 0.4,
  },
  dayCount: {
    fontFamily: Fonts.monoRegular,
    fontSize: 11,
  },
  leagueLabel: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 8,
    paddingLeft: 2,
  },
  center: {
    paddingTop: 80,
    alignItems: 'center',
    gap: 10,
  },
  centerHint: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 0.6,
    marginTop: 6,
  },
  errorTitle: {
    fontFamily: Fonts.dispBold,
    fontSize: 16,
  },
  errorMsg: {
    fontFamily: Fonts.uiRegular,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retry: {
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  retryTxt: {
    fontFamily: Fonts.dispBold,
    fontSize: 13,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 12,
  },
  bottomCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 28,
    elevation: 10,
  },
  countBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countTxt: {
    fontFamily: Fonts.dispBlack,
    color: '#06091A',
    fontSize: 16,
  },
  bottomTitle: {
    fontFamily: Fonts.dispBold,
    fontSize: 13,
  },
  bottomSub: {
    fontFamily: Fonts.monoMedium,
    fontSize: 11,
    marginTop: 1,
  },
  cta: {
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  ctaTxt: {
    fontFamily: Fonts.dispBold,
    color: '#06091A',
    fontSize: 13,
  },
});
