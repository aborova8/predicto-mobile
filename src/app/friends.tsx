import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Avatar } from '@/components/atoms/Avatar';
import { Icon } from '@/components/atoms/Icon';
import { SectionHeader } from '@/components/atoms/SectionHeader';
import { ScreenHeader } from '@/components/nav/ScreenHeader';
import { USERS } from '@/data/users';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';
import type { User } from '@/types/domain';

export default function FriendsScreen() {
  const theme = useTheme();
  const friends = Object.values(USERS).filter((u) => u.friend && !u.isMe);
  const suggested = Object.values(USERS).filter((u) => !u.friend && !u.isMe);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScreenHeader title="Friends" />
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ paddingHorizontal: 16, paddingBottom: 4 }}>
          <View
            style={[
              styles.search,
              { backgroundColor: theme.surface, borderColor: theme.line },
            ]}
          >
            <Icon name="search" size={16} color={theme.text3} />
            <TextInput
              placeholder="Search by username…"
              placeholderTextColor={theme.text3}
              style={{ flex: 1, fontFamily: Fonts.uiRegular, fontSize: 13, color: theme.text }}
            />
          </View>
        </View>

        <SectionHeader title={`Your friends · ${friends.length}`} />
        <View style={{ paddingHorizontal: 16, gap: 6, marginBottom: 18 }}>
          {friends.map((u) => (
            <FriendRow key={u.id} u={u} added />
          ))}
        </View>

        <SectionHeader title="Suggested" />
        <View style={{ paddingHorizontal: 16, gap: 6 }}>
          {suggested.map((u) => (
            <FriendRow key={u.id} u={u} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function FriendRow({ u, added = false }: { u: User; added?: boolean }) {
  const theme = useTheme();
  const router = useRouter();
  const [a, setA] = useState(added);
  return (
    <View
      style={[
        styles.row,
        { backgroundColor: theme.surface, borderColor: theme.line },
      ]}
    >
      <Pressable onPress={() => router.push(`/user/${u.id}`)}>
        <Avatar user={u} size={40} />
      </Pressable>
      <Pressable style={{ flex: 1 }} onPress={() => router.push(`/user/${u.id}`)}>
        <Text style={{ fontFamily: Fonts.dispBold, fontSize: 14, color: theme.text }}>{u.name}</Text>
        <Text style={{ fontFamily: Fonts.monoRegular, fontSize: 11, color: theme.text3 }}>
          @{u.handle} · LVL {u.level} · {u.hitRate}%
        </Text>
      </Pressable>
      <Pressable
        onPress={() => setA(!a)}
        style={[
          styles.actionBtn,
          {
            backgroundColor: a ? 'transparent' : theme.neon,
            borderColor: a ? theme.line : 'transparent',
            borderWidth: a ? 1 : 0,
          },
        ]}
      >
        {a ? (
          <>
            <Icon name="check" size={14} stroke={2.4} color={theme.text2} />
            <Text style={[styles.actionTxt, { color: theme.text2 }]}>Friends</Text>
          </>
        ) : (
          <Text style={[styles.actionTxt, { color: '#06091A' }]}>+ Add</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 4,
    marginBottom: 8,
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
});
