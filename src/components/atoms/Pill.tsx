import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { withAlpha } from '@/lib/colors';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';

interface PillProps {
  children: string;
  color?: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function Pill({ children, color, size = 'sm', style }: PillProps) {
  const theme = useTheme();
  const sizes = {
    sm: { fs: 10, py: 3, px: 7 },
    md: { fs: 11, py: 4, px: 9 },
  };
  const s = sizes[size];

  const bg = color ? withAlpha(color, 0.13) : theme.lineSoft;
  const border = color ? withAlpha(color, 0.27) : theme.line;
  const fg = color ?? theme.text2;

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: bg,
          borderColor: border,
          paddingVertical: s.py,
          paddingHorizontal: s.px,
        },
        style,
      ]}
    >
      <Text style={[styles.txt, { color: fg, fontSize: s.fs }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
  },
  txt: {
    fontFamily: Fonts.monoSemi,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
