import 'react-native-gesture-handler/jestSetup';
import { jest } from '@jest/globals';
import i18next from 'i18next';

import { messages } from './src/shared/i18n/locales/en';
import { PERMISSIONS_I18N_NAMESPACE } from './src/shared/i18n';

i18next.init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: {
      [PERMISSIONS_I18N_NAMESPACE]: messages.permissions,
    },
  },
  initImmediate: false,
});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
