import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/atoms/Icon';
import { ReportReasonSheet } from '@/components/sheets/ReportReasonSheet';
import { deletePost } from '@/lib/api/feed';
import { useAppState } from '@/state/AppStateContext';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';
import type { Post } from '@/types/domain';

interface PostActionSheetProps {
  post: Post | null;
  onClose: () => void;
  onToggleSave: (postId: string) => void;
  onDeleted?: (postId: string) => void;
}

// Hosted as a local modal rather than a route — the parent screen owns the
// useFeed/useSavedPosts state, and a route would need an event bus or context
// to call back into the optimistic-update path.
export function PostActionSheet({
  post,
  onClose,
  onToggleSave,
  onDeleted,
}: PostActionSheetProps) {
  const theme = useTheme();
  const { user } = useAppState();
  const open = post !== null;

  const [reportOpen, setReportOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwnPost = post != null && user != null && post.userId === user.id;

  const confirmDelete = () => {
    if (!post) return;
    Alert.alert(
      'Delete post?',
      'This removes the post and its comments from the feed. Your ticket itself stays — predictions are locked in once submitted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void runDelete(post.id),
        },
      ],
    );
  };

  const runDelete = async (postId: string) => {
    setDeleting(true);
    try {
      await deletePost(postId);
      onClose();
      onDeleted?.(postId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not delete this post.';
      Alert.alert('Delete failed', message);
    } finally {
      setDeleting(false);
    }
  };

  // Dismiss the outer sheet first so we don't render two stacked Modals
  // (each carries its own scrim, which flickers on Android).
  const openReport = () => {
    if (!post) return;
    onClose();
    setReportOpen(true);
  };

  return (
    <>
      <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
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
                <ActionRow
                  icon={post.saved ? 'check' : 'plus'}
                  iconColor={post.saved ? theme.neon : theme.text2}
                  title={post.saved ? 'Unsave slip' : 'Save slip'}
                  sub={
                    post.saved
                      ? 'Remove from your saved list.'
                      : 'Bookmark for later from your profile.'
                  }
                  onPress={() => {
                    onToggleSave(post.id);
                    onClose();
                  }}
                />

                {isOwnPost ? (
                  <ActionRow
                    icon="trash"
                    iconColor={theme.text2}
                    title="Delete post"
                    sub="Hides this share from the feed and clears its comments. Your ticket and any points stay locked in."
                    onPress={confirmDelete}
                    busy={deleting}
                    disabled={deleting}
                  />
                ) : (
                  <ActionRow
                    icon="flag"
                    iconColor={theme.text2}
                    title="Report post"
                    sub="Flag content that breaks our community rules."
                    onPress={openReport}
                  />
                )}
              </View>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      <ReportReasonSheet
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetUserId={post?.userId ?? ''}
        postId={post?.id ?? null}
        onSubmitted={() => setReportOpen(false)}
      />
    </>
  );
}

interface ActionRowProps {
  icon: IconName;
  iconColor: string;
  title: string;
  sub: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
}

function ActionRow({ icon, iconColor, title, sub, onPress, disabled, busy }: ActionRowProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
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
        {busy ? (
          <ActivityIndicator size="small" color={theme.text2} />
        ) : (
          <Icon name={icon} size={18} color={iconColor} stroke={2.2} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.rowSub, { color: theme.text3 }]}>{sub}</Text>
      </View>
    </Pressable>
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
