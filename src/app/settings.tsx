import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Icon, type IconName } from '@/components/atoms/Icon';
import { SectionHeader } from '@/components/atoms/SectionHeader';
import { ScreenHeader } from '@/components/nav/ScreenHeader';
import { useFriends } from '@/hooks/useFriends';
import { useSettings } from '@/hooks/useSettings';
import { ApiError } from '@/lib/api';
import { deleteAccount } from '@/lib/api/users';
import { useAppState } from '@/state/AppStateContext';
import { Fonts } from '@/theme/fonts';
import { useTheme, useThemeCtx } from '@/theme/ThemeContext';
import type { FeedLayout, ThemeName, TicketVariant } from '@/types/domain';

function privacyLabel(profilePublic: boolean | undefined): string {
  if (profilePublic === undefined) return '—';
  return profilePublic ? 'Public' : 'Private';
}

export default function SettingsScreen() {
  const theme = useTheme();
  const { name: themeName, setName: setThemeName } = useThemeCtx();
  const router = useRouter();
  const {
    signOut,
    ticketVariant,
    setTicketVariant,
    feedLayout,
    setFeedLayout,
  } = useAppState();
  const { settings, updatePrivacy, updateNotificationPrefs } = useSettings();
  const { friends } = useFriends();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const privacySummary = privacyLabel(settings?.privacy?.profilePublic);
  const subSummary = settings?.user
    ? `${settings.user.livesBalance} lives`
    : '—';

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScreenHeader title="Settings" />
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <SectionHeader title="Account" />
        <Card>
          <Item
            icon="profile"
            label="Edit profile"
            onPress={() => router.push('/edit-profile')}
          />
          <Item
            icon="lock"
            label="Change password"
            divided
            onPress={() => router.push('/change-password')}
          />
          <Item
            icon="people"
            label="Friends"
            detail={friends.length > 0 ? `${friends.length} friends` : undefined}
            divided
            onPress={() => router.push('/friends')}
          />
        </Card>

        <SectionHeader title="Privacy" />
        <Card>
          <ToggleItem
            icon="eye"
            label="Public profile"
            value={settings?.privacy?.profilePublic ?? true}
            onChange={(v) => void updatePrivacy({ profilePublic: v })}
          />
          <ToggleItem
            icon="trophy"
            label="Show on leaderboard"
            divided
            value={settings?.privacy?.showOnLeaderboard ?? true}
            onChange={(v) => void updatePrivacy({ showOnLeaderboard: v })}
          />
          <ToggleItem
            icon="add-friend"
            label="Allow friend requests"
            divided
            value={settings?.privacy?.allowFriendRequests ?? true}
            onChange={(v) => void updatePrivacy({ allowFriendRequests: v })}
          />
        </Card>

        <SectionHeader title="Notifications" />
        <Card>
          <ToggleItem
            icon="heart"
            label="Likes"
            value={settings?.notifications?.pushLikes ?? true}
            onChange={(v) => void updateNotificationPrefs({ pushLikes: v })}
          />
          <ToggleItem
            icon="comment"
            label="Comments"
            divided
            value={settings?.notifications?.pushComments ?? true}
            onChange={(v) => void updateNotificationPrefs({ pushComments: v })}
          />
          <ToggleItem
            icon="add-friend"
            label="Friend requests"
            divided
            value={settings?.notifications?.pushFriendReqs ?? true}
            onChange={(v) => void updateNotificationPrefs({ pushFriendReqs: v })}
          />
          <ToggleItem
            icon="trophy"
            label="Ticket results"
            divided
            value={settings?.notifications?.pushResults ?? true}
            onChange={(v) => void updateNotificationPrefs({ pushResults: v })}
          />
          <ToggleItem
            icon="people"
            label="Group invites"
            divided
            value={settings?.notifications?.pushGroupInvites ?? true}
            onChange={(v) => void updateNotificationPrefs({ pushGroupInvites: v })}
          />
          <ToggleItem
            icon="bell"
            label="Email digest"
            divided
            value={settings?.notifications?.emailDigest ?? false}
            onChange={(v) => void updateNotificationPrefs({ emailDigest: v })}
          />
        </Card>

        <SectionHeader title="Appearance" />
        <Card>
          <SegItem
            icon="star"
            label="Theme"
            options={(['dark', 'light', 'pitch'] as ThemeName[]).map((v) => ({
              value: v,
              label: v[0].toUpperCase() + v.slice(1),
            }))}
            value={themeName}
            onChange={(v) => setThemeName(v as ThemeName)}
          />
          <SegItem
            icon="comment"
            label="Ticket card"
            divided
            options={(['slip', 'card'] as TicketVariant[]).map((v) => ({
              value: v,
              label: v[0].toUpperCase() + v.slice(1),
            }))}
            value={ticketVariant}
            onChange={(v) => setTicketVariant(v as TicketVariant)}
          />
          <SegItem
            icon="filter"
            label="Feed density"
            divided
            options={(['card', 'compact'] as FeedLayout[]).map((v) => ({
              value: v,
              label: v[0].toUpperCase() + v.slice(1),
            }))}
            value={feedLayout}
            onChange={(v) => setFeedLayout(v as FeedLayout)}
          />
        </Card>

        <SectionHeader title="Subscriptions" />
        <Card>
          <Item
            icon="star"
            label="Manage subscription"
            detail={subSummary}
            onPress={() => router.push('/paywall')}
          />
        </Card>

        <SectionHeader title="Legal" />
        <Card>
          <Item
            icon="comment"
            label="Terms of service"
            onPress={() => router.push({ pathname: '/legal', params: { doc: 'terms' } })}
          />
          <Item
            icon="lock"
            label="Privacy policy"
            divided
            onPress={() => router.push({ pathname: '/legal', params: { doc: 'privacy' } })}
          />
        </Card>

        <View style={{ paddingHorizontal: 16, paddingTop: 6, gap: 10 }}>
          <Pressable
            onPress={() => void signOut()}
            style={[styles.signOut, { backgroundColor: theme.surface, borderColor: theme.line }]}
          >
            <Icon name="logout" size={16} color={theme.loss} stroke={2} />
            <Text style={[styles.signOutTxt, { color: theme.loss }]}>Sign out</Text>
          </Pressable>
          <Pressable
            onPress={() => setDeleteOpen(true)}
            style={[styles.signOut, { backgroundColor: 'transparent', borderColor: theme.loss }]}
          >
            <Text style={[styles.signOutTxt, { color: theme.loss }]}>Delete account</Text>
          </Pressable>
          <Text style={[styles.version, { color: theme.text3 }]}>
            PREDICTO v{Constants.expoConfig?.version ?? '—'} · {privacySummary}
          </Text>
        </View>
      </ScrollView>

      <DeleteAccountModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onDeleted={() => void signOut()}
      />
    </View>
  );
}

function DeleteAccountModal({
  open,
  onClose,
  onDeleted,
}: {
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const theme = useTheme();
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const onConfirm = async () => {
    if (confirmText !== 'DELETE') return;
    setDeleting(true);
    try {
      await deleteAccount();
      setConfirmText('');
      onClose();
      onDeleted();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to delete account';
      Alert.alert('Delete failed', msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.modalBackdrop, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
        <View style={[styles.modalCard, { backgroundColor: theme.bg, borderColor: theme.line }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Delete account?</Text>
          <Text style={[styles.modalBody, { color: theme.text2 }]}>
            This is permanent. Your tickets, posts, comments, and group memberships will be removed.
            Type DELETE to confirm.
          </Text>
          <TextInput
            value={confirmText}
            onChangeText={setConfirmText}
            placeholder="DELETE"
            placeholderTextColor={theme.text3}
            autoCapitalize="characters"
            style={[
              styles.modalInput,
              { color: theme.text, borderColor: theme.line, backgroundColor: theme.surface },
            ]}
          />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <Pressable
              onPress={onClose}
              style={[styles.modalBtn, { borderColor: theme.line, borderWidth: 1 }]}
            >
              <Text style={[styles.modalBtnTxt, { color: theme.text }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={confirmText !== 'DELETE' || deleting}
              style={[
                styles.modalBtn,
                {
                  backgroundColor:
                    confirmText === 'DELETE' && !deleting ? theme.loss : theme.surface,
                },
              ]}
            >
              <Text
                style={[
                  styles.modalBtnTxt,
                  { color: confirmText === 'DELETE' ? '#fff' : theme.text3 },
                ]}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.line },
      ]}
    >
      {children}
    </View>
  );
}

function Item({
  icon,
  label,
  detail,
  divided,
  onPress,
}: {
  icon: IconName;
  label: string;
  detail?: string;
  divided?: boolean;
  onPress?: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.item,
        divided && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.lineSoft },
      ]}
    >
      <Icon name={icon} size={18} color={theme.text2} />
      <Text style={{ flex: 1, fontFamily: Fonts.uiMedium, fontSize: 14, color: theme.text }}>
        {label}
      </Text>
      {detail ? (
        <Text style={{ fontFamily: Fonts.monoRegular, fontSize: 11, color: theme.text3 }}>{detail}</Text>
      ) : null}
      <Icon name="chevron" size={14} color={theme.text3} />
    </Pressable>
  );
}

function ToggleItem({
  icon,
  label,
  value,
  onChange,
  divided,
}: {
  icon: IconName;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  divided?: boolean;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.item,
        divided && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.lineSoft },
      ]}
    >
      <Icon name={icon} size={18} color={theme.text2} />
      <Text style={{ flex: 1, fontFamily: Fonts.uiMedium, fontSize: 14, color: theme.text }}>
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: theme.surface2, true: theme.neon }}
      />
    </View>
  );
}

function SegItem({
  icon,
  label,
  options,
  value,
  onChange,
  divided,
}: {
  icon: IconName;
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  divided?: boolean;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.segItem,
        divided && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.lineSoft },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <Icon name={icon} size={18} color={theme.text2} />
        <Text style={{ fontFamily: Fonts.uiMedium, fontSize: 14, color: theme.text }}>{label}</Text>
      </View>
      <View style={[styles.seg, { backgroundColor: theme.surface2 }]}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onChange(o.value)}
              style={[
                styles.segBtn,
                {
                  backgroundColor: active ? theme.neon : 'transparent',
                },
              ]}
            >
              <Text
                style={{
                  fontFamily: Fonts.dispBold,
                  fontSize: 12,
                  color: active ? '#06091A' : theme.text2,
                }}
              >
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  segItem: {
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  seg: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: 10,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOut: {
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  signOutTxt: {
    fontFamily: Fonts.dispBold,
    fontSize: 14,
  },
  version: {
    textAlign: 'center',
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 0.5,
    marginTop: 16,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontFamily: Fonts.dispBlack,
    fontSize: 18,
    marginBottom: 8,
  },
  modalBody: {
    fontFamily: Fonts.uiRegular,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  modalInput: {
    fontFamily: Fonts.monoMedium,
    fontSize: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 10,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalBtnTxt: {
    fontFamily: Fonts.dispBold,
    fontSize: 13,
  },
});
