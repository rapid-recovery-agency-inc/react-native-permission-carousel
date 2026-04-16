import { PermissionState } from './types';

export function getPermissionStateFromPermissionStatus(result: string | undefined): PermissionState | null {
  switch (result) {
    case 'granted':
      return PermissionState.GRANTED;
    case 'denied':
      return PermissionState.DENIED;
    case 'blocked':
      return PermissionState.BLOCKED;
    default:
      return null;
  }
}
