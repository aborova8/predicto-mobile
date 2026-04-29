import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Crest } from '@/components/atoms/Crest';
import { Pill } from '@/components/atoms/Pill';
import { TEAMS } from '@/data/teams';
import { fixtureMap } from '@/data/fixtures';
import { withAlpha } from '@/lib/colors';
import { calculateTotalOdds, fmtOdds } from '@/lib/format';
import { getMatch } from '@/lib/matchCache';
import { legStatusColor, statusGlyph, ticketBannerLabel, ticketStatusColor } from '@/lib/status';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';
import type { Ticket } from '@/types/domain';

interface TicketCardProps {
  ticket: Ticket;
  onPress?: () => void;
}

export function TicketCard({ ticket, onPress }: TicketCardProps) {
  const theme = useTheme();
  const totalOdds = calculateTotalOdds(ticket.legs);
  const sColor = ticketStatusColor(theme, ticket.status);
  const sLabel = ticketBannerLabel(ticket.status);
  const sGlyph = statusGlyph(ticket.status);

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.wrap,
        { backgroundColor: theme.surface, borderColor: withAlpha(sColor, 0.33) },
      ]}
    >
      <View style={[styles.banner, { backgroundColor: sColor }]}>
        <View style={styles.bannerLeft}>
          <View style={styles.bannerGlyph}>
            <Text style={styles.bannerGlyphTxt}>{sGlyph}</Text>
          </View>
          <Text style={styles.bannerText}>{sLabel}</Text>
        </View>
        {ticket.status === 'pending' ? (
          <View style={styles.bannerRight}>
            <View style={styles.dot} />
            <Text style={[styles.bannerText, { fontSize: 9 }]}>IN PLAY</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.header}>
        <Pill color={theme.text2}>{`${ticket.legs.length}-LEG ACCUMULATOR`}</Pill>
        <Text style={[styles.totalOdds, { color: theme.neon }]}>{fmtOdds(totalOdds)}×</Text>
      </View>

      <View style={{ paddingHorizontal: 14, paddingBottom: 12 }}>
        {ticket.legs.map((leg, i) => {
          const f = leg.fixture ?? getMatch(leg.matchId) ?? fixtureMap[leg.matchId];
          if (!f) return null;
          const isLast = i === ticket.legs.length - 1;
          const ls = leg.status;
          const wash =
            ls === 'won'
              ? withAlpha(theme.win, 0.06)
              : ls === 'lost'
                ? withAlpha(theme.loss, 0.06)
                : 'transparent';
          const accent = ls === 'won' || ls === 'lost' ? legStatusColor(theme, ls) : null;
          const glyph = ls === 'won' ? '✓' : ls === 'lost' ? '✕' : null;
          return (
            <View
              key={i}
              style={[
                styles.leg,
                {
                  backgroundColor: wash,
                  borderBottomColor: theme.lineSoft,
                  borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
                },
              ]}
            >
              <View style={styles.crests}>
                <Crest team={f.home} size={22} />
                <View style={{ marginLeft: -6 }}>
                  <Crest team={f.away} size={22} />
                </View>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.teamLine}>
                  {glyph ? (
                    <Text style={[styles.legGlyph, { color: accent ?? theme.text }]}>{glyph}</Text>
                  ) : null}
                  <Text style={[styles.teamLineTxt, { color: accent ?? theme.text }]} numberOfLines={1}>
                    {TEAMS[f.home]?.short ?? f.home}{' '}
                    <Text style={{ color: theme.text3 }}>vs</Text>{' '}
                    {TEAMS[f.away]?.short ?? f.away}
                  </Text>
                </View>
                <Text style={[styles.metaLine, { color: theme.text3 }]} numberOfLines={1}>
                  {f.kickoff} · {f.league}{leg.result ? ` · ${leg.result}` : ''}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <View
                  style={[
                    styles.pickBox,
                    { backgroundColor: accent ?? theme.neon },
                  ]}
                >
                  <Text style={styles.pickBoxTxt}>{leg.pick}</Text>
                </View>
                <Text style={[styles.legOdds, { color: theme.text2 }]}>{fmtOdds(f.odds[leg.pick])}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={[styles.footer, { backgroundColor: theme.surface2, borderTopColor: theme.line }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.footerLabel, { color: theme.text3 }]}>MULTIPLIER</Text>
          <Text style={[styles.footerValue, { color: theme.text }]}>{fmtOdds(totalOdds)}×</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.footerLabel, { color: theme.text3 }]}>
            {ticket.status === 'won' ? 'POINTS WON' : 'POINTS AT STAKE'}
          </Text>
          <Text style={[styles.footerValue, { color: sColor }]}>
            {ticket.potential.toLocaleString()} pts
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  banner: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bannerGlyph: {
    width: 14,
    height: 14,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerGlyphTxt: {
    color: '#fff',
    fontFamily: Fonts.monoBlack,
    fontSize: 10,
  },
  bannerText: {
    color: '#fff',
    fontFamily: Fonts.monoBlack,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  bannerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalOdds: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
  },
  leg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginHorizontal: -8,
    borderRadius: 8,
  },
  crests: {
    flexDirection: 'row',
    width: 36,
  },
  teamLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legGlyph: {
    fontFamily: Fonts.monoBlack,
    fontSize: 11,
    width: 13,
    textAlign: 'center',
  },
  teamLineTxt: {
    fontFamily: Fonts.uiSemi,
    fontSize: 13,
    flexShrink: 1,
  },
  metaLine: {
    fontFamily: Fonts.monoRegular,
    fontSize: 10,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  pickBox: {
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 5,
    minWidth: 24,
    alignItems: 'center',
  },
  pickBoxTxt: {
    color: '#06091A',
    fontFamily: Fonts.monoBlack,
    fontSize: 11,
  },
  legOdds: {
    fontFamily: Fonts.monoSemi,
    fontSize: 10,
    marginTop: 2,
  },
  footer: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 0.6,
  },
  footerValue: {
    fontFamily: Fonts.dispBlack,
    fontSize: 14,
    marginTop: 2,
  },
});
