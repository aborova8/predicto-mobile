import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { errorMessage } from '@/lib/api';
import * as appleAuth from '@/lib/auth/apple';
import { useGoogleAuth } from '@/lib/auth/google';
import { useAppState } from '@/state/AppStateContext';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';

export default function SignInScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn, signInWithGoogle, signInWithApple } = useAppState();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    void appleAuth.isAvailable().then(setAppleAvailable);
  }, []);

  const onSubmit = async () => {
    if (submitting) return;
    setError(null);
    if (!identifier.trim() || !password) {
      setError('Email/username and password are required.');
      return;
    }
    setSubmitting(true);
    try {
      await signIn(identifier.trim(), password);
    } catch (err) {
      setError(errorMessage(err, 'Sign in failed. Try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const google = useGoogleAuth({
    onIdToken: async (idToken) => {
      setError(null);
      setSubmitting(true);
      try {
        await signInWithGoogle(idToken);
      } catch (err) {
        setError(errorMessage(err, 'Google sign-in failed.'));
      } finally {
        setSubmitting(false);
      }
    },
    onError: (err) => setError(errorMessage(err, 'Google sign-in failed.')),
  });

  const onApple = async () => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const credential = await appleAuth.signIn();
      await signInWithApple({
        identityToken: credential.identityToken,
        fullName: credential.fullName,
      });
    } catch (err: unknown) {
      const code = err && typeof err === 'object' ? (err as { code?: string }).code : undefined;
      if (code !== 'ERR_REQUEST_CANCELED') {
        setError(errorMessage(err, 'Apple sign-in failed.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onGoogle = async () => {
    if (submitting || !google.ready) {
      if (!google.ready) {
        Alert.alert('Google sign-in unavailable', 'Add EXPO_PUBLIC_GOOGLE_*_CLIENT_ID values and restart the dev server.');
      }
      return;
    }
    setError(null);
    await google.promptAsync();
  };

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
            value={identifier}
            onChangeText={(v) => {
              setIdentifier(v);
              if (error) setError(null);
            }}
            placeholder="Email or username"
            placeholderTextColor={theme.text3}
            autoCapitalize="none"
            autoComplete="username"
            keyboardType="email-address"
            editable={!submitting}
            style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.line, color: theme.text }]}
          />
          <TextInput
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              if (error) setError(null);
            }}
            placeholder="Password"
            placeholderTextColor={theme.text3}
            secureTextEntry
            autoComplete="current-password"
            editable={!submitting}
            style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.line, color: theme.text }]}
          />
          {error ? (
            <Text style={[styles.errorTxt, { color: theme.loss }]}>{error.toUpperCase()}</Text>
          ) : null}
          <View style={{ alignItems: 'flex-end' }}>
            <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
              <Text style={[styles.linkSmall, { color: theme.text2 }]}>Forgot password?</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ marginTop: 18 }}>
          <NeonButton onPress={onSubmit} disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in →'}
          </NeonButton>
        </View>

        <View style={styles.dividerWrap}>
          <View style={[styles.dividerLine, { backgroundColor: theme.line }]} />
          <Text style={[styles.or, { color: theme.text3 }]}>OR</Text>
          <View style={[styles.dividerLine, { backgroundColor: theme.line }]} />
        </View>

        <View style={{ gap: 10 }}>
          {appleAvailable ? (
            <Pressable
              onPress={onApple}
              disabled={submitting}
              style={[styles.oauthBtn, { backgroundColor: theme.surface, borderColor: theme.line, opacity: submitting ? 0.5 : 1 }]}
            >
              <Icon name="apple" size={18} color={theme.text} />
              <Text style={[styles.oauthTxt, { color: theme.text }]}>Continue with Apple</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={onGoogle}
            disabled={submitting}
            style={[styles.oauthBtn, { backgroundColor: theme.surface, borderColor: theme.line, opacity: submitting ? 0.5 : 1 }]}
          >
            {submitting ? <ActivityIndicator size="small" color={theme.text2} /> : <Icon name="google" size={18} />}
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
  errorTxt: {
    fontFamily: Fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 0.5,
    marginTop: 2,
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
