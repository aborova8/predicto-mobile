import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/atoms/Icon';
import { SectionHeader } from '@/components/atoms/SectionHeader';
import { ScreenHeader } from '@/components/nav/ScreenHeader';
import { useAppState } from '@/state/AppStateContext';
import { Fonts } from '@/theme/fonts';
import { useTheme, useThemeCtx } from '@/theme/ThemeContext';
import type { FeedLayout, ThemeName, TicketVariant } from '@/types/domain';

export default function SettingsScreen() {
  const theme = useTheme();
  const { name: themeName, setName: setThemeName } = useThemeCtx();
  const router = useRouter();
  const {
    signOut,
    ticketVariant,
    setTicketVariant,
    feedLayout,
    setFeedLayout,
  } = useAppState();

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScreenHeader title="Settings" />
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <SectionHeader title="Account" />
        <Card>
          <Item icon="profile" label="Edit profile" />
          <Item icon="lock" label="Change password" divided />
          <Item icon="people" label="Friends" detail="5 friends" divided onPress={() => router.push('/friends')} />
        </Card>

        <SectionHeader title="Appearance" />
        <Card>
          <SegItem
            icon="star"
            label="Theme"
            options={(['dark', 'light', 'pitch'] as ThemeName[]).map((v) => ({
              value: v,
              label: v[0].toUpperCase() + v.slice(1),
            }))}
            value={themeName}
            onChange={(v) => setThemeName(v as ThemeName)}
          />
          <SegItem
            icon="comment"
            label="Ticket card"
            divided
            options={(['slip', 'card'] as TicketVariant[]).map((v) => ({
              value: v,
              label: v[0].toUpperCase() + v.slice(1),
            }))}
            value={ticketVariant}
            onChange={(v) => setTicketVariant(v as TicketVariant)}
          />
          <SegItem
            icon="filter"
            label="Feed density"
            divided
            options={(['card', 'compact'] as FeedLayout[]).map((v) => ({
              value: v,
              label: v[0].toUpperCase() + v.slice(1),
            }))}
            value={feedLayout}
            onChange={(v) => setFeedLayout(v as FeedLayout)}
          />
        </Card>

        <SectionHeader title="App" />
        <Card>
          <Item icon="bell" label="Notifications" detail="On" />
          <Item icon="eye" label="Privacy" detail="Public" divided />
          <Item icon="star" label="Subscriptions" detail="Free plan" divided onPress={() => router.push('/paywall')} />
        </Card>

        <SectionHeader title="Legal" />
        <Card>
          <Item
            icon="comment"
            label="Terms of service"
            onPress={() => router.push({ pathname: '/legal', params: { doc: 'terms' } })}
          />
          <Item
            icon="lock"
            label="Privacy policy"
            divided
            onPress={() => router.push({ pathname: '/legal', params: { doc: 'privacy' } })}
          />
        </Card>

        <SectionHeader title="Other" />
        <Card>
          <Item icon="comment" label="Help & support" />
          <Item icon="settings" label="About" divided />
        </Card>

        <View style={{ paddingHorizontal: 16, paddingTop: 6 }}>
          <Pressable
            onPress={() => {
              void signOut();
              // Auth gate auto-routes to sign-in once token clears.
            }}
            style={[styles.signOut, { backgroundColor: theme.surface, borderColor: theme.line }]}
          >
            <Icon name="logout" size={16} color={theme.loss} stroke={2} />
            <Text style={[styles.signOutTxt, { color: theme.loss }]}>Sign out</Text>
          </Pressable>
          <Text style={[styles.version, { color: theme.text3 }]}>PREDICTO v1.4.2</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.line },
      ]}
    >
      {children}
    </View>
  );
}

function Item({
  icon,
  label,
  detail,
  divided,
  onPress,
}: {
  icon: IconName;
  label: string;
  detail?: string;
  divided?: boolean;
  onPress?: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.item,
        divided && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.lineSoft },
      ]}
    >
      <Icon name={icon} size={18} color={theme.text2} />
      <Text style={{ flex: 1, fontFamily: Fonts.uiMedium, fontSize: 14, color: theme.text }}>
        {label}
      </Text>
      {detail ? (
        <Text style={{ fontFamily: Fonts.monoRegular, fontSize: 11, color: theme.text3 }}>{detail}</Text>
      ) : null}
      <Icon name="chevron" size={14} color={theme.text3} />
    </Pressable>
  );
}

function SegItem({
  icon,
  label,
  options,
  value,
  onChange,
  divided,
}: {
  icon: IconName;
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  divided?: boolean;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.segItem,
        divided && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.lineSoft },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <Icon name={icon} size={18} color={theme.text2} />
        <Text style={{ fontFamily: Fonts.uiMedium, fontSize: 14, color: theme.text }}>{label}</Text>
      </View>
      <View style={[styles.seg, { backgroundColor: theme.surface2 }]}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onChange(o.value)}
              style={[
                styles.segBtn,
                {
                  backgroundColor: active ? theme.neon : 'transparent',
                },
              ]}
            >
              <Text
                style={{
                  fontFamily: Fonts.dispBold,
                  fontSize: 12,
                  color: active ? '#06091A' : theme.text2,
                }}
              >
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  segItem: {
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  seg: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: 10,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOut: {
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  signOutTxt: {
    fontFamily: Fonts.dispBold,
    fontSize: 14,
  },
  version: {
    textAlign: 'center',
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 0.5,
    marginTop: 16,
  },
});
