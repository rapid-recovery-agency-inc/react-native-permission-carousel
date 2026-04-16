import { useEffect, useState } from 'react';
import { AppState, AppStateStatus, NativeEventSubscription, Platform } from 'react-native';

import { debounce } from 'lodash';

export const useIsForeground = (): boolean => {
  const [isForeground, setIsForeground] = useState(true);

  useEffect(() => {
    const debouncedSetIsForeground = debounce(setIsForeground, 100);

    const handleChange = (state: AppStateStatus): void => {
      debouncedSetIsForeground(state === 'active');
    };

    const handleFocus = (): void => {
      debouncedSetIsForeground(true);
    };

    const handleBlur = (): void => {
      debouncedSetIsForeground(false);
    };

    const subscriptions: NativeEventSubscription[] = [];
    if (Platform.OS === 'ios') {
      subscriptions.push(AppState.addEventListener('change', handleChange));
    } else if (Platform.OS === 'android') {
      subscriptions.push(AppState.addEventListener('focus', handleFocus));
      subscriptions.push(AppState.addEventListener('blur', handleBlur));
    }

    return () => {
      subscriptions.forEach((subscription) => {
        subscription.remove();
      });
    };
  }, [setIsForeground]);

  return isForeground;
};
