/* eslint-disable rra-conventions/react-naming-convention */

import { act, renderHook } from '@testing-library/react-native';
import { AppState, Platform } from 'react-native';

import { useIsForeground } from '../useIsForeground';

jest.mock('lodash', () => ({
  debounce: (fn: (...args: unknown[]) => void) => fn,
}));

jest.mock('react-native', () => {
  return {
    AppState: {
      addEventListener: jest.fn(),
    },
    Platform: {
      OS: 'ios',
    },
  };
});

type AppStateEvent = 'change' | 'focus' | 'blur';
type AppStateHandler = (state?: 'active' | 'background' | 'inactive') => void;

describe('useIsForeground', () => {
  const removeMocks: jest.Mock[] = [];
  const handlers = new Map<AppStateEvent, AppStateHandler>();

  beforeEach(() => {
    (Platform as { OS: string }).OS = 'ios';
    handlers.clear();
    removeMocks.length = 0;

    (AppState.addEventListener as jest.Mock).mockImplementation(
      (event: AppStateEvent, handler: AppStateHandler) => {
        handlers.set(event, handler);
        const remove = jest.fn();
        removeMocks.push(remove);

        return { remove };
      },
    );
  });

  afterEach(() => {
    (AppState.addEventListener as jest.Mock).mockReset();
  });

  it('should register change listener on iOS and update foreground state', () => {
    const { result } = renderHook(() => useIsForeground());

    expect(AppState.addEventListener).toHaveBeenCalledTimes(1);
    expect(AppState.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    expect(result.current).toBe(true);

    act(() => {
      handlers.get('change')?.('background');
    });

    expect(result.current).toBe(false);

    act(() => {
      handlers.get('change')?.('active');
    });

    expect(result.current).toBe(true);
  });

  it('should register focus and blur listeners on Android and clean up subscriptions', () => {
    (Platform as { OS: string }).OS = 'android';

    const { result, unmount } = renderHook(() => useIsForeground());

    expect(AppState.addEventListener).toHaveBeenCalledTimes(2);
    expect(AppState.addEventListener).toHaveBeenNthCalledWith(1, 'focus', expect.any(Function));
    expect(AppState.addEventListener).toHaveBeenNthCalledWith(2, 'blur', expect.any(Function));

    act(() => {
      handlers.get('blur')?.();
    });
    expect(result.current).toBe(false);

    act(() => {
      handlers.get('focus')?.();
    });
    expect(result.current).toBe(true);

    act(() => {
      unmount();
    });

    expect(removeMocks).toHaveLength(2);
    expect(removeMocks[0]).toHaveBeenCalledTimes(1);
    expect(removeMocks[1]).toHaveBeenCalledTimes(1);
  });
});
