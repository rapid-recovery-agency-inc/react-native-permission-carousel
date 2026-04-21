import type { i18n } from 'i18next';
import i18next from 'i18next';

import { messages } from './locales/en';

export const PERMISSIONS_I18N_NAMESPACE = 'permissions';

export function addTranslationsTo(i18nInstance: i18n): void {
  i18nInstance.addResourceBundle('en', PERMISSIONS_I18N_NAMESPACE, messages.permissions, true, true);
}

export const t = i18next.t.bind(i18next);
