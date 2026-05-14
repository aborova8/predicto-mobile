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
import { AppState } from 'react-native';

import { ApiError, configureApi } from '@/lib/api';
import { getEntitlements, type BackendEntitlements } from '@/lib/api/iap';
import { getUnreadNotifications } from '@/lib/api/notifications';
import { createTicket } from '@/lib/api/tickets';
import * as authApi from '@/lib/auth/api';
import * as authStorage from '@/lib/auth/storage';
import { predictionFromPick } from '@/lib/mappers';
import { partitionPicksByKickoff } from '@/lib/picks';
import { registerPushForSession, unregisterPushForSession } from '@/lib/push';
import { useBumpDataEpoch, useDataEpoch } from '@/state/DataEpochContext';
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
  revokeAllOtherSessions: () => Promise<void>;
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

  // ── IAP entitlements (feature-flag layer; per-screen ticket eligibility lives in useEligibility) ──
  entitlements: BackendEntitlements | null;
  refreshEntitlements: () => Promise<void>;

  // Shared so useNotifications.markRead can decrement the bell badge
  // instantly instead of waiting for the 60s poll.
  unreadNotifications: number;
  refreshUnreadNotifications: () => Promise<void>;
  decrementUnreadNotifications: (n?: number) => void;
  clearUnreadNotifications: () => void;
}

const AppStateContext = createContext<AppStateCtx | null>(null);

const TICKET_VARIANT_KEY = 'predicto.ticketVariant';
const FEED_LAYOUT_KEY = 'predicto.feedLayout';

function sameEntitlements(a: BackendEntitlements | null, b: BackendEntitlements | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.hasActiveSubscription === b.hasActiveSubscription &&
    a.livesBalance === b.livesBalance &&
    a.subscription?.expiresAt === b.subscription?.expiresAt &&
    a.subscription?.status === b.subscription?.status &&
    a.flags.hideAds === b.flags.hideAds &&
    a.flags.unlimitedTickets === b.flags.unlimitedTickets &&
    a.flags.canCreatePrivateGroup === b.flags.canCreatePrivateGroup
  );
}

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
    a.emailVerified === b.emailVerified &&
    a.provider === b.provider &&
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
  // Mirror the refresh token in a ref too — it changes on every /auth/refresh
  // rotation, and the api `refreshAccessToken` callback needs the latest.
  const refreshTokenRef = useRef<string | null>(null);
  // Guards against concurrent signOut() calls — a burst of 401s would
  // otherwise schedule N parallel logouts that race for SecureStore and
  // push-token cleanup. The first one wins; the rest are no-ops.
  const signOutInFlightRef = useRef(false);

  // ── Picks / UI prefs ──────────────────────────────────────────────────────
  const [picks, setPicks] = useState<Picks>({});
  const [filter, setFilter] = useState<FeedScope>('global');
  const [ticketVariant, setTicketVariantState] = useState<TicketVariant>('slip');
  const [feedLayout, setFeedLayoutState] = useState<FeedLayout>('card');
  const [entitlements, setEntitlements] = useState<BackendEntitlements | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const unreadReqRef = useRef(0);
  const dataEpoch = useDataEpoch();
  const bumpDataEpoch = useBumpDataEpoch();

  const refreshEntitlements = useCallback(async () => {
    if (!tokenRef.current) {
      setEntitlements((prev) => (prev === null ? prev : null));
      return;
    }
    // Tight 5s timeout — inheriting the api layer's 30s default leaves the
    // paywall stuck in an indeterminate state on slow networks, where the
    // user can't tell "checking subscription" from "not subscribed". The
    // call is advisory so timing out is the same as "no entitlement".
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      const { entitlements: e } = await Promise.race([
        getEntitlements(),
        new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('entitlements timeout')), 5000);
        }),
      ]);
      // Skip the re-render when nothing material changed — foreground refreshes
      // fire often and entitlements rarely move.
      setEntitlements((prev) => (sameEntitlements(prev, e) ? prev : e));
    } catch {
      // Entitlements are advisory — never block UX on their refresh.
    } finally {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    }
  }, []);

  const refreshUnreadNotifications = useCallback(async () => {
    if (!tokenRef.current) {
      setUnreadNotifications((prev) => (prev === 0 ? prev : 0));
      return;
    }
    const reqId = ++unreadReqRef.current;
    try {
      const { unread } = await getUnreadNotifications();
      if (unreadReqRef.current !== reqId) return;
      setUnreadNotifications((prev) => (prev === unread ? prev : unread));
    } catch {
      // Badge is advisory; silent failure.
    }
  }, []);

  const decrementUnreadNotifications = useCallback((n: number = 1) => {
    setUnreadNotifications((prev) => Math.max(0, prev - n));
  }, []);

  const clearUnreadNotifications = useCallback(() => {
    setUnreadNotifications((prev) => (prev === 0 ? prev : 0));
  }, []);

  const applySession = useCallback(
    (next: { token: string; refreshToken?: string; user: AuthUser } | null) => {
      if (next) {
        tokenRef.current = next.token;
        refreshTokenRef.current = next.refreshToken ?? null;
        setToken(next.token);
        setUser(next.user);
        refreshEntitlements().catch(() => {});
        // Register for push notifications. registerPushForSession swallows
        // its own errors — never block sign-in on permission prompts.
        registerPushForSession({ force: true }).catch(() => {});
      } else {
        tokenRef.current = null;
        refreshTokenRef.current = null;
        setToken(null);
        setUser(null);
        setEntitlements(null);
        // Bump dataEpoch so every hook that opts in (matches, feed, friends,
        // groups, notifications, tickets, leaderboard) re-runs from scratch
        // and any stale data from the prior user disappears.
        bumpDataEpoch();
      }
    },
    [refreshEntitlements, bumpDataEpoch],
  );

  const signOut = useCallback(async () => {
    if (signOutInFlightRef.current) return;
    signOutInFlightRef.current = true;
    try {
      // Push unregister and remote logout are independent best-effort calls;
      // run them in parallel so push retries (up to 7s of backoff) don't
      // gate the logout request. Both must complete before we drop the
      // token — once applySession(null) clears refs, signOutRemote would
      // 401 and unregister would lose the bearer.
      const refreshToken = refreshTokenRef.current;
      const hadAccessToken = tokenRef.current !== null;
      // Only call signOutRemote when we actually have a refresh token to
      // revoke — without it the backend rejects the request (and there's
      // nothing useful to do server-side anyway).
      await Promise.all([
        unregisterPushForSession(),
        hadAccessToken && refreshToken
          ? authApi.signOutRemote(refreshToken).catch(() => {})
          : Promise.resolve(),
      ]);
      await authStorage.clearSession();
      applySession(null);
    } finally {
      signOutInFlightRef.current = false;
    }
  }, [applySession]);

  useEffect(() => {
    configureApi({
      getToken: () => tokenRef.current,
      refreshAccessToken: async () => {
        const stored = refreshTokenRef.current;
        if (!stored) throw new Error('No refresh token');
        const res = await authApi.refreshAccessToken(stored);
        // Update only the refs and persisted storage — skip setToken/setUser
        // so a silent refresh every 15 minutes doesn't re-render every
        // context consumer. `authed` is derived from token !== null and
        // doesn't flip during a refresh.
        tokenRef.current = res.token;
        refreshTokenRef.current = res.refreshToken;
        await authStorage.setSession(res);
        return res.token;
      },
      onUnauthorized: () => {
        // Defer a tick so the in-flight request can throw before we clear.
        // signOutInFlightRef makes the call idempotent against the burst of
        // 401s a stale token tends to produce.
        setTimeout(() => {
          signOut().catch(() => {});
        }, 0);
      },
    });
  }, [signOut]);

  useEffect(() => {
    let cancelled = false;
    // Safety timeout: if the storage read or initial /me round-trip hangs
    // (slow disk, OS pause, network stall), don't leave the user stuck on
    // the splash screen indefinitely. Drop authLoading after 10s so they
    // land on sign-in and can recover. The validation request continues in
    // the background and will sign them in if it eventually succeeds.
    const splashTimeout = setTimeout(() => {
      if (!cancelled) setAuthLoading(false);
    }, 10_000);
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
          // Validate the persisted session against the server. A 401 here
          // (token expired, user deleted, sessions revoked) used to be
          // silently swallowed — the user appeared signed in but every
          // subsequent request 401'd. Now we attempt one refresh via the
          // standard interceptor; if that also fails the api layer calls
          // onUnauthorized → signOut, which is what we want.
          authApi.getMe().then(
            (fresh) => {
              if (cancelled) return;
              if (sameAuthUser(persisted.user, fresh)) return;
              setUser(fresh);
              authStorage.updateCachedUser(fresh).catch(() => {});
            },
            (err) => {
              if (cancelled) return;
              // 401 already triggered onUnauthorized → signOut via the api
              // layer; no extra cleanup needed here. Other errors (network,
              // server 5xx) are transient — keep the persisted session.
              if (!(err instanceof ApiError) || err.status !== 401) return;
            },
          );
        }
      } finally {
        clearTimeout(splashTimeout);
        if (!cancelled) setAuthLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      clearTimeout(splashTimeout);
    };
  }, [applySession]);

  // Refresh entitlements when the app comes back to the foreground — webhook
  // events from Apple/Google may have updated subscription status while the
  // app was backgrounded. Also re-register the push token: lastSeenAt updates
  // server-side so dormant rows can be pruned, and a rotated token (rare but
  // possible) is picked up here.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      refreshEntitlements().catch(() => {});
      if (tokenRef.current) registerPushForSession().catch(() => {});
    });
    return () => sub.remove();
  }, [refreshEntitlements]);

  // Poll the unread-notifications count once a minute while signed in. Reads
  // get cleared immediately via decrementUnreadNotifications from
  // useNotifications, so the bell badge no longer waits up to 60s.
  const authedForUnread = token !== null;
  useEffect(() => {
    if (!authedForUnread) {
      setUnreadNotifications(0);
      return;
    }
    refreshUnreadNotifications().catch(() => {});
    const interval = setInterval(() => {
      refreshUnreadNotifications().catch(() => {});
    }, 60_000);
    return () => clearInterval(interval);
  }, [authedForUnread, refreshUnreadNotifications]);

  // Refresh on foreground (DataEpoch). Initialised to dataEpoch's current
  // value so we don't double-fire with the poll's mount-time refresh.
  const prevEpochRef = useRef(dataEpoch);
  useEffect(() => {
    if (prevEpochRef.current === dataEpoch) return;
    prevEpochRef.current = dataEpoch;
    if (!authedForUnread) return;
    refreshUnreadNotifications().catch(() => {});
  }, [dataEpoch, authedForUnread, refreshUnreadNotifications]);

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
      // Fresh sign-in / sign-up / social login / revoke-others. Bump the
      // data epoch so every useStaleRefetch consumer (feed, groups, tickets,
      // etc.) refetches against the new identity — without this, the prior
      // user's cached lists could linger on screens that mounted earlier.
      // Persisted-session hydration goes straight through applySession on
      // cold start (not via this funnel), so we don't double-fire on launch.
      bumpDataEpoch();
    },
    [applySession, bumpDataEpoch],
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

  const revokeAllOtherSessions = useCallback(async () => {
    // Backend bumps tokenInvalidBefore for the user (killing every JWT minted
    // before now) and returns a freshly-signed token. We swap the in-memory
    // and persisted token to that fresh one so the user stays signed in here.
    const res = await authApi.revokeAllOtherSessions();
    await persistAndApply(res);
  }, [persistAndApply]);

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
      const hasAnyPick = Object.values(picks).some((p) => p);
      if (!hasAnyPick) {
        throw new Error('Pick at least one match before submitting.');
      }
      // Final client-side guard against a match that kicked off between the
      // 30s screen tick and Lock-in. Backend is the source of truth and
      // re-checks in a transaction — this just turns a 400 round-trip into
      // a clear local error.
      const { fresh, startedFixtures } = partitionPicksByKickoff(picks);
      if (startedFixtures.length > 0) {
        const startedIds = new Set(startedFixtures.map((f) => f.id));
        setPicks((prev) => {
          const next = { ...prev };
          for (const id of startedIds) next[id] = null;
          return next;
        });
        const n = startedFixtures.length;
        if (fresh.length === 0) {
          throw new Error(
            n === 1
              ? 'That match already kicked off — pick another.'
              : `${n} matches kicked off — pick others.`,
          );
        }
        throw new Error(
          n === 1
            ? '1 of your picks just kicked off and was removed. Review your slip and try again.'
            : `${n} of your picks just kicked off and were removed. Review your slip and try again.`,
        );
      }
      const payload = {
        picks: fresh.map(([matchId, pick]) => ({
          matchId,
          prediction: predictionFromPick(pick),
        })),
        caption: opts.caption,
      };
      const { ticket } = await createTicket(payload);
      setPicks({});
      refreshUser().catch(() => {});
      refreshEntitlements().catch(() => {});
      return { ticketId: ticket.id };
    },
    [picks, refreshUser, refreshEntitlements],
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
      revokeAllOtherSessions,
      refreshUser,
      requestPasswordReset,
      verifyPasswordResetCode,
      confirmPasswordReset,

      picks, setPick, clearPicks, pickCount, submitTicket,
      filter, setFilter,
      ticketVariant, setTicketVariant,
      feedLayout, setFeedLayout,
      entitlements, refreshEntitlements,
      unreadNotifications,
      refreshUnreadNotifications,
      decrementUnreadNotifications,
      clearUnreadNotifications,
    }),
    [
      authed, authLoading, user, token,
      signIn, signUp, signInWithGoogle, signInWithApple, signOut, revokeAllOtherSessions, refreshUser,
      requestPasswordReset, verifyPasswordResetCode, confirmPasswordReset,
      picks, setPick, clearPicks, pickCount, submitTicket,
      filter, ticketVariant, setTicketVariant,
      feedLayout, setFeedLayout,
      entitlements, refreshEntitlements,
      unreadNotifications,
      refreshUnreadNotifications,
      decrementUnreadNotifications,
      clearUnreadNotifications,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateCtx {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used inside <AppStateProvider>');
  return ctx;
}
