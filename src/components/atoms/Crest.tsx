import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Image, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { TEAMS } from '@/data/teams';
import { knownTeamLogo } from '@/data/teamLogos';
import { Fonts } from '@/theme/fonts';

interface CrestProps {
  team: string;
  size?: number;
  style?: ViewStyle;
  logo?: string | null;
  // Full team name. When provided, used to look up the team in the static
  // logo dictionary, which is more reliable than AI-supplied URLs.
  name?: string | null;
}

export function Crest({ team, size = 36, style, logo, name }: CrestProps) {
  const [imageFailed, setImageFailed] = useState(false);

  // Resolution priority: static dictionary (most reliable) → AI-supplied URL.
  // If the chosen URL fails to load, `imageFailed` flips and we render the
  // colored fallback badge.
  const resolvedLogo = knownTeamLogo(name) ?? logo;

  if (resolvedLogo && !imageFailed) {
    return (
      <View
        style={[
          styles.wrap,
          {
            width: size,
            height: size,
            borderRadius: 6,
            backgroundColor: '#fff',
          },
          style,
        ]}
      >
        <Image
          source={{ uri: resolvedLogo }}
          style={{ width: size * 0.86, height: size * 0.86 }}
          resizeMode="contain"
          onError={() => setImageFailed(true)}
        />
      </View>
    );
  }

  const t = TEAMS[team];
  if (!t) {
    return (
      <View
        style={[
          styles.wrap,
          {
            width: size,
            height: size,
            borderRadius: 6,
            backgroundColor: '#3A3F55',
          },
          style,
        ]}
      >
        <Text
          style={{
            color: '#fff',
            fontFamily: Fonts.dispBlack,
            fontSize: size * 0.34,
          }}
          numberOfLines={1}
        >
          {team.slice(0, 3).toUpperCase()}
        </Text>
      </View>
    );
  }

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
