import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/atoms/Icon';
import { SectionHeader } from '@/components/atoms/SectionHeader';
import { GROUPS } from '@/data/groups';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';
import type { Group } from '@/types/domain';

export default function GroupsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const matches = (g: Group) =>
    !q || g.name.toLowerCase().includes(q) || (g.desc || '').toLowerCase().includes(q);
  const mine = GROUPS.filter((g) => g.joined && matches(g));
  const discover = GROUPS.filter((g) => !g.joined && matches(g));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingBottom: 120, paddingTop: insets.top + 6 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
        <View style={styles.headRow}>
          <Text style={[styles.h1, { color: theme.text }]}>Groups</Text>
          <Pressable
            onPress={() => router.push('/create-group')}
            style={[styles.newBtn, { backgroundColor: theme.neon }]}
          >
            <Icon name="plus" size={14} stroke={2.4} color="#06091A" />
            <Text style={styles.newTxt}>New</Text>
          </Pressable>
        </View>
        <Text style={[styles.sub, { color: theme.text2 }]}>
          Compete in private leagues with your circle.
        </Text>
        <View style={[styles.search, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          <Icon name="search" size={16} color={theme.text3} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search groups by name"
            placeholderTextColor={theme.text3}
            style={{
              flex: 1,
              fontFamily: Fonts.dispMedium,
              fontSize: 14,
              color: theme.text,
            }}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')}>
              <Icon name="x" size={16} color={theme.text3} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {mine.length === 0 && discover.length === 0 && q ? (
        <View style={[styles.emptySearch, { borderColor: theme.line, marginHorizontal: 16 }]}>
          <Text style={[styles.emptyTxt, { color: theme.text3 }]}>
            NO GROUPS MATCH "{query.toUpperCase()}"
          </Text>
        </View>
      ) : null}

      {mine.length > 0 ? <SectionHeader title="Your groups" /> : null}
      {mine.length > 0 ? (
        <View style={{ paddingHorizontal: 16, gap: 8, marginBottom: 18 }}>
          {mine.map((g) => (
            <Pressable
              key={g.id}
              onPress={() => router.push(`/group/${g.id}`)}
              style={[styles.groupCard, { backgroundColor: theme.surface, borderColor: theme.line }]}
            >
              <View style={[styles.groupBadge, { backgroundColor: g.color }]}>
                <Text style={styles.groupBadgeTxt}>{g.name[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.groupNameRow}>
                  <Text style={[styles.groupName, { color: theme.text }]}>{g.name}</Text>
                  {g.private ? <Icon name="lock" size={12} color={theme.text3} stroke={2.2} /> : null}
                </View>
                <Text style={[styles.groupMeta, { color: theme.text3 }]}>
                  {g.members.toLocaleString()} MEMBERS · #2 RANK
                </Text>
              </View>
              <Icon name="chevron" size={16} color={theme.text3} />
            </Pressable>
          ))}
        </View>
      ) : null}

      {discover.length > 0 ? <SectionHeader title="Discover" /> : null}
      {discover.length > 0 ? (
        <View style={{ paddingHorizontal: 16, gap: 8 }}>
          {discover.map((g) => (
            <View
              key={g.id}
              style={[styles.groupCard, { backgroundColor: theme.surface, borderColor: theme.line }]}
            >
              <View style={[styles.groupBadge, { backgroundColor: g.color }]}>
                <Text style={styles.groupBadgeTxt}>{g.name[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.groupName, { color: theme.text }]}>{g.name}</Text>
                <Text style={[styles.groupMeta, { color: theme.text3 }]}>
                  {g.members.toLocaleString()} MEMBERS
                </Text>
                <Text style={[styles.groupDesc, { color: theme.text2 }]}>{g.desc}</Text>
              </View>
              <Pressable style={[styles.joinBtn, { borderColor: theme.neon }]}>
                <Text style={[styles.joinTxt, { color: theme.neon }]}>Join</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  h1: {
    fontFamily: Fonts.dispBlack,
    fontSize: 26,
    letterSpacing: -0.5,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  newTxt: {
    fontFamily: Fonts.dispBold,
    fontSize: 12,
    color: '#06091A',
  },
  sub: {
    fontFamily: Fonts.uiRegular,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 12,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  emptySearch: {
    paddingVertical: 28,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  emptyTxt: {
    fontFamily: Fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 12,
  },
  groupBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupBadgeTxt: {
    fontFamily: Fonts.dispBlack,
    fontSize: 18,
    color: '#06091A',
  },
  groupNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupName: {
    fontFamily: Fonts.dispBold,
    fontSize: 14,
  },
  groupMeta: {
    fontFamily: Fonts.monoMedium,
    fontSize: 11,
    marginBottom: 2,
  },
  groupDesc: {
    fontFamily: Fonts.uiRegular,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  joinBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  joinTxt: {
    fontFamily: Fonts.dispBold,
    fontSize: 12,
  },
});
