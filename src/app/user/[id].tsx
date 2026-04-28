import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/atoms/Avatar';
import { Icon } from '@/components/atoms/Icon';
import { Pill } from '@/components/atoms/Pill';
import { BottomSheet } from '@/components/sheets/BottomSheet';
import { Ticket } from '@/components/ticket/Ticket';
import { POSTS } from '@/data/posts';
import { USERS } from '@/data/users';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';

export default function UserSheetScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const u = id ? USERS[id] : null;

  if (!u) return null;

  const userPosts = POSTS.filter((p) => p.userId === u.id);

  return (
    <BottomSheet height="88%" title="Profile">
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <LinearGradient
            colors={[theme.neonDim, 'transparent']}
            locations={[0, 0.8]}
            style={styles.heroGrad}
          >
            <View style={styles.heroRow}>
              <Avatar user={u} size={64} ring />
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: theme.text }]}>{u.name}</Text>
                <Text style={[styles.handleTxt, { color: theme.text2 }]}>@{u.handle}</Text>
                <View style={styles.pillRow}>
                  <Pill color={theme.neon}>{`LVL ${u.level}`}</Pill>
                  <Pill>{`🔥 ${u.streak} STREAK`}</Pill>
                </View>
              </View>
            </View>
            {!u.isMe ? (
              <View style={styles.actionRow}>
                <Pressable style={[styles.actPrim, { backgroundColor: theme.neon }]}>
                  <Icon name="add-friend" size={14} stroke={2.4} color="#06091A" />
                  <Text style={styles.actPrimTxt}>Add friend</Text>
                </Pressable>
                <Pressable style={[styles.actSec, { borderColor: theme.line }]}>
                  <Text style={[styles.actSecTxt, { color: theme.text }]}>Message</Text>
                </Pressable>
              </View>
            ) : null}
          </LinearGradient>

          <View style={styles.statsRow}>
            <Stat label="Hit Rate" value={`${u.hitRate}%`} />
            <Stat label="Wins" value={`${u.wins}`} />
            <Stat label="Losses" value={`${u.losses}`} />
            <Stat label="Tickets" value={`${u.tickets}`} />
          </View>

          <Text style={[styles.section, { color: theme.text3 }]}>RECENT SLIPS</Text>
          <View style={{ paddingHorizontal: 16, gap: 10 }}>
            {userPosts.length === 0 ? (
              <Text style={{ color: theme.text3, fontFamily: Fonts.uiRegular, fontSize: 13, padding: 16 }}>
                No posts yet.
              </Text>
            ) : (
              userPosts.map((p) => (
                <Ticket
                  key={p.id}
                  ticket={p.ticket}
                  onPress={() => {
                    router.dismissAll();
                    router.push(`/ticket/${p.ticket.id}`);
                  }}
                />
              ))
            )}
          </View>
      </ScrollView>
    </BottomSheet>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <Text style={{ fontFamily: Fonts.monoMedium, fontSize: 9, color: theme.text3, letterSpacing: 0.6 }}>
        {label.toUpperCase()}
      </Text>
      <Text style={{ fontFamily: Fonts.dispBlack, fontSize: 16, color: theme.text, marginTop: 2 }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroGrad: {
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  name: {
    fontFamily: Fonts.dispBlack,
    fontSize: 20,
    letterSpacing: -0.3,
  },
  handleTxt: {
    fontFamily: Fonts.monoMedium,
    fontSize: 12,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  actPrim: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actPrimTxt: {
    fontFamily: Fonts.dispBold,
    color: '#06091A',
    fontSize: 13,
  },
  actSec: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  actSecTxt: {
    fontFamily: Fonts.dispBold,
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  statBox: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 12,
  },
  section: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});
