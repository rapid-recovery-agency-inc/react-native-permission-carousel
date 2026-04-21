/* eslint-disable rra-conventions/react-naming-convention */

import React from 'react';
import { renderHook } from '@testing-library/react-native';

jest.mock('react-native-permissions', () => ({
  check: jest.fn(),
  checkNotifications: jest.fn(),
  PERMISSIONS: {
    IOS: {},
    ANDROID: {},
  },
}));

import {
  PermissionsContext,
  PermissionsContextValue,
  initialPermissionsContextState,
} from '../../components/PermissionsProvider';
import { Permission } from '../../types';
import { usePermissionsContext } from '../usePermissionsContext';

describe('usePermissionsContext', () => {
  it('should return the value from PermissionsContext', () => {
    const contextValue: PermissionsContextValue = {
      ...initialPermissionsContextState,
      hasPermission: jest.fn(() => true),
      setPermissions: jest.fn(),
      promptPermission: jest.fn(),
      clearPermissionPrompt: jest.fn(),
    };

    const wrapper = ({ children }: { children: React.ReactNode }): React.JSX.Element => (
      <PermissionsContext.Provider value={contextValue}>{children}</PermissionsContext.Provider>
    );

    const { result } = renderHook(() => usePermissionsContext(), { wrapper });

    expect(result.current).toBe(contextValue);
    expect(result.current.hasPermission(Permission.CAMERA)).toBe(true);
  });
});
