import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';

interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, action, onAction }: SectionHeaderProps) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.title, { color: theme.text2 }]}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction}>
          <Text style={[styles.action, { color: theme.neon }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  title: {
    fontFamily: Fonts.dispBold,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  action: {
    fontFamily: Fonts.monoSemi,
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
