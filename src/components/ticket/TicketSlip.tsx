import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Crest } from '@/components/atoms/Crest';
import { calculateTotalOdds, fmtOdds } from '@/lib/format';
import { getMatch } from '@/lib/matchCache';
import { statusGlyph, ticketBannerLabel } from '@/lib/status';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';
import type { Ticket } from '@/types/domain';

interface TicketSlipProps {
  ticket: Ticket;
  onPress?: () => void;
}

const PAPER = '#F4F1E6';
const INK = '#1A1A1A';
const MUTED = '#666';

const SLIP_STATUS_COLOR = { won: '#0E9E5E', lost: '#D9244C', pending: '#C99024' } as const;

export function TicketSlip({ ticket, onPress }: TicketSlipProps) {
  const theme = useTheme();
  const totalOdds = calculateTotalOdds(ticket.legs);
  const sColor = SLIP_STATUS_COLOR[ticket.status];
  const sLabel = ticketBannerLabel(ticket.status);
  const sGlyph = statusGlyph(ticket.status);

  return (
    <Pressable onPress={onPress} style={[styles.wrap, { backgroundColor: PAPER }]}>
      <View style={[styles.notch, styles.notchL, { backgroundColor: theme.bg }]} />
      <View style={[styles.notch, styles.notchR, { backgroundColor: theme.bg }]} />

      <View style={[styles.statusStrip, { backgroundColor: sColor }]}>
        <Text style={styles.statusText}>{sGlyph}  {sLabel}</Text>
        {ticket.status === 'pending' ? (
          <View style={styles.statusRight}>
            <View style={styles.dot} />
            <Text style={styles.statusText}>IN PLAY</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.headerBand}>
        <Text style={[styles.headerText, { color: theme.neon }]}>PREDICTO</Text>
        <Text style={[styles.headerText, { color: theme.neon }]}>
          {ticket.legs.length}-LEG
        </Text>
      </View>

      <View style={{ paddingTop: 8, paddingBottom: 4 }}>
        {ticket.legs.map((leg, i) => {
          const f = leg.fixture ?? getMatch(leg.matchId);
          if (!f) return null;
          const ls = leg.status;
          const wash =
            ls === 'won'
              ? 'rgba(14,158,94,0.10)'
              : ls === 'lost'
                ? 'rgba(217,36,76,0.10)'
                : 'transparent';
          const bar = ls === 'won' ? '#0E9E5E' : ls === 'lost' ? '#D9244C' : 'transparent';
          const glyph = ls === 'won' ? '✓' : ls === 'lost' ? '✕' : null;
          const glyphColor = ls === 'won' ? '#0E9E5E' : '#D9244C';
          return (
            <View
              key={i}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                backgroundColor: wash,
                borderLeftWidth: 3,
                borderLeftColor: bar,
              }}
            >
              <View style={styles.legHeader}>
                <Text style={styles.legHeaderTxt}>
                  {f.league.toUpperCase()}{leg.result ? ` · ${leg.result}` : ''}
                </Text>
                <Text style={styles.legHeaderTxt}>{f.kickoff.toUpperCase()}</Text>
              </View>
              <View style={styles.legRow}>
                <View style={styles.legTeams}>
                  {glyph ? (
                    <Text style={[styles.legGlyph, { color: glyphColor }]}>{glyph}</Text>
                  ) : null}
                  <Crest team={f.home} name={f.homeName} size={18} logo={f.homeLogo} />
                  <Text style={styles.legTeamsTxt} numberOfLines={1}>
                    {f.homeName ?? f.home}
                  </Text>
                  <Text style={styles.legVsTxt}>vs</Text>
                  <Crest team={f.away} name={f.awayName} size={18} logo={f.awayLogo} />
                  <Text style={styles.legTeamsTxt} numberOfLines={1}>
                    {f.awayName ?? f.away}
                  </Text>
                </View>
                <View style={styles.legPickWrap}>
                  <View style={styles.legPickBox}>
                    <Text style={[styles.legPickTxt, { color: theme.neon }]}>{leg.pick}</Text>
                  </View>
                  <Text style={styles.legOdds}>@{fmtOdds(f.odds[leg.pick])}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Perforation row */}
      <View style={styles.perfRow}>
        {Array.from({ length: 30 }).map((_, i) => (
          <View key={i} style={[styles.perfDot, { backgroundColor: theme.bg }]} />
        ))}
      </View>

      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          <Text style={styles.footerLabel}>MULTIPLIER</Text>
          <Text style={styles.footerValue}>{fmtOdds(totalOdds)}×</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text style={styles.footerLabel}>
            {ticket.status === 'won' ? 'POINTS WON' : 'POINTS AT STAKE'}
          </Text>
          <Text
            style={[
              styles.footerValue,
              { color: ticket.status === 'pending' ? INK : sColor },
            ]}
          >
            {ticket.potential.toLocaleString()} pts
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 6,
  },
  notch: {
    position: 'absolute',
    top: '42%',
    width: 16,
    height: 16,
    borderRadius: 8,
    zIndex: 2,
  },
  notchL: { left: -8 },
  notchR: { right: -8 },
  statusStrip: {
    paddingVertical: 5,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontFamily: Fonts.monoBlack,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  headerBand: {
    backgroundColor: INK,
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  legHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  legHeaderTxt: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    color: MUTED,
    letterSpacing: 0.5,
  },
  legRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legTeams: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legVsTxt: {
    fontFamily: Fonts.monoRegular,
    fontSize: 11,
    color: '#999',
    paddingHorizontal: 1,
  },
  legGlyph: {
    fontFamily: Fonts.monoBlack,
    fontSize: 11,
    width: 14,
    textAlign: 'center',
  },
  legTeamsTxt: {
    flexShrink: 1,
    fontFamily: Fonts.monoSemi,
    fontSize: 13,
    color: INK,
  },
  legPickWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legPickBox: {
    backgroundColor: INK,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 3,
    minWidth: 22,
    alignItems: 'center',
  },
  legPickTxt: {
    fontFamily: Fonts.monoBold,
    fontSize: 12,
  },
  legOdds: {
    fontFamily: Fonts.monoBold,
    fontSize: 12,
    color: INK,
    minWidth: 36,
    textAlign: 'right',
  },
  perfRow: {
    height: 14,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  perfDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginHorizontal: 3.5,
    alignSelf: 'center',
  },
  footer: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#999',
    borderStyle: 'dashed',
  },
  footerLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 9,
    color: MUTED,
    letterSpacing: 0.5,
  },
  footerValue: {
    fontFamily: Fonts.monoBlack,
    fontSize: 13,
    color: INK,
    marginTop: 2,
  },
});
