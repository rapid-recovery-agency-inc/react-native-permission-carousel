import React from 'react';
import { Platform } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { PermissionsCarousel } from '../PermissionsCarousel';

jest.mock('@rapid-recovery-agency-inc/sloth-ui-mobile', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const RN = require('react-native');

  return {
    createThemeStyleSheet: (styles: Record<string, unknown>) => styles,
    useThemedStyles: (styles: Record<string, unknown>) => styles,
    MainText: ({ children }: { children: React.ReactNode }) => <RN.Text>{children}</RN.Text>,
    Icon: ({ iconName }: { iconName: string }) => <RN.Text>{`icon:${iconName}`}</RN.Text>,
    Button: ({ text, onPress, disabled }: { text: string; onPress: () => void; disabled?: boolean }) => (
      <RN.TouchableOpacity onPress={onPress} disabled={disabled} accessibilityState={{ disabled }}>
        <RN.Text>{text}</RN.Text>
      </RN.TouchableOpacity>
    ),
  };
});

const requests = [{ title: 'Location', description: 'We need your location', onAccept: jest.fn() }];

const renderCarousel = (bottomInset: number) =>
  render(
    <SafeAreaInsetsContext.Provider value={{ top: 0, right: 0, bottom: bottomInset, left: 0 }}>
      <PermissionsCarousel isVisible={true} requests={requests} />
    </SafeAreaInsetsContext.Provider>,
  );

describe('PermissionsCarousel', () => {
  beforeEach(() => {
    requests[0].onAccept.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('renders the accept button and forwards the press to the request', async () => {
    renderCarousel(0);

    await act(async () => {
      fireEvent.press(screen.getByText('Continue'));
      jest.advanceTimersByTime(32);
    });

    await waitFor(() => {
      expect(requests[0].onAccept).toHaveBeenCalledTimes(1);
    });
  });

  it('adds the navigation bar gap to the modal bottom inset on Android 3-button navigation', () => {
    jest.replaceProperty(Platform, 'OS', 'android');

    renderCarousel(48);

    expect(screen.getByTestId('permissions-carousel-root')).toHaveStyle({ paddingBottom: 64 });
  });

  it('leaves the Android gesture navigation inset untouched', () => {
    jest.replaceProperty(Platform, 'OS', 'android');

    renderCarousel(24);

    expect(screen.getByTestId('permissions-carousel-root')).toHaveStyle({ paddingBottom: 24 });
  });

  it('leaves the iOS home indicator inset untouched', () => {
    renderCarousel(34);

    expect(screen.getByTestId('permissions-carousel-root')).toHaveStyle({ paddingBottom: 34 });
  });
});
