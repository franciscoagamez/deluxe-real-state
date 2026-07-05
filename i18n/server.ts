import { cookies, headers } from 'next/headers';
import { Locale, translations, defaultLocale, locales } from './locales';

export async function getTranslationServer() {
  let locale: Locale = defaultLocale;
  
  try {
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get('NEXT_LOCALE')?.value;
    
    if (localeCookie && locales.includes(localeCookie as Locale)) {
      locale = localeCookie as Locale;
    } else {
      // Detect from Accept-Language header
      const headersList = await headers();
      const acceptLanguage = headersList.get('accept-language');
      if (acceptLanguage) {
        const detected = acceptLanguage
          .split(',')
          .map((lang) => lang.split(';')[0].trim().substring(0, 2).toLowerCase())
          .find((lang) => locales.includes(lang as Locale));
        if (detected) {
          locale = detected as Locale;
        }
      }
    }
  } catch (error) {
    // Prevent build failures when rendering static routes where cookies/headers are not available
    console.warn('i18n server helper: cookies/headers not available, falling back to default locale', error);
  }
  
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
  
  return {
    locale,
    t,
    dict,
  };
}
