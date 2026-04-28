import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/atoms/Icon';
import { NeonButton } from '@/components/atoms/NeonButton';
import { BottomSheet } from '@/components/sheets/BottomSheet';
import { Ticket } from '@/components/ticket/Ticket';
import { withAlpha } from '@/lib/colors';
import { calculateTotalOdds, fmtOdds } from '@/lib/format';
import { useAppState } from '@/state/AppStateContext';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';
import type { Pick, Ticket as TicketModel } from '@/types/domain';

export default function ReviewScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { picks, submitSlip } = useAppState();

  const legs = Object.entries(picks)
    .filter((entry): entry is [string, Pick] => entry[1] !== null && entry[1] !== undefined)
    .map(([matchId, pick]) => ({ matchId, pick }));
  const totalOdds = calculateTotalOdds(legs);
  const BASE = 100;
  const potential = Math.round(BASE * totalOdds);
  const ticket: TicketModel = { id: 'new', status: 'pending', potential, legs };

  const handleSubmit = () => {
    submitSlip();
    router.dismissAll();
    router.replace('/(tabs)');
  };

  return (
    <BottomSheet title="Review your slip">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <Ticket ticket={ticket} />

        <View
          style={[
            styles.note,
            { backgroundColor: theme.neonDim, borderColor: withAlpha(theme.neon, 0.2) },
          ]}
        >
          <Text style={[styles.noteLabel, { color: theme.neon }]}>HOW POINTS WORK</Text>
          <Text style={[styles.noteBody, { color: theme.text2 }]}>
            Every slip starts with{' '}
            <Text style={{ color: theme.text, fontFamily: Fonts.uiBold }}>100 base points</Text>. Hit
            all picks to win the multiplied total — climb the leaderboard.
          </Text>
        </View>

        <View
          style={[
            styles.summary,
            { backgroundColor: theme.surface, borderColor: theme.line },
          ]}
        >
          <View style={styles.summaryRow}>
            <Text style={{ color: theme.text2, fontSize: 13, fontFamily: Fonts.uiRegular }}>
              Multiplier
            </Text>
            <Text style={{ color: theme.text, fontFamily: Fonts.monoBold, fontSize: 13 }}>
              {fmtOdds(totalOdds)}×
            </Text>
          </View>
          <View style={[styles.summaryRow, { alignItems: 'baseline' }]}>
            <Text style={{ color: theme.text2, fontSize: 13, fontFamily: Fonts.uiRegular }}>
              Points to win
            </Text>
            <Text style={{ color: theme.neon, fontFamily: Fonts.dispBlack, fontSize: 22, letterSpacing: -0.4 }}>
              {potential.toLocaleString()} pts
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        <NeonButton onPress={handleSubmit} iconLeft={<Icon name="lock" size={16} color="#06091A" stroke={2.4} />}>
          Lock in slip
        </NeonButton>
        <Text style={[styles.hint, { color: theme.text3 }]}>
          ONCE LOCKED, PICKS CAN'T BE EDITED
        </Text>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  note: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 10,
  },
  noteLabel: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  noteBody: {
    fontFamily: Fonts.uiRegular,
    fontSize: 12,
    lineHeight: 18,
  },
  summary: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  hint: {
    textAlign: 'center',
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 0.5,
    marginTop: 10,
  },
});
