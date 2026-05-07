import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Avatar } from '@/components/atoms/Avatar';
import { ScreenHeader } from '@/components/nav/ScreenHeader';
import { useNotifications } from '@/hooks/useNotifications';
import { withAlpha } from '@/lib/colors';
import { notificationToApp } from '@/lib/notificationCopy';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';
import type {
  AppNotification,
  BackendNotification,
  NotificationKind,
} from '@/types/domain';

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

const TODAY_THRESHOLD_MS = 24 * 60 * 60 * 1000;

interface UiItem {
  app: AppNotification;
  raw: BackendNotification;
}

export default function NotificationsScreen() {
  const theme = useTheme();
  const { items, unreadCount, isLoading, error, refresh, markAllRead, markRead } = useNotifications();

  const { today, earlier } = useMemo(() => {
    const now = Date.now();
    const ui: UiItem[] = items.map((n) => ({ app: notificationToApp(n), raw: n }));
    const todayList: UiItem[] = [];
    const earlierList: UiItem[] = [];
    for (const it of ui) {
      const age = now - new Date(it.raw.createdAt).getTime();
      if (age <= TODAY_THRESHOLD_MS) todayList.push(it);
      else earlierList.push(it);
    }
    return { today: todayList, earlier: earlierList };
  }, [items]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScreenHeader
        title="Notifications"
        right={
          unreadCount > 0 ? (
            <Pressable
              onPress={() => void markAllRead()}
              style={[styles.markAll, { borderColor: theme.line }]}
            >
              <Text style={[styles.markAllTxt, { color: theme.text2 }]}>MARK ALL READ</Text>
            </Pressable>
          ) : undefined
        }
      />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && items.length > 0}
            onRefresh={() => void refresh()}
            tintColor={theme.text3}
          />
        }
      >
        {error ? (
          <Text
            style={{
              color: theme.loss,
              fontFamily: Fonts.uiRegular,
              fontSize: 13,
              padding: 16,
              textAlign: 'center',
            }}
          >
            {error.message}
          </Text>
        ) : null}

        {isLoading && items.length === 0 ? (
          <ActivityIndicator color={theme.text3} style={{ marginTop: 80 }} />
        ) : null}

        {!isLoading && items.length === 0 ? (
          <View style={{ padding: 60, alignItems: 'center' }}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>🔔</Text>
            <Text style={{ color: theme.text, fontFamily: Fonts.dispBold, fontSize: 16 }}>
              All quiet
            </Text>
            <Text
              style={{
                color: theme.text3,
                fontFamily: Fonts.monoMedium,
                fontSize: 11,
                letterSpacing: 0.4,
                marginTop: 4,
              }}
            >
              YOU&apos;LL SEE LIKES, COMMENTS, AND TICKET RESULTS HERE
            </Text>
          </View>
        ) : null}

        {unreadCount > 0 ? (
          <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
            <View
              style={[
                styles.unreadPill,
                { backgroundColor: theme.neonDim, borderColor: withAlpha(theme.neon, 0.2) },
              ]}
            >
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.neon }} />
              <Text style={{ color: theme.neon, fontFamily: Fonts.monoBold, fontSize: 10, letterSpacing: 0.5 }}>
                {unreadCount} NEW
              </Text>
            </View>
          </View>
        ) : null}

        {today.length > 0 ? <Group title="Today" items={today} onPress={(id) => void markRead(id)} /> : null}
        {earlier.length > 0 ? (
          <Group title="Earlier" items={earlier} onPress={(id) => void markRead(id)} />
        ) : null}
      </ScrollView>
    </View>
  );
}

function Group({
  title,
  items,
  onPress,
}: {
  title: string;
  items: UiItem[];
  onPress: (id: string) => void;
}) {
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
        {items.map((it, i) => (
          <Row key={it.app.id} item={it} divided={i > 0} onPress={() => onPress(it.app.id)} />
        ))}
      </View>
    </View>
  );
}

function Row({
  item,
  divided,
  onPress,
}: {
  item: UiItem;
  divided: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const router = useRouter();
  const { app, raw } = item;
  const color = kindColor(theme, app.kind);
  const icon = KIND_ICON[app.kind];

  const navigate = () => {
    onPress();
    if (raw.post) {
      router.push(`/comments?postId=${encodeURIComponent(raw.post.id)}`);
    } else if (raw.ticket) {
      router.push(`/ticket/${raw.ticket.id}`);
    } else if (raw.group) {
      router.push(`/group/${raw.group.id}`);
    } else if (raw.actor) {
      router.push(`/user/${raw.actor.id}`);
    }
  };

  return (
    <Pressable
      onPress={navigate}
      style={[
        styles.row,
        {
          backgroundColor: !app.read ? withAlpha(theme.neon, 0.06) : 'transparent',
          borderTopWidth: divided ? StyleSheet.hairlineWidth : 0,
          borderTopColor: theme.lineSoft,
        },
      ]}
    >
      <View style={{ position: 'relative' }}>
        {raw.actor ? (
          <Avatar
            author={{ username: raw.actor.username, avatarUrl: raw.actor.avatarUrl }}
            size={36}
          />
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
        {raw.actor ? (
          <View style={[styles.kindBadge, { backgroundColor: color, borderColor: theme.surface }]}>
            <Text style={{ color: '#06091A', fontSize: 9, fontFamily: Fonts.dispBlack }}>{icon}</Text>
          </View>
        ) : null}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: theme.text, fontFamily: Fonts.uiRegular, fontSize: 13, lineHeight: 18 }}>
          {app.text}
        </Text>
        {app.sub ? (
          <Text style={{ color: theme.text3, fontFamily: Fonts.monoRegular, fontSize: 11, marginTop: 2, lineHeight: 14 }}>
            {app.sub}
          </Text>
        ) : null}
        <Text style={{ color: theme.text3, fontFamily: Fonts.monoMedium, fontSize: 10, marginTop: 4, letterSpacing: 0.5 }}>
          {app.time.toUpperCase()} AGO
        </Text>
      </View>
      {!app.read ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.neon }} /> : null}
    </Pressable>
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
