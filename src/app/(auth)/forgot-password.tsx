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
import { withAlpha } from '@/lib/colors';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';

type Step = 'email' | 'sent' | 'reset' | 'done';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const inputs = useRef<(TextInput | null)[]>([]);

  const emailValid = /^\S+@\S+\.\S+$/.test(email);
  const codeFull = code.every((d) => d.length === 1);
  const pwValid = pw.length >= 8 && pw === pw2;

  const onCodeChange = (i: number, val: string) => {
    const v = val.replace(/[^0-9]/g, '').slice(0, 1);
    setCode((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
    if (v && i < 5) inputs.current[i + 1]?.focus();
  };

  const onCodeKey = (i: number, key: string) => {
    if (key === 'Backspace' && !code[i] && i > 0) inputs.current[i - 1]?.focus();
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
              No worries — happens to the best of us. Enter the email on your account and we'll send a 6-digit reset code.
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email address"
              placeholderTextColor={theme.text3}
              autoFocus
              autoCapitalize="none"
              keyboardType="email-address"
              style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.line, color: theme.text }]}
            />
            <View style={{ marginTop: 18 }}>
              <NeonButton onPress={() => emailValid && setStep('sent')} disabled={!emailValid}>
                Send reset code →
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
              . It's good for 10 minutes.
            </Text>
            <View style={styles.codeRow}>
              {code.map((d, i) => (
                <TextInput
                  key={i}
                  ref={(el) => {
                    inputs.current[i] = el;
                  }}
                  value={d}
                  onChangeText={(v) => onCodeChange(i, v)}
                  onKeyPress={({ nativeEvent }) => onCodeKey(i, nativeEvent.key)}
                  keyboardType="number-pad"
                  maxLength={1}
                  autoFocus={i === 0}
                  style={[
                    styles.codeBox,
                    {
                      backgroundColor: theme.surface,
                      borderColor: d ? withAlpha(theme.neon, 0.53) : theme.line,
                      color: theme.text,
                    },
                  ]}
                />
              ))}
            </View>
            <View style={{ marginTop: 18 }}>
              <NeonButton onPress={() => codeFull && setStep('reset')} disabled={!codeFull}>
                Verify code →
              </NeonButton>
            </View>
            <View style={{ alignItems: 'center', marginTop: 28 }}>
              <Text style={{ color: theme.text3, fontFamily: Fonts.monoMedium, fontSize: 11, letterSpacing: 0.5 }}>
                DIDN'T GET IT?{' '}
                <Text style={{ color: theme.neon, fontFamily: Fonts.monoSemi }}>RESEND CODE</Text>
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
                onChangeText={setPw}
                placeholder="New password"
                placeholderTextColor={theme.text3}
                secureTextEntry
                autoFocus
                style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.line, color: theme.text }]}
              />
              <TextInput
                value={pw2}
                onChangeText={setPw2}
                placeholder="Confirm new password"
                placeholderTextColor={theme.text3}
                secureTextEntry
                style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.line, color: theme.text }]}
              />
              {pw && pw2 && pw !== pw2 ? (
                <Text style={{ color: theme.loss, fontFamily: Fonts.monoMedium, fontSize: 11, letterSpacing: 0.4 }}>
                  PASSWORDS DON'T MATCH
                </Text>
              ) : null}
            </View>
            <View style={{ marginTop: 18 }}>
              <NeonButton onPress={() => pwValid && setStep('done')} disabled={!pwValid}>
                Reset password →
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
              You're back in
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
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  codeBox: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    fontFamily: Fonts.dispBlack,
    fontSize: 24,
    textAlign: 'center',
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
