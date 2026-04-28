import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeContext';
import { Icon, type IconName } from './Icon';

interface IconButtonProps {
  name: IconName;
  onPress?: () => void;
  size?: number;
  iconSize?: number;
  color?: string;
  badge?: boolean;
  style?: ViewStyle;
}

export function IconButton({
  name,
  onPress,
  size = 36,
  iconSize = 18,
  color,
  badge = false,
  style,
}: IconButtonProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={[
        styles.btn,
        {
          width: size,
          height: size,
          backgroundColor: theme.surface,
          borderColor: theme.line,
        },
        style,
      ]}
    >
      <Icon name={name} size={iconSize} color={color ?? theme.text2} />
      {badge ? (
        <View style={[styles.dot, { backgroundColor: theme.neon, borderColor: theme.bg }]} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
});
