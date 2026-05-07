import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Avatar } from '@/components/atoms/Avatar';
import { Icon } from '@/components/atoms/Icon';
import { ScreenHeader } from '@/components/nav/ScreenHeader';
import { ApiError } from '@/lib/api';
import { updateMyProfile, updateMyProfileMultipart } from '@/lib/api/users';
import { useAppState } from '@/state/AppStateContext';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';

export default function EditProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, refreshUser } = useAppState();
  const [username, setUsername] = useState(user?.username ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [avatar, setAvatar] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [saving, setSaving] = useState(false);

  const dirty =
    username !== (user?.username ?? '') ||
    bio !== (user?.bio ?? '') ||
    avatar !== null;

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Please grant photo access to change your avatar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatar(result.assets[0]);
    }
  };

  const onSave = async () => {
    setSaving(true);
    try {
      if (avatar) {
        await updateMyProfileMultipart({
          username: username !== (user?.username ?? '') ? username : undefined,
          bio: bio !== (user?.bio ?? '') ? bio : undefined,
          avatar: { uri: avatar.uri, mimeType: avatar.mimeType, fileName: avatar.fileName },
        });
      } else {
        await updateMyProfile({
          username: username !== (user?.username ?? '') ? username : undefined,
          bio: bio !== (user?.bio ?? '') ? bio : undefined,
        });
      }
      await refreshUser();
      router.back();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to update profile';
      Alert.alert('Update failed', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScreenHeader title="Edit profile" />
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ alignItems: 'center', paddingVertical: 24 }}>
          <Pressable onPress={pickImage}>
            {avatar ? (
              <Image source={{ uri: avatar.uri }} style={{ width: 96, height: 96, borderRadius: 48 }} />
            ) : (
              <Avatar
                author={{
                  username: user?.username ?? '?',
                  avatarUrl: user?.avatarUrl ?? null,
                }}
                size={96}
                ring
              />
            )}
            <View
              style={[
                styles.cameraBadge,
                { backgroundColor: theme.neon, borderColor: theme.bg },
              ]}
            >
              <Icon name="plus" size={14} color="#06091A" stroke={2.4} />
            </View>
          </Pressable>
          <Text style={[styles.changeTxt, { color: theme.text3 }]}>Tap to change avatar</Text>
        </View>

        <Field label="Username">
          <TextInput
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, { color: theme.text, borderColor: theme.line, backgroundColor: theme.surface }]}
            placeholderTextColor={theme.text3}
          />
        </Field>

        <Field label="Bio">
          <TextInput
            value={bio ?? ''}
            onChangeText={setBio}
            multiline
            maxLength={280}
            placeholder="Tell people about yourself…"
            placeholderTextColor={theme.text3}
            style={[
              styles.input,
              styles.bioInput,
              { color: theme.text, borderColor: theme.line, backgroundColor: theme.surface },
            ]}
          />
          <Text style={{ color: theme.text3, fontSize: 11, fontFamily: Fonts.monoRegular, marginTop: 4 }}>
            {(bio ?? '').length}/280
          </Text>
        </Field>

        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <Pressable
            onPress={onSave}
            disabled={!dirty || saving}
            style={[
              styles.saveBtn,
              { backgroundColor: dirty && !saving ? theme.neon : theme.surface },
            ]}
          >
            {saving ? (
              <ActivityIndicator color="#06091A" />
            ) : (
              <Text style={[styles.saveTxt, { color: dirty ? '#06091A' : theme.text3 }]}>
                Save changes
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
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeTxt: {
    fontFamily: Fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 0.4,
    marginTop: 10,
  },
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
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
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
