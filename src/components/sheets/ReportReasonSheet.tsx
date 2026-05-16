import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Icon } from '@/components/atoms/Icon';
import { createReport, type ReportReason } from '@/lib/api/reports';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';

interface ReportReasonSheetProps {
  open: boolean;
  onClose: () => void;
  targetUserId: string;
  postId?: string | null;
  onSubmitted?: () => void;
}

const REASONS: { value: ReportReason; label: string; sub: string }[] = [
  { value: 'SPAM', label: 'Spam', sub: 'Repetitive or misleading content' },
  { value: 'HARASSMENT', label: 'Harassment or bullying', sub: 'Targeted abuse or intimidation' },
  { value: 'HATE_SPEECH', label: 'Hate speech', sub: 'Discrimination or hateful conduct' },
  {
    value: 'INAPPROPRIATE_CONTENT',
    label: 'Inappropriate content',
    sub: 'Sexual, graphic, or otherwise unsuitable',
  },
  { value: 'VIOLENCE', label: 'Violence or threats', sub: 'Threats or incitement to violence' },
  {
    value: 'IMPERSONATION',
    label: 'Impersonation',
    sub: 'Pretending to be someone else',
  },
  { value: 'OTHER', label: 'Something else', sub: 'Tell us more in the details below' },
];

export function ReportReasonSheet({
  open,
  onClose,
  targetUserId,
  postId,
  onSubmitted,
}: ReportReasonSheetProps) {
  const theme = useTheme();
  const [selected, setSelected] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setSelected(null);
    setDescription('');
    setSubmitting(false);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!selected || submitting) return;
    setSubmitting(true);
    try {
      await createReport({
        targetUserId,
        postId: postId ?? null,
        reason: selected,
        description: description.trim() || null,
      });
      reset();
      onClose();
      onSubmitted?.();
      Alert.alert(
        'Report received',
        "Thanks — we'll review this within 24 hours and take action if it violates our policies.",
      );
    } catch (err) {
      setSubmitting(false);
      const message =
        err instanceof Error ? err.message : 'Could not submit report. Please try again.';
      Alert.alert('Report failed', message);
    }
  };

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <Pressable onPress={handleClose} style={styles.scrim}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[styles.sheet, { backgroundColor: theme.bg, borderColor: theme.line }]}
          >
            <View style={styles.handleWrap}>
              <View style={[styles.handle, { backgroundColor: theme.line }]} />
            </View>

            <Text style={[styles.title, { color: theme.text }]}>Report</Text>
            <Text style={[styles.subtitle, { color: theme.text3 }]}>
              {postId ? 'Why are you reporting this post?' : 'Why are you reporting this user?'}
            </Text>

            <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ paddingBottom: 8 }}>
              {REASONS.map((r) => {
                const active = selected === r.value;
                return (
                  <Pressable
                    key={r.value}
                    onPress={() => setSelected(r.value)}
                    style={({ pressed }) => [
                      styles.row,
                      {
                        backgroundColor: pressed || active ? theme.surface : 'transparent',
                        borderColor: active ? theme.neon : theme.line,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.iconBox,
                        {
                          backgroundColor: theme.surface,
                          borderColor: active ? theme.neon : theme.line,
                        },
                      ]}
                    >
                      <Icon
                        name={active ? 'check' : 'plus'}
                        size={16}
                        color={active ? theme.neon : theme.text2}
                        stroke={2.2}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowTitle, { color: theme.text }]}>{r.label}</Text>
                      <Text style={[styles.rowSub, { color: theme.text3 }]}>{r.sub}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Add details (optional)"
              placeholderTextColor={theme.text3}
              multiline
              maxLength={500}
              style={[
                styles.textArea,
                {
                  color: theme.text,
                  backgroundColor: theme.surface,
                  borderColor: theme.line,
                },
              ]}
            />

            <View style={styles.actions}>
              <Pressable
                onPress={handleClose}
                disabled={submitting}
                style={({ pressed }) => [
                  styles.btn,
                  { borderColor: theme.line, backgroundColor: pressed ? theme.surface : 'transparent' },
                ]}
              >
                <Text style={[styles.btnTxt, { color: theme.text2 }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSubmit}
                disabled={!selected || submitting}
                style={({ pressed }) => [
                  styles.btn,
                  {
                    borderColor: theme.neon,
                    backgroundColor: !selected
                      ? theme.surface
                      : pressed
                        ? theme.surface
                        : theme.neon,
                    opacity: !selected ? 0.5 : 1,
                  },
                ]}
              >
                {submitting ? (
                  <ActivityIndicator color={theme.bg} />
                ) : (
                  <Text style={[styles.btnTxt, { color: !selected ? theme.text3 : theme.bg }]}>
                    Submit
                  </Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 14,
    paddingBottom: 24,
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
  title: {
    fontFamily: Fonts.dispBold,
    fontSize: 18,
    paddingHorizontal: 4,
  },
  subtitle: {
    fontFamily: Fonts.uiRegular,
    fontSize: 13,
    marginTop: 2,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 6,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontFamily: Fonts.dispBold,
    fontSize: 14,
  },
  rowSub: {
    fontFamily: Fonts.uiRegular,
    fontSize: 12,
    marginTop: 2,
  },
  textArea: {
    marginTop: 8,
    minHeight: 64,
    maxHeight: 120,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontFamily: Fonts.uiRegular,
    fontSize: 13.5,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  btn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTxt: {
    fontFamily: Fonts.dispBold,
    fontSize: 14,
  },
});
