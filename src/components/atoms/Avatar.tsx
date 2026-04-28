import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { avatarGradient } from '@/lib/colors';
import { Fonts } from '@/theme/fonts';
import type { User } from '@/types/domain';

interface AvatarProps {
  user: User | null | undefined;
  size?: number;
  ring?: boolean;
  style?: ViewStyle;
}

export function Avatar({ user, size = 36, ring = false, style }: AvatarProps) {
  if (!user) return null;
  const initials = user.name.split(' ').map((n) => n[0]).slice(0, 2).join('');
  const [c1, c2] = avatarGradient(user.avatarHue);

  const dim: ViewStyle = { width: size, height: size, borderRadius: size / 2 };
  const ringWrap: ViewStyle | null = ring
    ? {
        padding: 2,
        borderRadius: size / 2 + 4,
        backgroundColor: '#EAFE3D',
      }
    : null;

  const inner = (
    <LinearGradient
      colors={[c1, c2]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, dim]}
    >
      <Text
        style={{
          color: '#fff',
          fontFamily: Fonts.dispBold,
          fontSize: size * 0.36,
          letterSpacing: -0.5,
        }}
      >
        {initials}
      </Text>
    </LinearGradient>
  );

  if (ring) {
    return (
      <View style={[ringWrap!, style]}>
        <View style={{ borderRadius: size / 2, padding: 1.5, backgroundColor: '#06091A' }}>
          {inner}
        </View>
      </View>
    );
  }
  return <View style={style}>{inner}</View>;
}

const styles = StyleSheet.create({
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
