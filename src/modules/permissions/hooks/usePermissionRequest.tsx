import { useEffect } from 'react';

import { Permission } from '../types';

import { usePermissionsContext } from './usePermissionsContext';

export function usePermissionsRequest(permission: Permission): void {
  const { clearPermissionPrompt, promptPermission } = usePermissionsContext();

  useEffect(() => {
    promptPermission(permission);

    return () => {
      clearPermissionPrompt(permission);
    };
  }, [clearPermissionPrompt, permission, promptPermission]);
}
