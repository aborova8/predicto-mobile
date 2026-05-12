import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/atoms/Icon';
import { useEntitlements } from '@/hooks/useEntitlements';
import { withAlpha } from '@/lib/colors';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';

type ProHintVariant = 'tip' | 'inline' | 'card';

interface ProHintProps {
  variant: ProHintVariant;
  // Override default copy if a screen wants a more specific hint.
  title?: string;
  subtitle?: string;
  style?: object;
}

// Soft subscription nudge — renders only for users without an active Pro
// subscription. Keeps the visual weight low across feed/predict/profile so
// the upgrade path stays discoverable without being pushy.
export function ProHint({ variant, title, subtitle, style }: ProHintProps) {
  const theme = useTheme();
  const router = useRouter();
  const { hasActiveSub } = useEntitlements();

  if (hasActiveSub) return null;

  const onPress = () => router.push('/paywall');

  if (variant === 'inline') {
    return (
      <Pressable onPress={onPress} hitSlop={6} style={style}>
        <Text style={[styles.inlineTxt, { color: theme.text2 }]}>
          {title ?? 'Unlimited with Pro'} <Text style={{ color: theme.neon }}>→</Text>
        </Text>
      </Pressable>
    );
  }

  if (variant === 'tip') {
    return (
      <Pressable
        onPress={onPress}
        style={[
          styles.tip,
          {
            backgroundColor: theme.surface,
            borderColor: withAlpha(theme.neon, 0.35),
          },
          style,
        ]}
      >
        <View style={[styles.tipGlyph, { backgroundColor: theme.neonDim }]}>
          <Icon name="star" size={12} color={theme.neon} />
        </View>
        <Text style={[styles.tipTxt, { color: theme.text }]} numberOfLines={1}>
          {title ?? 'Go Pro'}
          <Text style={{ color: theme.text3 }}> · {subtitle ?? 'Unlimited slips, no ads'}</Text>
        </Text>
        <Text style={[styles.tipArrow, { color: theme.neon }]}>→</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: withAlpha(theme.neon, 0.35),
        },
        style,
      ]}
    >
      <View style={[styles.cardGlyph, { backgroundColor: theme.neonDim }]}>
        <Icon name="star" size={16} color={theme.neon} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>
          {title ?? 'Predicto Pro'}
        </Text>
        <Text style={[styles.cardSub, { color: theme.text2 }]} numberOfLines={1}>
          {subtitle ?? 'Unlimited tickets · private groups · no ads'}
        </Text>
      </View>
      <Text style={[styles.cardArrow, { color: theme.neon }]}>→</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  inlineTxt: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    letterSpacing: 0.5,
    marginTop: 4,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  tipGlyph: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTxt: {
    flex: 1,
    fontFamily: Fonts.dispBold,
    fontSize: 12,
    letterSpacing: -0.1,
  },
  tipArrow: {
    fontFamily: Fonts.dispBold,
    fontSize: 14,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 14,
  },
  cardGlyph: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: Fonts.dispBold,
    fontSize: 14,
    letterSpacing: -0.2,
  },
  cardSub: {
    fontFamily: Fonts.monoRegular,
    fontSize: 11,
    marginTop: 2,
  },
  cardArrow: {
    fontFamily: Fonts.dispBold,
    fontSize: 16,
  },
});
