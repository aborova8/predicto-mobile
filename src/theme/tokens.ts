import type { ThemeName } from '@/types/domain';

export interface Theme {
  bg: string;
  surface: string;
  surface2: string;
  line: string;
  lineSoft: string;
  text: string;
  text2: string;
  text3: string;
  neon: string;
  neonDim: string;
  win: string;
  loss: string;
  draw: string;
  pending: string;
}

export const PRED: Theme = {
  bg: '#06091A',
  surface: '#0E1330',
  surface2: '#161B3D',
  line: 'rgba(255,255,255,0.08)',
  lineSoft: 'rgba(255,255,255,0.04)',
  text: '#F4F6FF',
  text2: 'rgba(244,246,255,0.62)',
  text3: 'rgba(244,246,255,0.38)',
  neon: '#EAFE3D',
  neonDim: 'rgba(234,254,61,0.14)',
  win: '#3DFEA1',
  loss: '#FE3D6A',
  draw: '#FFB454',
  pending: '#3DC0FE',
};

export const LIGHT: Theme = {
  bg: '#F2F4FA',
  surface: '#FFFFFF',
  surface2: '#FAFBFE',
  line: 'rgba(8,12,40,0.10)',
  lineSoft: 'rgba(8,12,40,0.04)',
  text: '#06091A',
  text2: 'rgba(6,9,26,0.62)',
  text3: 'rgba(6,9,26,0.40)',
  neon: '#1E2C84',
  neonDim: 'rgba(30,44,132,0.10)',
  win: '#0E9E5E',
  loss: '#D9244C',
  draw: '#C57A18',
  pending: '#1670AE',
};

export const PITCH: Theme = {
  bg: '#022016',
  surface: '#063D26',
  surface2: '#0A553A',
  line: 'rgba(255,255,255,0.10)',
  lineSoft: 'rgba(255,255,255,0.04)',
  text: '#F0FFE8',
  text2: 'rgba(240,255,232,0.65)',
  text3: 'rgba(240,255,232,0.40)',
  neon: '#F2FF4D',
  neonDim: 'rgba(242,255,77,0.16)',
  win: '#7CFE9C',
  loss: '#FE7D8E',
  draw: '#FFC872',
  pending: '#7DD8FE',
};

export const THEMES: Record<ThemeName, Theme> = {
  dark: PRED,
  light: LIGHT,
  pitch: PITCH,
};

export const getTheme = (name: ThemeName): Theme => THEMES[name] ?? PRED;
