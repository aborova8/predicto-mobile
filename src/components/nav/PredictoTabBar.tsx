import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/atoms/Icon';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';

const TABS: { name: string; icon: IconName; label: string }[] = [
  { name: 'index',       icon: 'home',    label: 'Feed' },
  { name: 'matches',     icon: 'plus',    label: 'Predict' },
  { name: 'leaderboard', icon: 'trophy',  label: 'Ranks' },
  { name: 'groups',      icon: 'people',  label: 'Groups' },
  { name: 'profile',     icon: 'profile', label: 'Me' },
];

export function PredictoTabBar({ state, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <LinearGradient
        colors={['transparent', theme.bg]}
        locations={[0, 0.3]}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          styles.bar,
          {
            backgroundColor: theme.surface,
            borderColor: theme.line,
            shadowColor: '#000',
          },
        ]}
      >
        {state.routes.map((route, idx) => {
          const cfg = TABS.find((t) => t.name === route.name);
          if (!cfg) return null;
          const isActive = state.index === idx;
          const isCenter = cfg.name === 'matches';
          return (
            <Pressable
              key={route.key}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!isActive && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              style={styles.tab}
            >
              {isCenter ? (
                <View
                  style={[
                    styles.center,
                    {
                      backgroundColor: isActive ? theme.neon : theme.surface2,
                      shadowColor: isActive ? theme.neon : 'transparent',
                    },
                  ]}
                >
                  <Icon name={cfg.icon} size={20} stroke={2.2} color={isActive ? '#06091A' : theme.text} />
                </View>
              ) : (
                <Icon
                  name={cfg.icon}
                  size={22}
                  stroke={isActive ? 2.2 : 1.8}
                  color={isActive ? theme.neon : theme.text3}
                />
              )}
              <Text
                style={[
                  styles.label,
                  { color: isActive ? theme.neon : theme.text3 },
                ]}
              >
                {cfg.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 24,
  },
  bar: {
    marginHorizontal: 12,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 6,
    flexDirection: 'row',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    gap: 3,
  },
  center: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  label: {
    fontFamily: Fonts.monoSemi,
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
