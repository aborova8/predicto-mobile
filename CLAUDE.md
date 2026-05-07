# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Predicto is a social sports-prediction app (build pick slips, track tickets, chat in groups, climb leaderboards). This repo is the **mobile client** — Expo SDK 55 / React Native 0.83 / React 19 in TypeScript with `expo-router` (file-based, typed routes).

**Status:** pre-release. Screens are wired against in-memory mock data in `src/data/`. Real APIs/auth are stubbed; `AppStateContext` is the source of truth at runtime.

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

### Routing (expo-router, `src/app/`)

The route tree drives navigation; there is no separate router config.

- `(auth)/` — sign-in, sign-up, forgot-password (route group)
- `(tabs)/` — main tab bar: index (home/feed), matches, groups, leaderboard, profile
- Stack screens at `src/app/_layout.tsx` declare presentation modes per route:
  - `card` + `slide_from_right`: detail screens (`ticket/[id]`, `prediction/[id]`, `group/[id]`, `group-feed/[id]`, `search`, `notifications`, `friends`, `settings`, `legal`)
  - `modal`: `create-group`
  - `transparentModal` + `fade`: `comments`, `review`, `paywall`, `user/[id]`

### Auth gating

`src/app/_layout.tsx` defines an `AuthGate` component that reads `authed` from `AppStateContext` and `useSegments()` from expo-router; it `router.replace`s between `(auth)/sign-in` and `(tabs)` based on auth state. To change auth-redirect behavior, edit this gate — not individual screens.

### Global state (`src/state/AppStateContext.tsx`)

Single React Context provider for the entire app, mounted in `_layout.tsx` inside `<ThemeProvider>` and `<SafeAreaProvider>`. Holds:

- `authed` — drives the auth gate
- `posts` / `likePost` — feed (seeded from `src/data/posts.ts`)
- `picks` (matchId → '1'|'X'|'2') / `setPick` / `clearPicks` / `pickCount` — current slip in progress
- `ticketsLeft` / `buyTickets` — paywall-gated counter
- `submitSlip` — converts current `picks` into a new `Post` (computes `potential` via `calculateTotalOdds`) and prepends it to the feed
- UI prefs persisted to `AsyncStorage`: `ticketVariant` (`slip`|`card`), `feedLayout` (`card`|`compact`)

`useAppState()` throws if used outside the provider — the hook is the only supported access path.

### Theming (`src/theme/`)

Three named themes (`dark` / `light` / `pitch`) defined as `Theme` token objects in `tokens.ts`. `ThemeProvider` persists the choice to `AsyncStorage` under `predicto.theme`. Components consume tokens via `useTheme()`. **Never hardcode hex colors** — use tokens (`theme.bg`, `theme.neon`, etc.) or `@/lib/colors` helpers (e.g., `avatarGradient(hue)` for per-user avatar colors derived from `User.avatarHue`).

### Domain types (`src/types/domain.ts`)

Single source of truth for shared types: `Pick`, `Leg`, `Ticket`, `Post`, `User`, `Group`, `Fixture`, `LeaderboardEntry`, `AppNotification`, etc. New screens/components should import from here rather than redefining shapes.

### Mock data (`src/data/`)

`teams.ts`, `fixtures.ts`, `posts.ts`, `groups.ts`, `users.ts`, `leaderboard.ts`, `comments.ts`, `notifications.ts`, `badges.ts`, `legal.ts`. New screens should be wired against these until a real backend is added — keeping data colocated here means the swap to a real API is one layer.

### Components (`src/components/`)

- `atoms/` — primitives (Avatar, Crest, Icon, IconButton, Logo, NeonButton, PickButton, Pill, SectionHeader, StatusDot)
- `feed/`, `ticket/`, `nav/`, `sheets/` — feature-grouped composites
- `MatchRow.tsx` lives at the top level

**No barrel files.** Always import from the source module directly.

### Pure helpers (`src/lib/`)

- `colors.ts` — HSL/RGB conversion + `avatarGradient`
- `format.ts` — formatters including `calculateTotalOdds(legs)` used by `submitSlip`
- `status.ts` — leg/ticket status helpers

## Conventions

- **Strict TS** (`tsconfig.json` extends `expo/tsconfig.base` with `strict: true`).
- **React Compiler is enabled** (`experiments.reactCompiler` in `app.json`) — avoid manual `useMemo`/`useCallback` purely for referential stability; reserve them for cases the compiler can't see (cross-render identity used by external systems, or to satisfy explicit deps as in `AppStateContext`).
- **Typed routes** are enabled (`experiments.typedRoutes`) — let TypeScript validate `router.replace('/(tabs)')`-style calls.
- ESLint flat config is `eslint-config-expo/flat` with `react/no-unescaped-entities` disabled.

## Environment

Standard Expo conventions: `EXPO_PUBLIC_*` vars are inlined into the JS bundle (public values only); everything else is build-time. Copy `.env.example` → `.env`. After changing env values, restart with `npx expo start -c`. `.env` is git-ignored; `.env.example` is the source of truth for variable names and is documented inline.

## Gotchas

- `expo-glass-effect` requires a development build to render correctly — Expo Go shows a degraded fallback.
- Reanimated v4 needs `react-native-worklets` (already in `package.json`); a full simulator restart is required after install.
- If `ios/` or `android/` were prebuilt locally, delete them before re-running — the project relies on CNG.
- `expo-iap` (paywall purchases) requires a custom dev client. Expo Go cannot run StoreKit / Play Billing — `paywall.tsx` detects `Constants.appOwnership === 'expo'` and shows an explanatory banner. To test real purchases, build with `eas build --profile development --platform <ios|android>` and sign in as a sandbox tester.
