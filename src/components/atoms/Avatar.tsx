import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Image, StyleSheet, Text, View, type ImageStyle, type ViewStyle } from 'react-native';

import { avatarGradient } from '@/lib/colors';
import { Fonts } from '@/theme/fonts';
import type { User } from '@/types/domain';

interface AvatarProps {
  user?: User | null;
  // Backend-driven authors don't carry a User shape — pass the raw fields.
  author?: { username: string; avatarUrl: string | null } | null;
  size?: number;
  ring?: boolean;
  style?: ViewStyle;
}

function hueFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || parts[0].length === 0) return '?';
  return parts.map((n) => n[0] ?? '').slice(0, 2).join('').toUpperCase();
}

export function Avatar({ user, author, size = 36, ring = false, style }: AvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);
  if (!user && !author) return null;

  const dim: ViewStyle = { width: size, height: size, borderRadius: size / 2 };
  const ringWrap: ViewStyle | null = ring
    ? {
        padding: 2,
        borderRadius: size / 2 + 4,
        backgroundColor: '#EAFE3D',
      }
    : null;

  let inner: React.ReactNode;
  if (author?.avatarUrl && !imgFailed) {
    const imgDim: ImageStyle = { width: size, height: size, borderRadius: size / 2 };
    inner = (
      <Image
        source={{ uri: author.avatarUrl }}
        style={[styles.image, imgDim]}
        accessibilityLabel={author.username}
        onError={() => setImgFailed(true)}
      />
    );
  } else {
    const name = user?.name ?? author?.username ?? '?';
    const hue = user?.avatarHue ?? hueFromString(author?.username ?? name);
    const [c1, c2] = avatarGradient(hue);
    const initials = initialsFromName(name);
    inner = (
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
  }

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
  image: {
    backgroundColor: '#1a1f30',
  },
});
