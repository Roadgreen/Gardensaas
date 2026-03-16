import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

export const locales = ['en', 'fr'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export default getRequestConfig(async () => {
  // Try to get locale from cookie first
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('locale')?.value;

  // Then try Accept-Language header
  const headerStore = await headers();
  const acceptLanguage = headerStore.get('accept-language') || '';

  let locale: Locale = defaultLocale;

  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    locale = cookieLocale as Locale;
  } else if (acceptLanguage) {
    // Parse Accept-Language header
    const preferred = acceptLanguage
      .split(',')
      .map((lang) => {
        const [code, q] = lang.trim().split(';q=');
        return { code: code.trim().split('-')[0].toLowerCase(), q: q ? parseFloat(q) : 1 };
      })
      .sort((a, b) => b.q - a.q);

    for (const { code } of preferred) {
      if (locales.includes(code as Locale)) {
        locale = code as Locale;
        break;
      }
    }
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
