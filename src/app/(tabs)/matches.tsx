import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MatchRow } from '@/components/MatchRow';
import { Pill } from '@/components/atoms/Pill';
import { FIXTURES } from '@/data/fixtures';
import { useAppState } from '@/state/AppStateContext';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';
import type { Fixture } from '@/types/domain';

const FIXTURES_BY_DAY: Record<number, Fixture[]> = { 0: [], 1: [], 2: [] };
const GROUPED_BY_DAY: Record<number, Record<string, Fixture[]>> = { 0: {}, 1: {}, 2: {} };
for (const m of FIXTURES) {
  FIXTURES_BY_DAY[m.day].push(m);
  const dayGroups = GROUPED_BY_DAY[m.day];
  (dayGroups[m.league] ??= []).push(m);
}
const COUNTS = [FIXTURES_BY_DAY[0].length, FIXTURES_BY_DAY[1].length, FIXTURES_BY_DAY[2].length];
const DAY_LABELS = ['Today', 'Tomorrow', 'Sunday'];

export default function MatchesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { picks, setPick, ticketsLeft, pickCount } = useAppState();
  const [day, setDay] = useState(0);
  const grouped = GROUPED_BY_DAY[day];

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: theme.text }]}>Build your slip</Text>
          <Pill color={ticketsLeft > 0 ? theme.neon : theme.loss} size="md">
            {`${ticketsLeft} TICKET LEFT`}
          </Pill>
        </View>
        <Text style={[styles.sub, { color: theme.text2 }]}>
          Pick 1 (home), X (draw) or 2 (away). Stack them up.
        </Text>
      </View>

      <View style={[styles.daysRow, { borderBottomColor: theme.lineSoft }]}>
        {[0, 1, 2].map((d) => {
          const active = d === day;
          return (
            <Pressable
              key={d}
              onPress={() => setDay(d)}
              style={[
                styles.dayBtn,
                {
                  backgroundColor: active ? theme.surface : 'transparent',
                  borderColor: active ? theme.line : 'transparent',
                },
              ]}
            >
              <Text style={[styles.dayLabel, { color: active ? theme.text : theme.text3 }]}>
                {DAY_LABELS[d].toUpperCase()}
              </Text>
              <Text style={[styles.dayCount, { color: theme.text3 }]}>{COUNTS[d]}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 200 }}
      >
        {Object.entries(grouped).map(([league, matches]) => (
          <View key={league} style={{ marginBottom: 18 }}>
            <Text style={[styles.leagueLabel, { color: theme.text3 }]}>{league.toUpperCase()}</Text>
            <View style={{ gap: 8 }}>
              {matches.map((m) => (
                <MatchRow key={m.id} match={m} pick={picks[m.id] ?? null} onPick={setPick} />
              ))}
            </View>
          </View>
        ))}
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
                {ticketsLeft > 0 ? 'Ready when you are' : 'Buy a ticket to submit'}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push(ticketsLeft > 0 ? '/review' : '/paywall')}
              style={[styles.cta, { backgroundColor: theme.neon }]}
            >
              <Text style={styles.ctaTxt}>{ticketsLeft > 0 ? 'Review' : 'Get ticket'} →</Text>
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
  daysRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
