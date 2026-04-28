# Predicto Mobile

Predicto is a social sports-prediction app: build pick slips, track tickets, chat in groups, climb the leaderboard. This repository is the **mobile client** — an [Expo](https://expo.dev) / React Native app written in TypeScript with [Expo Router](https://docs.expo.dev/router/introduction).

> Status: pre-release. Screens are wired up against in-memory mock data in `src/data/`. Real APIs and auth are stubbed and meant to be plugged in.

---

## Tech stack

- **Runtime:** Expo SDK 55, React Native 0.83, React 19
- **Routing:** `expo-router` (typed routes enabled)
- **Language:** TypeScript (strict)
- **State:** React Context (`src/state/AppStateContext.tsx`) + `@react-native-async-storage/async-storage`
- **Styling:** custom theme tokens (`src/theme/`) with `expo-blur`, `expo-linear-gradient`, `expo-glass-effect`
- **Animation/gesture:** `react-native-reanimated` v4, `react-native-gesture-handler`
- **Fonts:** Inter, Space Grotesk, JetBrains Mono (via `@expo-google-fonts/*`)
- **Lint:** `eslint` + `eslint-config-expo`
- **Compiler:** React Compiler is enabled (`experiments.reactCompiler` in `app.json`)

---

## Project layout

```
src/
├── app/                  # expo-router file-based routes
│   ├── (auth)/           # sign-in, sign-up, forgot-password
│   ├── (tabs)/           # main tab bar: home, matches, groups, leaderboard, profile
│   ├── group/[id].tsx    # group detail
│   ├── prediction/[id].tsx
│   ├── ticket/[id].tsx
│   ├── user/[id].tsx
│   ├── paywall.tsx
│   └── _layout.tsx
├── components/           # atoms/, feed/, nav/, sheets/, ticket/
├── data/                 # mock data (teams, fixtures, posts, leaderboard, …)
├── lib/                  # pure helpers (colors, format, status)
├── state/                # AppStateContext (picks, tickets, feed filter, layout)
├── theme/                # tokens, fonts, ThemeContext
└── types/                # shared domain types
assets/                   # icons, splash, brand imagery
```

Path aliases (see `tsconfig.json`):

- `@/*` → `src/*`
- `@/assets/*` → `assets/*`

---

## Getting started

### 1. Prerequisites

- **Node.js** ≥ 20
- **npm** (lockfile is `package-lock.json`)
- **Watchman** (recommended on macOS): `brew install watchman`
- **Xcode** with iOS Simulator (for iOS) and/or **Android Studio** with an emulator (for Android)
- **Expo Go** app on a physical device — works for the basic experience, but native modules like `expo-glass-effect` may require a development build

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in the values you need. Every variable is documented inline in `.env.example`. Variables prefixed with `EXPO_PUBLIC_` are bundled into the app; everything else is build-time only. Remember to restart Expo with `-c` after changing env values.

### 4. Run the app

```bash
npm run start          # Metro + dev menu
npm run ios            # iOS Simulator
npm run android        # Android emulator
npm run web            # Web (experimental)
```

---

## Scripts

| Script                  | What it does                                                              |
| ----------------------- | ------------------------------------------------------------------------- |
| `npm run start`         | Launch the Expo dev server                                                |
| `npm run ios`           | Start dev server and open in iOS Simulator                                |
| `npm run android`       | Start dev server and open in Android emulator                             |
| `npm run web`           | Run the app in a browser via `react-native-web`                           |
| `npm run lint`          | Lint the project with `expo lint` (ESLint + `eslint-config-expo`)         |
| `npm run reset-project` | Move the current `app/` to `app-example/` and create a blank `app/` shell |

---

## Environment variables

Predicto follows the standard Expo convention:

- `EXPO_PUBLIC_*` — inlined into the JS bundle at build time. Safe for **public** values only (API base URLs, publishable keys, feature flags).
- Everything else — only available at build time (in scripts, `app.config.*`, EAS). Never exposed to the running app, so this is where build secrets live.

See [`.env.example`](./.env.example) for the full list with comments. Keys you'll most likely need:

- `EXPO_PUBLIC_APP_ENV` — `development` / `staging` / `production`
- `EXPO_PUBLIC_API_URL` — Predicto backend base URL
- Auth provider keys (Supabase / Clerk / Auth0) — pick one and uncomment
- `EXPO_PUBLIC_SENTRY_DSN`, `EXPO_PUBLIC_POSTHOG_KEY` — optional telemetry
- `EXPO_PUBLIC_REVENUECAT_*` — required if the paywall is enabled

> Real `.env` files are git-ignored. Only `.env.example` is committed.

---

## Conventions

- **No barrel files.** Import from the source module directly.
- **Atomic components** live under `src/components/atoms/`; feature components are grouped by domain (`feed/`, `ticket/`, `nav/`, `sheets/`).
- **Mock data first.** New screens should be wired to `src/data/*` until a real backend exists, so we can iterate on UX without an API.
- **Theme tokens over hardcoded values.** Use `@/theme/tokens` and `@/lib/colors` instead of literal hex codes.

---

## Troubleshooting

- **Stale env / weird import errors** → `npx expo start -c` to clear the Metro cache.
- **`expo-glass-effect` looks off in Expo Go** → expected; build a [development build](https://docs.expo.dev/develop/development-builds/introduction/).
- **Reanimated worklets crashing** → ensure `react-native-worklets` is installed (it is, in `package.json`) and that you fully restarted the simulator.
- **Pod / native cache issues (iOS)** → if you've prebuilt locally, delete `ios/` and re-run; the project uses Continuous Native Generation, so `ios/` and `android/` are not committed.

---

## License

See [`LICENSE`](./LICENSE).
