import { AndroidConfig, ConfigPlugin, withAndroidStyles, withMainActivity } from '@expo/config-plugins';

/**
 * Expo config plugin that enables Android edge-to-edge rendering so
 * `react-native-safe-area-context` reports real system bar insets.
 *
 * Without edge-to-edge, `useSafeAreaInsets().bottom` is `0` on Android and
 * bottom-anchored UI (such as the permission carousel CTA) draws behind or
 * flush against the navigation bar.
 *
 * Applies two changes:
 * 1. `MainActivity.kt` — imports and calls the top-level `enableEdgeToEdge()`.
 * 2. `styles.xml` — makes the `AppTheme` navigation bar translucent.
 *
 * Usage (Expo / CNG apps):
 *
 * ```ts
 * // app.config.ts
 * export default {
 *   android: { edgeToEdgeEnabled: true },
 *   plugins: ['@rapid-recovery-agency-inc/react-native-permission-carousel/plugins/with-edge-to-edge'],
 * };
 * ```
 *
 * Bare React Native apps cannot use this plugin — apply the equivalent
 * `WindowCompat.setDecorFitsSystemWindows(window, false)` / `enableEdgeToEdge()`
 * in `MainActivity` directly.
 */

const EDGE_TO_EDGE_IMPORT = 'import androidx.activity.enableEdgeToEdge';
const EDGE_TO_EDGE_CALL = 'enableEdgeToEdge()';
const NAVIGATION_BAR_COLOR = 'android:navigationBarColor';
const WINDOW_TRANSLUCENT_NAVIGATION = 'android:windowTranslucentNavigation';
const TRANSPARENT_NAVIGATION_BAR_COLOR = '@android:color/transparent';

/**
 * Adds the top-level `enableEdgeToEdge` import to a MainActivity source file.
 *
 * `enableEdgeToEdge` is a top-level function in current `androidx.activity`; the
 * extension-on-Activity form (`enableEdgeToEdge(this)`) was removed and fails to
 * compile.
 */
export function addEdgeToEdgeImport(contents: string): string {
  if (contents.includes(EDGE_TO_EDGE_IMPORT)) {
    return contents;
  }

  if (contents.includes('import android.os.Bundle')) {
    return contents.replace('import android.os.Bundle', `import android.os.Bundle\n${EDGE_TO_EDGE_IMPORT}`);
  }

  return contents.replace(/^import .*$/m, (match) => `${match}\n${EDGE_TO_EDGE_IMPORT}`);
}

/**
 * Adds the `enableEdgeToEdge()` call directly after `super.onCreate(...)`.
 */
export function addEdgeToEdgeCall(contents: string): string {
  if (contents.includes(EDGE_TO_EDGE_CALL)) {
    return contents;
  }

  return contents.replace(/super\.onCreate\([^)]*\)/, (match) => `${match}\n    ${EDGE_TO_EDGE_CALL}`);
}

/**
 * Applies both MainActivity changes. Safe to run repeatedly (idempotent).
 */
export function patchMainActivity(contents: string): string {
  return addEdgeToEdgeCall(addEdgeToEdgeImport(contents));
}

/**
 * Makes the `AppTheme` navigation bar translucent so content draws behind it.
 * Returns the styles.xml unchanged when the app already sets a navigation bar
 * colour of its own. Safe to run repeatedly (idempotent).
 */
export function applyTranslucentNavigation(
  stylesXml: AndroidConfig.Resources.ResourceXML,
): AndroidConfig.Resources.ResourceXML {
  const { assignStylesValue, getAppThemeGroup, getStylesItem } = AndroidConfig.Styles;
  const parent = getAppThemeGroup();

  if (getStylesItem({ name: NAVIGATION_BAR_COLOR, xml: stylesXml, parent })) {
    return stylesXml;
  }

  const withNavigationBarColor = assignStylesValue(stylesXml, {
    add: true,
    value: TRANSPARENT_NAVIGATION_BAR_COLOR,
    name: NAVIGATION_BAR_COLOR,
    parent,
  });

  return assignStylesValue(withNavigationBarColor, {
    add: true,
    value: 'true',
    name: WINDOW_TRANSLUCENT_NAVIGATION,
    parent,
  });
}

const withEdgeToEdge: ConfigPlugin = (config) => {
  config = withMainActivity(config, (config) => {
    config.modResults.contents = patchMainActivity(config.modResults.contents);
    return config;
  });

  config = withAndroidStyles(config, (config) => {
    config.modResults = applyTranslucentNavigation(config.modResults);
    return config;
  });

  return config;
};

export default withEdgeToEdge;
