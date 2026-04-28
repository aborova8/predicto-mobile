import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/atoms/Icon';
import { NeonButton } from '@/components/atoms/NeonButton';
import { Pill } from '@/components/atoms/Pill';
import { BottomSheet } from '@/components/sheets/BottomSheet';
import { useAppState } from '@/state/AppStateContext';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';

const PACKS = [
  { id: 'pack1', label: '1 Ticket', sub: 'One-shot', price: '$0.99', n: 1 },
  { id: 'pack5', label: '5 Tickets', sub: 'Most popular', price: '$3.99', save: 'Save 20%', n: 5 },
  { id: 'pack20', label: '20 Tickets', sub: 'Big run', price: '$12.99', save: 'Save 35%', n: 20 },
  {
    id: 'pro',
    label: 'Predicto Pro',
    sub: 'Unlimited tickets · Private groups · No ads',
    price: '$7.99/mo',
    tag: 'PRO',
    n: 999,
  },
];

export default function PaywallScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { buyTickets } = useAppState();
  const [selected, setSelected] = useState('pack5');

  const onPurchase = () => {
    const pack = PACKS.find((p) => p.id === selected);
    if (pack) buyTickets(pack.n);
    router.back();
  };

  return (
    <BottomSheet showHandle={false} title={<Pill color={theme.neon}>OUT OF TICKETS</Pill>}>
      <View style={{ paddingHorizontal: 20, paddingBottom: 28 }}>
        <Text style={[styles.h2, { color: theme.text }]}>Want more action?</Text>
        <Text style={[styles.sub, { color: theme.text2 }]}>
          You get one free slip a day. Stack more to chase your edge.
        </Text>

        <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ gap: 8 }}>
          {PACKS.map((p) => {
            const sel = selected === p.id;
            return (
              <Pressable
                key={p.id}
                onPress={() => setSelected(p.id)}
                style={[
                  styles.pack,
                  {
                    backgroundColor: sel ? theme.neonDim : theme.surface,
                    borderColor: sel ? theme.neon : theme.line,
                  },
                ]}
              >
                <View
                  style={[
                    styles.radio,
                    {
                      borderColor: sel ? theme.neon : theme.line,
                      backgroundColor: sel ? theme.neon : 'transparent',
                    },
                  ]}
                >
                  {sel ? <Icon name="check" size={14} color="#06091A" stroke={3} /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.packTitleRow}>
                    <Text style={[styles.packLabel, { color: theme.text }]}>{p.label}</Text>
                    {p.tag ? <Pill color={theme.neon}>{p.tag}</Pill> : null}
                    {p.save ? (
                      <Text style={{ color: theme.win, fontFamily: Fonts.monoBold, fontSize: 10 }}>
                        {p.save}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={[styles.packSub, { color: theme.text2 }]}>{p.sub}</Text>
                </View>
                <Text style={[styles.packPrice, { color: theme.text }]}>{p.price}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ marginTop: 16 }}>
          <NeonButton onPress={onPurchase}>
            {selected === 'pro' ? 'Subscribe' : 'Buy now'} →
          </NeonButton>
        </View>
        <Text style={[styles.hint, { color: theme.text3 }]}>
          PURCHASES VIA APP STORE · CANCEL ANYTIME
        </Text>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  h2: {
    fontFamily: Fonts.dispBlack,
    fontSize: 26,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  sub: {
    fontFamily: Fonts.uiRegular,
    fontSize: 13.5,
    marginBottom: 18,
  },
  pack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderRadius: 12,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  packLabel: {
    fontFamily: Fonts.dispBold,
    fontSize: 14,
  },
  packSub: {
    fontFamily: Fonts.monoRegular,
    fontSize: 11,
    marginTop: 2,
  },
  packPrice: {
    fontFamily: Fonts.dispBlack,
    fontSize: 16,
  },
  hint: {
    textAlign: 'center',
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 0.4,
    marginTop: 10,
  },
});
