# React Native Permission Carousel

A reusable permission management library for React Native applications. It provides a carousel-style prompt UI, contextual permission requesting, and warning screens for denied or blocked permissions — designed to be shared across multiple projects within the `@rapid-recovery-agency-inc` organisation.

---

## Demo 

https://github.com/user-attachments/assets/93ae353b-f19d-49a3-b09d-82031d8852c9

---

## Table of Contents

- [Consuming the Library](#consuming-the-library)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Peer Dependencies](#peer-dependencies)
  - [Setup](#setup)
    - [1. Configure the Provider](#1-configure-the-provider)
    - [2. Add the Permission Prompt](#2-add-the-permission-prompt)
    - [3. Request Permissions Contextually](#3-request-permissions-contextually)
  - [i18n Integration](#i18n-integration)
  - [API Reference](#api-reference)
- [Contributing](#contributing)
  - [Getting Started](#getting-started)
  - [Development Workflow](#development-workflow)
  - [Scripts](#scripts)
  - [Project Structure](#project-structure)

---

## Consuming the Library

### Prerequisites

You will need a GitHub personal access token with the `read:packages` scope to install packages from the `@rapid-recovery-agency-inc` GitHub Packages registry.

### Installation

Create a `.npmrc` file at the root of your project with the following content:

```
@rapid-recovery-agency-inc:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_TOKEN
```

Replace `YOUR_TOKEN` with your GitHub personal access token.

Then install the package:

```bash
npm install @rapid-recovery-agency-inc/react-native-permission-carousel
```

### Peer Dependencies

This package relies on peer dependencies provided by your app. They are not bundled with this library, and your app must satisfy these versions:

| Package                                      | Version              |
| -------------------------------------------- | -------------------- |
| `@rapid-recovery-agency-inc/sloth-ui-mobile` | `^1.272.0`           |
| `@react-native-async-storage/async-storage`  | `^2.0.0`             |
| `i18next`                                    | `>=23.0.0`           |
| `react`                                      | `>=18.2.0 <20.0.0`   |
| `react-native`                               | `>=0.71.16 <=0.81.4` |
| `react-native-gesture-handler`               | `>=2.10.0`           |
| `react-native-permissions`                   | `^5.5.1`             |
| `react-native-reanimated`                    | `>=3.4.2`            |
| `react-native-reanimated-carousel`           | `^4.0.2`             |

If you are using `npm` v7+, peer dependencies are installed automatically in many cases. If not, install them manually:

```bash
npm install @rapid-recovery-agency-inc/sloth-ui-mobile @react-native-async-storage/async-storage i18next react react-native react-native-gesture-handler react-native-permissions react-native-reanimated react-native-reanimated-carousel
```

Refer to the [`react-native-permissions` setup guide](https://github.com/zoontek/react-native-permissions) for platform-specific configuration (iOS `Info.plist` entries and Android `AndroidManifest.xml` permissions).

---

### Setup

#### 1. Configure the Provider

Wrap your application (or the relevant part of your component tree) with `PermissionsProvider`. This is typically placed at the root of your app, e.g. in `App.tsx`.

```tsx
import {
  PermissionsProvider,
  LocationPermissionGrantLevel,
  PermissionState,
} from '@rapid-recovery-agency-inc/react-native-permission-carousel';

const APP_PERMISSIONS = {
  location: {
    title: 'Location',
    description: 'We need access to your location to show nearby jobs.',
    iconName: 'map-marker',
    warningTitle: 'Location Disabled',
    warningMessage1: 'Location access is required for this feature.',
    warningMessage2: 'Please enable location access in your device settings.',
    os: '*',
    required: true,
    prompt: true,
    requested: false,
    skipped: false,
    permissionState: null,
    locationGrantLevel: LocationPermissionGrantLevel.NONE,
  },
  camera: {
    title: 'Camera',
    description: 'We need camera access to let you upload photos.',
    iconName: 'camera',
    warningTitle: 'Camera Disabled',
    warningMessage1: 'Camera access is required for this feature.',
    warningMessage2: 'Please enable camera access in your device settings.',
    os: '*',
    required: false,
    prompt: false,
    requested: false,
    skipped: false,
    permissionState: null,
  },
  // ...other permissions
};

export default function App() {
  return (
    <PermissionsProvider permissions={APP_PERMISSIONS} permissionsStorageKey="@my-app/permissions">
      {/* rest of your app */}
    </PermissionsProvider>
  );
}
```

**`PermissionsProvider` Props**

| Prop                    | Type          | Required | Description                                                                                                     |
| ----------------------- | ------------- | -------- | --------------------------------------------------------------------------------------------------------------- |
| `permissions`           | `Permissions` | Yes      | The permissions configuration object for your application.                                                      |
| `permissionsStorageKey` | `string`      | No       | A unique key used to persist permission state via AsyncStorage. Defaults to `@insightt-mobile-app/permissions`. |

**`PermissionConfig` Fields**

| Field                | Type                           | Description                                                                                                        |
| -------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `title`              | `string`                       | Display name for the permission, shown in the prompt UI.                                                           |
| `description`        | `string`                       | Explanation of why the permission is needed.                                                                       |
| `iconName`           | `string`                       | A valid FontAwesome icon name (from the Sloth UI Mobile library).                                                  |
| `warningTitle`       | `string`                       | Title shown in the warning screen if the permission is denied or blocked.                                          |
| `warningMessage1`    | `string`                       | First message line in the warning screen.                                                                          |
| `warningMessage2`    | `string`                       | Second message line in the warning screen.                                                                         |
| `os`                 | `'*' \| 'ios' \| 'android'`    | Limits the permission to a specific platform. Use `'*'` for both.                                                  |
| `required`           | `boolean`                      | Whether the permission is required for core app functionality.                                                     |
| `prompt`             | `boolean`                      | Whether to prompt on load. Set to `false` to defer until a specific feature is used (see `usePermissionsRequest`). |
| `requested`          | `boolean`                      | Whether the native permission dialog has already been shown. Set to `false` initially.                             |
| `skipped`            | `boolean`                      | Whether the user has skipped the prompt. Set to `false` initially.                                                 |
| `permissionState`    | `PermissionState \| null`      | Current state of the permission. Set to `null` initially.                                                          |
| `locationGrantLevel` | `LocationPermissionGrantLevel` | _(Location only)_ The level of location access granted. Set to `LocationPermissionGrantLevel.NONE` initially.      |

---

#### 2. Add the Permission Prompt

Place `PermissionsPrompt` in the screens where you want the permission carousel and warning UI to appear. It is intentionally provided as a separate component so you have full control over which screens it is displayed on.

```tsx
import { PermissionsPrompt } from '@rapid-recovery-agency-inc/react-native-permission-carousel';

export default function HomeScreen() {
  return (
    <View style={{ flex: 1 }}>
      <PermissionsPrompt />
      {/* screen content */}
    </View>
  );
}
```

`PermissionsPrompt` automatically shows the carousel for any permissions with `prompt: true` that have not yet been requested or skipped. Once all prompted permissions are handled, it will display a warning screen for any required permissions that are denied or blocked.

**`PermissionsPrompt` Props**

| Prop                    | Type                    | Required | Description                                                                                                                                                                                                    |
| ----------------------- | ----------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `warningButtonPosition` | `WarningButtonPosition` | No       | Override the position of the warning button. The button is always positioned absolutely; this prop accepts only `top`, `right`, `bottom`, `left`, `width`, and `height`. Defaults to `{ top: 64, right: 64 }`. |

---

#### 3. Request Permissions Contextually

For permissions that should only be requested when a specific feature is used (e.g. camera on a photo upload screen), use the `usePermissionsRequest` hook. It signals to the provider that the permission should be prompted, and cleans up automatically when the component unmounts.

```tsx
import {
  usePermissionsRequest,
  Permission,
} from '@rapid-recovery-agency-inc/react-native-permission-carousel';

export default function PhotoUploadScreen() {
  usePermissionsRequest(Permission.CAMERA);

  return (
    // ...
  );
}
```

> **Note:** For this to work, the permission must have `prompt: false` in its initial configuration so it is not shown on app load. The hook will temporarily enable prompting for the duration of the screen's lifecycle.

---

### i18n Integration

The library ships with built-in English translations. If your project uses `i18next`, register the library's translations with your existing i18n instance:

```ts
import i18n from './i18n'; // your app's i18n instance
import { addTranslationsTo } from '@rapid-recovery-agency-inc/react-native-permission-carousel';

addTranslationsTo(i18n);
```

Translations are registered under the `permissions` namespace, exported as `PERMISSIONS_I18N_NAMESPACE` if you need to reference it directly.

---

### API Reference

**Components**

| Export                | Description                                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| `PermissionsProvider` | Context provider that manages permission state. Must wrap any component that uses this library. |
| `PermissionsPrompt`   | Renders the permission request carousel and warning screens.                                    |

**Hooks**

| Export                              | Description                                                                                        |
| ----------------------------------- | -------------------------------------------------------------------------------------------------- |
| `usePermissionsRequest(permission)` | Triggers a contextual permission prompt for the given permission. Use on feature-specific screens. |
| `usePermissionsContext()`           | Returns the full permissions context, including state and control functions.                       |

**Types & Enums**

| Export                         | Description                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------- |
| `Permission`                   | Enum of supported permission types: `LOCATION`, `CAMERA`, `PUSH_NOTIFICATIONS`, `TRACKING`. |
| `PermissionState`              | Enum of permission states: `GRANTED`, `DENIED`, `BLOCKED`.                                  |
| `LocationPermissionGrantLevel` | Enum for location grant levels: `NONE`, `WHILE_IN_USE`, `ALWAYS`.                           |
| `PermissionConfig`             | Interface describing the configuration for a single permission.                             |
| `Permissions`                  | Interface describing the full permissions configuration object.                             |

---

## Contributing

### Getting Started

Clone the repository:

```bash
git clone https://github.com/rapid-recovery-agency-inc/react-native-permission-carousel.git
cd react-native-permission-carousel
```

Create a `.npmrc` file at the root of the project to authenticate with the GitHub Packages registry:

```
@rapid-recovery-agency-inc:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_TOKEN
```

Replace `YOUR_TOKEN` with your GitHub personal access token with `read:packages` scope.

Install dependencies:

```bash
npm install
```

---

### Development Workflow

This project uses [Husky](https://typicode.github.io/husky/) to enforce quality checks before every commit. The pre-commit hook automatically runs linting, formatting checks, type checking, and tests — so you do not need to run these manually before committing. You can still run them individually during development using the scripts below.

---

### Scripts

| Script                 | Description                                                                   |
| ---------------------- | ----------------------------------------------------------------------------- |
| `npm run lint`         | Runs ESLint across the `src` directory.                                       |
| `npm run lint-fix`     | Runs ESLint and automatically fixes issues where possible.                    |
| `npm run format`       | Formats source files with Prettier.                                           |
| `npm run format-check` | Checks source files for formatting issues without writing changes.            |
| `npm run typecheck`    | Runs the TypeScript compiler without emitting files to check for type errors. |
| `npm run test`         | Runs the full Jest test suite.                                                |
| `npm run test-watch`   | Runs Jest in watch mode.                                                      |

---

### Project Structure

```
src/
├── index.ts                              # Public API — all exports
├── modules/
│   └── permissions/
│       ├── types.ts                      # Enums and interfaces (Permission, PermissionConfig, etc.)
│       ├── utils.ts                      # Utility functions
│       ├── components/
│       │   ├── PermissionsProvider.tsx   # Context provider and permission state management
│       │   ├── PermissionsPrompt.tsx     # Orchestrates carousel and warning display
│       │   ├── PermissionsCarousel.tsx   # Carousel UI component
│       │   └── PermissionsWarning.tsx    # Warning screen for denied/blocked permissions
│       └── hooks/
│           ├── usePermissionsContext.tsx # Consumes the permissions context
│           ├── usePermissionRequest.tsx  # Triggers a contextual permission prompt
│           └── useIsForeground.ts        # Detects when the app returns to the foreground
└── shared/
    └── i18n/
        ├── index.ts                      # i18n registration helpers
        └── locales/
            └── en.ts                     # Default English translations
```
