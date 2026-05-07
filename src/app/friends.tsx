import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Avatar } from '@/components/atoms/Avatar';
import { Icon } from '@/components/atoms/Icon';
import { SectionHeader } from '@/components/atoms/SectionHeader';
import { ScreenHeader } from '@/components/nav/ScreenHeader';
import { useFriends } from '@/hooks/useFriends';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';
import type { BackendFriendUser } from '@/types/domain';

type Tab = 'friends' | 'incoming' | 'outgoing' | 'blocked';

export default function FriendsScreen() {
  const theme = useTheme();
  const {
    friends,
    incoming,
    outgoing,
    blocked,
    loading,
    error,
    refetch,
    acceptRequest,
    declineRequest,
    removeFriend,
    unblock,
  } = useFriends();
  const [tab, setTab] = useState<Tab>('friends');

  const tabs: { key: Tab; label: string; count: number }[] = useMemo(
    () => [
      { key: 'friends', label: 'Friends', count: friends.length },
      { key: 'incoming', label: 'Requests', count: incoming.length },
      { key: 'outgoing', label: 'Sent', count: outgoing.length },
      { key: 'blocked', label: 'Blocked', count: blocked.length },
    ],
    [friends.length, incoming.length, outgoing.length, blocked.length],
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScreenHeader title="Friends" />

      <View style={styles.tabsRow}>
        {tabs.map((t) => {
          const active = t.key === tab;
          return (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              style={[
                styles.tabBtn,
                {
                  backgroundColor: active ? theme.neon : 'transparent',
                  borderColor: active ? 'transparent' : theme.line,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabTxt,
                  { color: active ? '#06091A' : theme.text2 },
                ]}
              >
                {t.label} {t.count > 0 ? `· ${t.count}` : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => void refetch()} tintColor={theme.text3} />
        }
      >
        {error ? (
          <Text style={[styles.empty, { color: theme.text3 }]}>{error.message}</Text>
        ) : null}

        {loading && !error && tabs.every((t) => t.count === 0) ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={theme.text3} />
        ) : null}

        {tab === 'friends' ? (
          <Section
            empty="No friends yet — search for users and send a request."
            items={friends}
            renderItem={(u) => (
              <UserRow
                key={u.id}
                user={u}
                trailing={
                  <ActionButton
                    label="Friends"
                    icon="check"
                    onPress={() =>
                      Alert.alert('Remove friend', `Remove ${u.username}?`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Remove', style: 'destructive', onPress: () => void removeFriend(u.id) },
                      ])
                    }
                  />
                }
              />
            )}
          />
        ) : null}

        {tab === 'incoming' ? (
          <Section
            empty="No friend requests."
            items={incoming}
            renderItem={(r) =>
              r.requester ? (
                <UserRow
                  key={r.id}
                  user={r.requester}
                  trailing={
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <ActionButton label="Accept" primary onPress={() => void acceptRequest(r.id)} />
                      <ActionButton label="Decline" onPress={() => void declineRequest(r.id)} />
                    </View>
                  }
                />
              ) : null
            }
          />
        ) : null}

        {tab === 'outgoing' ? (
          <Section
            empty="No pending sent requests."
            items={outgoing}
            renderItem={(r) =>
              r.addressee ? (
                <UserRow key={r.id} user={r.addressee} trailing={<PendingPill />} />
              ) : null
            }
          />
        ) : null}

        {tab === 'blocked' ? (
          <Section
            empty="No blocked users."
            items={blocked}
            renderItem={(u) => (
              <UserRow
                key={u.id}
                user={u}
                trailing={<ActionButton label="Unblock" onPress={() => void unblock(u.id)} />}
              />
            )}
          />
        ) : null}

        {tab === 'friends' && friends.length > 0 ? (
          <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
            <SectionHeader title="More actions" />
            <Text style={{ color: theme.text3, fontFamily: Fonts.uiRegular, fontSize: 12 }}>
              To block someone, open their profile and tap the menu.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Section<T>({
  items,
  renderItem,
  empty,
}: {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  empty: string;
}) {
  const theme = useTheme();
  if (items.length === 0) {
    return <Text style={[styles.empty, { color: theme.text3 }]}>{empty}</Text>;
  }
  return <View style={{ paddingHorizontal: 16, gap: 6 }}>{items.map((it) => renderItem(it))}</View>;
}

function UserRow({
  user,
  trailing,
}: {
  user: BackendFriendUser;
  trailing?: React.ReactNode;
}) {
  const theme = useTheme();
  const router = useRouter();
  return (
    <View style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <Pressable onPress={() => router.push(`/user/${user.id}`)}>
        <Avatar author={{ username: user.username, avatarUrl: user.avatarUrl }} size={40} />
      </Pressable>
      <Pressable style={{ flex: 1 }} onPress={() => router.push(`/user/${user.id}`)}>
        <Text style={{ fontFamily: Fonts.dispBold, fontSize: 14, color: theme.text }}>
          {user.username}
        </Text>
        {typeof user.points === 'number' ? (
          <Text style={{ fontFamily: Fonts.monoRegular, fontSize: 11, color: theme.text3 }}>
            {user.points} pts
          </Text>
        ) : null}
      </Pressable>
      {trailing}
    </View>
  );
}

function ActionButton({
  label,
  icon,
  primary = false,
  onPress,
}: {
  label: string;
  icon?: 'check';
  primary?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.actionBtn,
        {
          backgroundColor: primary ? theme.neon : 'transparent',
          borderColor: primary ? 'transparent' : theme.line,
          borderWidth: primary ? 0 : 1,
        },
      ]}
    >
      {icon ? <Icon name={icon} size={14} stroke={2.4} color={primary ? '#06091A' : theme.text2} /> : null}
      <Text style={[styles.actionTxt, { color: primary ? '#06091A' : theme.text2 }]}>{label}</Text>
    </Pressable>
  );
}

function PendingPill() {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.actionBtn,
        { backgroundColor: 'transparent', borderColor: theme.line, borderWidth: 1 },
      ]}
    >
      <Text style={[styles.actionTxt, { color: theme.text3 }]}>Pending</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  tabTxt: {
    fontFamily: Fonts.dispBold,
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  actionTxt: {
    fontFamily: Fonts.dispBold,
    fontSize: 12,
  },
  empty: {
    textAlign: 'center',
    fontFamily: Fonts.uiRegular,
    fontSize: 13,
    paddingHorizontal: 32,
    marginTop: 32,
  },
});
