import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/atoms/Icon';
import { NeonButton } from '@/components/atoms/NeonButton';
import { OtpInput, type OtpInputHandle } from '@/components/atoms/OtpInput';
import { errorMessage } from '@/lib/api';
import { confirmEmailVerification, requestEmailVerification } from '@/lib/auth/api';
import { withAlpha } from '@/lib/colors';
import { useAppState } from '@/state/AppStateContext';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';

type Step = 'sending' | 'enter' | 'done' | 'already';

export default function VerifyEmailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshUser, signOut } = useAppState();
  const [step, setStep] = useState<Step>('sending');
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const otpRef = useRef<OtpInputHandle>(null);
  const codeFull = code.every((d) => d.length === 1);
  const codeStr = code.join('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await requestEmailVerification();
        if (cancelled) return;
        setStep(res.alreadyVerified ? 'already' : 'enter');
      } catch (e) {
        if (cancelled) return;
        setStep('enter');
        setErr(errorMessage(e, 'Could not send code.'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onConfirm = async () => {
    if (busy || !codeFull) return;
    setErr(null);
    setBusy(true);
    try {
      await confirmEmailVerification(codeStr);
      void refreshUser();
      setStep('done');
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
      await requestEmailVerification();
      setCode(['', '', '', '', '', '']);
      otpRef.current?.focus();
    } catch (e) {
      setErr(errorMessage(e, 'Could not resend code.'));
    } finally {
      setBusy(false);
    }
  };

  const onContinue = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  const heroBox = (icon: 'lock' | 'bell' | 'check') => (
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
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} style={styles.back}>
          <Icon name="chevronL" size={18} color={theme.text2} />
          <Text style={[styles.backTxt, { color: theme.text2 }]}>BACK</Text>
        </Pressable>

        {step === 'sending' ? (
          <>
            {heroBox('bell')}
            <Text style={[styles.h1, { color: theme.text }]}>Verify your email</Text>
            <Text style={[styles.sub, { color: theme.text2 }]}>Sending a 6-digit code…</Text>
            <OtpInput value={code} onChange={setCode} disabled error={false} />
          </>
        ) : null}

        {step === 'enter' ? (
          <>
            {heroBox('bell')}
            <Text style={[styles.h1, { color: theme.text }]}>Verify your email</Text>
            <Text style={[styles.sub, { color: theme.text2 }]}>
              We sent a 6-digit code to{' '}
              <Text style={{ color: theme.text, fontFamily: Fonts.uiSemi }}>
                {user?.email ?? 'your email'}
              </Text>
              . It&apos;s good for 30 minutes.
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
            {err ? <Text style={[styles.errTxt, { color: theme.loss }]}>{err.toUpperCase()}</Text> : null}
            <View style={{ marginTop: 18 }}>
              <NeonButton onPress={onConfirm} disabled={!codeFull || busy}>
                {busy ? 'Verifying…' : 'Verify email →'}
              </NeonButton>
            </View>
            <View style={{ alignItems: 'center', marginTop: 28 }}>
              <Text style={{ color: theme.text3, fontFamily: Fonts.monoMedium, fontSize: 11, letterSpacing: 0.5 }}>
                DIDN&apos;T GET IT?{' '}
                <Text onPress={onResend} style={{ color: theme.neon, fontFamily: Fonts.monoSemi }}>
                  RESEND CODE
                </Text>
              </Text>
              <Text
                onPress={() => void signOut()}
                style={{
                  marginTop: 12,
                  color: theme.text3,
                  fontFamily: Fonts.monoMedium,
                  fontSize: 11,
                  letterSpacing: 0.5,
                }}
              >
                WRONG ACCOUNT?{' '}
                <Text style={{ color: theme.text2, fontFamily: Fonts.monoSemi }}>SIGN OUT</Text>
              </Text>
            </View>
          </>
        ) : null}

        {step === 'already' ? (
          <View style={styles.centered}>
            {heroBox('check')}
            <Text style={[styles.h1, { color: theme.text, textAlign: 'center' }]}>
              Already verified
            </Text>
            <Text style={[styles.sub, { color: theme.text2, textAlign: 'center', maxWidth: 280 }]}>
              Your email is already on file. You&apos;re good to go.
            </Text>
            <View style={{ width: '100%', maxWidth: 320, marginTop: 12 }}>
              <NeonButton onPress={onContinue}>Continue →</NeonButton>
            </View>
          </View>
        ) : null}

        {step === 'done' ? (
          <View style={styles.centered}>
            <View
              style={[
                styles.doneCircle,
                { backgroundColor: theme.neonDim, borderColor: theme.neon },
              ]}
            >
              <Icon name="check" size={40} color={theme.neon} stroke={3} />
            </View>
            <Text style={[styles.h1, { color: theme.text, textAlign: 'center' }]}>
              Email verified
            </Text>
            <Text style={[styles.sub, { color: theme.text2, textAlign: 'center', maxWidth: 280 }]}>
              Thanks. You&apos;re all set.
            </Text>
            <View style={{ width: '100%', maxWidth: 320, marginTop: 12 }}>
              <NeonButton onPress={onContinue}>Continue →</NeonButton>
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
  errTxt: {
    fontFamily: Fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 0.5,
    marginTop: 8,
  },
  centered: {
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
