import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Icon } from '@/components/atoms/Icon';
import { BottomSheet } from '@/components/sheets/BottomSheet';
import { errorMessage } from '@/lib/api';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';
import type { GroupRole } from '@/types/domain';

interface InviteSheetProps {
  open: boolean;
  onClose: () => void;
  inviteCode: string;
  groupName: string;
  viewerRole: GroupRole | null;
  onRotate?: () => Promise<string>;
}

export function InviteSheet({
  open,
  onClose,
  inviteCode,
  groupName,
  viewerRole,
  onRotate,
}: InviteSheetProps) {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);
  const [rotating, setRotating] = useState(false);
  const isAdmin = viewerRole === 'OWNER' || viewerRole === 'ADMIN';

  const copy = async () => {
    try {
      await Clipboard.setStringAsync(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard rarely fails on real devices; silent failure is fine.
    }
  };

  const share = async () => {
    try {
      await Share.share({
        message: `Join "${groupName}" on Predicto. Invite code: ${inviteCode}`,
      });
    } catch {
      // User cancelled the share sheet — nothing to do.
    }
  };

  const rotate = () => {
    if (!onRotate || rotating) return;
    Alert.alert(
      'Rotate invite code?',
      'The current code will stop working immediately. Anyone using it will need the new one.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rotate',
          style: 'destructive',
          onPress: async () => {
            setRotating(true);
            try {
              await onRotate();
            } catch (err) {
              Alert.alert('Could not rotate code', errorMessage(err, 'Try again.'));
            } finally {
              setRotating(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <BottomSheet title="Invite to group" onClose={onClose}>
        <View style={styles.body}>
          <Text style={[styles.label, { color: theme.text3 }]}>INVITE CODE</Text>
          <Pressable
            onPress={copy}
            style={[
              styles.codeBox,
              { backgroundColor: theme.surface, borderColor: theme.line },
            ]}
          >
            <Text style={[styles.code, { color: theme.text }]} selectable>
              {inviteCode}
            </Text>
            <Text style={[styles.copyHint, { color: copied ? theme.win : theme.text3 }]}>
              {copied ? 'COPIED' : 'TAP TO COPY'}
            </Text>
          </Pressable>

          <View style={styles.row}>
            <Pressable
              onPress={share}
              style={[styles.action, { backgroundColor: theme.surface, borderColor: theme.line }]}
            >
              <Icon name="share" size={18} color={theme.text} stroke={2} />
              <Text style={[styles.actionLabel, { color: theme.text }]}>Share</Text>
            </Pressable>
            <Pressable
              onPress={copy}
              style={[styles.action, { backgroundColor: theme.surface, borderColor: theme.line }]}
            >
              <Icon name="check" size={18} color={theme.text} stroke={2} />
              <Text style={[styles.actionLabel, { color: theme.text }]}>Copy</Text>
            </Pressable>
          </View>

          {isAdmin && onRotate ? (
            <Pressable
              onPress={rotate}
              disabled={rotating}
              style={[styles.rotate, { borderColor: theme.line }]}
            >
              {rotating ? (
                <ActivityIndicator color={theme.text2} />
              ) : (
                <Text style={[styles.rotateText, { color: theme.text2 }]}>Rotate code</Text>
              )}
            </Pressable>
          ) : null}
        </View>
      </BottomSheet>
    </Modal>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 4,
    gap: 14,
  },
  label: {
    fontFamily: Fonts.uiBold,
    fontSize: 11,
    letterSpacing: 1.4,
  },
  codeBox: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 8,
  },
  code: {
    fontFamily: Fonts.monoBold,
    fontSize: 28,
    letterSpacing: 4,
  },
  copyHint: {
    fontFamily: Fonts.uiBold,
    fontSize: 10,
    letterSpacing: 1.6,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionLabel: {
    fontFamily: Fonts.dispBold,
    fontSize: 14,
  },
  rotate: {
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    marginTop: 4,
  },
  rotateText: {
    fontFamily: Fonts.uiMedium,
    fontSize: 13,
  },
});
