import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { AppState } from 'react-native';

interface DataEpochCtx {
  epoch: number;
  bump: () => void;
}

const DataEpochContext = createContext<DataEpochCtx>({ epoch: 0, bump: () => {} });

// Counter that bumps every time the app transitions to active (foreground)
// AND whenever an external caller (e.g. AppStateContext on sign-out) calls
// `bump()`. Lives in its own context so consumers of AppStateContext (auth,
// picks, UI prefs — ~20 call sites) do not re-render on every foreground
// event; only hooks that opt in via `useDataEpoch()` see the change.
export function DataEpochProvider({ children }: PropsWithChildren) {
  const [epoch, setEpoch] = useState(0);
  const bump = useCallback(() => setEpoch((n) => n + 1), []);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') bump();
    });
    return () => sub.remove();
  }, [bump]);
  const value = useMemo<DataEpochCtx>(() => ({ epoch, bump }), [epoch, bump]);
  return <DataEpochContext.Provider value={value}>{children}</DataEpochContext.Provider>;
}

export function useDataEpoch(): number {
  return useContext(DataEpochContext).epoch;
}

// Imperative bump for cross-context resets (auth state changes, manual
// "refresh everything" actions). Returns a stable function reference.
export function useBumpDataEpoch(): () => void {
  return useContext(DataEpochContext).bump;
}
