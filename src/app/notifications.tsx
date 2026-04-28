import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/atoms/Avatar';
import { ScreenHeader } from '@/components/nav/ScreenHeader';
import { NOTIFICATIONS } from '@/data/notifications';
import { USERS } from '@/data/users';
import { withAlpha } from '@/lib/colors';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';
import type { AppNotification, NotificationKind } from '@/types/domain';

import type { Theme } from '@/theme/tokens';

const KIND_ICON: Record<NotificationKind, string> = {
  win: '✓',
  loss: '✕',
  like: '♥',
  comment: '💬',
  friend: '+',
  group: '⌘',
  leader: '▲',
  kickoff: '◐',
  badge: '★',
  follow: '+',
};

const kindColor = (theme: Theme, kind: NotificationKind): string => {
  switch (kind) {
    case 'win':
    case 'leader':
    case 'badge':
    case 'friend':
      return theme.neon;
    case 'loss':
      return theme.loss;
    case 'like':
      return '#FF3D7F';
    case 'comment':
    case 'kickoff':
      return theme.pending;
    case 'group':
      return '#FE9F3D';
    case 'follow':
      return '#A78BFA';
  }
};

export default function NotificationsScreen() {
  const theme = useTheme();
  const [items, setItems] = useState<AppNotification[]>(NOTIFICATIONS);
  const unread = items.filter((n) => !n.read).length;
  const today = items.slice(0, 4);
  const earlier = items.slice(4);
  const markAllRead = () => setItems((prev) => prev.map((n) => ({ ...n, read: true })));

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScreenHeader
        title="Notifications"
        right={
          unread > 0 ? (
            <Pressable
              onPress={markAllRead}
              style={[styles.markAll, { borderColor: theme.line }]}
            >
              <Text style={[styles.markAllTxt, { color: theme.text2 }]}>MARK ALL READ</Text>
            </Pressable>
          ) : undefined
        }
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {unread > 0 ? (
          <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
            <View
              style={[
                styles.unreadPill,
                { backgroundColor: theme.neonDim, borderColor: withAlpha(theme.neon, 0.2) },
              ]}
            >
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.neon }} />
              <Text style={{ color: theme.neon, fontFamily: Fonts.monoBold, fontSize: 10, letterSpacing: 0.5 }}>
                {unread} NEW
              </Text>
            </View>
          </View>
        ) : null}
        <Group title="Today" items={today} />
        {earlier.length > 0 ? <Group title="Earlier" items={earlier} /> : null}
      </ScrollView>
    </View>
  );
}

function Group({ title, items }: { title: string; items: AppNotification[] }) {
  const theme = useTheme();
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[styles.groupHeader, { color: theme.text3 }]}>{title.toUpperCase()}</Text>
      <View
        style={[
          styles.list,
          { backgroundColor: theme.surface, borderColor: theme.line },
        ]}
      >
        {items.map((n, i) => (
          <Row key={n.id} n={n} divided={i > 0} />
        ))}
      </View>
    </View>
  );
}

function Row({ n, divided }: { n: AppNotification; divided: boolean }) {
  const theme = useTheme();
  const color = kindColor(theme, n.kind);
  const icon = KIND_ICON[n.kind];
  const u = n.userId ? USERS[n.userId] : null;
  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: !n.read ? withAlpha(theme.neon, 0.06) : 'transparent',
          borderTopWidth: divided ? StyleSheet.hairlineWidth : 0,
          borderTopColor: theme.lineSoft,
        },
      ]}
    >
      <View style={{ position: 'relative' }}>
        {u ? (
          <Avatar user={u} size={36} />
        ) : (
          <View
            style={[
              styles.iconBox,
              { backgroundColor: withAlpha(color, 0.13), borderColor: withAlpha(color, 0.33) },
            ]}
          >
            <Text style={{ color, fontSize: 16, fontFamily: Fonts.dispBlack }}>{icon}</Text>
          </View>
        )}
        {u ? (
          <View style={[styles.kindBadge, { backgroundColor: color, borderColor: theme.surface }]}>
            <Text style={{ color: '#06091A', fontSize: 9, fontFamily: Fonts.dispBlack }}>{icon}</Text>
          </View>
        ) : null}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: theme.text, fontFamily: Fonts.uiRegular, fontSize: 13, lineHeight: 18 }}>
          {n.text}
        </Text>
        {n.sub ? (
          <Text style={{ color: theme.text3, fontFamily: Fonts.monoRegular, fontSize: 11, marginTop: 2, lineHeight: 14 }}>
            {n.sub}
          </Text>
        ) : null}
        <Text style={{ color: theme.text3, fontFamily: Fonts.monoMedium, fontSize: 10, marginTop: 4, letterSpacing: 0.5 }}>
          {n.time.toUpperCase()} AGO
        </Text>
      </View>
      {n.meta ? (
        <Text style={{ color, fontFamily: Fonts.dispBlack, fontSize: 14 }}>{n.meta}</Text>
      ) : null}
      {!n.read ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.neon }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  markAll: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 8,
  },
  markAllTxt: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    letterSpacing: 0.4,
  },
  unreadPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  groupHeader: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  list: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kindBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
