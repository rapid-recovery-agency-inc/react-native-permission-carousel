import i18next from 'i18next';

import { messages as en } from './locales/en';

void i18next.init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: {
      translation: en,
    },
  },
});

export const i18n = i18next;

export const t = i18next.t;
