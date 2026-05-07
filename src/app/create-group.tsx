import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Icon } from '@/components/atoms/Icon';
import { ScreenHeader } from '@/components/nav/ScreenHeader';
import { errorMessage } from '@/lib/api';
import { createGroup } from '@/lib/api/groups';
import { withAlpha } from '@/lib/colors';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';

// The color picker is purely ephemeral UX — the chosen color is NOT sent to
// the backend (which has no color field). After creation, the detail screen
// renders a deterministic color derived from the assigned group id, so the
// pick is lost on round-trip. Kept because a stark form is worse than a
// short-lived flourish during creation.
const COLORS = ['#EAFE3D', '#3DD9FE', '#FE3D8B', '#3DFE8B', '#FE9F3D', '#D93DFE', '#FE5C3D', '#3D7AFE'];

export default function CreateGroupScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [color, setColor] = useState('#EAFE3D');
  const [isPrivate, setPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Backend Zod schema requires name 2..60 chars and description up to 500.
  const trimmedName = name.trim();
  const valid = trimmedName.length >= 2 && trimmedName.length <= 60 && !submitting;

  const onSubmit = async () => {
    if (!valid) return;
    setSubmitting(true);
    try {
      const { group } = await createGroup({
        name: trimmedName,
        description: desc.trim() || undefined,
        visibility: isPrivate ? 'PRIVATE' : 'PUBLIC',
      });
      router.replace(`/group/${group.id}`);
    } catch (err) {
      Alert.alert('Could not create group', errorMessage(err, 'Try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScreenHeader title="New group" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        <LinearGradient
          colors={[withAlpha(color, 0.15), 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.preview, { borderColor: withAlpha(color, 0.33) }]}
        >
          <View style={[styles.crest, { backgroundColor: color }]}>
            <Text style={styles.crestTxt}>{(trimmedName[0] ?? '?').toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.previewName, { color: theme.text }]} numberOfLines={1}>
              {trimmedName || 'Group name'}
            </Text>
            <Text style={[styles.previewMeta, { color: theme.text3 }]}>
              1 MEMBER · {isPrivate ? '🔒 PRIVATE' : 'PUBLIC'}
            </Text>
          </View>
        </LinearGradient>

        <FieldLabel>Name</FieldLabel>
        <TextInput
          value={name}
          onChangeText={(t) => setName(t.slice(0, 60))}
          placeholder="The Lads, Office FC…"
          placeholderTextColor={theme.text3}
          editable={!submitting}
          style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.line, color: theme.text }]}
        />
        <Text style={[styles.counter, { color: theme.text3 }]}>{name.length}/60</Text>

        <View style={{ height: 14 }} />
        <FieldLabel>Description (optional)</FieldLabel>
        <TextInput
          value={desc}
          onChangeText={(t) => setDesc(t.slice(0, 500))}
          placeholder="Sunday league predictions, no analysis required."
          placeholderTextColor={theme.text3}
          multiline
          numberOfLines={3}
          editable={!submitting}
          style={[
            styles.input,
            { backgroundColor: theme.surface, borderColor: theme.line, color: theme.text, minHeight: 80, textAlignVertical: 'top' },
          ]}
        />
        <Text style={[styles.counter, { color: theme.text3 }]}>{desc.length}/500</Text>

        <View style={{ height: 18 }} />
        <FieldLabel>Group color</FieldLabel>
        <View style={styles.colorRow}>
          {COLORS.map((c) => {
            const a = c === color;
            return (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={[
                  styles.colorSwatch,
                  {
                    backgroundColor: c,
                    borderColor: a ? theme.text : 'transparent',
                  },
                ]}
              >
                {a ? <Icon name="check" size={18} color="#06091A" stroke={3} /> : null}
              </Pressable>
            );
          })}
        </View>

        <View style={{ height: 22 }} />
        <FieldLabel>Settings</FieldLabel>
        <View style={[styles.toggleCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          <ToggleRow
            label="Private group"
            sub="Only people with the invite code can join. Requires an active subscription."
            value={isPrivate}
            onChange={setPrivate}
          />
        </View>

        {isPrivate ? (
          <View
            style={[
              styles.privacyNote,
              { backgroundColor: theme.neonDim, borderColor: withAlpha(theme.neon, 0.33) },
            ]}
          >
            <Icon name="lock" size={14} color={theme.neon} stroke={2.4} />
            <Text style={[styles.privacyText, { color: theme.text2 }]}>
              You&apos;ll get an invite code after creating the group. Share it to grow your roster.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.cta, { backgroundColor: theme.bg, borderTopColor: theme.lineSoft }]}>
        <Pressable
          disabled={!valid}
          onPress={onSubmit}
          style={[
            styles.ctaBtn,
            {
              backgroundColor: valid ? theme.neon : theme.surface2,
            },
          ]}
        >
          {submitting ? (
            <ActivityIndicator color="#06091A" />
          ) : (
            <>
              <Icon
                name="plus"
                size={16}
                color={valid ? '#06091A' : theme.text3}
                stroke={2.6}
              />
              <Text style={[styles.ctaTxt, { color: valid ? '#06091A' : theme.text3 }]}>
                Create group
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function FieldLabel({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text style={[styles.fieldLabel, { color: theme.text3 }]}>{children.toUpperCase()}</Text>
  );
}

function ToggleRow({
  label,
  sub,
  value,
  onChange,
  divided,
}: {
  label: string;
  sub: string;
  value: boolean;
  onChange: (v: boolean) => void;
  divided?: boolean;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.toggleRow,
        divided && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.lineSoft },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: Fonts.uiSemi, fontSize: 14, color: theme.text }}>{label}</Text>
        <Text style={{ fontFamily: Fonts.monoRegular, fontSize: 11, color: theme.text3, marginTop: 2 }}>
          {sub}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: theme.surface2, true: theme.neon }}
        thumbColor={value ? '#06091A' : theme.text3}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginTop: 8,
    marginBottom: 18,
    borderWidth: 1,
    borderRadius: 16,
  },
  crest: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crestTxt: {
    fontFamily: Fonts.dispBlack,
    fontSize: 24,
    color: '#06091A',
  },
  previewName: {
    fontFamily: Fonts.dispBlack,
    fontSize: 18,
    letterSpacing: -0.3,
  },
  previewMeta: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  fieldLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  input: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 12,
    fontFamily: Fonts.uiRegular,
    fontSize: 14,
  },
  counter: {
    textAlign: 'right',
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    marginTop: 4,
    letterSpacing: 0.4,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorSwatch: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleCard: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  privacyNote: {
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  privacyText: {
    flex: 1,
    fontFamily: Fonts.uiRegular,
    fontSize: 12,
    lineHeight: 16,
  },
  cta: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  ctaBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  ctaTxt: {
    fontFamily: Fonts.dispBlack,
    fontSize: 14,
    letterSpacing: 0.2,
  },
});
