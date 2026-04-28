import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import type { ThemeName } from '@/types/domain';
import { getTheme, type Theme } from './tokens';

interface ThemeCtx {
  name: ThemeName;
  theme: Theme;
  setName: (n: ThemeName) => void;
}

const ThemeContext = createContext<ThemeCtx | null>(null);

const STORAGE_KEY = 'predicto.theme';

export function ThemeProvider({ children }: PropsWithChildren) {
  const [name, setNameState] = useState<ThemeName>('dark');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === 'dark' || v === 'light' || v === 'pitch') setNameState(v);
    });
  }, []);

  const setName = useCallback((n: ThemeName) => {
    setNameState(n);
    AsyncStorage.setItem(STORAGE_KEY, n).catch(() => {});
  }, []);

  const value = useMemo<ThemeCtx>(
    () => ({ name, theme: getTheme(name), setName }),
    [name, setName],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeCtx(): ThemeCtx {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeCtx must be used inside <ThemeProvider>');
  return ctx;
}

export function useTheme(): Theme {
  return useThemeCtx().theme;
}
