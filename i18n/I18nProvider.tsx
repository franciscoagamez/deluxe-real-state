'use client';

import React, { createContext, useContext, useTransition, useState } from 'react';
import { Locale, translations, locales } from './locales';
import { useRouter } from 'next/navigation';

type I18nContextType = {
  locale: Locale;
  t: (key: string, variables?: Record<string, unknown>) => string;
  setLocale: (newLocale: Locale) => void;
};

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const setLocale = (newLocale: Locale) => {
    if (!locales.includes(newLocale)) return;
    
    // Set cookie for 1 year
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
    
    setLocaleState(newLocale);
    
    startTransition(() => {
      // Refresh the server components in place
      router.refresh();
    });
  };

  const dict = translations[locale];

  const t = (key: string, variables?: Record<string, unknown>): string => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value = key.split('.').reduce((acc, part) => acc && (acc as any)[part], dict as any);
    
    if (typeof value !== 'string') {
      return key;
    }
    
    if (variables) {
      Object.entries(variables).forEach(([k, v]) => {
        value = (value as string).replace(`{${k}}`, String(v));
      });
    }
    
    return value;
  };

  return (
    <I18nContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}
