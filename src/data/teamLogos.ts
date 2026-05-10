// Premier League official badge CDN. Stable, hot-linkable, returns PNG.
// Keys are normalized team names — `normalizeTeamName` lowercases and strips
// "FC", "F.C.", "AFC", and collapses whitespace, so "Arsenal", "Arsenal FC",
// and "ARSENAL F.C." all match the same entry.
const PL_BADGE_BASE = 'https://resources.premierleague.com/premierleague/badges/70';

const PL_TEAM_IDS: Record<string, number> = {
  arsenal: 3,
  'aston villa': 7,
  bournemouth: 91,
  'afc bournemouth': 91,
  brentford: 94,
  brighton: 36,
  'brighton & hove albion': 36,
  'brighton and hove albion': 36,
  burnley: 90,
  chelsea: 8,
  'crystal palace': 31,
  everton: 11,
  fulham: 54,
  leeds: 2,
  'leeds united': 2,
  leicester: 13,
  'leicester city': 13,
  liverpool: 14,
  'man city': 43,
  'manchester city': 43,
  'man united': 1,
  'man utd': 1,
  'manchester united': 1,
  newcastle: 4,
  'newcastle united': 4,
  'nottingham forest': 17,
  "nott'm forest": 17,
  'nottm forest': 17,
  'sheffield united': 49,
  southampton: 20,
  tottenham: 6,
  'tottenham hotspur': 6,
  spurs: 6,
  'west ham': 21,
  'west ham united': 21,
  wolves: 39,
  wolverhampton: 39,
  'wolverhampton wanderers': 39,
  ipswich: 40,
  'ipswich town': 40,
  luton: 163,
  'luton town': 163,
  sunderland: 56,
};

export function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(f\.?c\.?|a\.?f\.?c\.?|c\.?f\.?)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function knownTeamLogo(name: string | null | undefined): string | null {
  if (!name) return null;
  const id = PL_TEAM_IDS[normalizeTeamName(name)];
  return id != null ? `${PL_BADGE_BASE}/t${id}.png` : null;
}
