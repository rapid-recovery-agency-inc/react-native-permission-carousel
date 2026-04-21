import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { check, checkNotifications, PERMISSIONS } from 'react-native-permissions';

jest.mock('../../hooks/useIsForeground', () => ({
  useIsForeground: jest.fn(),
}));

jest.mock('react-native-permissions', () => ({
  check: jest.fn(),
  checkNotifications: jest.fn(),
  PERMISSIONS: {
    IOS: {
      LOCATION_ALWAYS: 'ios.location.always',
      LOCATION_WHEN_IN_USE: 'ios.location.when_in_use',
      CAMERA: 'ios.camera',
      APP_TRACKING_TRANSPARENCY: 'ios.tracking',
    },
    ANDROID: {
      ACCESS_BACKGROUND_LOCATION: 'android.location.background',
      ACCESS_FINE_LOCATION: 'android.location.fine',
      CAMERA: 'android.camera',
    },
  },
}));

import { useIsForeground } from '../../hooks/useIsForeground';
import { usePermissionsContext } from '../../hooks/usePermissionsContext';
import { PermissionsProvider, PermissionsProviderProps } from '../PermissionsProvider';
import {
  LocationPermissionGrantLevel,
  Permission,
  PermissionConfig,
  Permissions,
  PermissionState,
} from '../../types';
import type { RenderHookResult } from '@testing-library/react-native';

const mockedUseIsForeground = jest.mocked(useIsForeground);
const mockedCheck = jest.mocked(check);
const mockedCheckNotifications = jest.mocked(checkNotifications);
const mockedGetItem = jest.mocked(AsyncStorage.getItem);
const mockedSetItem = jest.mocked(AsyncStorage.setItem);

const createPermissionConfig = (overrides: Partial<PermissionConfig> = {}): PermissionConfig => ({
  title: 'Permission',
  description: 'Permission description',
  iconName: 'camera',
  warningTitle: 'Warning title',
  warningMessage1: 'Warning message 1',
  warningMessage2: 'Warning message 2',
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
    iconName: 'location',
    locationGrantLevel: LocationPermissionGrantLevel.NONE,
  }),
  camera: createPermissionConfig({
    title: 'Camera',
    iconName: 'camera',
  }),
  pushNotifications: createPermissionConfig({
    title: 'Push Notifications',
    iconName: 'bell',
  }),
  tracking: createPermissionConfig({
    title: 'Tracking',
    iconName: 'tracking',
  }),
  ...overrides,
});

const createWrapper = (props: PermissionsProviderProps) => {
  return function Wrapper({ children }: { children: React.ReactNode }): React.JSX.Element {
    return <PermissionsProvider {...props}>{children}</PermissionsProvider>;
  };
};

const flushEffects = async (): Promise<void> => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

const renderPermissionsProviderHook = async (
  props: PermissionsProviderProps,
): Promise<RenderHookResult<ReturnType<typeof usePermissionsContext>, unknown>> => {
  const rendered = renderHook(() => usePermissionsContext(), {
    wrapper: createWrapper(props),
  });

  await flushEffects();

  return rendered;
};

describe('PermissionsProvider', () => {
  beforeEach(() => {
    (Platform as { OS: string }).OS = 'ios';
    mockedUseIsForeground.mockReturnValue(true);
    mockedGetItem.mockResolvedValue(null);
    mockedSetItem.mockResolvedValue();
    mockedCheck.mockResolvedValue('unavailable');
    mockedCheckNotifications.mockResolvedValue({ status: 'unavailable' } as never);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should filter permissions based on OS', async () => {
    (Platform as { OS: string }).OS = 'android';
    mockedUseIsForeground.mockReturnValue(false);

    const permissions = createPermissions({
      tracking: createPermissionConfig({ title: 'Tracking', os: 'ios' }),
      camera: createPermissionConfig({ title: 'Camera', os: 'android' }),
    });

    const hook = await renderPermissionsProviderHook({ permissions, children: null });
    const { result, unmount } = hook;

    await waitFor(() => {
      expect(mockedSetItem).toHaveBeenCalled();
    });

    expect(result.current.permissions.camera).toBeDefined();
    expect(result.current.permissions.location).toBeDefined();
    expect(result.current.permissions.pushNotifications).toBeDefined();
    expect('tracking' in result.current.permissions).toBe(false);

    await act(async () => {
      unmount();
    });
  });

  it('should hydrate permissions from storage', async () => {
    mockedUseIsForeground.mockReturnValue(false);
    mockedGetItem.mockResolvedValue(
      JSON.stringify({
        camera: {
          requested: true,
          skipped: true,
          permissionState: PermissionState.BLOCKED,
        },
        location: {
          required: true,
          permissionState: PermissionState.GRANTED,
          locationGrantLevel: LocationPermissionGrantLevel.ALWAYS,
        },
      }),
    );

    const hook = await renderPermissionsProviderHook({ permissions: createPermissions(), children: null });
    const { result, unmount } = hook;

    await waitFor(() => {
      expect(mockedSetItem).toHaveBeenCalled();
    });

    expect(result.current.permissions.camera.requested).toBe(true);
    expect(result.current.permissions.camera.skipped).toBe(true);
    expect(result.current.permissions.camera.permissionState).toBe(PermissionState.BLOCKED);
    expect(result.current.permissions.location.required).toBe(true);
    expect(result.current.permissions.location.permissionState).toBe(PermissionState.GRANTED);
    expect(result.current.permissions.location.locationGrantLevel).toBe(LocationPermissionGrantLevel.ALWAYS);

    await act(async () => {
      unmount();
    });
  });

  it('should expose permission state, allow updating permissions, and querying permissions via hasPermission', async () => {
    mockedCheck.mockImplementation(async (permission) => {
      switch (permission) {
        case PERMISSIONS.IOS.LOCATION_ALWAYS:
          return 'denied';
        case PERMISSIONS.IOS.LOCATION_WHEN_IN_USE:
          return 'granted';
        case PERMISSIONS.IOS.CAMERA:
          return 'granted';
        case PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY:
          return 'blocked';
        default:
          return 'unavailable';
      }
    });
    mockedCheckNotifications.mockResolvedValue({ status: 'granted' } as never);

    const hook = await renderPermissionsProviderHook({ permissions: createPermissions(), children: null });
    const { result, unmount } = hook;

    await waitFor(() => {
      expect(result.current.initialised).toBe(true);
    });

    expect(result.current.permissions.location.permissionState).toBe(PermissionState.GRANTED);
    expect(result.current.permissions.location.locationGrantLevel).toBe(LocationPermissionGrantLevel.WHILE_IN_USE);
    expect(result.current.permissions.camera.permissionState).toBe(PermissionState.GRANTED);
    expect(result.current.permissions.pushNotifications.permissionState).toBe(PermissionState.GRANTED);
    expect(result.current.permissions.tracking.permissionState).toBe(PermissionState.BLOCKED);
    expect(result.current.hasPermission(Permission.LOCATION)).toBe(true);
    expect(result.current.hasPermission(Permission.CAMERA)).toBe(true);
    expect(result.current.hasPermission(Permission.PUSH_NOTIFICATIONS)).toBe(true);
    expect(result.current.hasPermission(Permission.TRACKING)).toBe(false);

    act(() => {
      result.current.setPermissions({
        ...result.current.permissions,
        camera: {
          ...result.current.permissions.camera,
          permissionState: PermissionState.DENIED,
        },
      });
    });

    expect(result.current.permissions.camera.permissionState).toBe(PermissionState.DENIED);
    expect(result.current.hasPermission(Permission.CAMERA)).toBe(false);

    await act(async () => {
      unmount();
    });
  });

  it('should prompt for a permission and clear the prompt', async () => {
    mockedUseIsForeground.mockReturnValue(false);

    const hook = await renderPermissionsProviderHook({ permissions: createPermissions(), children: null });
    const { result, unmount } = hook;

    await waitFor(() => {
      expect(mockedSetItem).toHaveBeenCalled();
    });

    act(() => {
      result.current.promptPermission(Permission.CAMERA);
    });

    expect(result.current.permissions.camera.required).toBe(true);
    expect(result.current.permissions.camera.prompt).toBe(true);

    act(() => {
      result.current.clearPermissionPrompt(Permission.CAMERA);
    });

    expect(result.current.permissions.camera.required).toBe(false);
    expect(result.current.permissions.camera.prompt).toBe(false);

    await act(async () => {
      unmount();
    });
  });
});
