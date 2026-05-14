import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/atoms/Icon';
import { NeonButton } from '@/components/atoms/NeonButton';
import { BottomSheet } from '@/components/sheets/BottomSheet';
import { Ticket } from '@/components/ticket/Ticket';
import { useGroups } from '@/hooks/useGroups';
import { useNow } from '@/hooks/useNow';
import { withAlpha } from '@/lib/colors';
import { errorMessage } from '@/lib/api';
import { calculateTotalOdds, fmtOdds } from '@/lib/format';
import { partitionPicksByKickoff, startedPicksBanner } from '@/lib/picks';
import { useAppState } from '@/state/AppStateContext';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';
import type { Ticket as TicketModel } from '@/types/domain';

export default function ReviewScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { picks, setPick, submitTicket, slipContext, setSlipContext } = useAppState();
  const mineQ = useGroups({ scope: 'mine' });
  const [submitting, setSubmitting] = useState(false);
  const [staleNotice, setStaleNotice] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  // Same 30s tick as MatchesScreen so a match kicking off while the user is
  // here triggers identical auto-removal + banner behaviour.
  const now = useNow(30_000);

  const { fresh, startedFixtures } = partitionPicksByKickoff(picks, now);
  const legs = fresh.map(([matchId, pick]) => ({ matchId, pick }));
  const startedKey = startedFixtures.map((f) => f.id).join(',');

  useEffect(() => {
    if (startedFixtures.length === 0) return;
    for (const f of startedFixtures) setPick(f.id, null);
    setStaleNotice(startedPicksBanner(startedFixtures));
    // Effect fires once per tick that produces a new stale set; depending on
    // the array reference itself would re-fire every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startedKey, setPick]);

  useEffect(() => {
    if (!staleNotice) return;
    const id = setTimeout(() => setStaleNotice(null), 4000);
    return () => clearTimeout(id);
  }, [staleNotice]);

  const totalOdds = calculateTotalOdds(legs);
  const BASE = 10;
  const potential = Math.round(BASE * totalOdds);
  const ticket: TicketModel = { id: 'new', status: 'pending', potential, legs };
  const canSubmit = legs.length > 0 && !submitting;

  // A group the user no longer belongs to (kicked, left, deleted) shouldn't
  // be allowed to stay selected — drop the context back to Global so the
  // backend doesn't 403 on submit. Dependency keyed on the membership id-set
  // (not the array reference) so background refetches that return identical
  // membership don't fire this effect.
  const membershipKey = mineQ.groups.map((g) => g.id).join(',');
  useEffect(() => {
    if (slipContext.kind !== 'group') return;
    if (mineQ.loading) return;
    const stillMember = membershipKey.split(',').includes(slipContext.groupId);
    if (!stillMember) setSlipContext({ kind: 'global' });
  }, [slipContext, membershipKey, mineQ.loading, setSlipContext]);

  const contextLabel =
    slipContext.kind === 'group' ? slipContext.groupName : 'Global feed';
  const hasGroups = mineQ.groups.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await submitTicket();
      router.dismissAll();
      router.replace('/(tabs)');
    } catch (err) {
      Alert.alert('Could not lock slip', errorMessage(err, 'Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet title="Review your slip">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}>
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

        <Pressable
          onPress={() => hasGroups && setPickerOpen((v) => !v)}
          disabled={!hasGroups}
          style={[
            styles.contextRow,
            { backgroundColor: theme.surface, borderColor: theme.line },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.contextLabel, { color: theme.text3 }]}>SUBMITTING TO</Text>
            <Text style={[styles.contextValue, { color: theme.text }]} numberOfLines={1}>
              {contextLabel}
            </Text>
          </View>
          {hasGroups ? (
            <View style={{ transform: [{ rotate: pickerOpen ? '90deg' : '0deg' }] }}>
              <Icon name="chevron" size={16} color={theme.text3} />
            </View>
          ) : null}
        </Pressable>

        {pickerOpen && hasGroups ? (
          <View
            style={[
              styles.pickerPanel,
              { backgroundColor: theme.surface, borderColor: theme.line },
            ]}
          >
            <Pressable
              onPress={() => {
                setSlipContext({ kind: 'global' });
                setPickerOpen(false);
              }}
              style={[styles.pickerRow, { borderBottomColor: theme.lineSoft }]}
            >
              <Text style={[styles.pickerRowLabel, { color: theme.text }]}>Global feed</Text>
              {slipContext.kind === 'global' ? (
                <View style={[styles.dot, { backgroundColor: theme.neon }]} />
              ) : null}
            </Pressable>
            {mineQ.groups.map((g, i) => {
              const selected =
                slipContext.kind === 'group' && slipContext.groupId === g.id;
              const isLast = i === mineQ.groups.length - 1;
              return (
                <Pressable
                  key={g.id}
                  onPress={() => {
                    setSlipContext({ kind: 'group', groupId: g.id, groupName: g.name });
                    setPickerOpen(false);
                  }}
                  style={[
                    styles.pickerRow,
                    { borderBottomColor: isLast ? 'transparent' : theme.lineSoft },
                  ]}
                >
                  <Text style={[styles.pickerRowLabel, { color: theme.text }]} numberOfLines={1}>
                    {g.name}
                  </Text>
                  {selected ? (
                    <View style={[styles.dot, { backgroundColor: theme.neon }]} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {legs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No picks to lock in
            </Text>
            <Text style={[styles.emptyBody, { color: theme.text2 }]}>
              All your picks have already kicked off. Head back and pick fresh matches.
            </Text>
          </View>
        ) : (
          <Ticket ticket={ticket} />
        )}

        <View
          style={[
            styles.note,
            { backgroundColor: theme.neonDim, borderColor: withAlpha(theme.neon, 0.2) },
          ]}
        >
          <Text style={[styles.noteLabel, { color: theme.neon }]}>HOW POINTS WORK</Text>
          <Text style={[styles.noteBody, { color: theme.text2 }]}>
            Every slip starts with{' '}
            <Text style={{ color: theme.text, fontFamily: Fonts.uiBold }}>10 base points</Text>. Hit
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
        {(() => {
          const mode = submitting ? 'submitting' : legs.length === 0 ? 'empty' : 'ready';
          const cta = {
            submitting: { label: 'Locking…', icon: <ActivityIndicator size="small" color="#06091A" /> },
            empty: { label: 'Back to matches', icon: <Icon name="chevronL" size={16} color="#06091A" stroke={2.4} /> },
            ready: { label: 'Lock in slip', icon: <Icon name="lock" size={16} color="#06091A" stroke={2.4} /> },
          }[mode];
          return (
            <NeonButton
              onPress={mode === 'empty' ? () => router.back() : handleSubmit}
              disabled={submitting}
              iconLeft={cta.icon}
            >
              {cta.label}
            </NeonButton>
          );
        })()}
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
  staleBanner: {
    marginBottom: 10,
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderRadius: 10,
  },
  staleBannerText: {
    fontFamily: Fonts.uiRegular,
    fontSize: 12,
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 10,
  },
  contextLabel: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  contextValue: {
    fontFamily: Fonts.dispBold,
    fontSize: 15,
  },
  pickerPanel: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerRowLabel: {
    flex: 1,
    fontFamily: Fonts.uiMedium,
    fontSize: 14,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  emptyState: {
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontFamily: Fonts.dispBold,
    fontSize: 16,
  },
  emptyBody: {
    fontFamily: Fonts.uiRegular,
    fontSize: 13,
    textAlign: 'center',
  },
});
