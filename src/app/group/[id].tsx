import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/atoms/Avatar';
import { Icon } from '@/components/atoms/Icon';
import { Pill } from '@/components/atoms/Pill';
import { SectionHeader } from '@/components/atoms/SectionHeader';
import { InviteSheet } from '@/components/groups/InviteSheet';
import { JoinByCodeSheet } from '@/components/groups/JoinByCodeSheet';
import { ManageSheet } from '@/components/groups/ManageSheet';
import { useGroup } from '@/hooks/useGroup';
import { useGroupJoinRequests } from '@/hooks/useGroupJoinRequests';
import { useGroupLeaderboard } from '@/hooks/useGroupLeaderboard';
import { useGroupMembers } from '@/hooks/useGroupMembers';
import { useGroups } from '@/hooks/useGroups';
import { errorMessage } from '@/lib/api';
import { withAlpha } from '@/lib/colors';
import { useAppState } from '@/state/AppStateContext';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';
import type { GroupRole } from '@/types/domain';

type SheetKind = 'join' | 'invite' | 'manage' | null;

export default function GroupDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: me } = useAppState();
  const groupId = id ?? '';

  const groupQ = useGroup(groupId);
  const membersQ = useGroupMembers(groupId);
  const leaderboardQ = useGroupLeaderboard(groupId);
  // The admin-only join-requests query is gated by viewerRole — only fires
  // for OWNER/ADMIN to avoid a guaranteed 403 on every non-admin view.
  const isAdmin: boolean =
    groupQ.group?.viewerRole === 'OWNER' || groupQ.group?.viewerRole === 'ADMIN';
  const requestsQ = useGroupJoinRequests(groupId, isAdmin);

  // Used by JoinByCodeSheet — `useGroups({scope:'mine'})` provides the
  // joinByCode mutation and refreshes membership on success.
  const mineQ = useGroups({ scope: 'mine' });

  const [sheet, setSheet] = useState<SheetKind>(null);

  const refreshAll = async () => {
    await Promise.all([
      groupQ.refetch(),
      membersQ.refetch(),
      leaderboardQ.refetch(),
      requestsQ.refetch(),
    ]);
  };

  const onLeave = () => {
    Alert.alert('Leave group?', 'You will need an invite code to rejoin.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            await groupQ.leave();
            await mineQ.refetch();
            router.back();
          } catch (err) {
            Alert.alert('Could not leave', errorMessage(err, 'Try again.'));
          }
        },
      },
    ]);
  };

  // ── Loading / error states ────────────────────────────────────────────────
  if (groupQ.loading && !groupQ.group) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg, paddingTop: insets.top + 40 }]}>
        <ActivityIndicator color={theme.text2} />
      </View>
    );
  }

  if (groupQ.error || !groupQ.group) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.bg }}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 16 }}
      >
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: theme.line }]}
        >
          <Icon name="chevronL" size={18} color={theme.text2} />
        </Pressable>
        <View style={[styles.errorBox, { borderColor: theme.line }]}>
          <Text style={[styles.errorTitle, { color: theme.text }]}>
            Group is private or no longer exists
          </Text>
          <Text style={[styles.errorBody, { color: theme.text2 }]}>
            {errorMessage(groupQ.error, 'You may need an invite code to view this group.')}
          </Text>
          <Pressable onPress={refreshAll} style={[styles.retryBtn, { borderColor: theme.neon }]}>
            <Text style={[styles.retryTxt, { color: theme.neon }]}>RETRY</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  const g = groupQ.group;
  const isMember = g.viewerRole !== null;
  const refreshing =
    (groupQ.loading || membersQ.loading || leaderboardQ.loading || requestsQ.loading) &&
    !!groupQ.group;

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.bg }}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshAll} tintColor={theme.text2} />
        }
      >
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
              <Text style={styles.crestTxt}>{g.name[0]?.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, { color: theme.text }]}>{g.name}</Text>
                {g.visibility === 'PRIVATE' ? <Pill>{`🔒 PRIVATE`}</Pill> : null}
              </View>
              <Text style={[styles.meta, { color: theme.text2 }]}>
                {g.memberCount.toLocaleString()} MEMBERS
                {isMember && g.inviteCode ? ` · CODE: ${g.inviteCode}` : ''}
              </Text>
            </View>
          </View>
          {g.description ? (
            <Text style={[styles.desc, { color: theme.text2 }]}>{g.description}</Text>
          ) : null}
          <View style={styles.actionRow}>
            {isMember ? (
              <>
                <Pressable
                  onPress={() => setSheet('invite')}
                  style={[styles.actionPrim, { backgroundColor: theme.neon }]}
                >
                  <Text style={styles.actionPrimTxt}>Invite</Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push(`/group-feed/${g.id}`)}
                  style={[styles.actionSec, { borderColor: theme.line }]}
                >
                  <Text style={[styles.actionSecTxt, { color: theme.text }]}>Group feed</Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                onPress={() => setSheet('join')}
                style={[styles.actionPrim, { backgroundColor: theme.neon, flex: 1 }]}
              >
                <Text style={styles.actionPrimTxt}>Join with invite code</Text>
              </Pressable>
            )}
          </View>
          {isMember ? (
            <View style={styles.secondaryRow}>
              {isAdmin ? (
                <Pressable
                  onPress={() => setSheet('manage')}
                  style={[styles.secondaryBtn, { borderColor: theme.line }]}
                >
                  <Icon name="settings" size={14} color={theme.text2} />
                  <Text style={[styles.secondaryTxt, { color: theme.text2 }]}>
                    Manage{requestsQ.requests.length > 0 ? ` · ${requestsQ.requests.length}` : ''}
                  </Text>
                </Pressable>
              ) : null}
              {g.viewerRole !== 'OWNER' ? (
                <Pressable
                  onPress={onLeave}
                  style={[styles.secondaryBtn, { borderColor: theme.line }]}
                >
                  <Icon name="logout" size={14} color={theme.text2} />
                  <Text style={[styles.secondaryTxt, { color: theme.text2 }]}>Leave</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </LinearGradient>

        {isMember ? (
          <>
            <SectionHeader title="Group leaderboard" />
            <View style={{ paddingHorizontal: 16, gap: 6, marginBottom: 14 }}>
              {leaderboardQ.loading && leaderboardQ.entries.length === 0 ? (
                <View style={[styles.center, { paddingVertical: 30 }]}>
                  <ActivityIndicator color={theme.text2} />
                </View>
              ) : leaderboardQ.entries.length === 0 ? (
                <View style={[styles.empty, { borderColor: theme.line }]}>
                  <Text style={[styles.emptyTxt, { color: theme.text3 }]}>
                    NO POINTS YET — SUBMIT A SLIP TO START EARNING
                  </Text>
                </View>
              ) : (
                leaderboardQ.entries.slice(0, 6).map((entry, i) => {
                  const isMe = me?.id === entry.user.id;
                  return (
                    <Pressable
                      key={entry.user.id}
                      onPress={() => router.push(`/user/${entry.user.id}`)}
                      style={[
                        styles.lbRow,
                        {
                          backgroundColor: isMe ? theme.neonDim : theme.surface,
                          borderColor: isMe ? withAlpha(theme.neon, 0.33) : theme.line,
                        },
                      ]}
                    >
                      <Text style={[styles.lbRank, { color: theme.text2 }]}>{i + 1}</Text>
                      <Avatar author={entry.user} size={32} />
                      <Text style={[styles.lbName, { color: theme.text }]}>
                        @{entry.user.username}
                        {isMe ? <Text style={{ color: theme.neon, fontSize: 10 }}>  YOU</Text> : null}
                      </Text>
                      <Text style={[styles.lbScore, { color: theme.text }]}>
                        {entry.points.toLocaleString()}
                      </Text>
                    </Pressable>
                  );
                })
              )}
            </View>

            <SectionHeader title="Members" action={`${g.memberCount}`} />
            <View style={styles.membersGrid}>
              {membersQ.loading && membersQ.members.length === 0 ? (
                <View style={[styles.center, { paddingVertical: 20, width: '100%' }]}>
                  <ActivityIndicator color={theme.text2} />
                </View>
              ) : (
                membersQ.members.slice(0, 12).map((m) => (
                  <Pressable
                    key={m.id}
                    onPress={() => router.push(`/user/${m.userId}`)}
                    style={styles.memberCell}
                  >
                    <Avatar author={m.user} size={44} />
                    <Text style={[styles.memberHandle, { color: theme.text2 }]} numberOfLines={1}>
                      @{m.user.username}
                    </Text>
                    {m.role !== 'MEMBER' ? (
                      <Text style={[styles.roleTag, { color: theme.text3 }]}>{m.role}</Text>
                    ) : null}
                  </Pressable>
                ))
              )}
            </View>
          </>
        ) : null}
      </ScrollView>

      <JoinByCodeSheet
        open={sheet === 'join'}
        onClose={() => setSheet(null)}
        joinByCode={mineQ.joinByCode}
        onResult={async (result) => {
          if (result.joined || result.alreadyMember) {
            await Promise.all([groupQ.refetch(), mineQ.refetch(), membersQ.refetch()]);
          }
        }}
      />

      {isMember && g.inviteCode ? (
        <InviteSheet
          open={sheet === 'invite'}
          onClose={() => setSheet(null)}
          inviteCode={g.inviteCode}
          groupName={g.name}
          viewerRole={g.viewerRole as GroupRole}
          onRotate={isAdmin ? groupQ.rotateCode : undefined}
        />
      ) : null}

      {isAdmin ? (
        <ManageSheet
          open={sheet === 'manage'}
          onClose={() => setSheet(null)}
          group={g}
          members={membersQ.members}
          joinRequests={requestsQ.requests}
          onUpdate={groupQ.update}
          onChangeRole={membersQ.changeRole}
          onRemoveMember={membersQ.remove}
          onRespond={async (requestId, action) => {
            await requestsQ.respond(requestId, action);
            if (action === 'approve') {
              await Promise.all([membersQ.refetch(), groupQ.refetch()]);
            }
          }}
          onTransfer={async (newOwnerId) => {
            await groupQ.transfer(newOwnerId);
            // Role flips on multiple rows — refresh both views in parallel
            // so the manage panel reflects the new owner immediately.
            await Promise.all([groupQ.refetch(), membersQ.refetch()]);
          }}
          onDelete={async () => {
            await groupQ.remove();
            await mineQ.refetch();
            router.back();
          }}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  secondaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  secondaryTxt: {
    fontFamily: Fonts.uiMedium,
    fontSize: 12,
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
    width: 64,
    alignItems: 'center',
  },
  memberHandle: {
    fontFamily: Fonts.monoRegular,
    fontSize: 10,
    marginTop: 4,
    width: '100%',
    textAlign: 'center',
  },
  roleTag: {
    fontFamily: Fonts.uiBold,
    fontSize: 9,
    letterSpacing: 1.0,
    marginTop: 2,
  },
  empty: {
    paddingVertical: 26,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    marginHorizontal: 0,
  },
  emptyTxt: {
    fontFamily: Fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  errorBox: {
    paddingVertical: 30,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    marginTop: 16,
  },
  errorTitle: {
    fontFamily: Fonts.dispBold,
    fontSize: 16,
  },
  errorBody: {
    fontFamily: Fonts.uiRegular,
    fontSize: 13,
    textAlign: 'center',
  },
  retryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
  },
  retryTxt: {
    fontFamily: Fonts.dispBold,
    fontSize: 12,
    letterSpacing: 1.4,
  },
});
