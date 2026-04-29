import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import { configureApi } from '@/lib/api';
import { createTicket } from '@/lib/api/tickets';
import * as authApi from '@/lib/auth/api';
import * as authStorage from '@/lib/auth/storage';
import { predictionFromPick } from '@/lib/mappers';
import type { AuthUser, FeedLayout, FeedScope, Pick, TicketVariant } from '@/types/domain';

type Picks = Record<string, Pick | null>;

interface SubmitTicketOptions {
  caption?: string;
}

interface AppStateCtx {
  // ── Auth ────────────────────────────────────────────────────────────────
  authed: boolean;
  authLoading: boolean;
  user: AuthUser | null;
  token: string | null;
  signIn: (identifier: string, password: string) => Promise<void>;
  signUp: (input: authApi.SignUpInput) => Promise<void>;
  signInWithGoogle: (idToken: string, username?: string) => Promise<void>;
  signInWithApple: (payload: authApi.AppleSignInPayload) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  verifyPasswordResetCode: (email: string, code: string) => Promise<void>;
  confirmPasswordReset: (email: string, code: string, newPassword: string) => Promise<void>;

  // ── Picks / slip in progress ────────────────────────────────────────────
  picks: Picks;
  setPick: (matchId: string, pick: Pick | null) => void;
  clearPicks: () => void;
  pickCount: number;
  submitTicket: (opts?: SubmitTicketOptions) => Promise<{ ticketId: string }>;

  // ── UI prefs ────────────────────────────────────────────────────────────
  filter: FeedScope;
  setFilter: (f: FeedScope) => void;

  ticketVariant: TicketVariant;
  setTicketVariant: (v: TicketVariant) => void;

  feedLayout: FeedLayout;
  setFeedLayout: (v: FeedLayout) => void;
}

const AppStateContext = createContext<AppStateCtx | null>(null);

const TICKET_VARIANT_KEY = 'predicto.ticketVariant';
const FEED_LAYOUT_KEY = 'predicto.feedLayout';

function sameAuthUser(a: AuthUser | null, b: AuthUser | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.id === b.id &&
    a.username === b.username &&
    a.email === b.email &&
    a.avatarUrl === b.avatarUrl &&
    a.bio === b.bio &&
    a.role === b.role &&
    a.points === b.points &&
    a.livesBalance === b.livesBalance &&
    a.createdAt === b.createdAt
  );
}

export function AppStateProvider({ children }: PropsWithChildren) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  // Mirror token in a ref so the api `getToken` callback always sees the
  // latest value without re-running configureApi on every change.
  const tokenRef = useRef<string | null>(null);

  // ── Picks / UI prefs ──────────────────────────────────────────────────────
  const [picks, setPicks] = useState<Picks>({});
  const [filter, setFilter] = useState<FeedScope>('global');
  const [ticketVariant, setTicketVariantState] = useState<TicketVariant>('slip');
  const [feedLayout, setFeedLayoutState] = useState<FeedLayout>('card');

  const applySession = useCallback((next: { token: string; user: AuthUser } | null) => {
    if (next) {
      tokenRef.current = next.token;
      setToken(next.token);
      setUser(next.user);
    } else {
      tokenRef.current = null;
      setToken(null);
      setUser(null);
    }
  }, []);

  const signOut = useCallback(async () => {
    // Best-effort remote call; never block local logout on the network.
    try {
      if (tokenRef.current) await authApi.signOutRemote();
    } catch {}
    await authStorage.clearSession();
    applySession(null);
  }, [applySession]);

  useEffect(() => {
    configureApi({
      getToken: () => tokenRef.current,
      onUnauthorized: () => {
        // Defer a tick so the in-flight request can throw before we clear.
        setTimeout(() => {
          void signOut();
        }, 0);
      },
    });
  }, [signOut]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [persisted, prefs] = await Promise.all([
          authStorage.getSession(),
          AsyncStorage.multiGet([TICKET_VARIANT_KEY, FEED_LAYOUT_KEY]),
        ]);
        if (cancelled) return;
        const map = Object.fromEntries(prefs);
        const tv = map[TICKET_VARIANT_KEY];
        const fl = map[FEED_LAYOUT_KEY];
        if (tv === 'slip' || tv === 'card') setTicketVariantState(tv);
        if (fl === 'card' || fl === 'compact') setFeedLayoutState(fl);
        if (persisted) {
          applySession(persisted);
          void authApi.getMe().then(
            (fresh) => {
              if (cancelled) return;
              if (sameAuthUser(persisted.user, fresh)) return;
              setUser(fresh);
              void authStorage.updateCachedUser(fresh);
            },
            () => {},
          );
        }
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applySession]);

  const setTicketVariant = useCallback((v: TicketVariant) => {
    setTicketVariantState(v);
    AsyncStorage.setItem(TICKET_VARIANT_KEY, v).catch(() => {});
  }, []);

  const setFeedLayout = useCallback((v: FeedLayout) => {
    setFeedLayoutState(v);
    AsyncStorage.setItem(FEED_LAYOUT_KEY, v).catch(() => {});
  }, []);

  const persistAndApply = useCallback(
    async (response: authApi.AuthResponse) => {
      await authStorage.setSession(response);
      applySession(response);
    },
    [applySession],
  );

  const signIn = useCallback(
    async (identifier: string, password: string) => {
      const res = await authApi.signIn(identifier, password);
      await persistAndApply(res);
    },
    [persistAndApply],
  );

  const signUp = useCallback(
    async (input: authApi.SignUpInput) => {
      const res = await authApi.signUp(input);
      await persistAndApply(res);
    },
    [persistAndApply],
  );

  const signInWithGoogle = useCallback(
    async (idToken: string, username?: string) => {
      const res = await authApi.signInWithGoogle(idToken, username);
      await persistAndApply(res);
    },
    [persistAndApply],
  );

  const signInWithApple = useCallback(
    async (payload: authApi.AppleSignInPayload) => {
      const res = await authApi.signInWithApple(payload);
      await persistAndApply(res);
    },
    [persistAndApply],
  );

  const refreshUser = useCallback(async () => {
    const fresh = await authApi.getMe();
    setUser((prev) => (sameAuthUser(prev, fresh) ? prev : fresh));
    await authStorage.updateCachedUser(fresh);
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    await authApi.requestPasswordReset(email);
  }, []);

  const verifyPasswordResetCode = useCallback(async (email: string, code: string) => {
    await authApi.verifyPasswordResetCode(email, code);
  }, []);

  const confirmPasswordReset = useCallback(
    async (email: string, code: string, newPassword: string) => {
      await authApi.confirmPasswordReset(email, code, newPassword);
    },
    [],
  );

  const setPick = useCallback((matchId: string, pick: Pick | null) => {
    setPicks((prev) => {
      if ((prev[matchId] ?? null) === pick) return prev;
      return { ...prev, [matchId]: pick };
    });
  }, []);

  const clearPicks = useCallback(() => setPicks({}), []);

  const submitTicket = useCallback(
    async (opts: SubmitTicketOptions = {}) => {
      const items = Object.entries(picks).filter(
        (entry): entry is [string, Pick] => entry[1] !== null && entry[1] !== undefined,
      );
      if (items.length === 0) {
        throw new Error('Pick at least one match before submitting.');
      }
      const payload = {
        picks: items.map(([matchId, pick]) => ({
          matchId,
          prediction: predictionFromPick(pick),
        })),
        caption: opts.caption,
      };
      const { ticket } = await createTicket(payload);
      setPicks({});
      // Refresh the cached user (livesBalance / points may have shifted).
      void refreshUser().catch(() => {});
      return { ticketId: ticket.id };
    },
    [picks, refreshUser],
  );

  const pickCount = useMemo(
    () => Object.values(picks).filter((p) => p !== null && p !== undefined).length,
    [picks],
  );

  const authed = token !== null;

  const value = useMemo<AppStateCtx>(
    () => ({
      authed,
      authLoading,
      user,
      token,
      signIn,
      signUp,
      signInWithGoogle,
      signInWithApple,
      signOut,
      refreshUser,
      requestPasswordReset,
      verifyPasswordResetCode,
      confirmPasswordReset,

      picks, setPick, clearPicks, pickCount, submitTicket,
      filter, setFilter,
      ticketVariant, setTicketVariant,
      feedLayout, setFeedLayout,
    }),
    [
      authed, authLoading, user, token,
      signIn, signUp, signInWithGoogle, signInWithApple, signOut, refreshUser,
      requestPasswordReset, verifyPasswordResetCode, confirmPasswordReset,
      picks, setPick, clearPicks, pickCount, submitTicket,
      filter, ticketVariant, setTicketVariant,
      feedLayout, setFeedLayout,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateCtx {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used inside <AppStateProvider>');
  return ctx;
}
