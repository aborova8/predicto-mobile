import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/atoms/Avatar';
import { Icon } from '@/components/atoms/Icon';
import { Pill } from '@/components/atoms/Pill';
import { SectionHeader } from '@/components/atoms/SectionHeader';
import { GROUPS } from '@/data/groups';
import { USERS } from '@/data/users';
import { withAlpha } from '@/lib/colors';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';

export default function GroupDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const g = GROUPS.find((x) => x.id === id) ?? GROUPS[0];
  const members = Object.values(USERS).slice(0, 8);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.bg }} contentContainerStyle={{ paddingBottom: 100 }}>
      <LinearGradient
        colors={[withAlpha(g.color, 0.15), 'transparent']}
        locations={[0, 0.8]}
        style={[styles.heroGrad, { paddingTop: insets.top + 8 }]}
      >
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: theme.line }]}
        >
          <Icon name="chevronL" size={18} color={theme.text2} />
        </Pressable>
        <View style={styles.heroRow}>
          <View style={[styles.crest, { backgroundColor: g.color }]}>
            <Text style={styles.crestTxt}>{g.name[0]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: theme.text }]}>{g.name}</Text>
              {g.private ? <Pill>{`🔒 PRIVATE`}</Pill> : null}
            </View>
            <Text style={[styles.meta, { color: theme.text2 }]}>
              {g.members.toLocaleString()} MEMBERS · CODE: {g.name.replace(/\s/g, '').toUpperCase().slice(0, 6)}24
            </Text>
          </View>
        </View>
        <Text style={[styles.desc, { color: theme.text2 }]}>{g.desc}</Text>
        <View style={styles.actionRow}>
          <Pressable style={[styles.actionPrim, { backgroundColor: theme.neon }]}>
            <Text style={styles.actionPrimTxt}>Invite</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push(`/group-feed/${g.id}`)}
            style={[styles.actionSec, { borderColor: theme.line }]}
          >
            <Text style={[styles.actionSecTxt, { color: theme.text }]}>Group feed</Text>
          </Pressable>
        </View>
      </LinearGradient>

      <SectionHeader title="Group leaderboard" />
      <View style={{ paddingHorizontal: 16, gap: 6, marginBottom: 14 }}>
        {members.slice(0, 6).map((u, i) => (
          <Pressable
            key={u.id}
            onPress={() => router.push(`/user/${u.id}`)}
            style={[
              styles.lbRow,
              {
                backgroundColor: u.isMe ? theme.neonDim : theme.surface,
                borderColor: u.isMe ? withAlpha(theme.neon, 0.33) : theme.line,
              },
            ]}
          >
            <Text style={[styles.lbRank, { color: theme.text2 }]}>{i + 1}</Text>
            <Avatar user={u} size={32} />
            <Text style={[styles.lbName, { color: theme.text }]}>
              {u.name}
              {u.isMe ? <Text style={{ color: theme.neon, fontSize: 10 }}>  YOU</Text> : null}
            </Text>
            <Text style={[styles.lbScore, { color: theme.text }]}>
              {(2400 - i * 180).toLocaleString()}
            </Text>
          </Pressable>
        ))}
      </View>

      <SectionHeader title="Members" action={`${g.members} →`} />
      <View style={styles.membersGrid}>
        {members.map((u) => (
          <Pressable
            key={u.id}
            onPress={() => router.push(`/user/${u.id}`)}
            style={styles.memberCell}
          >
            <Avatar user={u} size={44} />
            <Text style={[styles.memberHandle, { color: theme.text2 }]} numberOfLines={1}>
              @{u.handle}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heroGrad: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  crest: {
    width: 64,
    height: 64,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crestTxt: {
    fontFamily: Fonts.dispBlack,
    fontSize: 28,
    color: '#06091A',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontFamily: Fonts.dispBlack,
    fontSize: 22,
    letterSpacing: -0.4,
  },
  meta: {
    fontFamily: Fonts.monoMedium,
    fontSize: 11,
    marginTop: 4,
  },
  desc: {
    fontFamily: Fonts.uiRegular,
    fontSize: 13,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  actionPrim: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionPrimTxt: {
    fontFamily: Fonts.dispBold,
    color: '#06091A',
    fontSize: 13,
  },
  actionSec: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionSecTxt: {
    fontFamily: Fonts.dispBold,
    fontSize: 13,
  },
  lbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 10,
  },
  lbRank: {
    width: 24,
    textAlign: 'center',
    fontFamily: Fonts.monoBold,
  },
  lbName: {
    flex: 1,
    fontFamily: Fonts.dispBold,
    fontSize: 13,
  },
  lbScore: {
    fontFamily: Fonts.monoBold,
    fontSize: 12,
  },
  membersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
  },
  memberCell: {
    width: 60,
    alignItems: 'center',
  },
  memberHandle: {
    fontFamily: Fonts.monoRegular,
    fontSize: 10,
    marginTop: 4,
    width: '100%',
    textAlign: 'center',
  },
});
