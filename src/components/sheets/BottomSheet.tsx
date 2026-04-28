import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { Icon } from '@/components/atoms/Icon';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';

interface BottomSheetProps {
  children: ReactNode;
  title?: ReactNode;
  height?: number | `${number}%`;
  onClose?: () => void;
  showHandle?: boolean;
  showClose?: boolean;
  contentStyle?: ViewStyle;
}

export function BottomSheet({
  children,
  title,
  height,
  onClose,
  showHandle = true,
  showClose = true,
  contentStyle,
}: BottomSheetProps) {
  const theme = useTheme();
  const router = useRouter();
  const close = onClose ?? (() => router.back());

  return (
    <Pressable onPress={close} style={styles.scrim}>
      <Pressable
        onPress={(e) => e.stopPropagation()}
        style={[
          styles.sheet,
          { backgroundColor: theme.bg, borderColor: theme.line, height: height ?? undefined, maxHeight: height ? undefined : '90%' },
          contentStyle,
        ]}
      >
        {showHandle ? (
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: theme.line }]} />
          </View>
        ) : null}
        {title || showClose ? (
          <View style={styles.head}>
            {typeof title === 'string' ? (
              <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            ) : title ? (
              title
            ) : (
              <View />
            )}
            {showClose ? (
              <Pressable onPress={close} hitSlop={10}>
                <Icon name="x" size={20} color={theme.text2} />
              </Pressable>
            ) : null}
          </View>
        ) : null}
        {children}
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  handleWrap: {
    paddingTop: 8,
    paddingBottom: 4,
    alignItems: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  head: {
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: Fonts.dispBold,
    fontSize: 16,
  },
});
