import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/atoms/Icon';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';
import type { Post } from '@/types/domain';

interface PostActionSheetProps {
  post: Post | null;
  onClose: () => void;
  onToggleSave: (postId: string) => void;
}

// Hosted as a local modal rather than a route — the parent screen owns the
// useFeed/useSavedPosts state, and a route would need an event bus or context
// to call back into the optimistic-update path.
export function PostActionSheet({ post, onClose, onToggleSave }: PostActionSheetProps) {
  const theme = useTheme();
  const open = post !== null;

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable onPress={onClose} style={styles.scrim}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[styles.sheet, { backgroundColor: theme.bg, borderColor: theme.line }]}
        >
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: theme.line }]} />
          </View>

          {post ? (
            <View style={{ paddingHorizontal: 8, paddingBottom: 16 }}>
              <Pressable
                onPress={() => {
                  onToggleSave(post.id);
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.row,
                  { backgroundColor: pressed ? theme.surface : 'transparent' },
                ]}
              >
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: theme.surface, borderColor: theme.line },
                  ]}
                >
                  <Icon
                    name={post.saved ? 'check' : 'plus'}
                    size={18}
                    color={post.saved ? theme.neon : theme.text2}
                    stroke={2.2}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: theme.text }]}>
                    {post.saved ? 'Unsave slip' : 'Save slip'}
                  </Text>
                  <Text style={[styles.rowSub, { color: theme.text3 }]}>
                    {post.saved
                      ? 'Remove from your saved list.'
                      : 'Bookmark for later from your profile.'}
                  </Text>
                </View>
              </Pressable>
            </View>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
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
    paddingBottom: 8,
    alignItems: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontFamily: Fonts.dispBold,
    fontSize: 15,
  },
  rowSub: {
    fontFamily: Fonts.uiRegular,
    fontSize: 12,
    marginTop: 2,
  },
});
