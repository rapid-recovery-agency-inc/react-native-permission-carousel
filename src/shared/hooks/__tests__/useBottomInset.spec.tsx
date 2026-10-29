/* eslint-disable rra-conventions/react-naming-convention */

import React, { ReactNode } from 'react';
import { Platform } from 'react-native';
import { renderHook } from '@testing-library/react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { useBottomInset } from '../useBottomInset';

const renderBottomInset = (bottom: number, gap?: number) => {
  const wrapper = ({ children }: { children: ReactNode }): React.JSX.Element => (
    <SafeAreaInsetsContext.Provider value={{ top: 0, right: 0, bottom, left: 0 }}>
      {children}
    </SafeAreaInsetsContext.Provider>
  );

  return renderHook(() => (gap === undefined ? useBottomInset() : useBottomInset(gap)), { wrapper });
};

describe('useBottomInset', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns the raw inset on iOS (home indicator already leaves the correct gap)', () => {
    const { result } = renderBottomInset(34);

    expect(Platform.OS).toBe('ios');
    expect(result.current).toBe(34);
  });

  it('returns the raw inset for Android gesture navigation (no visible bar)', () => {
    jest.replaceProperty(Platform, 'OS', 'android');

    const { result } = renderBottomInset(24);

    expect(result.current).toBe(24);
  });

  it('adds breathing room when an Android 3-button navigation bar is visible', () => {
    jest.replaceProperty(Platform, 'OS', 'android');

    const { result } = renderBottomInset(48);

    expect(result.current).toBe(64);
  });

  it('treats the navigation bar threshold as inclusive', () => {
    jest.replaceProperty(Platform, 'OS', 'android');

    expect(renderBottomInset(40).result.current).toBe(56);
    expect(renderBottomInset(39).result.current).toBe(39);
  });

  it('honours a custom gap', () => {
    jest.replaceProperty(Platform, 'OS', 'android');

    const { result } = renderBottomInset(48, 24);

    expect(result.current).toBe(72);
  });

  it('returns 0 when edge-to-edge is not enabled (no reported inset)', () => {
    jest.replaceProperty(Platform, 'OS', 'android');

    const { result } = renderBottomInset(0);

    expect(result.current).toBe(0);
  });
});
