import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/nav/ScreenHeader';
import { PAST_PREDICTIONS } from '@/data/leaderboard';
import { withAlpha } from '@/lib/colors';
import { multiplyOdds } from '@/lib/format';
import { legStatusColor, statusGlyph, ticketStatusColor } from '@/lib/status';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';

export default function PredictionDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const p = PAST_PREDICTIONS.find((x) => x.id === id);

  if (!p) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <ScreenHeader title="Slip detail" />
        <Text style={{ textAlign: 'center', marginTop: 80, color: theme.text, fontFamily: Fonts.dispBold }}>
          Not found
        </Text>
      </View>
    );
  }

  const legs = PAST_PREDICTIONS.filter((x) => x.ticketId === p.ticketId);
  const totalOdds = multiplyOdds(legs.map((l) => l.odds));
  const status: 'won' | 'lost' | 'pending' = legs.every((l) => l.status === 'won')
    ? 'won'
    : legs.some((l) => l.status === 'lost')
      ? 'lost'
      : 'pending';
  const points = status === 'won' ? Math.round(100 * totalOdds) : 0;
  const c = ticketStatusColor(theme, status);
  const wonLegs = legs.filter((l) => l.status === 'won').length;
  const avgOdds = legs.reduce((a, l) => a + l.odds, 0) / legs.length;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScreenHeader title="Slip detail" />
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <LinearGradient
            colors={[withAlpha(c, 0.13), 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.hero, { borderColor: withAlpha(c, 0.33) }]}
          >
            <View style={styles.heroTop}>
              <View>
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: withAlpha(c, 0.13), borderColor: withAlpha(c, 0.33) },
                  ]}
                >
                  <Text style={{ color: c, fontFamily: Fonts.monoBlack, fontSize: 10, letterSpacing: 0.6 }}>
                    {status === 'won' ? '✓ WON' : status === 'lost' ? '✕ LOST' : '◐ PENDING'}
                  </Text>
                </View>
                <Text style={[styles.heroPts, { color: theme.text }]}>
                  {status === 'won'
                    ? `+${points} pts`
                    : status === 'lost'
                      ? '0 pts'
                      : `${Math.round(100 * totalOdds)} pts`}
                </Text>
                <Text style={[styles.heroMeta, { color: theme.text3 }]}>
                  {p.date.toUpperCase()} · {legs.length}-LEG SLIP
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.heroLabel, { color: theme.text3 }]}>MULTIPLIER</Text>
                <Text style={[styles.heroMult, { color: theme.neon }]}>{totalOdds.toFixed(2)}×</Text>
              </View>
            </View>
            <View style={[styles.statsRow, { borderTopColor: theme.line }]}>
              <Stat label="Legs" value={`${legs.length}`} />
              <Stat label="Hit" value={`${wonLegs}/${legs.length}`} />
              <Stat label="Avg odds" value={`${avgOdds.toFixed(2)}×`} />
            </View>
          </LinearGradient>
        </View>

        <Text style={[styles.section, { color: theme.text3 }]}>{legs.length} PICKS</Text>
        <View style={{ paddingHorizontal: 16 }}>
          <View
            style={[
              styles.legsCard,
              { backgroundColor: theme.surface, borderColor: theme.line },
            ]}
          >
            {legs.map((l, i) => {
              const lc = legStatusColor(theme, l.status);
              const pickLabel = l.pick === '1' ? l.home : l.pick === '2' ? l.away : 'DRAW';
              const highlight = l.id === p.id;
              return (
                <View
                  key={l.id}
                  style={[
                    styles.legRow,
                    i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.lineSoft },
                    highlight && { backgroundColor: withAlpha(theme.neon, 0.08) },
                  ]}
                >
                  {highlight ? (
                    <View
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 8,
                        bottom: 8,
                        width: 3,
                        backgroundColor: theme.neon,
                        borderRadius: 2,
                      }}
                    />
                  ) : null}
                  <View
                    style={[
                      styles.legGlyph,
                      { backgroundColor: withAlpha(lc, 0.13), borderColor: withAlpha(lc, 0.33) },
                    ]}
                  >
                    <Text style={{ color: lc, fontFamily: Fonts.monoBlack, fontSize: 12 }}>
                      {statusGlyph(l.status)}
                    </Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.legTeams, { color: theme.text }]} numberOfLines={1}>
                      {l.home}{' '}
                      <Text style={{ color: theme.text3 }}>vs</Text>{' '}
                      {l.away}{' '}
                      <Text style={{ color: theme.text3, fontFamily: Fonts.monoMedium, fontSize: 9 }}>
                        {l.league.toUpperCase()}
                      </Text>
                    </Text>
                    <View style={styles.legPickLine}>
                      <View style={[styles.pickBox, { backgroundColor: theme.surface2 }]}>
                        <Text style={{ color: theme.text2, fontFamily: Fonts.monoBold, fontSize: 11 }}>
                          {l.pick}
                        </Text>
                      </View>
                      <Text style={{ color: theme.text2, fontFamily: Fonts.monoSemi, fontSize: 11 }}>
                        {pickLabel}
                      </Text>
                      <Text style={{ color: theme.text3, fontSize: 11 }}>·</Text>
                      <Text style={{ color: theme.text3, fontFamily: Fonts.monoMedium, fontSize: 11 }}>
                        FT {l.result}
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.legOdds, { color: theme.text }]}>{l.odds.toFixed(2)}×</Text>
                    <Text style={[styles.legOddsLabel, { color: theme.text3 }]}>ODDS</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontFamily: Fonts.monoMedium, fontSize: 9, color: theme.text3, letterSpacing: 0.5 }}>
        {label.toUpperCase()}
      </Text>
      <Text style={{ fontFamily: Fonts.dispBlack, fontSize: 16, color: theme.text, marginTop: 2 }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 16,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  heroPts: {
    fontFamily: Fonts.dispBlack,
    fontSize: 28,
    letterSpacing: -0.5,
    marginTop: 8,
  },
  heroMeta: {
    fontFamily: Fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 0.5,
    marginTop: 4,
  },
  heroLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 0.6,
  },
  heroMult: {
    fontFamily: Fonts.dispBlack,
    fontSize: 22,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderStyle: 'dashed',
  },
  section: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 0.8,
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  legsCard: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  legRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    position: 'relative',
  },
  legGlyph: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legTeams: {
    fontFamily: Fonts.dispBold,
    fontSize: 13,
  },
  legPickLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  pickBox: {
    minWidth: 24,
    height: 18,
    paddingHorizontal: 6,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legOdds: {
    fontFamily: Fonts.dispBlack,
    fontSize: 14,
  },
  legOddsLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 0.5,
    marginTop: 2,
  },
});
