import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/atoms/Icon';
import { FeedPostCard } from '@/components/feed/FeedPostCard';
import { GROUPS, GROUP_POSTS } from '@/data/groups';
import { POSTS } from '@/data/posts';
import { withAlpha } from '@/lib/colors';
import { useAppState } from '@/state/AppStateContext';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';

export default function GroupFeedScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { likePost } = useAppState();
  const g = GROUPS.find((x) => x.id === id) ?? GROUPS[0];
  const postIds = GROUP_POSTS[g.id] ?? ['p1', 'p3', 'p5'];
  const groupPosts = postIds.map((pid) => POSTS.find((p) => p.id === pid)).filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <LinearGradient
        colors={[withAlpha(g.color, 0.15), 'transparent']}
        locations={[0, 1]}
        style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: theme.lineSoft }]}
      >
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: theme.line }]}
        >
          <Icon name="chevronL" size={18} color={theme.text2} />
        </Pressable>
        <View style={[styles.crest, { backgroundColor: g.color }]}>
          <Text style={styles.crestTxt}>{g.name[0]}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.title, { color: theme.text }]}>{g.name}</Text>
          <Text style={[styles.meta, { color: theme.text3 }]}>
            GROUP FEED · {g.members.toLocaleString()} MEMBERS
          </Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {groupPosts.length === 0 ? (
          <View style={[styles.empty, { borderColor: theme.line }]}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>📭</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No slips yet today</Text>
            <Text style={[styles.emptySub, { color: theme.text3 }]}>
              BE THE FIRST IN {g.name.toUpperCase()}
            </Text>
          </View>
        ) : (
          groupPosts.map((post) => (
            <FeedPostCard
              key={post.id}
              post={post}
              onLike={likePost}
              onComment={(pid) => router.push({ pathname: '/comments', params: { postId: pid } })}
              onShare={() => {}}
              onTicketPress={(tid) => router.push(`/ticket/${tid}`)}
              onOpenUser={(uid) => router.push(`/user/${uid}`)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crest: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crestTxt: {
    fontFamily: Fonts.dispBlack,
    fontSize: 14,
    color: '#06091A',
  },
  title: {
    fontFamily: Fonts.dispBlack,
    fontSize: 16,
    letterSpacing: -0.2,
  },
  meta: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  empty: {
    margin: 24,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
  },
  emptyTitle: {
    fontFamily: Fonts.dispBold,
    fontSize: 16,
  },
  emptySub: {
    fontFamily: Fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 0.5,
    marginTop: 6,
  },
});
