import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/atoms/Icon';
import { NeonButton } from '@/components/atoms/NeonButton';
import { useAppState } from '@/state/AppStateContext';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';

export default function SignUpScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setAuthed } = useAppState();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.wrap, { paddingTop: insets.top + 36, paddingBottom: 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Icon name="chevronL" size={18} color={theme.text2} />
          <Text style={[styles.backTxt, { color: theme.text2 }]}>BACK</Text>
        </Pressable>

        <Text style={[styles.h1, { color: theme.text }]}>Create your account</Text>
        <Text style={[styles.sub, { color: theme.text2 }]}>
          Pick a username — your slips will live under it.
        </Text>

        <View style={styles.uploaderRow}>
          <View
            style={[
              styles.uploadCircle,
              { backgroundColor: theme.surface, borderColor: theme.line },
            ]}
          >
            <Text style={[styles.plus, { color: theme.text3 }]}>+</Text>
          </View>
          <View>
            <Text style={[styles.uploadTitle, { color: theme.text }]}>Upload photo</Text>
            <Text style={[styles.uploadSub, { color: theme.text3 }]}>OPTIONAL · JPG OR PNG</Text>
          </View>
        </View>

        <View style={{ gap: 10 }}>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Username"
            placeholderTextColor={theme.text3}
            autoCapitalize="none"
            style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.line, color: theme.text }]}
          />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={theme.text3}
            autoCapitalize="none"
            keyboardType="email-address"
            style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.line, color: theme.text }]}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={theme.text3}
            secureTextEntry
            style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.line, color: theme.text }]}
          />
        </View>

        <View style={{ marginTop: 16 }}>
          <NeonButton onPress={() => setAuthed(true)}>Create account</NeonButton>
        </View>

        <View style={styles.legal}>
          <Text style={[styles.legalLine, { color: theme.text3 }]}>
            BY SIGNING UP YOU AGREE TO THE
          </Text>
          <Text style={[styles.legalLine, { color: theme.text3 }]}>
            <Text
              onPress={() => router.push({ pathname: '/legal', params: { doc: 'terms' } })}
              style={{ color: theme.neon, textDecorationLine: 'underline' }}
            >
              TERMS OF SERVICE
            </Text>{' '}
            AND{' '}
            <Text
              onPress={() => router.push({ pathname: '/legal', params: { doc: 'privacy' } })}
              style={{ color: theme.neon, textDecorationLine: 'underline' }}
            >
              PRIVACY POLICY
            </Text>
            .
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 24,
    flexGrow: 1,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backTxt: {
    fontFamily: Fonts.monoMedium,
    fontSize: 12,
  },
  h1: {
    fontFamily: Fonts.dispBlack,
    fontSize: 30,
    marginTop: 24,
    marginBottom: 4,
    letterSpacing: -0.6,
  },
  sub: {
    fontFamily: Fonts.uiRegular,
    fontSize: 13,
    marginBottom: 24,
  },
  uploaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },
  uploadCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: {
    fontFamily: Fonts.monoSemi,
    fontSize: 22,
  },
  uploadTitle: {
    fontFamily: Fonts.dispBold,
    fontSize: 14,
  },
  uploadSub: {
    fontFamily: Fonts.monoMedium,
    fontSize: 11,
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontFamily: Fonts.uiRegular,
    fontSize: 14,
  },
  legal: {
    alignItems: 'center',
    marginTop: 14,
    gap: 4,
  },
  legalLine: {
    fontFamily: Fonts.monoMedium,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 18,
    letterSpacing: 0.4,
  },
});
