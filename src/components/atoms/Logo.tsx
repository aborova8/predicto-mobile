import { StyleSheet, Text } from 'react-native';

import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';

interface LogoProps {
  size?: number;
}

export function Logo({ size = 24 }: LogoProps) {
  const theme = useTheme();
  return (
    <Text style={[styles.text, { color: theme.text, fontSize: size }]}>
      predicto
      <Text style={{ color: theme.neon }}>.</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: Fonts.dispBlack,
    letterSpacing: -0.5,
  },
});
