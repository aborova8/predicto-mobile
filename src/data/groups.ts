import type { Group } from '@/types/domain';

export const GROUPS: Group[] = [
  { id: 'g1', name: 'The Lads',         members: 12,   private: false, color: '#EAFE3D', desc: 'Sunday league predictions, no analysis required.', joined: true },
  { id: 'g2', name: 'Champions League', members: 847,  private: false, color: '#3DD9FE', desc: "Europe's biggest stage. Weekly tournaments.",        joined: true },
  { id: 'g3', name: 'Office FC',        members: 28,   private: true,  color: '#FE3D8B', desc: 'Workplace league — no spoilers in slack.',           joined: true },
  { id: 'g4', name: 'Serie A Heads',    members: 234,  private: false, color: '#3DFE8B', desc: 'Calcio purists only.',                                joined: false },
  { id: 'g5', name: 'Underdog Club',    members: 1204, private: false, color: '#FE9F3D', desc: 'Specialists in the long shot.',                       joined: false },
  { id: 'g6', name: 'PL Diehards',      members: 5621, private: false, color: '#D93DFE', desc: 'Premier League only. Match thread heaven.',           joined: false },
];

export const GROUP_POSTS: Record<string, string[]> = {
  g1: ['p2', 'p4'],
  g2: ['p3', 'p5'],
  g3: ['p1'],
};
