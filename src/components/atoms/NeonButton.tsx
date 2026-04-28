import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';

interface NeonButtonProps {
  children: ReactNode;
  onPress?: () => void;
  full?: boolean;
  disabled?: boolean;
  secondary?: boolean;
  style?: ViewStyle;
  iconLeft?: ReactNode;
}

export function NeonButton({
  children,
  onPress,
  full = true,
  disabled = false,
  secondary = false,
  style,
  iconLeft,
}: NeonButtonProps) {
  const theme = useTheme();
  const bg = disabled
    ? theme.surface2
    : secondary
      ? 'transparent'
      : theme.neon;
  const fg = disabled ? theme.text3 : secondary ? theme.text : '#06091A';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.btn,
        {
          backgroundColor: bg,
          borderWidth: secondary ? 1 : 0,
          borderColor: theme.line,
          width: full ? '100%' : undefined,
          shadowColor: !disabled && !secondary ? theme.neon : 'transparent',
        },
        style,
      ]}
    >
      {iconLeft ? <View style={{ marginRight: 8 }}>{iconLeft}</View> : null}
      <Text style={[styles.label, { color: fg }]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 0,
  },
  label: {
    fontFamily: Fonts.dispBold,
    fontSize: 15,
    letterSpacing: 0.2,
  },
});
