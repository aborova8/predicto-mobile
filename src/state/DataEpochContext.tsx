import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';

const DataEpochContext = createContext<number>(0);

// Counter that bumps every time the app transitions to active (foreground).
// Lives in its own context so consumers of AppStateContext (auth, picks, UI
// prefs — ~20 call sites) do not re-render on every foreground event; only
// hooks that opt in via `useDataEpoch()` see the change.
export function DataEpochProvider({ children }: PropsWithChildren) {
  const [epoch, setEpoch] = useState(0);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setEpoch((n) => n + 1);
    });
    return () => sub.remove();
  }, []);
  return <DataEpochContext.Provider value={epoch}>{children}</DataEpochContext.Provider>;
}

export function useDataEpoch(): number {
  return useContext(DataEpochContext);
}
