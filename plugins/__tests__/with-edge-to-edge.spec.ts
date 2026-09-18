import { AndroidConfig } from '@expo/config-plugins';

import withEdgeToEdge, {
  addEdgeToEdgeCall,
  addEdgeToEdgeImport,
  applyTranslucentNavigation,
  patchMainActivity,
} from '../with-edge-to-edge';

const MAIN_ACTIVITY = `package com.example.app

import android.os.Bundle
import com.facebook.react.ReactActivity

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
  }
}
`;

const MAIN_ACTIVITY_WITHOUT_BUNDLE_IMPORT = `package com.example.app

import com.facebook.react.ReactActivity

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
  }
}
`;

const createStylesXml = (): AndroidConfig.Resources.ResourceXML => ({
  resources: {
    style: [
      {
        $: { name: 'AppTheme', parent: 'Theme.AppCompat.DayNight.NoActionBar' },
        item: [{ _: '#ffffff', $: { name: 'android:statusBarColor' } }],
      },
    ],
  },
});

interface AndroidStyleItem {
  _: string;
  $: { name: string };
}

const getStyleItemValue = (stylesXml: AndroidConfig.Resources.ResourceXML, name: string): string | undefined =>
  stylesXml.resources.style?.[0].item?.find((item) => item.$.name === name)?._;

describe('addEdgeToEdgeImport', () => {
  it('adds the top-level enableEdgeToEdge import after the Bundle import', () => {
    expect(addEdgeToEdgeImport(MAIN_ACTIVITY)).toContain(
      'import android.os.Bundle\nimport androidx.activity.enableEdgeToEdge',
    );
  });

  it('falls back to the first import when there is no Bundle import', () => {
    expect(addEdgeToEdgeImport(MAIN_ACTIVITY_WITHOUT_BUNDLE_IMPORT)).toContain(
      'import com.facebook.react.ReactActivity\nimport androidx.activity.enableEdgeToEdge',
    );
  });

  it('does not add the import twice', () => {
    const once = addEdgeToEdgeImport(MAIN_ACTIVITY);

    expect(addEdgeToEdgeImport(once)).toBe(once);
  });
});

describe('addEdgeToEdgeCall', () => {
  it('adds the top-level enableEdgeToEdge() call after super.onCreate', () => {
    expect(addEdgeToEdgeCall(MAIN_ACTIVITY)).toContain('super.onCreate(null)\n    enableEdgeToEdge()');
  });

  it('does not use the removed extension-on-Activity form', () => {
    expect(addEdgeToEdgeCall(MAIN_ACTIVITY)).not.toContain('enableEdgeToEdge(this)');
  });

  it('does not add the call twice', () => {
    const once = addEdgeToEdgeCall(MAIN_ACTIVITY);

    expect(addEdgeToEdgeCall(once)).toBe(once);
  });
});

describe('patchMainActivity', () => {
  it('is idempotent', () => {
    const patched = patchMainActivity(MAIN_ACTIVITY);

    expect(patchMainActivity(patched)).toBe(patched);
  });

  it('adds both the import and the call', () => {
    const patched = patchMainActivity(MAIN_ACTIVITY);

    expect(patched).toContain('import androidx.activity.enableEdgeToEdge');
    expect(patched).toContain('enableEdgeToEdge()');
  });
});

describe('applyTranslucentNavigation', () => {
  it('makes the AppTheme navigation bar translucent', () => {
    const stylesXml = applyTranslucentNavigation(createStylesXml());

    expect(getStyleItemValue(stylesXml, 'android:navigationBarColor')).toBe('@android:color/transparent');
    expect(getStyleItemValue(stylesXml, 'android:windowTranslucentNavigation')).toBe('true');
  });

  it('keeps existing AppTheme items', () => {
    const stylesXml = applyTranslucentNavigation(createStylesXml());

    expect(getStyleItemValue(stylesXml, 'android:statusBarColor')).toBe('#ffffff');
  });

  it('does not override a navigation bar colour the app already configured', () => {
    const stylesXml = createStylesXml();
    stylesXml.resources.style?.[0].item?.push({ _: '#000000', $: { name: 'android:navigationBarColor' } });

    const result = applyTranslucentNavigation(stylesXml);

    expect(getStyleItemValue(result, 'android:navigationBarColor')).toBe('#000000');
    expect(getStyleItemValue(result, 'android:windowTranslucentNavigation')).toBeUndefined();
  });

  it('does not duplicate items when applied twice', () => {
    const twice = applyTranslucentNavigation(applyTranslucentNavigation(createStylesXml()));
    const items: AndroidStyleItem[] = twice.resources.style?.[0].item ?? [];

    expect(items.filter((item) => item.$.name === 'android:navigationBarColor')).toHaveLength(1);
  });
});

describe('withEdgeToEdge', () => {
  it('registers the MainActivity and styles Android mods', () => {
    const config = withEdgeToEdge({ name: 'test-app', slug: 'test-app' } as never) as unknown as {
      mods?: { android?: Record<string, unknown> };
    };

    expect(Object.keys(config.mods?.android ?? {})).toEqual(expect.arrayContaining(['mainActivity', 'styles']));
  });
});
