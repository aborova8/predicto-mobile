import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
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
import { ApiError } from '@/lib/api';
import { isValidEmail } from '@/lib/format';
import { useAppState } from '@/state/AppStateContext';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';

const USERNAME_RE = /^[a-zA-Z0-9_.]+$/;

interface FieldErrors {
  username?: string;
  email?: string;
  password?: string;
  general?: string;
}

export default function SignUpScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signUp } = useAppState();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!username.trim()) next.username = 'Required';
    else if (username.length < 3 || username.length > 24) next.username = '3–24 characters';
    else if (!USERNAME_RE.test(username)) next.username = 'Only letters, numbers, _ and .';
    if (!email.trim()) next.email = 'Required';
    else if (!isValidEmail(email)) next.email = 'Invalid email';
    if (!password) next.password = 'Required';
    else if (password.length < 8) next.password = 'At least 8 characters';
    else if (password.length > 72) next.password = 'At most 72 characters';
    return next;
  };

  const onPickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const onSubmit = async () => {
    if (submitting) return;
    const validation = validate();
    if (Object.keys(validation).length) {
      setErrors(validation);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await signUp({
        username: username.trim(),
        email: email.trim(),
        password,
        avatarUri: avatarUri ?? undefined,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        // Backend returns 409 with the specific field message.
        if (err.status === 409) {
          if (/email/i.test(err.message)) setErrors({ email: err.message });
          else if (/username/i.test(err.message)) setErrors({ username: err.message });
          else setErrors({ general: err.message });
        } else if (err.status === 422) {
          setErrors({ general: err.message });
        } else {
          setErrors({ general: err.message ?? 'Sign up failed.' });
        }
      } else {
        setErrors({ general: 'Sign up failed. Try again.' });
      }
    } finally {
      setSubmitting(false);
    }
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
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Icon name="chevronL" size={18} color={theme.text2} />
          <Text style={[styles.backTxt, { color: theme.text2 }]}>BACK</Text>
        </Pressable>

        <Text style={[styles.h1, { color: theme.text }]}>Create your account</Text>
        <Text style={[styles.sub, { color: theme.text2 }]}>
          Pick a username — your slips will live under it.
        </Text>

        <Pressable onPress={onPickAvatar} style={styles.uploaderRow}>
          <View
            style={[
              styles.uploadCircle,
              { backgroundColor: theme.surface, borderColor: theme.line },
            ]}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarPreview} contentFit="cover" />
            ) : (
              <Text style={[styles.plus, { color: theme.text3 }]}>+</Text>
            )}
          </View>
          <View>
            <Text style={[styles.uploadTitle, { color: theme.text }]}>
              {avatarUri ? 'Change photo' : 'Upload photo'}
            </Text>
            <Text style={[styles.uploadSub, { color: theme.text3 }]}>OPTIONAL · JPG OR PNG</Text>
          </View>
        </Pressable>

        <View style={{ gap: 10 }}>
          <View>
            <TextInput
              value={username}
              onChangeText={(v) => {
                setUsername(v);
                if (errors.username) setErrors((p) => ({ ...p, username: undefined }));
              }}
              placeholder="Username"
              placeholderTextColor={theme.text3}
              autoCapitalize="none"
              autoComplete="username-new"
              editable={!submitting}
              style={[styles.input, { backgroundColor: theme.surface, borderColor: errors.username ? theme.loss : theme.line, color: theme.text }]}
            />
            {errors.username ? <Text style={[styles.fieldErr, { color: theme.loss }]}>{errors.username.toUpperCase()}</Text> : null}
          </View>
          <View>
            <TextInput
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
              }}
              placeholder="Email"
              placeholderTextColor={theme.text3}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              editable={!submitting}
              style={[styles.input, { backgroundColor: theme.surface, borderColor: errors.email ? theme.loss : theme.line, color: theme.text }]}
            />
            {errors.email ? <Text style={[styles.fieldErr, { color: theme.loss }]}>{errors.email.toUpperCase()}</Text> : null}
          </View>
          <View>
            <TextInput
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
              }}
              placeholder="Password"
              placeholderTextColor={theme.text3}
              secureTextEntry
              autoComplete="new-password"
              editable={!submitting}
              style={[styles.input, { backgroundColor: theme.surface, borderColor: errors.password ? theme.loss : theme.line, color: theme.text }]}
            />
            {errors.password ? <Text style={[styles.fieldErr, { color: theme.loss }]}>{errors.password.toUpperCase()}</Text> : null}
          </View>
          {errors.general ? (
            <Text style={[styles.fieldErr, { color: theme.loss }]}>{errors.general.toUpperCase()}</Text>
          ) : null}
        </View>

        <View style={{ marginTop: 16 }}>
          <NeonButton onPress={onSubmit} disabled={submitting}>
            {submitting ? 'Creating…' : 'Create account'}
          </NeonButton>
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
    overflow: 'hidden',
  },
  avatarPreview: {
    width: '100%',
    height: '100%',
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
  fieldErr: {
    fontFamily: Fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 0.5,
    marginTop: 4,
    marginLeft: 2,
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
