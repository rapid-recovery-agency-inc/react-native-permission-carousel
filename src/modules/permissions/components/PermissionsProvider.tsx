import { createContext, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { check, checkNotifications, PERMISSIONS } from 'react-native-permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  LocationPermissionGrantLevel,
  Permission,
  PermissionConfig,
  Permissions,
  PermissionState,
} from '../types';
import { getPermissionStateFromPermissionStatus } from '../utils';
import { useIsForeground } from '../hooks/useIsForeground';

const FALLBACK_STORAGE_KEY = '@insightt-mobile-app/permissions';

export interface PermissionsContextStateValue {
  initialised: boolean;
  permissions: Permissions;
}

export interface PermissionsContextValue extends PermissionsContextStateValue {
  hasPermission: (permission: Permission) => boolean;
  setPermissions: (permissions: Permissions) => void;
  promptPermission: (permission: Permission) => void;
  clearPermissionPrompt: (permission: Permission) => void;
}

export const initialPermissionsContextState = {
  permissions: {} as Permissions,
  initialised: false,
};

export const PermissionsContext = createContext<PermissionsContextValue>({
  ...initialPermissionsContextState,
  hasPermission: () => false,
  setPermissions: () => null,
  promptPermission: () => null,
  clearPermissionPrompt: () => null,
});

export interface PermissionsProviderProps {
  children: ReactNode;
  ready: boolean;
  permissions: Permissions;
  permissionsStorageKey?: string;
}

export function PermissionsProvider({
  children,
  ready,
  permissions: _permissions,
  permissionsStorageKey = FALLBACK_STORAGE_KEY,
}: PermissionsProviderProps): React.JSX.Element {
  const isForeground = useIsForeground();

  const [initialised, setInitialised] = useState<boolean>(false);
  const [hasHydratedPermissions, setHasHydratedPermissions] = useState<boolean>(false);

  const osPermissions = useMemo(
    () =>
      (Object.keys(_permissions) as Array<keyof Permissions>).reduce<Permissions>((acc, permissionKey) => {
        const permissionConfig = _permissions[permissionKey];
        if (permissionConfig.os === '*' || permissionConfig.os === Platform.OS) {
          acc[permissionKey] = permissionConfig;
        }
        return acc;
      }, {} as Permissions),
    [_permissions],
  );
  const [permissions, setPermissions] = useState<Permissions>(osPermissions);

  const isPermissionState = (value: unknown): value is PermissionState =>
    value === PermissionState.GRANTED || value === PermissionState.DENIED || value === PermissionState.BLOCKED;

  const isLocationPermissionGrantLevel = (value: unknown): value is LocationPermissionGrantLevel =>
    value === LocationPermissionGrantLevel.NONE ||
    value === LocationPermissionGrantLevel.WHILE_IN_USE ||
    value === LocationPermissionGrantLevel.ALWAYS;

  const updatePermission = useCallback(
    (
      permission: Permission,
      updater: (currentPermission: Permissions[keyof Permissions]) => Permissions[keyof Permissions],
    ): void => {
      setPermissions((prev) => {
        const permissionKey = permission as keyof Permissions;
        const currentPermission = prev[permissionKey];
        const nextPermission = updater(currentPermission);

        if (currentPermission === nextPermission) {
          return prev;
        }

        return {
          ...prev,
          [permissionKey]: nextPermission,
        };
      });
    },
    [],
  );

  const hasPermission = (key: Permission): boolean => {
    if (key === Permission.LOCATION) {
      return permissions.location.locationGrantLevel === LocationPermissionGrantLevel.WHILE_IN_USE ||
        permissions.location.locationGrantLevel === LocationPermissionGrantLevel.ALWAYS
        ? true
        : permissions.location.permissionState === PermissionState.GRANTED;
    }

    return permissions[key as keyof Permissions]?.permissionState === PermissionState.GRANTED;
  };

  const getLocationPermissionSnapshot = useCallback(async (): Promise<{
    permissionState: PermissionState | null;
    locationGrantLevel: LocationPermissionGrantLevel;
  }> => {
    if (Platform.OS === 'ios') {
      const alwaysStatus = await check(PERMISSIONS.IOS.LOCATION_ALWAYS);
      const alwaysState = getPermissionStateFromPermissionStatus(alwaysStatus);

      if (alwaysState === PermissionState.GRANTED) {
        return {
          permissionState: PermissionState.GRANTED,
          locationGrantLevel: LocationPermissionGrantLevel.ALWAYS,
        };
      }

      const whenInUseStatus = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      const whenInUseState = getPermissionStateFromPermissionStatus(whenInUseStatus);

      if (whenInUseState === PermissionState.GRANTED) {
        return {
          permissionState: PermissionState.GRANTED,
          locationGrantLevel: LocationPermissionGrantLevel.WHILE_IN_USE,
        };
      }

      return {
        permissionState: whenInUseState,
        locationGrantLevel: LocationPermissionGrantLevel.NONE,
      };
    }

    const backgroundStatus = await check(PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION);
    const backgroundState = getPermissionStateFromPermissionStatus(backgroundStatus);

    if (backgroundState === PermissionState.GRANTED) {
      return {
        permissionState: PermissionState.GRANTED,
        locationGrantLevel: LocationPermissionGrantLevel.ALWAYS,
      };
    }

    const fineStatus = await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
    const fineState = getPermissionStateFromPermissionStatus(fineStatus);

    if (fineState === PermissionState.GRANTED) {
      return {
        permissionState: PermissionState.GRANTED,
        locationGrantLevel: LocationPermissionGrantLevel.WHILE_IN_USE,
      };
    }

    return {
      permissionState: fineState,
      locationGrantLevel: LocationPermissionGrantLevel.NONE,
    };
  }, []);

  const checkLocationPermission = useCallback(async (): Promise<void> => {
    const nextLocationPermission = await getLocationPermissionSnapshot();

    updatePermission(Permission.LOCATION, (currentPermission) => {
      if (
        currentPermission.permissionState === nextLocationPermission.permissionState &&
        currentPermission.locationGrantLevel === nextLocationPermission.locationGrantLevel //&&
      ) {
        return currentPermission;
      }

      return {
        ...currentPermission,
        permissionState: nextLocationPermission.permissionState,
        locationGrantLevel: nextLocationPermission.locationGrantLevel,
      };
    });
  }, [getLocationPermissionSnapshot, updatePermission]);

  const checkCameraPermission = useCallback(async (): Promise<void> => {
    const permission = Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;
    const permissionStatus = await check(permission);
    const nextPermissionState = getPermissionStateFromPermissionStatus(permissionStatus);

    if (permissions.camera.permissionState === nextPermissionState) {
      return;
    }

    updatePermission(Permission.CAMERA, (currentPermission) => ({
      ...currentPermission,
      permissionState: nextPermissionState,
    }));
  }, [permissions.camera, updatePermission]);

  const checkPushNotificationsPermission = useCallback(async (): Promise<void> => {
    const permissionStatus = (await checkNotifications())?.status;
    const nextPermissionState = getPermissionStateFromPermissionStatus(permissionStatus);

    if (permissions.pushNotifications.permissionState === nextPermissionState) {
      return;
    }

    updatePermission(Permission.PUSH_NOTIFICATIONS, (currentPermission) => ({
      ...currentPermission,
      permissionState: nextPermissionState,
    }));
  }, [permissions.pushNotifications, updatePermission]);

  const checkTrackingPermission = useCallback(async (): Promise<void> => {
    if (Platform.OS === 'android') {
      return;
    }

    const permission = PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY;
    const permissionStatus = await check(permission);
    const nextPermissionState = getPermissionStateFromPermissionStatus(permissionStatus);

    if (permissions.tracking.permissionState === nextPermissionState) {
      return;
    }

    updatePermission(Permission.TRACKING, (currentPermission) => ({
      ...currentPermission,
      permissionState: nextPermissionState,
    }));
  }, [permissions.tracking, updatePermission]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    let isMounted = true;

    const hydratePermissions = async (): Promise<void> => {
      try {
        const persistedPermissionsJson = await AsyncStorage.getItem(permissionsStorageKey);
        if (!persistedPermissionsJson) {
          return;
        }

        const persistedPermissions = JSON.parse(persistedPermissionsJson) as Partial<
          Record<keyof Permissions, Partial<PermissionConfig>>
        >;

        if (typeof persistedPermissions !== 'object' || !persistedPermissions) {
          return;
        }

        setPermissions((prev) => {
          const nextPermissions = { ...prev };

          (Object.keys(prev) as Array<keyof Permissions>).forEach((permissionKey) => {
            const persistedPermission = persistedPermissions?.[permissionKey];

            if (!persistedPermission) {
              return;
            }

            const required = persistedPermission.required ?? osPermissions[permissionKey].required;
            const requested = persistedPermission.requested ?? osPermissions[permissionKey].requested;
            const skipped = persistedPermission.skipped ?? osPermissions[permissionKey].skipped;
            const permissionState = isPermissionState(persistedPermission.permissionState)
              ? persistedPermission.permissionState
              : null;
            const locationGrantLevel = isLocationPermissionGrantLevel(persistedPermission.locationGrantLevel)
              ? persistedPermission.locationGrantLevel
              : undefined;

            nextPermissions[permissionKey] = {
              ...nextPermissions[permissionKey],
              required,
              requested,
              skipped,
              permissionState,
              ...(permissionKey === Permission.LOCATION ? { locationGrantLevel } : {}),
            };
          });

          return nextPermissions;
        });
      } catch {
        // Ignore invalid persisted permission payloads.
      } finally {
        if (isMounted) {
          setHasHydratedPermissions(true);
        }
      }
    };

    void hydratePermissions();

    return () => {
      isMounted = false;
    };
  }, [osPermissions, permissionsStorageKey, ready]);

  useEffect(() => {
    if (!ready || !hasHydratedPermissions) {
      return;
    }

    const persistedPermissions = (Object.keys(permissions) as Array<keyof Permissions>).reduce(
      (acc, permissionKey) => {
        acc[permissionKey] = {
          required: permissions[permissionKey].required,
          requested: permissions[permissionKey].requested,
          skipped: permissions[permissionKey].skipped,
          permissionState: permissions[permissionKey].permissionState,
          ...(permissionKey === Permission.LOCATION
            ? { locationGrantLevel: permissions.location.locationGrantLevel }
            : {}),
        };

        return acc;
      },
      {} as Record<keyof Permissions, Partial<PermissionConfig>>,
    );

    void AsyncStorage.setItem(permissionsStorageKey, JSON.stringify(persistedPermissions));
  }, [permissions, hasHydratedPermissions, permissionsStorageKey, ready]);

  useEffect(() => {
    if (!ready || !hasHydratedPermissions || !isForeground) {
      return;
    }

    const checkPermissions = async (): Promise<void> => {
      await Promise.all([
        checkLocationPermission(),
        checkCameraPermission(),
        checkPushNotificationsPermission(),
        checkTrackingPermission(),
      ]);
      setInitialised(true);
    };

    void checkPermissions();

    return () => {
      setInitialised(false);
    };
  }, [
    ready,
    hasHydratedPermissions,
    isForeground,
    checkLocationPermission,
    checkCameraPermission,
    checkPushNotificationsPermission,
    checkTrackingPermission,
  ]);

  const promptPermission = useCallback(
    (permission: Permission): void => {
      updatePermission(permission, (currentPermission) => {
        return {
          ...currentPermission,
          required: true,
          prompt: true,
        };
      });
    },
    [updatePermission],
  );

  const clearPermissionPrompt = useCallback(
    (permission: Permission): void => {
      updatePermission(permission, (currentPermission) => {
        if (!currentPermission.prompt) {
          return currentPermission;
        }

        return {
          ...currentPermission,
          required: false,
          prompt: false,
        };
      });
    },
    [updatePermission],
  );

  return (
    <PermissionsContext.Provider
      value={{
        initialised,
        permissions,
        hasPermission,
        setPermissions,
        promptPermission,
        clearPermissionPrompt,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}
