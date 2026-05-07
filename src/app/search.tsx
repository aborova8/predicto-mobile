import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/atoms/Avatar';
import { Icon } from '@/components/atoms/Icon';
import { FIXTURES } from '@/data/fixtures';
import { TEAMS } from '@/data/teams';
import { USERS } from '@/data/users';
import { useGroups } from '@/hooks/useGroups';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';

type Scope = 'all' | 'users' | 'groups' | 'matches';

const TRENDING = ['El Clásico', 'PSG vs Bayern', 'Premier League', 'Underdog Club', '@marcoR'];
const RECENT = ['ARS vs CHE', '@anya.v', 'The Lads'];

export default function SearchScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [scope, setScope] = useState<Scope>('all');
  const inputRef = useRef<TextInput>(null);

  // Backend has no group-search endpoint, but `scope=public` returns up to 100
  // groups and we filter client-side. The list is silently absent if loading
  // fails — we don't want a network blip to block users/matches search.
  const publicGroups = useGroups({ scope: 'public' });

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, []);

  const { userResults, groupResults, matchResults } = useMemo(() => {
    if (!q) return { userResults: [], groupResults: [], matchResults: [] };
    const needle = q.toLowerCase();
    const has = (target: string) => target.toLowerCase().includes(needle);
    return {
      userResults: Object.values(USERS).filter(
        (u) => !u.isMe && (has(u.name) || has(u.handle)),
      ),
      groupResults: publicGroups.groups.filter((g) => has(g.name) || has(g.description ?? '')),
      matchResults: FIXTURES.filter(
        (m) =>
          has(TEAMS[m.home]?.name ?? '') ||
          has(TEAMS[m.away]?.name ?? '') ||
          has(m.home) ||
          has(m.away) ||
          has(m.league),
      ),
    };
  }, [q, publicGroups.groups]);
  const empty =
    q && userResults.length === 0 && groupResults.length === 0 && matchResults.length === 0;
  const showSection = (k: Scope) => scope === 'all' || scope === k;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: theme.lineSoft }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: theme.line }]}
          >
            <Icon name="chevronL" size={18} color={theme.text2} />
          </Pressable>
          <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.line }]}>
            <Icon name="search" size={16} color={theme.text3} />
            <TextInput
              ref={inputRef}
              value={q}
              onChangeText={setQ}
              placeholder="Search players, groups, matches…"
              placeholderTextColor={theme.text3}
              style={{
                flex: 1,
                fontFamily: Fonts.uiRegular,
                fontSize: 13,
                color: theme.text,
              }}
            />
            {q ? (
              <Pressable onPress={() => setQ('')}>
                <Icon name="x" size={14} color={theme.text3} />
              </Pressable>
            ) : null}
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 10, paddingLeft: 44 }}>
          {(['all', 'users', 'groups', 'matches'] as const).map((s) => {
            const a = s === scope;
            return (
              <Pressable
                key={s}
                onPress={() => setScope(s)}
                style={[
                  styles.scopePill,
                  {
                    backgroundColor: a ? theme.neon : 'transparent',
                    borderColor: a ? theme.neon : theme.line,
                  },
                ]}
              >
                <Text style={[styles.scopeTxt, { color: a ? '#06091A' : theme.text2 }]}>
                  {s === 'users' ? 'PLAYERS' : s.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
        {!q ? (
          <>
            <Text style={[styles.sectionLabel, { color: theme.text3 }]}>TRENDING</Text>
            <View style={styles.chipsRow}>
              {TRENDING.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setQ(t.replace('@', ''))}
                  style={[styles.chip, { backgroundColor: theme.surface, borderColor: theme.line }]}
                >
                  <Text style={{ color: theme.neon }}>↗</Text>
                  <Text style={{ color: theme.text, fontFamily: Fonts.uiMedium, fontSize: 12 }}>
                    {t}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={[styles.sectionLabel, { color: theme.text3, marginTop: 18 }]}>
              RECENT
            </Text>
            <View
              style={[styles.recentCard, { backgroundColor: theme.surface, borderColor: theme.line }]}
            >
              {RECENT.map((r, i) => (
                <Pressable
                  key={r}
                  onPress={() => setQ(r.replace('@', ''))}
                  style={[
                    styles.recentRow,
                    i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.lineSoft },
                  ]}
                >
                  <Icon name="search" size={14} color={theme.text3} />
                  <Text style={{ flex: 1, color: theme.text, fontFamily: Fonts.uiRegular, fontSize: 13 }}>
                    {r}
                  </Text>
                  <Text style={{ color: theme.text3, fontFamily: Fonts.monoRegular, fontSize: 10 }}>↖</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : empty ? (
          <View style={{ paddingVertical: 60, paddingHorizontal: 24, alignItems: 'center' }}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>🔎</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No results</Text>
            <Text style={[styles.emptySub, { color: theme.text3 }]}>
              NOTHING FOUND FOR "{q.toUpperCase()}"
            </Text>
          </View>
        ) : (
          <>
            {showSection('users') && userResults.length > 0 ? (
              <Section title={`Players · ${userResults.length}`}>
                {userResults.slice(0, 6).map((u) => (
                  <Pressable
                    key={u.id}
                    onPress={() => router.push(`/user/${u.id}`)}
                    style={[styles.row]}
                  >
                    <Avatar user={u} size={36} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowTitle, { color: theme.text }]}>{u.name}</Text>
                      <Text style={[styles.rowMeta, { color: theme.text3 }]}>
                        @{u.handle} · LVL {u.level} · {u.hitRate}%
                      </Text>
                    </View>
                    <Icon name="chevron" size={14} color={theme.text3} />
                  </Pressable>
                ))}
              </Section>
            ) : null}
            {showSection('groups') && groupResults.length > 0 ? (
              <Section title={`Groups · ${groupResults.length}`}>
                {groupResults.map((g) => (
                  <Pressable key={g.id} onPress={() => router.push(`/group/${g.id}`)} style={styles.row}>
                    <View style={[styles.groupBadge, { backgroundColor: g.color }]}>
                      <Text style={styles.groupBadgeTxt}>{g.name[0]?.toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowTitle, { color: theme.text }]}>{g.name}</Text>
                      <Text style={[styles.rowMeta, { color: theme.text3 }]}>
                        {g.memberCount.toLocaleString()} MEMBERS{g.visibility === 'PRIVATE' ? ' · 🔒 PRIVATE' : ''}
                      </Text>
                    </View>
                    <Icon name="chevron" size={14} color={theme.text3} />
                  </Pressable>
                ))}
              </Section>
            ) : null}
            {showSection('matches') && matchResults.length > 0 ? (
              <Section title={`Matches · ${matchResults.length}`}>
                {matchResults.map((m) => (
                  <View key={m.id} style={styles.row}>
                    <View style={[styles.leagueBox, { backgroundColor: theme.surface2, borderColor: theme.line }]}>
                      <Text style={{ color: theme.text2, fontFamily: Fonts.monoBold, fontSize: 9 }}>
                        {m.league
                          .split(' ')
                          .map((w) => w[0])
                          .join('')
                          .slice(0, 2)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowTitle, { color: theme.text }]}>
                        {TEAMS[m.home]?.short} vs {TEAMS[m.away]?.short}
                      </Text>
                      <Text style={[styles.rowMeta, { color: theme.text3 }]}>
                        {m.league.toUpperCase()} · {m.kickoff.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={{ color: theme.neon, fontFamily: Fonts.monoBold, fontSize: 11 }}>
                      {m.odds['1'].toFixed(2)}×
                    </Text>
                  </View>
                ))}
              </Section>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
      <Text style={[styles.sectionLabel, { color: theme.text3 }]}>{title.toUpperCase()}</Text>
      <View style={[styles.list, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 12,
    paddingBottom: 8,
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
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 36,
  },
  scopePill: {
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 999,
    borderWidth: 1,
  },
  scopeTxt: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    letterSpacing: 0.4,
  },
  sectionLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 999,
  },
  recentCard: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  list: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  rowTitle: {
    fontFamily: Fonts.dispBold,
    fontSize: 13,
  },
  rowMeta: {
    fontFamily: Fonts.monoRegular,
    fontSize: 11,
    marginTop: 2,
  },
  groupBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupBadgeTxt: {
    fontFamily: Fonts.dispBlack,
    fontSize: 16,
    color: '#06091A',
  },
  leagueBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: Fonts.dispBold,
    fontSize: 16,
  },
  emptySub: {
    fontFamily: Fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 0.4,
    marginTop: 4,
  },
});
