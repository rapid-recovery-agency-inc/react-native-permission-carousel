import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { PermissionsWarning } from '../PermissionsWarning';
import { Permission, PermissionConfig, PermissionState } from '../../types';
import { useThemeColor } from '@rapid-recovery-agency-inc/sloth-ui-mobile';

jest.mock('react-native-permissions', () => ({
  openSettings: jest.fn(),
}));

jest.mock('@rapid-recovery-agency-inc/sloth-ui-mobile', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactNative = require('react-native');

  return {
    MainModal: ({
      children,
      isVisible,
      onClose,
      title,
    }: {
      children: React.ReactNode;
      isVisible: boolean;
      onClose: () => void;
      title: string;
    }) =>
      isVisible ? (
        <ReactNative.View>
          <ReactNative.Text>{title}</ReactNative.Text>
          {children}
          <ReactNative.TouchableOpacity onPress={onClose}>
            <ReactNative.Text>Close</ReactNative.Text>
          </ReactNative.TouchableOpacity>
        </ReactNative.View>
      ) : null,
    MainText: ({ children }: { children: React.ReactNode }) => <ReactNative.Text>{children}</ReactNative.Text>,
    Icon: ({ iconName }: { iconName: string }) => <ReactNative.Text>{`icon:${iconName}`}</ReactNative.Text>,
    useThemeColor: jest.fn().mockReturnValue('#000000'),
  };
});

const createMissingPermission = (): PermissionConfig => ({
  title: 'Camera',
  description: 'Camera access',
  iconName: 'camera',
  warningTitle: 'Camera permission needed',
  warningMessage1: 'Please enable camera access.',
  warningMessage2: 'You can change this later.',
  required: true,
  prompt: true,
  requested: false,
  skipped: false,
  permissionState: PermissionState.DENIED,
  os: '*',
});

describe('PermissionsWarning', () => {
  it('should only display the warning icon when permissions are missing', () => {
    const onRequestPermission = jest.fn().mockResolvedValue(undefined);
    const { rerender } = render(
      <PermissionsWarning missingPermissions={{}} onRequestPermission={onRequestPermission} />,
    );

    expect(screen.queryByText('icon:exclamation')).toBeNull();
    expect(screen.queryByText('Required Permissions')).toBeNull();

    rerender(
      <PermissionsWarning
        missingPermissions={{ camera: createMissingPermission() }}
        onRequestPermission={onRequestPermission}
      />,
    );

    expect(screen.getByText('icon:exclamation')).toBeTruthy();
    expect(screen.queryByText('Required Permissions')).toBeNull();
  });

  it('should open the modal when the icon is pressed and close it when close is pressed', () => {
    const onRequestPermission = jest.fn().mockResolvedValue(undefined);

    render(
      <PermissionsWarning
        missingPermissions={{ camera: createMissingPermission() }}
        onRequestPermission={onRequestPermission}
      />,
    );

    expect(screen.queryByText('Required Permissions')).toBeNull();

    fireEvent.press(screen.getByText('icon:exclamation'));

    expect(screen.getByText('Required Permissions')).toBeTruthy();

    fireEvent.press(screen.getByText('Close'));

    expect(screen.queryByText('Required Permissions')).toBeNull();
    expect(screen.getByText('icon:exclamation')).toBeTruthy();
  });

  it('should apply a custom buttonPosition to the warning button', () => {
    const onRequestPermission = jest.fn().mockResolvedValue(undefined);
    const customStyle = { top: 10, right: 10 };

    render(
      <PermissionsWarning
        missingPermissions={{ camera: createMissingPermission() }}
        onRequestPermission={onRequestPermission}
        buttonPosition={customStyle}
      />,
    );

    const button = screen.getByTestId('permissions-warning-button');
    expect(button).toHaveStyle(customStyle);
  });
});
