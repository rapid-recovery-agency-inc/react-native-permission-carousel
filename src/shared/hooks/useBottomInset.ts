import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Android's visible 3-button navigation bar reports a ~48dp inset, while its
 * gesture indicator (~24dp) and iOS's home indicator (~24–34dp) already leave
 * the correct visual gap on their own. Only pad when an actual navigation bar
 * is on screen so floating UI never touches it.
 */
const ANDROID_NAV_BAR_INSET_THRESHOLD = 40;

/**
 * Returns the bottom inset for floating/bottom-anchored UI, adding breathing
 * room only when a visible Android navigation bar is present. iOS and Android
 * gesture navigation behaviour is unchanged.
 *
 * This is the single source of truth for bottom insets in this package — do not
 * add `Platform.OS` checks in individual components.
 *
 * Requires a `SafeAreaProvider` (from `react-native-safe-area-context`) above
 * the consuming component tree.
 *
 * @param gap Extra breathing room applied only when a real Android navigation
 * bar is on screen. Defaults to 16.
 */
export function useBottomInset(gap = 16): number {
  const { bottom } = useSafeAreaInsets();

  if (Platform.OS === 'android' && bottom >= ANDROID_NAV_BAR_INSET_THRESHOLD) {
    return bottom + gap;
  }

  return bottom;
}
