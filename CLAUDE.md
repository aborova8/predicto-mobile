# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Predicto is a social sports-prediction app (build pick slips, track tickets, chat in groups, climb leaderboards). This repo is the **mobile client** — Expo SDK 55 / React Native 0.83 / React 19 in TypeScript with `expo-router` (file-based, typed routes).

The app talks to a real backend over HTTPS (`EXPO_PUBLIC_API_URL`). `src/data/` only holds static reference assets (teams, team logos, legal docs) — feed/tickets/groups/leaderboard/notifications are fetched live.

## Commands

```bash
npm install
npm run start        # Metro + dev menu
npm run ios          # iOS Simulator
npm run android      # Android emulator
npm run web          # react-native-web
npm run lint         # expo lint (ESLint flat config + eslint-config-expo)
npx expo start -c    # restart Metro with cleared cache (use after env or alias changes)
```

There is no test runner configured. Continuous Native Generation is used — `ios/` and `android/` are not committed; running `npm run ios`/`android` regenerates them.

## Path aliases

Defined in `tsconfig.json`:
- `@/*` → `src/*`
- `@/assets/*` → `assets/*`

## Architecture

### Provider tree (`src/app/_layout.tsx`)

```
ErrorBoundary
└─ GestureHandlerRootView
   └─ SafeAreaProvider
      └─ ThemeProvider
         └─ DataEpochProvider
            └─ AppStateProvider
               └─ InnerErrorBoundary (signs out on crash)
                  └─ ThemedShell (StatusBar + SplashGate + RootStack)
```

Splash is held via `SplashScreen.preventAutoHideAsync()` until fonts load **and** `authLoading` flips to false; `SplashGate` hides it.

### Routing (expo-router, `src/app/`)

The route tree drives navigation; there is no separate router config.

- `(auth)/` — sign-in, sign-up, forgot-password (route group)
- `(tabs)/` — main tab bar: index (home/feed), matches, groups, leaderboard, profile
- Detail screens (`presentation: 'card'`, `slide_from_right`): `ticket/[id]`, `group/[id]`, `group-feed/[id]`, `search`, `notifications`, `friends`, `settings`, `edit-profile`, `change-password`, `legal`, `comments`
- `verify-email` — `card` + `fade` (gated separately, see Auth gate)
- `create-group` — `modal`
- `review`, `paywall`, `user/[id]` — `transparentModal` + `fade`

### Auth gate (`src/app/_layout.tsx`)

`AuthGate` reads `authed`, `authLoading`, `user` from `AppStateContext` and `useSegments()` from expo-router; `router.replace`s between three states:

1. Not authed → `(auth)/sign-in` (and `router.dismissAll()` first to pop any detail/modal stack so back-navigation can't land in a tab the signed-out user shouldn't see)
2. Authed but `user.provider === 'LOCAL' && !user.emailVerified` → `verify-email` (Google/Apple flows set `emailVerified: true` on creation, so they skip this)
3. Authed & verified → `(tabs)`

Always edit `AuthGate` for redirect changes — not individual screens.

### State: split across two contexts

**`AppStateContext` (`src/state/AppStateContext.tsx`)** — the heavyweight provider. Holds:

- **Auth**: `user`, `token`, `authed`, `authLoading`, plus `signIn`, `signUp`, `signInWithGoogle`, `signInWithApple`, `signOut`, `revokeAllOtherSessions`, `refreshUser`, password-reset flow (`request` / `verify` / `confirm`). Tokens are mirrored in refs so the api layer's `getToken`/`refreshAccessToken` callbacks see the latest value without reconfiguring on every change.
- **Picks slip in progress**: `picks` (matchId → `Pick`), `setPick`, `clearPicks`, `pickCount`, `submitTicket({ caption? })` — `submitTicket` POSTs via `createTicket` (`src/lib/api/tickets`) and returns `{ ticketId }`.
- **UI prefs** persisted to `AsyncStorage`: `filter` (FeedScope), `ticketVariant` (`slip` | `card`), `feedLayout` (`card` | `compact`).
- **Entitlements**: `entitlements` (from `getEntitlements` in `lib/api/iap`) + `refreshEntitlements` — advisory feature-flag layer; per-screen ticket eligibility lives in `useEligibility`.
- **Unread bell badge**: `unreadNotifications`, `refreshUnreadNotifications`, `decrementUnreadNotifications`, `clearUnreadNotifications` — shared so `useNotifications.markRead` can decrement instantly instead of waiting for the 60s poll.

`useAppState()` throws if used outside the provider — the hook is the only supported access path.

**`DataEpochContext` (`src/state/DataEpochContext.tsx`)** — a counter, isolated from `AppStateContext` so its ~20 consumers don't re-render on foreground events. `epoch` bumps when the app transitions to active **or** when an imperative caller (e.g., `AppStateContext` on sign-out) calls `bump()`. Per-resource hooks opt in via `useDataEpoch()` (typically through `useStaleRefetch`) to refetch from scratch.

### API layer (`src/lib/api.ts` + `src/lib/api/*`)

`src/lib/api.ts` exports `configureApi({ getToken, refreshAccessToken, onUnauthorized })` — wired up exactly once by `AppStateContext` to avoid a circular import. Handles:

- 30s default timeout, `ApiError` with `status` / `code` / `details`
- Insecure-HTTP refusal in staging/production builds (so we never leak bearer tokens over plain HTTP)
- Android emulator localhost rewrite (`localhost` / `127.0.0.1` → `10.0.2.2`)
- Automatic refresh-token rotation on 401, then a one-shot retry; if refresh fails, `onUnauthorized` triggers a global sign-out

Per-resource modules under `src/lib/api/` (`feed`, `tickets`, `groups`, `matches`, `comments`, `friends`, `users`, `notifications`, `leaderboard`, `iap`, `badges`, `devices`) wrap typed fetch calls.

`src/lib/auth/` holds `api.ts` (auth endpoints), `apple.ts` / `google.ts` (provider SDK plumbing), and `storage.ts` (SecureStore for tokens, AsyncStorage for non-sensitive state).

### Hooks (`src/hooks/`) — fetch + cache pattern

Per-resource data hooks (`useFeed`, `useTicket`, `useGroup`, `useGroupMembers`, `useGroupJoinRequests`, `useGroupLeaderboard`, `useGroups`, `useLeaderboard`, `useMatches`, `useNotifications`, `useUnreadNotifications`, `useSavedPosts`, `useComments`, `useFriends`, `useUserProfile`, `useUserSearch`, `useSettings`, `useEntitlements`, `useEligibility`, `useTicket`) follow a single pattern:

- `useAsyncResource(fetcher, deps, { enabled })` — race-protected refetch, loading/error state, `enabled` short-circuit, `setData` for optimistic mutations
- `useStaleRefetch` — reads `useDataEpoch()` and re-runs the fetcher when the epoch bumps (foreground or sign-out)
- `useNow` — coarse "now" tick for time-sensitive UI (kickoff windows etc.)

When adding a new fetched resource, prefer the `useAsyncResource` + `useStaleRefetch` pattern over rolling your own. `useFeed` / `useMatches` / `useEligibility` predate the helper and could be migrated.

### Theming (`src/theme/`)

Three named themes (`dark` / `light` / `pitch`) defined as `Theme` token objects in `tokens.ts`. `ThemeProvider` persists the choice to `AsyncStorage` under `predicto.theme`. Components consume tokens via `useTheme()`. **Never hardcode hex colors** — use tokens (`theme.bg`, `theme.neon`, etc.) or `@/lib/colors` helpers (e.g., `avatarGradient(hue)` for per-user avatar colors derived from `User.avatarHue`).

### Domain types (`src/types/domain.ts`)

Single source of truth for shared types: `AuthUser`, `Pick`, `Leg`, `Ticket`, `Post`, `User`, `Group`, `Fixture`, `LeaderboardEntry`, `AppNotification`, `FeedScope`, `FeedLayout`, `TicketVariant`, etc. New screens/components should import from here rather than redefining shapes. API modules typically project DTOs into these via `src/lib/mappers.ts`.

### Components (`src/components/`)

- `atoms/` — primitives (Avatar, Crest, Icon, IconButton, Logo, NeonButton, OtpInput, PickButton, Pill, ProHint, SectionHeader, StatusDot)
- `feed/`, `ticket/`, `groups/`, `leaderboard/`, `nav/`, `sheets/` — feature-grouped composites
- `MatchRow.tsx` and `ErrorBoundary.tsx` live at the top level

**No barrel files.** Always import from the source module directly.

### Pure helpers (`src/lib/`)

- `colors.ts` — HSL/RGB conversion + `avatarGradient`
- `format.ts` — formatters including `calculateTotalOdds(legs)`
- `status.ts` — leg/ticket status helpers
- `picks.ts` — slip math, kickoff partitioning (`partitionPicksByKickoff` used by `submitTicket`)
- `mappers.ts` — DTO ↔ domain projections (e.g., `predictionFromPick`)
- `notificationCopy.ts` — notification body string templates
- `matchCache.ts` — in-memory match lookups for screens that need a match by id
- `push.ts` — `registerPushForSession` / `unregisterPushForSession` (Expo push tokens; errors are swallowed, never block sign-in)
- `share.ts` — share-sheet wrappers

## Conventions

- **Strict TS** (`tsconfig.json` extends `expo/tsconfig.base` with `strict: true`).
- **React Compiler is enabled** (`experiments.reactCompiler` in `app.json`) — avoid manual `useMemo`/`useCallback` purely for referential stability; reserve them for cases the compiler can't see (cross-render identity used by external systems, or to satisfy explicit deps as in `AppStateContext`).
- **Typed routes** are enabled (`experiments.typedRoutes`) — let TypeScript validate `router.replace('/(tabs)')`-style calls.
- ESLint flat config is `eslint-config-expo/flat` with `react/no-unescaped-entities` disabled.

## Environment

Standard Expo conventions: `EXPO_PUBLIC_*` vars are inlined into the JS bundle (public values only); everything else is build-time. Copy `.env.example` → `.env`. After changing env values, restart with `npx expo start -c`. `.env` is git-ignored; `.env.example` is the source of truth for variable names and is documented inline.

`EXPO_PUBLIC_API_URL` is required. The api layer rewrites `localhost` → `10.0.2.2` on Android emulators automatically, and refuses plain `http://` in staging/production builds.

## Gotchas

- `expo-glass-effect` requires a development build to render correctly — Expo Go shows a degraded fallback.
- Reanimated v4 needs `react-native-worklets` (already in `package.json`); a full simulator restart is required after install.
- If `ios/` or `android/` were prebuilt locally, delete them before re-running — the project relies on CNG.
- `expo-iap` (paywall purchases) requires a custom dev client. Expo Go cannot run StoreKit / Play Billing — `paywall.tsx` detects `Constants.appOwnership === 'expo'` and shows an explanatory banner. To test real purchases, build with `eas build --profile development --platform <ios|android>` and sign in as a sandbox tester.
- Apple/Google sign-in similarly require a dev client (native auth modules). The email/password flow works in Expo Go.
