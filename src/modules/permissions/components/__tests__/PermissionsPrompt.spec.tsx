import React from 'react';
import { View } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import {
  PermissionsContext,
  PermissionsContextValue,
  initialPermissionsContextState,
} from '../PermissionsProvider';
import { PermissionsPrompt, PermissionsPromptProps } from '../PermissionsPrompt';
import {
  LocationPermissionGrantLevel,
  Permission,
  PermissionConfig,
  Permissions,
  PermissionState,
} from '../../types';

jest.mock('react-native-permissions', () => ({
  request: jest.fn().mockResolvedValue('denied'),
  requestNotifications: jest.fn().mockResolvedValue({ status: 'denied' }),
  PERMISSIONS: {
    IOS: {
      CAMERA: 'ios.camera',
      LOCATION_ALWAYS: 'ios.location.always',
      LOCATION_WHEN_IN_USE: 'ios.location.when_in_use',
      APP_TRACKING_TRANSPARENCY: 'ios.tracking',
    },
    ANDROID: {
      CAMERA: 'android.camera',
      ACCESS_BACKGROUND_LOCATION: 'android.location.background',
      ACCESS_FINE_LOCATION: 'android.location.fine',
    },
  },
}));

// Carousel mock renders each request title and exposes accept/skip touch targets.
jest.mock('../PermissionsCarousel', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const RN = require('react-native');
  return {
    PermissionsCarousel: ({
      isVisible,
      requests,
    }: {
      isVisible: boolean;
      requests: Array<{ title?: string; onAccept: () => Promise<void>; onReject: () => Promise<void> }>;
    }) => {
      if (!isVisible) {
        return null;
      }
      return (
        <RN.View testID="permissions-carousel">
          {requests.map((r, i) => (
            <RN.View key={i}>
              <RN.Text testID={`carousel-item-${i}`}>{r.title ?? 'Permission Needed'}</RN.Text>
              <RN.TouchableOpacity testID={`carousel-accept-${i}`} onPress={r.onAccept}>
                <RN.Text>Accept</RN.Text>
              </RN.TouchableOpacity>
              <RN.TouchableOpacity testID={`carousel-skip-${i}`} onPress={r.onReject}>
                <RN.Text>Skip</RN.Text>
              </RN.TouchableOpacity>
            </RN.View>
          ))}
        </RN.View>
      );
    },
  };
});

// Warning mock renders a testID marker and exposes buttonPosition so the test can assert forwarding.
jest.mock('../PermissionsWarning', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const RN = require('react-native');
  return {
    PermissionsWarning: ({ buttonPosition }: { buttonPosition?: object }) => (
      <RN.View testID="permissions-warning" style={buttonPosition} />
    ),
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const createPermissionConfig = (overrides: Partial<PermissionConfig> = {}): PermissionConfig => ({
  title: 'Permission',
  description: 'A permission',
  iconName: 'camera',
  warningTitle: 'Warning',
  warningMessage1: 'Message 1',
  warningMessage2: 'Message 2',
  required: false,
  prompt: false,
  requested: false,
  skipped: false,
  permissionState: null,
  os: '*',
  ...overrides,
});

const createPermissions = (overrides: Partial<Permissions> = {}): Permissions => ({
  location: createPermissionConfig({
    title: 'Location',
    locationGrantLevel: LocationPermissionGrantLevel.NONE,
  }),
  camera: createPermissionConfig({ title: 'Camera' }),
  pushNotifications: createPermissionConfig({ title: 'Push Notifications' }),
  tracking: createPermissionConfig({ title: 'Tracking' }),
  ...overrides,
});

const createContextValue = (overrides: Partial<PermissionsContextValue> = {}): PermissionsContextValue => ({
  ...initialPermissionsContextState,
  permissions: createPermissions(),
  initialised: true,
  hasPermission: jest.fn(() => false),
  setPermissions: jest.fn(),
  promptPermission: jest.fn(),
  clearPermissionPrompt: jest.fn(),
  ...overrides,
});

function TestWrapper({
  contextValue,
  promptProps,
}: {
  contextValue: PermissionsContextValue;
  promptProps?: PermissionsPromptProps;
}): React.JSX.Element {
  return (
    <PermissionsContext.Provider value={contextValue}>
      <PermissionsPrompt {...promptProps} />
    </PermissionsContext.Provider>
  );
}

// Stateful wrapper — needed when the component's internal cycle must complete by
// having setPermissions updates reflect back into the context.
function StatefulWrapper({ initialPermissions }: { initialPermissions: Permissions }): React.JSX.Element {
  const [permissions, setPermissions] = React.useState(initialPermissions);

  const contextValue: PermissionsContextValue = {
    ...initialPermissionsContextState,
    permissions,
    initialised: true,
    hasPermission: () => false,
    setPermissions,
    promptPermission: jest.fn(),
    clearPermissionPrompt: jest.fn(),
  };

  return (
    <PermissionsContext.Provider value={contextValue}>
      <PermissionsPrompt />
    </PermissionsContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PermissionsPrompt', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('frozen permission cycle', () => {
    it('should freeze the active prompt cycle so that new permissions added to context mid-cycle do not appear in the carousel', async () => {
      // Start with only camera needing a prompt.
      const { rerender } = render(
        <TestWrapper
          contextValue={createContextValue({
            permissions: createPermissions({
              camera: createPermissionConfig({ title: 'Camera', prompt: true }),
            }),
          })}
        />,
      );

      // Wait for the effect to snapshot (freeze) the initial set of prompts.
      await waitFor(() => {
        expect(screen.getByTestId('permissions-carousel')).toBeTruthy();
      });

      // Carousel contains only Camera.
      expect(screen.getByText('Camera')).toBeTruthy();
      expect(screen.queryByText('Location')).toBeNull();

      // Simulate a context change mid-cycle: location also needs a prompt now.
      rerender(
        <TestWrapper
          contextValue={createContextValue({
            permissions: createPermissions({
              camera: createPermissionConfig({ title: 'Camera', prompt: true }),
              location: createPermissionConfig({
                title: 'Location',
                prompt: true,
                locationGrantLevel: LocationPermissionGrantLevel.NONE,
              }),
            }),
          })}
        />,
      );

      // Carousel must still show only Camera — the cycle is frozen against this change.
      expect(screen.getByTestId('permissions-carousel')).toBeTruthy();
      expect(screen.getByText('Camera')).toBeTruthy();
      expect(screen.queryByText('Location')).toBeNull();
    });
  });

  describe('carousel visibility', () => {
    it('should display the carousel when there are unhandled permissions to prompt', async () => {
      render(
        <TestWrapper
          contextValue={createContextValue({
            permissions: createPermissions({
              camera: createPermissionConfig({ title: 'Camera', prompt: true }),
            }),
          })}
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('permissions-carousel')).toBeTruthy();
      });

      expect(screen.getByText('Camera')).toBeTruthy();
    });

    it('should not display the carousel when all prompt permissions have already been requested or skipped', () => {
      render(
        <TestWrapper
          contextValue={createContextValue({
            permissions: createPermissions({
              // prompt is true but requested is also true — filtered out of the pending set.
              camera: createPermissionConfig({ title: 'Camera', prompt: true, requested: true }),
            }),
          })}
        />,
      );

      expect(screen.queryByTestId('permissions-carousel')).toBeNull();
    });

    it('should hide the carousel after every permission in the cycle has been accepted or skipped', async () => {
      render(
        <StatefulWrapper
          initialPermissions={createPermissions({
            camera: createPermissionConfig({ title: 'Camera', prompt: true }),
          })}
        />,
      );

      // Wait for the carousel to appear.
      await waitFor(() => {
        expect(screen.getByTestId('permissions-carousel')).toBeTruthy();
      });

      // Skip the single permission — this marks it as handled and completes the cycle.
      await act(async () => {
        fireEvent.press(screen.getByTestId('carousel-skip-0'));
      });

      // Once all items are handled the component resets frozenRequests, hiding the carousel.
      await waitFor(() => {
        expect(screen.queryByTestId('permissions-carousel')).toBeNull();
      });
    });
  });

  describe('permission warning visibility', () => {
    it('should display the warning when a required permission has been requested or skipped but is not granted', () => {
      render(
        <TestWrapper
          contextValue={createContextValue({
            permissions: createPermissions({
              camera: createPermissionConfig({
                required: true,
                requested: true,
                permissionState: PermissionState.DENIED,
              }),
            }),
          })}
        />,
      );

      expect(screen.getByTestId('permissions-warning')).toBeTruthy();
    });

    it('should display the warning when a required permission was skipped', () => {
      render(
        <TestWrapper
          contextValue={createContextValue({
            permissions: createPermissions({
              camera: createPermissionConfig({
                required: true,
                skipped: true,
                permissionState: PermissionState.DENIED,
              }),
            }),
          })}
        />,
      );

      expect(screen.getByTestId('permissions-warning')).toBeTruthy();
    });

    it('should not display the warning when no required permissions are missing', () => {
      // All permissions are neither required nor in a denied/skipped state.
      render(
        <TestWrapper
          contextValue={createContextValue({
            permissions: createPermissions(),
          })}
        />,
      );

      expect(screen.queryByTestId('permissions-warning')).toBeNull();
    });

    it('should not display the warning when a required permission has been granted', () => {
      render(
        <TestWrapper
          contextValue={createContextValue({
            permissions: createPermissions({
              camera: createPermissionConfig({
                required: true,
                requested: true,
                permissionState: PermissionState.GRANTED,
              }),
            }),
          })}
        />,
      );

      expect(screen.queryByTestId('permissions-warning')).toBeNull();
    });
  });

  describe('warningButtonPosition', () => {
    it('should forward warningButtonPosition to the warning component', () => {
      const customStyle = { top: 10, right: 10 };

      render(
        <TestWrapper
          contextValue={createContextValue({
            permissions: createPermissions({
              camera: createPermissionConfig({
                required: true,
                requested: true,
                permissionState: PermissionState.DENIED,
              }),
            }),
          })}
          promptProps={{ warningButtonPosition: customStyle }}
        />,
      );

      expect(screen.getByTestId('permissions-warning')).toHaveStyle(customStyle);
    });
  });

  describe('cycle reset does not modify permissions context', () => {
    it('should not call setPermissions when the cycle-completion reset occurs', async () => {
      const setPermissionsSpy = jest.fn();

      // A wrapper that holds real permissions state AND records every setPermissions call,
      // so we can verify the cycle-completion reset never touches the external context.
      function SpyWrapper(): React.JSX.Element {
        const [permissions, setPermissionsState] = React.useState(
          createPermissions({
            camera: createPermissionConfig({ title: 'Camera', prompt: true }),
          }),
        );
        const setPermissions = React.useCallback((p: Permissions) => {
          setPermissionsSpy(p);
          setPermissionsState(p);
        }, []);
        const contextValue: PermissionsContextValue = {
          ...initialPermissionsContextState,
          permissions,
          initialised: true,
          hasPermission: () => false,
          setPermissions,
          promptPermission: jest.fn(),
          clearPermissionPrompt: jest.fn(),
        };
        return (
          <PermissionsContext.Provider value={contextValue}>
            <PermissionsPrompt />
          </PermissionsContext.Provider>
        );
      }

      render(<SpyWrapper />);

      // Wait for the carousel to appear (effect snapshots the cycle).
      await waitFor(() => {
        expect(screen.getByTestId('permissions-carousel')).toBeTruthy();
      });

      // Reset the spy count so we only count calls that happen after the carousel appears.
      setPermissionsSpy.mockClear();

      // Skip the single permission — marks it as handled and triggers the cycle reset.
      await act(async () => {
        fireEvent.press(screen.getByTestId('carousel-skip-0'));
      });

      // The carousel should disappear (cycle completed).
      await waitFor(() => {
        expect(screen.queryByTestId('permissions-carousel')).toBeNull();
      });

      // setPermissions should have been called exactly once: to mark camera as skipped.
      // The cycle-completion reset (clearing frozenRequests / handledPermissions) must NOT
      // call setPermissions.
      expect(setPermissionsSpy).toHaveBeenCalledTimes(1);
      expect(setPermissionsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          camera: expect.objectContaining({ skipped: true }),
        }),
      );
    });
  });
});
