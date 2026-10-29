import React from 'react';
import { Platform } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

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
      safeAreaInsets,
    }: {
      children: React.ReactNode;
      isVisible: boolean;
      onClose: () => void;
      title: string;
      safeAreaInsets?: { top: number; right: number; bottom: number; left: number };
    }) =>
      isVisible ? (
        <ReactNative.View>
          <ReactNative.Text>{title}</ReactNative.Text>
          <ReactNative.Text testID="warning-modal-bottom-inset">{String(safeAreaInsets?.bottom)}</ReactNative.Text>
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

const renderWithBottomInset = (ui: React.ReactElement, bottom: number) =>
  render(
    <SafeAreaInsetsContext.Provider value={{ top: 0, right: 0, bottom, left: 0 }}>
      {ui}
    </SafeAreaInsetsContext.Provider>,
  );

describe('PermissionsWarning', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

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

  it('offsets a bottom-anchored button by the Android navigation bar inset', () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    const onRequestPermission = jest.fn().mockResolvedValue(undefined);

    renderWithBottomInset(
      <PermissionsWarning
        missingPermissions={{ camera: createMissingPermission() }}
        onRequestPermission={onRequestPermission}
        buttonPosition={{ bottom: 24 }}
      />,
      48,
    );

    expect(screen.getByTestId('permissions-warning-button')).toHaveStyle({ bottom: 88 });
  });

  it('offsets a bottom-anchored button by the bottom inset on iOS too', () => {
    const onRequestPermission = jest.fn().mockResolvedValue(undefined);

    renderWithBottomInset(
      <PermissionsWarning
        missingPermissions={{ camera: createMissingPermission() }}
        onRequestPermission={onRequestPermission}
        buttonPosition={{ bottom: 24 }}
      />,
      34,
    );

    expect(screen.getByTestId('permissions-warning-button')).toHaveStyle({ bottom: 58 });
  });

  it('does not offset a top-anchored button', () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    const onRequestPermission = jest.fn().mockResolvedValue(undefined);

    renderWithBottomInset(
      <PermissionsWarning
        missingPermissions={{ camera: createMissingPermission() }}
        onRequestPermission={onRequestPermission}
        buttonPosition={{ top: 10, right: 10 }}
      />,
      48,
    );

    expect(screen.getByTestId('permissions-warning-button')).toHaveStyle({ top: 10, right: 10 });
  });

  it('passes the navigation bar inset to the full-screen warning modal', () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    const onRequestPermission = jest.fn().mockResolvedValue(undefined);

    renderWithBottomInset(
      <PermissionsWarning
        missingPermissions={{ camera: createMissingPermission() }}
        onRequestPermission={onRequestPermission}
      />,
      48,
    );

    fireEvent.press(screen.getByText('icon:exclamation'));

    expect(screen.getByTestId('warning-modal-bottom-inset')).toHaveTextContent('64');
  });
});
