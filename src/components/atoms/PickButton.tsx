import { Pressable, StyleSheet, Text } from 'react-native';

import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';

interface PickButtonProps {
  pick: '1' | 'X' | '2';
  odds: number;
  selected?: boolean;
  onPress?: () => void;
  locked?: boolean;
  won?: boolean | null;
}

export function PickButton({ pick, odds, selected, onPress, locked = false, won = null }: PickButtonProps) {
  const theme = useTheme();
  const bg = won === true
    ? theme.win
    : won === false
      ? 'transparent'
      : selected
        ? theme.neon
        : 'transparent';
  const fg = won === true
    ? '#06091A'
    : won === false
      ? theme.text3
      : selected
        ? '#06091A'
        : theme.text;
  const border = won === true
    ? theme.win
    : selected
      ? theme.neon
      : theme.line;

  return (
    <Pressable
      onPress={locked ? undefined : onPress}
      disabled={locked}
      style={[
        styles.btn,
        {
          backgroundColor: bg,
          borderColor: border,
        },
      ]}
    >
      <Text style={[styles.pick, { color: fg }]}>{pick}</Text>
      <Text style={[styles.odds, { color: fg }]}>{odds.toFixed(2)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pick: {
    fontFamily: Fonts.monoBold,
    fontSize: 13,
  },
  odds: {
    fontFamily: Fonts.monoRegular,
    fontSize: 10,
    opacity: 0.7,
    marginTop: 1,
  },
});
