/* eslint-disable rra-conventions/react-naming-convention */

import { renderHook } from '@testing-library/react-native';

import { Permission } from '../../types';
import { usePermissionsRequest } from '../usePermissionRequest';
import { usePermissionsContext } from '../usePermissionsContext';

jest.mock('../usePermissionsContext', () => ({
  usePermissionsContext: jest.fn(),
}));

describe('usePermissionsRequest', () => {
  const promptPermission = jest.fn();
  const clearPermissionPrompt = jest.fn();

  beforeEach(() => {
    (usePermissionsContext as jest.Mock).mockReturnValue({
      promptPermission,
      clearPermissionPrompt,
    });
  });

  afterEach(() => {
    promptPermission.mockReset();
    clearPermissionPrompt.mockReset();
    (usePermissionsContext as jest.Mock).mockReset();
  });

  it('should prompt on mount and clear prompt on unmount for the provided permission', () => {
    const { unmount } = renderHook(
      ({ permission }: { permission: Permission }) => usePermissionsRequest(permission),
      {
        initialProps: { permission: Permission.CAMERA },
      },
    );

    expect(promptPermission).toHaveBeenCalledTimes(1);
    expect(promptPermission).toHaveBeenCalledWith(Permission.CAMERA);
    expect(clearPermissionPrompt).not.toHaveBeenCalled();

    unmount();

    expect(clearPermissionPrompt).toHaveBeenCalledTimes(1);
    expect(clearPermissionPrompt).toHaveBeenCalledWith(Permission.CAMERA);
  });
});
