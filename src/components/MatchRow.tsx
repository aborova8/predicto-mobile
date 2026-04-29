import { StyleSheet, Text, View } from 'react-native';

import { Crest } from '@/components/atoms/Crest';
import { PickButton } from '@/components/atoms/PickButton';
import { Pill } from '@/components/atoms/Pill';
import { TEAMS } from '@/data/teams';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';
import type { Fixture, Pick } from '@/types/domain';

interface MatchRowProps {
  match: Fixture;
  pick: Pick | null | undefined;
  onPick: (matchId: string, pick: Pick | null) => void;
  locked?: boolean;
}

export function MatchRow({ match, pick, onPick, locked }: MatchRowProps) {
  const theme = useTheme();
  const homeName = match.homeName ?? TEAMS[match.home]?.name ?? match.home;
  const awayName = match.awayName ?? TEAMS[match.away]?.name ?? match.away;

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: theme.surface,
          borderColor: pick ? theme.neon : theme.line,
        },
      ]}
    >
      <View style={styles.head}>
        <Pill>{match.league}</Pill>
        <Text style={[styles.kickoff, { color: theme.text3 }]}>{match.kickoff.toUpperCase()}</Text>
      </View>
      <View style={styles.mid}>
        <Crest team={match.home} size={26} />
        <Text style={[styles.teams, { color: theme.text }]} numberOfLines={1}>
          {homeName} <Text style={{ color: theme.text3, fontFamily: Fonts.dispMedium }}>vs</Text> {awayName}
        </Text>
        <Crest team={match.away} size={26} />
      </View>
      <View style={styles.picks}>
        {(['1', 'X', '2'] as const).map((p) => (
          <PickButton
            key={p}
            pick={p}
            odds={match.odds[p]}
            selected={pick === p}
            locked={locked}
            onPress={() => onPick(match.id, pick === p ? null : p)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 11,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 9,
  },
  kickoff: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 0.4,
  },
  mid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  teams: {
    flex: 1,
    fontFamily: Fonts.dispBold,
    fontSize: 14,
  },
  picks: {
    flexDirection: 'row',
    gap: 6,
  },
});
