import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { PERMISSIONS, PermissionStatus, request, requestNotifications } from 'react-native-permissions';

import { usePermissionsContext } from '../hooks/usePermissionsContext';
import {
  LocationPermissionGrantLevel,
  Permission,
  Permissions,
  PermissionState,
  WarningButtonPosition,
} from '../types';
import { getPermissionStateFromPermissionStatus } from '../utils';

import { PermissionsWarning } from './PermissionsWarning';
import { PermissionsCarousel } from './PermissionsCarousel';

type PermissionsCarouselRequest = NonNullable<
  React.ComponentProps<typeof PermissionsCarousel>['requests']
>[number];

export interface PermissionsPromptProps {
  warningButtonPosition?: WarningButtonPosition;
}

export function PermissionsPrompt({ warningButtonPosition }: PermissionsPromptProps = {}): React.JSX.Element {
  const { initialised, permissions, setPermissions } = usePermissionsContext();

  const [frozenRequests, setFrozenRequests] = useState<
    Array<{ permission: Permission; request: PermissionsCarouselRequest }>
  >([]);

  const [handledPermissions, setHandledPermissions] = useState<Set<Permission>>(new Set());
  const handledPermissionsRef = useRef<Set<Permission>>(new Set());

  const nextFrozenRequests = useMemo(
    () =>
      Object.entries(permissions)
        .filter(([, value]) => {
          return value.prompt && !value.requested && !value.skipped;
        })
        .map(([key, value]) => ({
          permission: key as Permission,
          request: {
            title: value.title,
            description: value.description,
            iconName: value.iconName as PermissionsCarouselRequest['iconName'],
            onAccept: () => Promise.resolve(),
            onReject: () => Promise.resolve(),
          },
        })),
    [permissions],
  );

  const frozenRequestsSnapshotKey = useMemo(
    () =>
      frozenRequests
        .map(({ permission }) => permission)
        .sort()
        .join('|'),
    [frozenRequests],
  );

  const nextFrozenRequestsSnapshotKey = useMemo(
    () =>
      nextFrozenRequests
        .map(({ permission }) => permission)
        .sort()
        .join('|'),
    [nextFrozenRequests],
  );

  const requiredPermissions = Object.keys(permissions).reduce((acc, key) => {
    if (permissions[key as keyof Permissions]?.required) {
      acc[key as keyof Permissions] = permissions[key as keyof Permissions];
    }
    return acc;
  }, {} as Partial<Permissions>);

  const missingPermissions = Object.keys(requiredPermissions).reduce((acc, key) => {
    const permission = permissions[key as keyof Permissions];

    const permissionGranted =
      permission.permissionState !== null && permission.permissionState === PermissionState.GRANTED;
    const permissionGrantLevelSufficient =
      key !== Permission.LOCATION ||
      (permission.locationGrantLevel !== null &&
        permission.locationGrantLevel === LocationPermissionGrantLevel.ALWAYS);

    if ((permission.requested || permission.skipped) && (!permissionGranted || !permissionGrantLevelSufficient)) {
      acc[key as keyof Permissions] = permission;
    }

    return acc;
  }, {} as Partial<Permissions>);

  useEffect(() => {
    if (!initialised) {
      return;
    }

    const hasCompletedCycle = frozenRequests.length > 0 && handledPermissions.size >= frozenRequests.length;

    if (hasCompletedCycle) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFrozenRequests([]);
      setHandledPermissions(new Set());
      handledPermissionsRef.current = new Set();
      return;
    }

    if (frozenRequests.length > 0) {
      return;
    }

    if (nextFrozenRequests.length === 0 || nextFrozenRequestsSnapshotKey === frozenRequestsSnapshotKey) {
      return;
    }

    setHandledPermissions(new Set());
    handledPermissionsRef.current = new Set();
    setFrozenRequests(nextFrozenRequests);
  }, [
    frozenRequests.length,
    frozenRequestsSnapshotKey,
    handledPermissions.size,
    initialised,
    nextFrozenRequests,
    nextFrozenRequestsSnapshotKey,
  ]);

  const updatePermission = useCallback(
    (
      permission: Permission,
      updater: (currentPermission: Permissions[keyof Permissions]) => Permissions[keyof Permissions],
    ): void => {
      const permissionKey = permission as keyof Permissions;
      const currentPermission = permissions[permissionKey];
      const nextPermission = updater(currentPermission);

      if (currentPermission === nextPermission) {
        return;
      }

      setPermissions({
        ...permissions,
        [permissionKey]: nextPermission,
      });
    },
    [permissions, setPermissions],
  );

  const completeNativePermissionRequest = useCallback(
    (
      permission: Permission,
      nextPermissionState: PermissionState | null,
      nextGrantLevel?: LocationPermissionGrantLevel,
    ): void => {
      updatePermission(permission, (currentPermission) => {
        if (
          currentPermission.permissionState === nextPermissionState &&
          (permission !== Permission.LOCATION || currentPermission.locationGrantLevel === nextGrantLevel)
        ) {
          return currentPermission;
        }

        return {
          ...currentPermission,
          permissionState: nextPermissionState,
          ...(permission === Permission.LOCATION
            ? {
                locationGrantLevel:
                  nextGrantLevel ?? currentPermission.locationGrantLevel ?? LocationPermissionGrantLevel.NONE,
              }
            : {}),
        };
      });
    },
    [updatePermission],
  );

  const requestLocationPermission = useCallback(async (): Promise<void> => {
    if (Platform.OS === 'ios') {
      if (permissions.location.locationGrantLevel === LocationPermissionGrantLevel.WHILE_IN_USE) {
        const alwaysStatus: PermissionStatus = await request(PERMISSIONS.IOS.LOCATION_ALWAYS);
        const alwaysState = getPermissionStateFromPermissionStatus(alwaysStatus);

        if (alwaysState === PermissionState.GRANTED) {
          completeNativePermissionRequest(
            Permission.LOCATION,
            PermissionState.GRANTED,
            LocationPermissionGrantLevel.ALWAYS,
          );
          return;
        }

        completeNativePermissionRequest(
          Permission.LOCATION,
          PermissionState.GRANTED,
          LocationPermissionGrantLevel.WHILE_IN_USE,
        );
        return;
      }

      const whenInUseStatus: PermissionStatus = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      const whenInUseState = getPermissionStateFromPermissionStatus(whenInUseStatus);

      if (whenInUseState !== PermissionState.GRANTED) {
        completeNativePermissionRequest(Permission.LOCATION, whenInUseState, LocationPermissionGrantLevel.NONE);
        return;
      }

      const alwaysStatus: PermissionStatus = await request(PERMISSIONS.IOS.LOCATION_ALWAYS);
      const alwaysState = getPermissionStateFromPermissionStatus(alwaysStatus);

      if (alwaysState === PermissionState.GRANTED) {
        completeNativePermissionRequest(
          Permission.LOCATION,
          PermissionState.GRANTED,
          LocationPermissionGrantLevel.ALWAYS,
        );
        return;
      }

      completeNativePermissionRequest(
        Permission.LOCATION,
        PermissionState.GRANTED,
        LocationPermissionGrantLevel.WHILE_IN_USE,
      );
      return;
    }

    if (permissions.location.locationGrantLevel === LocationPermissionGrantLevel.WHILE_IN_USE) {
      const backgroundStatus: PermissionStatus = await request(PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION);
      const backgroundState = getPermissionStateFromPermissionStatus(backgroundStatus);

      completeNativePermissionRequest(
        Permission.LOCATION,
        PermissionState.GRANTED,
        backgroundState === PermissionState.GRANTED
          ? LocationPermissionGrantLevel.ALWAYS
          : LocationPermissionGrantLevel.WHILE_IN_USE,
      );
      return;
    }

    const fineStatus: PermissionStatus = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
    const fineState = getPermissionStateFromPermissionStatus(fineStatus);

    if (fineState !== PermissionState.GRANTED) {
      completeNativePermissionRequest(Permission.LOCATION, fineState, LocationPermissionGrantLevel.NONE);
      return;
    }

    const backgroundStatus: PermissionStatus = await request(PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION);
    const backgroundState = getPermissionStateFromPermissionStatus(backgroundStatus);

    completeNativePermissionRequest(
      Permission.LOCATION,
      PermissionState.GRANTED,
      backgroundState === PermissionState.GRANTED
        ? LocationPermissionGrantLevel.ALWAYS
        : LocationPermissionGrantLevel.WHILE_IN_USE,
    );
  }, [completeNativePermissionRequest, permissions.location.locationGrantLevel]);

  const requestCameraPermission = useCallback(async (): Promise<void> => {
    const permission = Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;
    const permissionStatus: PermissionStatus = await request(permission);
    const nextPermissionState = getPermissionStateFromPermissionStatus(permissionStatus);

    completeNativePermissionRequest(Permission.CAMERA, nextPermissionState);
  }, [completeNativePermissionRequest]);

  const requestPushNotificationsPermission = useCallback(async (): Promise<void> => {
    let permissionStatus: PermissionStatus;
    try {
      permissionStatus = (await requestNotifications(['alert', 'badge', 'sound'])).status;
    } catch {
      return;
    }
    const nextPermissionState = getPermissionStateFromPermissionStatus(permissionStatus);

    completeNativePermissionRequest(Permission.PUSH_NOTIFICATIONS, nextPermissionState);
  }, [completeNativePermissionRequest]);

  const requestTrackingPermission = useCallback(async (): Promise<void> => {
    if (Platform.OS === 'android') {
      return;
    }
    const permission = PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY;
    const permissionStatus = await request(permission);
    const nextPermissionState = getPermissionStateFromPermissionStatus(permissionStatus);

    completeNativePermissionRequest(Permission.TRACKING, nextPermissionState);
  }, [completeNativePermissionRequest]);

  const handleRequest = useCallback(
    async (permission: Permission): Promise<void> => {
      if (permission === Permission.LOCATION) {
        await requestLocationPermission();
      } else if (permission === Permission.CAMERA) {
        await requestCameraPermission();
      } else if (permission === Permission.PUSH_NOTIFICATIONS) {
        await requestPushNotificationsPermission();
      } else if (permission === Permission.TRACKING) {
        await requestTrackingPermission();
      }

      updatePermission(permission, (currentPermission) => ({
        ...currentPermission,
        requested: true,
      }));
    },
    [
      requestCameraPermission,
      requestLocationPermission,
      requestPushNotificationsPermission,
      requestTrackingPermission,
      updatePermission,
    ],
  );

  const markHandled = useCallback((permission: Permission): void => {
    setHandledPermissions((prev) => {
      const next = new Set(prev);
      next.add(permission);
      handledPermissionsRef.current = next;
      return next;
    });
  }, []);

  const handleAccept = useCallback(
    async (permission: Permission): Promise<void> => {
      if (handledPermissionsRef.current.has(permission)) {
        return;
      }

      await handleRequest(permission);

      markHandled(permission);
    },
    [handleRequest, markHandled],
  );

  const handleReject = useCallback(
    async (permission: Permission): Promise<void> => {
      updatePermission(permission, (currentPermission) => ({
        ...currentPermission,
        skipped: true,
      }));
      markHandled(permission);
    },
    [markHandled, updatePermission],
  );

  const requests: PermissionsCarouselRequest[] = useMemo(
    () =>
      frozenRequests.map(({ permission, request }) => ({
        ...request,
        onAccept: () => handleAccept(permission),
        onReject: () => handleReject(permission),
      })),
    [frozenRequests, handleAccept, handleReject],
  );

  const isCarouselVisible = frozenRequests.length > 0 && handledPermissions.size < frozenRequests.length;
  const isWarningVisible = Object.keys(missingPermissions)?.length > 0;

  return (
    <>
      {isCarouselVisible ? <PermissionsCarousel isVisible={isCarouselVisible} requests={requests} /> : null}
      {isWarningVisible ? (
        <PermissionsWarning
          missingPermissions={missingPermissions}
          onRequestPermission={handleRequest}
          buttonPosition={warningButtonPosition}
        />
      ) : null}
    </>
  );
}
