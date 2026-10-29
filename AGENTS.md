# AGENTS.md

## Purpose

Reusable permission-management library for React Native apps inside the `@rapid-recovery-agency-inc` org. It owns the educational pre-prompt carousel, the contextual permission request flow, the denied/blocked warning UI, and the shared bottom safe-area inset logic used by those surfaces.

Code-style conventions (naming, tests, styling) live in [.github/copilot_instructions.md](.github/copilot_instructions.md). This file covers architecture, layout, and workflow.

## Architecture

```text
package consumer
	-> src/index.ts            public API barrel
		 -> src/modules/*        first-class library features
		 -> src/shared/*         cross-cutting primitives (i18n, hooks)
	-> plugins/*               Expo config plugins (build time only — never imported at app runtime)
```

- `src/modules/permissions` is the only feature module: `types.ts`, `utils.ts`, `components/`, `hooks/`.
- `src/shared` holds primitives reused across modules — currently `i18n` and `hooks`.
- `plugins/` ships Expo config plugins. These run during `expo prebuild`, import Node/Expo APIs, and must never be re-exported from `src/index.ts` (that would pull build-time code into the app bundle).
- The package is consumed as TypeScript source (`"main": "src/index.ts"`); there is no build step.

## Repository Layout

| Path                        | Role                                                            |
| --------------------------- | --------------------------------------------------------------- |
| `src/index.ts`              | Package-level public API barrel                                 |
| `src/modules/permissions`   | Permission types, utils, components, and hooks                  |
| `src/shared/hooks`          | Cross-cutting hooks (`useBottomInset`)                          |
| `src/shared/i18n`           | Translation registration helpers and English locale             |
| `plugins/with-edge-to-edge` | Expo config plugin enabling Android edge-to-edge + translucent nav bar |
| `README.md`                 | Consumer-facing documentation                                   |

Tests are colocated in `__tests__/*.spec.tsx` next to the code they cover.

## Safe Area Conventions

These rules came from the Android safe-area fix (content drawing behind the navigation bar) and apply to every bottom-anchored surface.

- `useBottomInset()` in `src/shared/hooks/useBottomInset.ts` is the **single source of truth** for bottom insets and is internal to the package — never add `Platform.OS` checks in components, and never re-export the hook from the public barrel.
- The hook returns the raw `bottom` inset for iOS and Android gesture navigation. When a real Android navigation bar is on screen (`bottom >= 40`, i.e. ~48dp 3-button nav) it adds 16px of breathing room.
- `MainModal` (sloth-ui-mobile) takes plain numeric `safeAreaInsets` and applies them as padding in `full` mode — it does not read `react-native-safe-area-context` itself, so the library computes and passes the values.
- Do not double-pad: a component wrapped in `SafeAreaView` must not also apply `useBottomInset()`, and vice versa.
- Consumers must render `SafeAreaProvider` above anything that uses this library; `useSafeAreaInsets()` throws without it.
- Consumers on Android must enable edge-to-edge, otherwise `bottom` is `0`. Expo apps add `plugins/with-edge-to-edge`; bare RN apps call the top-level `enableEdgeToEdge()` in `MainActivity` (the `enableEdgeToEdge(this)` form no longer compiles).
- Use `react-native-safe-area-context`'s cross-platform `SafeAreaView`, never React Native's deprecated iOS-only one.

## Working Rules

- Keep the public surface stable through `src/index.ts`; new public components and hooks must be exported there.
- Keep layout/inset helpers internal. `useBottomInset` in `src/shared/hooks/useBottomInset.ts` is imported directly by the carousel and warning components and must **not** be exported from `src/index.ts` — this is a permission library, not a layout library, and consumers may already own a hook with that name.
- Do not add new non-optional props to existing components — add a prop or a new component version instead.
- Aesthetic changes to existing components must be driven by props, not hardcoded values.
- Style through `@rapid-recovery-agency-inc/sloth-ui-mobile` components, `useThemedStyles`, and `createThemeStyleSheet`.
- The library never commits on its own behalf, and no changes should be committed unless explicitly requested.

## Quality Gates

Every code change must pass `npm run precommit` (lint → format-check → typecheck → test).

| Script                 | Description                                                |
| ---------------------- | ---------------------------------------------------------- |
| `npm run lint`         | ESLint over `src` and `plugins`                            |
| `npm run format`       | Prettier write over `src` and `plugins`                    |
| `npm run format-check` | Prettier check over `src` and `plugins`                    |
| `npm run typecheck`    | `tsc --noEmit` (includes `src` and `plugins`)              |
| `npm run test`         | Jest suite (`react-native` preset, config `jest.config.cjs`) |

`react-native-safe-area-context` is mocked globally in `jest.setup.js`; individual tests set insets through `SafeAreaInsetsContext.Provider`.

## Navigation

- README: [README.md](README.md)
- Public API: [src/index.ts](src/index.ts)
- Permissions module: [src/modules/permissions](src/modules/permissions)
- Shared hooks: [src/shared/hooks](src/shared/hooks)
- i18n: [src/shared/i18n](src/shared/i18n)
- Edge-to-edge plugin: [plugins/with-edge-to-edge.ts](plugins/with-edge-to-edge.ts)
