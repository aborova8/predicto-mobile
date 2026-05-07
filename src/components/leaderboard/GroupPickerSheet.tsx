import { useRouter } from 'expo-router';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/sheets/BottomSheet';
import { useGroups } from '@/hooks/useGroups';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';

interface GroupPickerSheetProps {
  open: boolean;
  onClose: () => void;
}

export function GroupPickerSheet({ open, onClose }: GroupPickerSheetProps) {
  const theme = useTheme();
  const router = useRouter();
  const { groups, loading, error, refetch } = useGroups({ scope: 'mine' });

  const goToGroup = (id: string) => {
    onClose();
    router.push(`/group/${id}`);
  };

  const goToGroupsTab = () => {
    onClose();
    router.push('/(tabs)/groups');
  };

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <BottomSheet title="Group standings" onClose={onClose}>
        <View style={styles.body}>
          {loading && groups.length === 0 ? (
            <View style={styles.center}>
              <ActivityIndicator color={theme.neon} />
            </View>
          ) : error && groups.length === 0 ? (
            <View style={styles.center}>
              <Text style={[styles.errorText, { color: theme.loss }]}>{error.message}</Text>
              <Pressable onPress={refetch} style={[styles.retry, { borderColor: theme.line }]}>
                <Text style={[styles.retryText, { color: theme.text }]}>Retry</Text>
              </Pressable>
            </View>
          ) : groups.length === 0 ? (
            <View style={styles.center}>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No groups yet</Text>
              <Text style={[styles.emptyHint, { color: theme.text2 }]}>
                Join a group to see group standings.
              </Text>
              <Pressable onPress={goToGroupsTab} style={[styles.cta, { backgroundColor: theme.neon }]}>
                <Text style={[styles.ctaText, { color: '#06091A' }]}>Browse groups</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ paddingBottom: 20 }}>
              {groups.map((g) => (
                <Pressable
                  key={g.id}
                  onPress={() => goToGroup(g.id)}
                  style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.line }]}
                >
                  <View style={[styles.tile, { backgroundColor: g.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                      {g.name}
                    </Text>
                    <Text style={[styles.meta, { color: theme.text3 }]}>
                      {g.memberCount} {g.memberCount === 1 ? 'member' : 'members'}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      </BottomSheet>
    </Modal>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 4,
  },
  center: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    fontFamily: Fonts.uiMedium,
    fontSize: 13,
    textAlign: 'center',
  },
  retry: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  retryText: {
    fontFamily: Fonts.dispBold,
    fontSize: 13,
  },
  emptyTitle: {
    fontFamily: Fonts.dispBold,
    fontSize: 16,
  },
  emptyHint: {
    fontFamily: Fonts.uiRegular,
    fontSize: 13,
    textAlign: 'center',
  },
  cta: {
    marginTop: 4,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  ctaText: {
    fontFamily: Fonts.dispBold,
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  tile: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  name: {
    fontFamily: Fonts.dispBold,
    fontSize: 14,
  },
  meta: {
    fontFamily: Fonts.monoRegular,
    fontSize: 11,
    marginTop: 2,
  },
});
