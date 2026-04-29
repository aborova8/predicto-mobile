import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
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
import { OtpInput, type OtpInputHandle } from '@/components/atoms/OtpInput';
import { errorMessage } from '@/lib/api';
import { withAlpha } from '@/lib/colors';
import { isValidEmail } from '@/lib/format';
import { useAppState } from '@/state/AppStateContext';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';

type Step = 'email' | 'sent' | 'reset' | 'done';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { requestPasswordReset, verifyPasswordResetCode, confirmPasswordReset } = useAppState();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const otpRef = useRef<OtpInputHandle>(null);

  const emailValid = isValidEmail(email);
  const codeFull = code.every((d) => d.length === 1);
  const pwValid = pw.length >= 8 && pw === pw2;
  const codeStr = code.join('');

  const onRequest = async () => {
    if (busy || !emailValid) return;
    setErr(null);
    setBusy(true);
    try {
      await requestPasswordReset(email.trim());
      // Backend returns 200 even for unknown emails (enumeration protection),
      // so always advance — the UX trade-off is that an unregistered address
      // still lands in the OTP step until the user notices the email never came.
      setStep('sent');
    } catch (e) {
      setErr(errorMessage(e, 'Could not send reset code. Try again.'));
    } finally {
      setBusy(false);
    }
  };

  const onVerify = async () => {
    if (busy || !codeFull) return;
    setErr(null);
    setBusy(true);
    try {
      await verifyPasswordResetCode(email.trim(), codeStr);
      setStep('reset');
    } catch (e) {
      setErr(errorMessage(e, 'Invalid or expired code.'));
    } finally {
      setBusy(false);
    }
  };

  const onResend = async () => {
    if (busy) return;
    setErr(null);
    setBusy(true);
    try {
      await requestPasswordReset(email.trim());
      setCode(['', '', '', '', '', '']);
      otpRef.current?.focus();
    } catch (e) {
      setErr(errorMessage(e, 'Could not resend code. Try again.'));
    } finally {
      setBusy(false);
    }
  };

  const onConfirm = async () => {
    if (busy || !pwValid) return;
    setErr(null);
    setBusy(true);
    try {
      await confirmPasswordReset(email.trim(), codeStr, pw);
      setStep('done');
    } catch (e) {
      setErr(errorMessage(e, 'Could not reset password. Try again.'));
    } finally {
      setBusy(false);
    }
  };

  const heroBox = (icon: 'lock' | 'bell') => (
    <View
      style={[
        styles.hero,
        { backgroundColor: theme.neonDim, borderColor: withAlpha(theme.neon, 0.33) },
      ]}
    >
      <Icon name={icon} size={26} color={theme.neon} stroke={2} />
    </View>
  );

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

        {step === 'email' ? (
          <>
            {heroBox('lock')}
            <Text style={[styles.h1, { color: theme.text }]}>Forgot password?</Text>
            <Text style={[styles.sub, { color: theme.text2 }]}>
              No worries — happens to the best of us. Enter the email on your account and we&apos;ll send a 6-digit reset code.
            </Text>
            <TextInput
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (err) setErr(null);
              }}
              placeholder="Email address"
              placeholderTextColor={theme.text3}
              autoFocus
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              editable={!busy}
              style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.line, color: theme.text }]}
            />
            {err ? <Text style={[styles.errTxt, { color: theme.loss }]}>{err.toUpperCase()}</Text> : null}
            <View style={{ marginTop: 18 }}>
              <NeonButton onPress={onRequest} disabled={!emailValid || busy}>
                {busy ? 'Sending…' : 'Send reset code →'}
              </NeonButton>
            </View>
            <View style={{ alignItems: 'center', marginTop: 28 }}>
              <Text style={{ color: theme.text2, fontSize: 13, fontFamily: Fonts.uiRegular }}>
                Remembered it?{' '}
                <Text onPress={() => router.back()} style={{ color: theme.neon, fontFamily: Fonts.uiSemi }}>
                  Sign in
                </Text>
              </Text>
            </View>
          </>
        ) : null}

        {step === 'sent' ? (
          <>
            {heroBox('bell')}
            <Text style={[styles.h1, { color: theme.text }]}>Check your inbox</Text>
            <Text style={[styles.sub, { color: theme.text2 }]}>
              We sent a 6-digit code to{' '}
              <Text style={{ color: theme.text, fontFamily: Fonts.uiSemi }}>
                {email || 'your email'}
              </Text>
              . It&apos;s good for 10 minutes.
            </Text>
            <OtpInput
              ref={otpRef}
              value={code}
              onChange={(next) => {
                setCode(next);
                if (err) setErr(null);
              }}
              disabled={busy}
              error={!!err}
              autoFocus
            />
            {err ? <Text style={[styles.errTxt, { color: theme.loss, marginTop: 8 }]}>{err.toUpperCase()}</Text> : null}
            <View style={{ marginTop: 18 }}>
              <NeonButton onPress={onVerify} disabled={!codeFull || busy}>
                {busy ? 'Verifying…' : 'Verify code →'}
              </NeonButton>
            </View>
            <View style={{ alignItems: 'center', marginTop: 28 }}>
              <Text style={{ color: theme.text3, fontFamily: Fonts.monoMedium, fontSize: 11, letterSpacing: 0.5 }}>
                DIDN&apos;T GET IT?{' '}
                <Text onPress={onResend} style={{ color: theme.neon, fontFamily: Fonts.monoSemi }}>
                  RESEND CODE
                </Text>
              </Text>
            </View>
          </>
        ) : null}

        {step === 'reset' ? (
          <>
            {heroBox('lock')}
            <Text style={[styles.h1, { color: theme.text }]}>Set a new password</Text>
            <Text style={[styles.sub, { color: theme.text2 }]}>
              Make it 8+ characters. Mix letters, numbers, and symbols if you want extra cover.
            </Text>
            <View style={{ gap: 10 }}>
              <TextInput
                value={pw}
                onChangeText={(v) => {
                  setPw(v);
                  if (err) setErr(null);
                }}
                placeholder="New password"
                placeholderTextColor={theme.text3}
                secureTextEntry
                autoComplete="new-password"
                autoFocus
                editable={!busy}
                style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.line, color: theme.text }]}
              />
              <TextInput
                value={pw2}
                onChangeText={(v) => {
                  setPw2(v);
                  if (err) setErr(null);
                }}
                placeholder="Confirm new password"
                placeholderTextColor={theme.text3}
                secureTextEntry
                autoComplete="new-password"
                editable={!busy}
                style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.line, color: theme.text }]}
              />
              {pw && pw2 && pw !== pw2 ? (
                <Text style={{ color: theme.loss, fontFamily: Fonts.monoMedium, fontSize: 11, letterSpacing: 0.4 }}>
                  PASSWORDS DON&apos;T MATCH
                </Text>
              ) : null}
              {err ? <Text style={[styles.errTxt, { color: theme.loss }]}>{err.toUpperCase()}</Text> : null}
            </View>
            <View style={{ marginTop: 18 }}>
              <NeonButton onPress={onConfirm} disabled={!pwValid || busy}>
                {busy ? 'Resetting…' : 'Reset password →'}
              </NeonButton>
            </View>
          </>
        ) : null}

        {step === 'done' ? (
          <View style={styles.done}>
            <View
              style={[
                styles.doneCircle,
                { backgroundColor: theme.neonDim, borderColor: theme.neon },
              ]}
            >
              <Icon name="check" size={40} color={theme.neon} stroke={3} />
            </View>
            <Text style={[styles.h1, { color: theme.text, textAlign: 'center' }]}>
              You&apos;re back in
            </Text>
            <Text style={[styles.sub, { color: theme.text2, textAlign: 'center', maxWidth: 280 }]}>
              Your password has been updated. Sign in with your new password to keep going.
            </Text>
            <View style={{ width: '100%', maxWidth: 320, marginTop: 12 }}>
              <NeonButton onPress={() => router.replace('/(auth)/sign-in')}>Sign in →</NeonButton>
            </View>
          </View>
        ) : null}
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
  hero: {
    width: 56,
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 20,
  },
  h1: {
    fontFamily: Fonts.dispBlack,
    fontSize: 28,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  sub: {
    fontFamily: Fonts.uiRegular,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontFamily: Fonts.uiRegular,
    fontSize: 14,
  },
  errTxt: {
    fontFamily: Fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 0.5,
    marginTop: 6,
  },
  done: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 24,
    gap: 8,
  },
  doneCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
});
