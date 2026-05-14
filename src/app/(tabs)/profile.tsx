import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/atoms/Avatar';
import { Crest } from '@/components/atoms/Crest';
import { Icon } from '@/components/atoms/Icon';
import { Pill } from '@/components/atoms/Pill';
import { ProHint } from '@/components/atoms/ProHint';
import { SectionHeader } from '@/components/atoms/SectionHeader';
import { PostActionSheet } from '@/components/sheets/PostActionSheet';
import { Ticket } from '@/components/ticket/Ticket';
import { useSavedPosts } from '@/hooks/useSavedPosts';
import { useStaleRefetch } from '@/hooks/useStaleRefetch';
import { ApiError, errorMessage } from '@/lib/api';
import { getAllBadges, getMyBadges } from '@/lib/api/badges';
import { getMyProfile, getMyTickets, updateMyProfileMultipart } from '@/lib/api/users';
import { withAlpha } from '@/lib/colors';
import { deriveAbbrev, legStatusFromPick } from '@/lib/mappers';
import {
  legStatusColor,
  statusGlyph as statusGlyphFn,
  ticketStatusColor,
  ticketStatusLabel,
} from '@/lib/status';
import { useAppState } from '@/state/AppStateContext';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';
import type {
  BackendPick,
  BackendTicket,
  BackendTicketStatus,
  BadgeDefinition,
  MyProfile,
  Post,
  TicketStatus,
} from '@/types/domain';

type Filter = TicketStatus | 'all' | 'saved';

function toUiStatus(s: BackendTicketStatus): TicketStatus {
  if (s === 'WON') return 'won';
  if (s === 'LOST') return 'lost';
  return 'pending';
}

function pickLabelFromBackend(pick: BackendPick): string {
  if (pick.prediction === 'HOME') return deriveAbbrev(pick.match.homeTeam, pick.match.homeAbbrev);
  if (pick.prediction === 'AWAY') return deriveAbbrev(pick.match.awayTeam, pick.match.awayAbbrev);
  return 'DRAW';
}

function formatTicketDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signOut, refreshUser } = useAppState();
  const [filter, setFilter] = useState<Filter>('all');

  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [tickets, setTickets] = useState<BackendTicket[]>([]);
  const [allBadges, setAllBadges] = useState<BadgeDefinition[]>([]);
  const [myBadgeIds, setMyBadgeIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Ticket-history pagination — first page loads with the rest of the profile,
  // subsequent pages are appended on scroll-near-bottom. PAGE_SIZE matches the
  // backend default (users.schemas.ts:41-44).
  const TICKETS_PAGE_SIZE = 20;
  const [ticketsPage, setTicketsPage] = useState(1);
  const [ticketsTotal, setTicketsTotal] = useState(0);
  const [loadingMoreTickets, setLoadingMoreTickets] = useState(false);
  // Cursor-paginated, fetched lazily once the user lands on the Saved filter.
  const savedQ = useSavedPosts({ enabled: filter === 'saved' });
  const [menuPost, setMenuPost] = useState<Post | null>(null);
  // Avatar upload happens in-place on this screen. We mirror the picker flow
  // already used in /edit-profile so users can update their photo without
  // leaving the profile.
  const [avatarUploading, setAvatarUploading] = useState(false);

  async function onChangeAvatar() {
    if (avatarUploading) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Please grant photo access to change your avatar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setAvatarUploading(true);
    try {
      await updateMyProfileMultipart({
        avatar: { uri: asset.uri, mimeType: asset.mimeType, fileName: asset.fileName },
      });
      // The multipart response only carries a summary (id/username/bio/avatar);
      // re-fetch the full MyProfile so stats/level/xp stay current, and bump
      // refreshUser so other screens (feed header avatar, notification rows)
      // pick up the new avatarUrl too.
      const [{ profile: fresh }] = await Promise.all([getMyProfile(), refreshUser()]);
      setProfile(fresh);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to update avatar';
      Alert.alert('Update failed', msg);
    } finally {
      setAvatarUploading(false);
    }
  }

  const loadAll = useCallback(async () => {
    setError(null);
    try {
      const [{ profile: p }, tx, allB, myB] = await Promise.all([
        getMyProfile(),
        getMyTickets(1, TICKETS_PAGE_SIZE),
        getAllBadges(),
        getMyBadges(),
      ]);
      setProfile(p);
      setTickets(tx.items);
      setTicketsPage(tx.page);
      setTicketsTotal(tx.total);
      setAllBadges(allB.items);
      setMyBadgeIds(new Set(myB.items.map((u) => u.badgeId)));
    } catch (err) {
      setError(errorMessage(err, 'Failed to load profile'));
    }
  }, []);

  // Auto-refetch tickets/badges/profile on app foreground and on a fresh login
  // (both bump the data epoch). Stamps freshness so rapid tab toggles don't
  // re-hammer the API.
  const { refetch: staleLoadAll } = useStaleRefetch(loadAll);

  // Append the next page of tickets when the user scrolls near the bottom.
  // `total` from the backend lets us short-circuit once everything is loaded
  // without an extra empty-page round-trip.
  const hasMoreTickets = tickets.length < ticketsTotal;
  const loadMoreTickets = useCallback(async () => {
    if (!hasMoreTickets || loadingMoreTickets) return;
    setLoadingMoreTickets(true);
    try {
      const next = await getMyTickets(ticketsPage + 1, TICKETS_PAGE_SIZE);
      setTickets((prev) => [...prev, ...next.items]);
      setTicketsPage(next.page);
      setTicketsTotal(next.total);
    } catch {
      // Silent — the user can pull-to-refresh; surfacing a toast for an
      // infinite-scroll failure mid-list adds more friction than value.
    } finally {
      setLoadingMoreTickets(false);
    }
  }, [hasMoreTickets, loadingMoreTickets, ticketsPage]);

  const NEAR_BOTTOM_PX = 280;
  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const distanceFromBottom =
        contentSize.height - (contentOffset.y + layoutMeasurement.height);
      if (distanceFromBottom >= NEAR_BOTTOM_PX) return;
      // Either history or saved can need another page depending on the
      // active filter. Trigger both — each has its own internal guard.
      if (filter === 'saved') {
        if (savedQ.hasMore) void savedQ.fetchMore();
      } else {
        void loadMoreTickets();
      }
    },
    [filter, loadMoreTickets, savedQ],
  );

  useEffect(() => {
    void (async () => {
      await staleLoadAll();
      setLoading(false);
    })();
    // staleLoadAll is referentially stable enough for an initial-mount fire;
    // foreground/login refetches are handled inside useStaleRefetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await staleLoadAll();
    setRefreshing(false);
  }

  if (loading && !profile) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator color={theme.neon} />
      </View>
    );
  }

  if (error && !profile) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg, paddingHorizontal: 24 }]}>
        <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
        <Pressable
          onPress={() => {
            setLoading(true);
            void loadAll().finally(() => setLoading(false));
          }}
          style={[styles.retryBtn, { backgroundColor: theme.neon }]}
        >
          <Text style={{ color: '#06091A', fontFamily: Fonts.monoBold, fontSize: 12 }}>RETRY</Text>
        </Pressable>
      </View>
    );
  }

  if (!profile) return null;

  const ticketHit = Math.round(profile.stats.winRate * 100);
  const avgOdds = profile.stats.avgOdds;
  const xpPct = profile.xpToNextLevel === 0
    ? 0
    : Math.min(100, Math.round((profile.xpInLevel / profile.xpToNextLevel) * 100));

  const filteredTickets =
    filter === 'all' ? tickets : tickets.filter((t) => toUiStatus(t.status) === filter);

  return (
    <>
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingBottom: 120 }}
      onMomentumScrollEnd={onScrollEnd}
      scrollEventThrottle={16}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.text2} />
      }
    >
      <LinearGradient
        colors={[theme.neonDim, 'transparent']}
        locations={[0, 0.8]}
        style={[styles.heroGrad, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.iconRow}>
          <Pressable
            onPress={() => router.push('/settings')}
            style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: theme.line }]}
          >
            <Icon name="settings" size={18} color={theme.text2} />
          </Pressable>
          <Pressable
            onPress={() => { void signOut(); }}
            style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: theme.line }]}
          >
            <Icon name="logout" size={18} color={theme.text2} />
          </Pressable>
        </View>

        <View style={styles.heroRow}>
          <Pressable
            onPress={onChangeAvatar}
            disabled={avatarUploading}
            style={styles.avatarWrap}
          >
            <Avatar
              author={{ username: profile.username, avatarUrl: profile.avatarUrl }}
              size={72}
              ring
            />
            <View
              style={[
                styles.cameraBadge,
                { backgroundColor: theme.neon, borderColor: theme.bg },
              ]}
            >
              {avatarUploading ? (
                <ActivityIndicator size="small" color="#06091A" />
              ) : (
                <Icon name="plus" size={12} color="#06091A" stroke={2.4} />
              )}
            </View>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: theme.text }]}>{profile.username}</Text>
            <Text style={[styles.handle, { color: theme.text2 }]}>@{profile.username}</Text>
            <View style={styles.pillRow}>
              <Pill color={theme.neon}>{`LVL ${profile.level}`}</Pill>
              {profile.streak > 0 ? <Pill>{`🔥 ${profile.streak} STREAK`}</Pill> : null}
            </View>
          </View>
        </View>
      </LinearGradient>

      <View style={{ paddingHorizontal: 16, paddingTop: 4 }}>
        <View style={styles.gridRow2}>
          <StatBox label="Ticket Hit" value={`${ticketHit}%`} valueColor={theme.neon} />
          <StatBox
            label="Avg Odds"
            value={avgOdds === null ? '—' : `${avgOdds.toFixed(2)}×`}
            valueColor={theme.text}
          />
        </View>
        <View style={[styles.gridRow3, { marginTop: 8 }]}>
          <StatBox label="Won" value={`${profile.stats.won}`} valueColor={theme.win} small />
          <StatBox label="Lost" value={`${profile.stats.lost}`} valueColor={theme.loss} small />
          <StatBox
            label="Tickets"
            value={`${profile.stats.totalTickets}`}
            valueColor={theme.text2}
            small
          />
        </View>

        <View
          style={[
            styles.xpCard,
            { backgroundColor: theme.surface, borderColor: theme.line },
          ]}
        >
          <View style={styles.xpHead}>
            <Text style={[styles.xpLabel, { color: theme.text3 }]}>NEXT LEVEL</Text>
            <Text style={[styles.xpAmount, { color: theme.text2 }]}>
              {profile.xpInLevel.toLocaleString()} / {profile.xpToNextLevel.toLocaleString()} XP
            </Text>
          </View>
          <View style={[styles.xpBar, { backgroundColor: theme.surface2 }]}>
            <View
              style={[
                styles.xpFill,
                {
                  backgroundColor: theme.neon,
                  shadowColor: theme.neon,
                  width: `${xpPct}%`,
                },
              ]}
            />
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
        <ProHint variant="card" />
      </View>

      <View style={{ marginTop: 18 }}>
        <SectionHeader title="Badges" />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        style={{ marginBottom: 18 }}
      >
        {allBadges.length === 0 ? (
          <View style={[styles.emptyBadgeCard, { borderColor: theme.line }]}>
            <Text style={{ color: theme.text3, fontFamily: Fonts.monoMedium, fontSize: 11 }}>
              NO BADGES YET
            </Text>
          </View>
        ) : null}
        {allBadges.map((b) => {
          const earned = myBadgeIds.has(b.id);
          return (
            <View
              key={b.id}
              style={[
                styles.badgeCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: earned ? withAlpha(theme.neon, 0.33) : theme.line,
                  opacity: earned ? 1 : 0.5,
                },
              ]}
            >
              <View
                style={[
                  styles.badgeIcon,
                  { backgroundColor: earned ? theme.neonDim : theme.surface2 },
                ]}
              >
                {b.iconUrl ? (
                  <Image source={{ uri: b.iconUrl }} style={styles.badgeIconImg} />
                ) : (
                  <Text style={{ fontSize: 20 }}>{earned ? '🏆' : '🔒'}</Text>
                )}
              </View>
              <Text style={[styles.badgeName, { color: theme.text }]} numberOfLines={1}>
                {b.name}
              </Text>
              <Text style={[styles.badgeMeta, { color: theme.text3 }]}>
                {earned ? 'EARNED' : 'LOCKED'}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.historyHead}>
        <Text style={[styles.historyTitle, { color: theme.text }]}>Ticket history</Text>
        <Text style={[styles.historyMeta, { color: theme.text3 }]}>
          {profile.stats.totalTickets} TOTAL · POINTS ONLY ON FULL WINS
        </Text>
      </View>

      <View style={styles.filterRow}>
        {([
          { id: 'all', label: 'All', count: profile.stats.totalTickets },
          { id: 'won', label: 'Won', count: profile.stats.won },
          { id: 'lost', label: 'Lost', count: profile.stats.lost },
          { id: 'pending', label: 'Pending', count: profile.stats.pending },
          // Saved feed is cursor-paginated so we don't know the true count
          // until the user scrolls the whole way. Omit the badge.
          { id: 'saved', label: 'Saved', count: null },
        ] as const).map((f) => {
          const a = filter === f.id;
          return (
            <Pressable
              key={f.id}
              onPress={() => setFilter(f.id)}
              style={[
                styles.filterPill,
                {
                  backgroundColor: a ? theme.neon : 'transparent',
                  borderColor: a ? theme.neon : theme.line,
                },
              ]}
            >
              <Text style={[styles.filterTxt, { color: a ? '#06091A' : theme.text2 }]}>
                {f.label.toUpperCase()}
                {f.count !== null ? <Text style={{ opacity: 0.65 }}> {f.count}</Text> : null}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {filter === 'saved' ? (
        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          {savedQ.loading && savedQ.posts.length === 0 ? (
            <View style={styles.emptyCard}>
              <ActivityIndicator color={theme.text3} />
            </View>
          ) : savedQ.posts.length === 0 ? (
            <View style={[styles.emptyCard, { borderColor: theme.line }]}>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No saved slips yet</Text>
              <Text style={[styles.emptyBody, { color: theme.text2 }]}>
                Tap the … on any feed slip and pick Save to keep it here.
              </Text>
            </View>
          ) : (
            savedQ.posts.map((p) => (
              <SavedPostRow
                key={p.id}
                post={p}
                onOpenMenu={() => setMenuPost(p)}
                onOpen={() => router.push({ pathname: '/comments', params: { postId: p.id } })}
              />
            ))
          )}
        </View>
      ) : (
        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          {filteredTickets.length === 0 ? (
            <View style={[styles.emptyCard, { borderColor: theme.line }]}>
              <Text style={{ color: theme.text3, fontFamily: Fonts.monoMedium, fontSize: 11, letterSpacing: 0.5 }}>
                NO {filter.toUpperCase()} TICKETS
              </Text>
            </View>
          ) : null}
          {filteredTickets.map((t) => (
            <TicketHistoryCard key={t.id} ticket={t} />
          ))}
        </View>
      )}

      {(filter === 'saved' ? savedQ.loadingMore : loadingMoreTickets) ? (
        <View style={styles.footerLoader}>
          <ActivityIndicator color={theme.text2} />
        </View>
      ) : null}
    </ScrollView>

    <PostActionSheet
      post={menuPost}
      onClose={() => setMenuPost(null)}
      onToggleSave={savedQ.toggleSave}
    />
    </>
  );
}

function StatBox({
  label,
  value,
  valueColor,
  small,
}: {
  label: string;
  value: string;
  valueColor: string;
  small?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <Text style={[styles.statLabel, { color: theme.text3 }]}>{label.toUpperCase()}</Text>
      <Text
        style={[
          styles.statValue,
          { color: valueColor, fontSize: small ? 18 : 26 },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function TicketHistoryCard({ ticket }: { ticket: BackendTicket }) {
  const theme = useTheme();
  const router = useRouter();
  const uiStatus = toUiStatus(ticket.status);
  const legs = ticket.picks;
  const legsWon = legs.filter((l) => l.isCorrect === true).length;
  const c = ticketStatusColor(theme, uiStatus);
  const statusLabel =
    ticket.status === 'VOID' ? 'VOID' : ticketStatusLabel(uiStatus);
  const statusGlyph = statusGlyphFn(uiStatus);
  const postId = ticket.post?.id;

  return (
    <Pressable
      disabled={!postId}
      onPress={() => {
        if (postId) router.push({ pathname: '/comments', params: { postId } });
      }}
      style={[
        styles.histCard,
        { backgroundColor: theme.surface, borderColor: theme.line },
      ]}
    >
      <View style={styles.histTop}>
        <View
          style={[
            styles.histGlyph,
            { backgroundColor: withAlpha(c, 0.13), borderColor: withAlpha(c, 0.33) },
          ]}
        >
          <Text style={[styles.histGlyphTxt, { color: c }]}>{statusGlyph}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.histStatus, { color: c }]}>{statusLabel}</Text>
          <Text style={[styles.histInfo, { color: theme.text }]}>
            {legs.length}-leg · {ticket.totalOdds.toFixed(2)}×{' '}
            <Text style={{ color: theme.text3 }}>· {formatTicketDate(ticket.createdAt)}</Text>
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.histPoints, { color: c }]}>
            {ticket.status === 'WON'
              ? `+${ticket.pointsAwarded}`
              : ticket.status === 'LOST'
              ? '0'
              : '···'}
          </Text>
          <Text style={[styles.histPointsLabel, { color: theme.text3 }]}>POINTS</Text>
        </View>
      </View>

      {legs.length > 0 ? (
        <View style={[styles.histLegs, { borderTopColor: theme.lineSoft }]}>
          {legs.map((l) => {
            const ls = legStatusFromPick(l);
            const lc = legStatusColor(theme, ls);
            return (
              <View key={l.id} style={styles.legLine}>
                <View
                  style={[
                    styles.legGlyph,
                    { backgroundColor: withAlpha(lc, 0.13), borderColor: withAlpha(lc, 0.33) },
                  ]}
                >
                  <Text style={{ color: lc, fontFamily: Fonts.monoBlack, fontSize: 9 }}>
                    {statusGlyphFn(ls)}
                  </Text>
                </View>
                <Crest
                  team={deriveAbbrev(l.match.homeTeam, l.match.homeAbbrev)}
                  name={l.match.homeTeam}
                  size={16}
                  logo={l.match.homeLogo}
                />
                <Text
                  style={{ color: theme.text, fontFamily: Fonts.uiSemi, fontSize: 11, flexShrink: 1 }}
                  numberOfLines={1}
                >
                  {l.match.homeTeam}
                </Text>
                <Text style={{ color: theme.text3, fontFamily: Fonts.monoRegular, fontSize: 10 }}>
                  vs
                </Text>
                <Crest
                  team={deriveAbbrev(l.match.awayTeam, l.match.awayAbbrev)}
                  name={l.match.awayTeam}
                  size={16}
                  logo={l.match.awayLogo}
                />
                <Text
                  style={{ color: theme.text, fontFamily: Fonts.uiSemi, fontSize: 11, flexShrink: 1 }}
                  numberOfLines={1}
                >
                  {l.match.awayTeam}
                </Text>
                <View style={{ flex: 1 }} />
                <Text style={{ color: theme.text3, fontFamily: Fonts.monoRegular, fontSize: 11 }}>
                  {pickLabelFromBackend(l)} · {l.oddsAtPick.toFixed(2)}×
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}

      {ticket.status !== 'PENDING' ? (
        <View style={styles.histFoot}>
          <Text style={[styles.histFootTxt, { color: theme.text3 }]}>
            {legsWon}/{legs.length} LEGS HIT
          </Text>
          {postId ? (
            <Text style={[styles.histFootTxt, { color: theme.text3 }]}>
              TAP FOR COMMENTS ›
            </Text>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

// Render a saved feed post as its slip plus a dots-menu trigger. We use the
// existing `Ticket` component (which renders the mobile-side slip) rather
// than TicketHistoryCard because the saved list source — feed posts — gives
// us the mobile `Ticket` shape via `feedItemToPost`, not BackendTicket.
function SavedPostRow({
  post,
  onOpen,
  onOpenMenu,
}: {
  post: Post;
  onOpen: () => void;
  onOpenMenu: () => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: theme.line,
        borderRadius: 14,
        backgroundColor: theme.surface,
        paddingTop: 10,
        paddingHorizontal: 10,
        paddingBottom: 6,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 4,
          paddingBottom: 6,
        }}
      >
        <Text
          style={{ color: theme.text3, fontFamily: Fonts.monoMedium, fontSize: 11, letterSpacing: 0.5 }}
          numberOfLines={1}
        >
          {post.author.username.toUpperCase()} · {post.timeAgo.toUpperCase()}
        </Text>
        <Pressable onPress={onOpenMenu} hitSlop={10} accessibilityLabel="More actions">
          <Text style={{ color: theme.text2, fontSize: 18, lineHeight: 18 }}>···</Text>
        </Pressable>
      </View>
      <Ticket ticket={post.ticket} onPress={onOpen} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: Fonts.monoMedium,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 14,
  },
  retryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  heroGrad: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: {
    position: 'relative',
  },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontFamily: Fonts.dispBlack,
    fontSize: 22,
    letterSpacing: -0.4,
  },
  handle: {
    fontFamily: Fonts.monoMedium,
    fontSize: 12,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  gridRow2: {
    flexDirection: 'row',
    gap: 8,
  },
  gridRow3: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 12,
  },
  statLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 0.6,
  },
  statValue: {
    fontFamily: Fonts.dispBlack,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  xpCard: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 12,
  },
  xpHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  xpLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 0.6,
  },
  xpAmount: {
    fontFamily: Fonts.monoMedium,
    fontSize: 11,
  },
  xpBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 4,
  },
  badgeCard: {
    width: 100,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
  },
  badgeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    overflow: 'hidden',
  },
  badgeIconImg: {
    width: 40,
    height: 40,
  },
  badgeName: {
    fontFamily: Fonts.dispBold,
    fontSize: 11,
    textAlign: 'center',
  },
  badgeMeta: {
    fontFamily: Fonts.monoMedium,
    fontSize: 9,
    marginTop: 2,
    textAlign: 'center',
  },
  emptyBadgeCard: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  historyHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
  },
  historyTitle: {
    fontFamily: Fonts.dispBold,
    fontSize: 16,
    letterSpacing: -0.2,
  },
  historyMeta: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 0.6,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexWrap: 'wrap',
  },
  filterPill: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterTxt: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    letterSpacing: 0.4,
  },
  emptyCard: {
    paddingVertical: 24,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    gap: 6,
  },
  emptyTitle: {
    fontFamily: Fonts.dispBold,
    fontSize: 15,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: Fonts.uiRegular,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  histCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  histTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  histGlyph: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  histGlyphTxt: {
    fontFamily: Fonts.monoBlack,
    fontSize: 12,
  },
  histStatus: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  histInfo: {
    fontFamily: Fonts.dispBold,
    fontSize: 13,
    marginTop: 3,
  },
  histPoints: {
    fontFamily: Fonts.dispBlack,
    fontSize: 18,
    letterSpacing: -0.3,
  },
  histPointsLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  histLegs: {
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  legLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legGlyph: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  histFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  histFootTxt: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
