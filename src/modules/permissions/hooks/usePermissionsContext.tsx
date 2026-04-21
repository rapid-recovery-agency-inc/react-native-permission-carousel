import { useContext } from 'react';

import { PermissionsContext, PermissionsContextValue } from '../components/PermissionsProvider';

export function usePermissionsContext(): PermissionsContextValue {
  return useContext(PermissionsContext);
}
