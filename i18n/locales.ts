import { es } from './translations/es';
import { en } from './translations/en';
import { fr } from './translations/fr';

export const locales = ['es', 'en', 'fr'] as const;
export type Locale = typeof locales[number];
export const defaultLocale: Locale = 'en';

export const translations = {
  es,
  en,
  fr,
} as const;

export type TranslationType = typeof en;
