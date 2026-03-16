'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';

const localeLabels: Record<string, string> = {
  en: 'EN',
  fr: 'FR',
};

export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations('locale');
  const router = useRouter();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const otherLocale = locale === 'en' ? 'fr' : 'en';

  async function switchLocale(newLocale: string) {
    // Set the cookie for next-intl
    await fetch('/api/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: newLocale }),
    });
    // Also persist to DB if user is logged in
    if (session?.user) {
      fetch('/api/user/locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: newLocale }),
      }).catch(() => {});
    }
    setIsOpen(false);
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-green-700/50 bg-white/80 dark:bg-green-900/30 text-gray-700 dark:text-green-200 hover:text-green-700 dark:hover:text-green-100 hover:bg-green-50 dark:hover:bg-green-800/40 hover:border-green-300 dark:hover:border-green-600 transition-all duration-200 cursor-pointer text-sm shadow-sm"
        aria-label={t('switchLanguage')}
      >
        <Globe className="w-4 h-4" />
        <span className="font-semibold tracking-wide">{localeLabels[locale]}</span>
        <span className="text-gray-400 dark:text-green-500/70 text-xs">/</span>
        <span className="text-gray-400 dark:text-green-400/50 text-xs font-medium">{localeLabels[otherLocale]}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 rounded-xl border border-gray-200 dark:border-green-800/60 bg-white dark:bg-[#142A1E] shadow-xl overflow-hidden z-50 ring-1 ring-black/5 dark:ring-green-500/10">
          {['en', 'fr'].map((loc) => (
            <button
              key={loc}
              onClick={() => switchLocale(loc)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer flex items-center gap-2 ${
                locale === loc
                  ? 'bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-300 font-semibold'
                  : 'text-gray-600 dark:text-green-400/70 hover:bg-gray-50 dark:hover:bg-green-900/30 hover:text-gray-900 dark:hover:text-green-200'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                locale === loc
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 dark:bg-green-800/50 text-gray-500 dark:text-green-400/60'
              }`}>
                {loc === 'en' ? 'E' : 'F'}
              </span>
              {t(loc)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
