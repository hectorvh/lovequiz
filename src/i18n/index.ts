import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import es from './es.json';
import en from './en.json';
import fr from './fr.json';
import de from './de.json';

import { LOCALES, type Locale } from '../types';
import { readPersistedLocale } from '../state/persistence';

export const resources = {
  es: { translation: es },
  en: { translation: en },
  fr: { translation: fr },
  de: { translation: de },
} as const;

export const LOCALE_LABELS: Record<Locale, { flag: string; name: string }> = {
  es: { flag: '🇪🇸', name: 'Español' },
  en: { flag: '🇬🇧', name: 'English' },
  fr: { flag: '🇫🇷', name: 'Français' },
  de: { flag: '🇩🇪', name: 'Deutsch' },
};

void i18n.use(initReactI18next).init({
  resources,
  lng: readPersistedLocale() ?? 'es',
  fallbackLng: 'es',
  supportedLngs: LOCALES,
  interpolation: { escapeValue: false },
});

export default i18n;
