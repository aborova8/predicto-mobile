import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { TEAMS } from '@/data/teams';
import { Fonts } from '@/theme/fonts';

interface CrestProps {
  team: string;
  size?: number;
  style?: ViewStyle;
}

export function Crest({ team, size = 36, style }: CrestProps) {
  const t = TEAMS[team];
  if (!t) return null;
  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: 6,
          backgroundColor: t.color,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.25)']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <Text
        style={{
          color: '#fff',
          fontFamily: Fonts.dispBlack,
          fontSize: size * 0.34,
          textShadowColor: 'rgba(0,0,0,0.4)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 2,
        }}
      >
        {t.short}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
