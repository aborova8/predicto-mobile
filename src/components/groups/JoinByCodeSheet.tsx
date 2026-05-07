import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { NeonButton } from '@/components/atoms/NeonButton';
import { BottomSheet } from '@/components/sheets/BottomSheet';
import { errorMessage } from '@/lib/api';
import type { JoinByCodeResult } from '@/lib/api/groups';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';

interface JoinByCodeSheetProps {
  open: boolean;
  onClose: () => void;
  onResult: (result: JoinByCodeResult) => void;
  joinByCode: (code: string) => Promise<JoinByCodeResult>;
}

export function JoinByCodeSheet({ open, onClose, onResult, joinByCode }: JoinByCodeSheetProps) {
  const theme = useTheme();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setCode('');
      setError(null);
      setPendingMessage(null);
      setSubmitting(false);
    }
  }, [open]);

  const trimmed = code.trim();
  const canSubmit = trimmed.length >= 6 && !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    setPendingMessage(null);
    try {
      const result = await joinByCode(trimmed);
      if (result.requestPending) {
        setPendingMessage('Request sent. An admin will approve you shortly.');
        // Don't auto-close — let the user read the banner.
      } else {
        onResult(result);
        onClose();
      }
    } catch (err) {
      setError(errorMessage(err, 'Could not join group. Check the code and try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <BottomSheet title="Join a group" onClose={onClose}>
        <View style={styles.body}>
          <Text style={[styles.hint, { color: theme.text2 }]}>
            Paste an invite code to join. Public groups join instantly. Private groups send a request to the admins.
          </Text>
          <TextInput
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="ABCD12-WXYZ"
            placeholderTextColor={theme.text3}
            style={[
              styles.input,
              { backgroundColor: theme.surface, borderColor: theme.line, color: theme.text },
            ]}
            editable={!submitting}
            onSubmitEditing={submit}
          />
          {error ? <Text style={[styles.errorText, { color: theme.loss }]}>{error}</Text> : null}
          {pendingMessage ? (
            <View
              style={[
                styles.banner,
                { backgroundColor: theme.neonDim, borderColor: theme.neon },
              ]}
            >
              <Text style={[styles.bannerText, { color: theme.neon }]}>{pendingMessage}</Text>
            </View>
          ) : null}
          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              style={[styles.cancel, { borderColor: theme.line }]}
            >
              <Text style={[styles.cancelText, { color: theme.text2 }]}>Close</Text>
            </Pressable>
            <View style={{ flex: 1 }}>
              <NeonButton onPress={submit} disabled={!canSubmit}>
                {submitting ? <ActivityIndicator color="#06091A" /> : 'Join'}
              </NeonButton>
            </View>
          </View>
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
    gap: 12,
  },
  hint: {
    fontFamily: Fonts.uiRegular,
    fontSize: 13,
    lineHeight: 18,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: Fonts.monoMedium,
    fontSize: 16,
    letterSpacing: 1.4,
  },
  errorText: {
    fontFamily: Fonts.uiMedium,
    fontSize: 13,
  },
  banner: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  bannerText: {
    fontFamily: Fonts.uiMedium,
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancel: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontFamily: Fonts.dispBold,
    fontSize: 15,
  },
});
