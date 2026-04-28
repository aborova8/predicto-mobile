import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/atoms/IconButton';
import { Logo } from '@/components/atoms/Logo';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';

interface FeedHeaderProps {
  filter: 'global' | 'friends';
  onFilter: (f: 'global' | 'friends') => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  unreadNotifications?: boolean;
}

export function FeedHeader({
  filter,
  onFilter,
  onOpenSearch,
  onOpenNotifications,
  unreadNotifications = true,
}: FeedHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: insets.top + 6,
          backgroundColor: theme.bg,
          borderBottomColor: theme.lineSoft,
        },
      ]}
    >
      <View style={styles.row}>
        <Logo size={22} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <IconButton name="search" onPress={onOpenSearch} />
          <IconButton name="bell" onPress={onOpenNotifications} badge={unreadNotifications} />
        </View>
      </View>

      <View style={styles.pillsRow}>
        {(['global', 'friends'] as const).map((f) => {
          const active = f === filter;
          return (
            <Pressable
              key={f}
              onPress={() => onFilter(f)}
              style={[
                styles.pill,
                {
                  backgroundColor: active ? theme.neon : 'transparent',
                  borderColor: active ? theme.neon : theme.line,
                },
              ]}
            >
              <Text
                style={[
                  styles.pillTxt,
                  { color: active ? '#06091A' : theme.text2 },
                ]}
              >
                {f}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: 8,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillTxt: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
