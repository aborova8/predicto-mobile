import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Avatar } from '@/components/atoms/Avatar';
import { Icon } from '@/components/atoms/Icon';
import { Pill } from '@/components/atoms/Pill';
import { BottomSheet } from '@/components/sheets/BottomSheet';
import { Ticket } from '@/components/ticket/Ticket';
import { useFriends } from '@/hooks/useFriends';
import { useUserProfile } from '@/hooks/useUserProfile';
import { backendTicketToTicket } from '@/lib/mappers';
import { useAppState } from '@/state/AppStateContext';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';

export default function UserSheetScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: me } = useAppState();
  const { profile, tickets, badges, loading, notViewable, error } = useUserProfile(id);
  const { friends, outgoing, sendRequest, removeFriend, block } = useFriends();

  const isMe = me?.id === id;
  const friendUser = friends.find((f) => f.id === id);
  const pendingOut = outgoing.find((r) => r.addresseeId === id);

  return (
    <BottomSheet height="88%" title="Profile">
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {loading && !profile ? (
          <ActivityIndicator color={theme.text3} style={{ marginTop: 80 }} />
        ) : null}

        {notViewable ? (
          <Text
            style={{
              color: theme.text3,
              fontFamily: Fonts.uiRegular,
              fontSize: 13,
              padding: 32,
              textAlign: 'center',
            }}
          >
            This profile is private or unavailable.
          </Text>
        ) : null}

        {error ? (
          <Text
            style={{
              color: theme.text3,
              fontFamily: Fonts.uiRegular,
              fontSize: 13,
              padding: 32,
              textAlign: 'center',
            }}
          >
            {error.message}
          </Text>
        ) : null}

        {profile ? (
          <>
            <LinearGradient
              colors={[theme.neonDim, 'transparent']}
              locations={[0, 0.8]}
              style={styles.heroGrad}
            >
              <View style={styles.heroRow}>
                <Avatar
                  author={{ username: profile.username, avatarUrl: profile.avatarUrl }}
                  size={64}
                  ring
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: theme.text }]}>{profile.username}</Text>
                  {profile.bio ? (
                    <Text style={[styles.handleTxt, { color: theme.text2 }]} numberOfLines={2}>
                      {profile.bio}
                    </Text>
                  ) : null}
                  <View style={styles.pillRow}>
                    <Pill color={theme.neon}>{`LVL ${profile.level}`}</Pill>
                    <Pill>{`🔥 ${profile.streak} STREAK`}</Pill>
                    <Pill>{`${profile.points.toLocaleString()} PTS`}</Pill>
                  </View>
                </View>
              </View>
              {!isMe ? (
                <View style={styles.actionRow}>
                  {friendUser ? (
                    <Pressable
                      onPress={() =>
                        Alert.alert('Remove friend', `Remove ${profile.username}?`, [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Remove',
                            style: 'destructive',
                            onPress: () => void removeFriend(profile.id),
                          },
                        ])
                      }
                      style={[styles.actSec, { borderColor: theme.line }]}
                    >
                      <Icon name="check" size={14} stroke={2.4} color={theme.text} />
                      <Text style={[styles.actSecTxt, { color: theme.text }]}>Friends</Text>
                    </Pressable>
                  ) : pendingOut ? (
                    <View style={[styles.actSec, { borderColor: theme.line }]}>
                      <Text style={[styles.actSecTxt, { color: theme.text3 }]}>Request sent</Text>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => void sendRequest(profile.id)}
                      style={[styles.actPrim, { backgroundColor: theme.neon }]}
                    >
                      <Icon name="add-friend" size={14} stroke={2.4} color="#06091A" />
                      <Text style={styles.actPrimTxt}>Add friend</Text>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() =>
                      Alert.alert('Block user', `Block ${profile.username}?`, [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Block',
                          style: 'destructive',
                          onPress: () => void block(profile.id),
                        },
                      ])
                    }
                    style={[styles.actSec, { borderColor: theme.line }]}
                  >
                    <Text style={[styles.actSecTxt, { color: theme.text }]}>Block</Text>
                  </Pressable>
                </View>
              ) : null}
            </LinearGradient>

            <View style={styles.statsRow}>
              <Stat
                label="Hit Rate"
                value={`${Math.round((profile.stats.winRate ?? 0) * 100)}%`}
              />
              <Stat label="Wins" value={`${profile.stats.won}`} />
              <Stat label="Losses" value={`${profile.stats.lost}`} />
              <Stat label="Tickets" value={`${profile.stats.totalTickets}`} />
            </View>

            {badges.length > 0 ? (
              <>
                <Text style={[styles.section, { color: theme.text3 }]}>BADGES</Text>
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: 6,
                    paddingHorizontal: 16,
                  }}
                >
                  {badges.map((b) => (
                    <Pill key={b.id}>{b.badge.name.toUpperCase()}</Pill>
                  ))}
                </View>
              </>
            ) : null}

            <Text style={[styles.section, { color: theme.text3 }]}>RECENT SLIPS</Text>
            <View style={{ paddingHorizontal: 16, gap: 10 }}>
              {tickets.length === 0 ? (
                <Text
                  style={{
                    color: theme.text3,
                    fontFamily: Fonts.uiRegular,
                    fontSize: 13,
                    padding: 16,
                  }}
                >
                  No slips yet.
                </Text>
              ) : (
                tickets.map((t) => (
                  <Ticket
                    key={t.id}
                    ticket={backendTicketToTicket(t)}
                    onPress={() => {
                      router.dismissAll();
                      router.push(`/ticket/${t.id}`);
                    }}
                  />
                ))
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </BottomSheet>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <Text
        style={{
          fontFamily: Fonts.monoMedium,
          fontSize: 9,
          color: theme.text3,
          letterSpacing: 0.6,
        }}
      >
        {label.toUpperCase()}
      </Text>
      <Text
        style={{
          fontFamily: Fonts.dispBlack,
          fontSize: 16,
          color: theme.text,
          marginTop: 2,
        }}
      >
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
    fontFamily: Fonts.uiRegular,
    fontSize: 12,
    marginTop: 2,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
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
