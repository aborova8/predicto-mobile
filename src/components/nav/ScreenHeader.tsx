import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/atoms/IconButton';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';

interface ScreenHeaderProps {
  title: string;
  right?: ReactNode;
  onBack?: () => void;
}

export function ScreenHeader({ title, right, onBack }: ScreenHeaderProps) {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: insets.top + 8,
          backgroundColor: theme.bg,
          borderBottomColor: theme.lineSoft,
        },
      ]}
    >
      <IconButton name="chevronL" onPress={onBack ?? (() => router.back())} />
      <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{title}</Text>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    flex: 1,
    fontFamily: Fonts.dispBlack,
    fontSize: 18,
    letterSpacing: -0.4,
  },
  right: {
    minWidth: 36,
    alignItems: 'flex-end',
  },
});
