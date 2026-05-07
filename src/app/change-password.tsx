import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ScreenHeader } from '@/components/nav/ScreenHeader';
import { ApiError } from '@/lib/api';
import { changePassword } from '@/lib/api/users';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';

export default function ChangePasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [saving, setSaving] = useState(false);

  const valid = current.length > 0 && next.length >= 8 && next === confirmPwd;

  const onSave = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      await changePassword({ currentPassword: current, newPassword: next });
      Alert.alert('Password changed', 'Your password has been updated.');
      router.back();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to change password';
      Alert.alert('Update failed', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScreenHeader title="Change password" />
      <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingTop: 16 }}>
        <Field label="Current password">
          <TextInput
            value={current}
            onChangeText={setCurrent}
            secureTextEntry
            autoCapitalize="none"
            style={[
              styles.input,
              { color: theme.text, borderColor: theme.line, backgroundColor: theme.surface },
            ]}
          />
        </Field>
        <Field label="New password">
          <TextInput
            value={next}
            onChangeText={setNext}
            secureTextEntry
            autoCapitalize="none"
            placeholder="At least 8 characters"
            placeholderTextColor={theme.text3}
            style={[
              styles.input,
              { color: theme.text, borderColor: theme.line, backgroundColor: theme.surface },
            ]}
          />
        </Field>
        <Field label="Confirm new password">
          <TextInput
            value={confirmPwd}
            onChangeText={setConfirmPwd}
            secureTextEntry
            autoCapitalize="none"
            style={[
              styles.input,
              { color: theme.text, borderColor: theme.line, backgroundColor: theme.surface },
            ]}
          />
          {confirmPwd.length > 0 && confirmPwd !== next ? (
            <Text style={{ color: theme.loss, fontFamily: Fonts.monoMedium, fontSize: 11, marginTop: 4 }}>
              Passwords don't match
            </Text>
          ) : null}
        </Field>
        <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
          <Pressable
            onPress={onSave}
            disabled={!valid || saving}
            style={[
              styles.saveBtn,
              { backgroundColor: valid && !saving ? theme.neon : theme.surface },
            ]}
          >
            {saving ? (
              <ActivityIndicator color="#06091A" />
            ) : (
              <Text style={[styles.saveTxt, { color: valid ? '#06091A' : theme.text3 }]}>
                Update password
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
      <Text style={[styles.fieldLabel, { color: theme.text3 }]}>{label.toUpperCase()}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  input: {
    fontFamily: Fonts.uiRegular,
    fontSize: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 10,
  },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveTxt: {
    fontFamily: Fonts.dispBold,
    fontSize: 14,
  },
});
