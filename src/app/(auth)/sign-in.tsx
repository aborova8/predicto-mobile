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
import { Logo } from '@/components/atoms/Logo';
import { NeonButton } from '@/components/atoms/NeonButton';
import { useAppState } from '@/state/AppStateContext';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';

export default function SignInScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setAuthed } = useAppState();
  const [email, setEmail] = useState('marco@predicto.app');
  const [password, setPassword] = useState('••••••••');

  const onSignIn = () => setAuthed(true);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.wrap, { paddingTop: insets.top + 36, paddingBottom: 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ marginTop: 24, marginBottom: 36 }}>
          <Logo size={32} />
          <Text style={[styles.h1, { color: theme.text }]}>
            Call it.{'\n'}
            <Text style={{ color: theme.neon }}>Stake your reputation.</Text>
          </Text>
          <Text style={[styles.sub, { color: theme.text2 }]}>
            One free ticket a day. Climb the ranks with your friends.
          </Text>
        </View>

        <View style={{ gap: 10 }}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email or username"
            placeholderTextColor={theme.text3}
            autoCapitalize="none"
            autoComplete="email"
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
          <View style={{ alignItems: 'flex-end' }}>
            <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
              <Text style={[styles.linkSmall, { color: theme.text2 }]}>Forgot password?</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ marginTop: 18 }}>
          <NeonButton onPress={onSignIn}>Sign in →</NeonButton>
        </View>

        <View style={styles.dividerWrap}>
          <View style={[styles.dividerLine, { backgroundColor: theme.line }]} />
          <Text style={[styles.or, { color: theme.text3 }]}>OR</Text>
          <View style={[styles.dividerLine, { backgroundColor: theme.line }]} />
        </View>

        <View style={{ gap: 10 }}>
          <Pressable
            onPress={onSignIn}
            style={[styles.oauthBtn, { backgroundColor: theme.surface, borderColor: theme.line }]}
          >
            <Icon name="apple" size={18} color={theme.text} />
            <Text style={[styles.oauthTxt, { color: theme.text }]}>Continue with Apple</Text>
          </Pressable>
          <Pressable
            onPress={onSignIn}
            style={[styles.oauthBtn, { backgroundColor: theme.surface, borderColor: theme.line }]}
          >
            <Icon name="google" size={18} />
            <Text style={[styles.oauthTxt, { color: theme.text }]}>Continue with Google</Text>
          </Pressable>
        </View>

        <View style={{ alignItems: 'center', marginTop: 28 }}>
          <Text style={{ color: theme.text2, fontSize: 13, fontFamily: Fonts.uiRegular }}>
            New here?{' '}
            <Text
              onPress={() => router.push('/(auth)/sign-up')}
              style={{ color: theme.neon, fontFamily: Fonts.uiSemi }}
            >
              Create account
            </Text>
          </Text>
        </View>

        <View style={styles.legalRow}>
          <Pressable onPress={() => router.push({ pathname: '/legal', params: { doc: 'terms' } })}>
            <Text style={[styles.legalLink, { color: theme.text3 }]}>TERMS</Text>
          </Pressable>
          <Text style={[styles.legalLink, { color: theme.text3, opacity: 0.5 }]}> · </Text>
          <Pressable onPress={() => router.push({ pathname: '/legal', params: { doc: 'privacy' } })}>
            <Text style={[styles.legalLink, { color: theme.text3 }]}>PRIVACY</Text>
          </Pressable>
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
  h1: {
    fontFamily: Fonts.dispBlack,
    fontSize: 32,
    marginTop: 24,
    marginBottom: 8,
    lineHeight: 36,
    letterSpacing: -0.8,
  },
  sub: {
    fontFamily: Fonts.uiRegular,
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontFamily: Fonts.uiRegular,
    fontSize: 14,
  },
  linkSmall: {
    fontFamily: Fonts.monoMedium,
    fontSize: 12,
    letterSpacing: 0.4,
  },
  dividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  or: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1,
  },
  oauthBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  oauthTxt: {
    fontFamily: Fonts.uiSemi,
    fontSize: 14,
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  legalLink: {
    fontFamily: Fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
