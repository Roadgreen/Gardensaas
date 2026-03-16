'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
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

  async function switchLocale(newLocale: string) {
    await fetch('/api/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: newLocale }),
    });
    setIsOpen(false);
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-gray-500 dark:text-green-400/60 hover:text-green-600 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200 cursor-pointer text-sm"
        aria-label={t('switchLanguage')}
      >
        <Globe className="w-4 h-4" />
        <span className="font-medium">{localeLabels[locale]}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-32 rounded-xl border border-gray-200 dark:border-green-900/40 bg-white dark:bg-[#142A1E] shadow-xl overflow-hidden z-50">
          {['en', 'fr'].map((loc) => (
            <button
              key={loc}
              onClick={() => switchLocale(loc)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                locale === loc
                  ? 'bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-300 font-medium'
                  : 'text-gray-600 dark:text-green-400/60 hover:bg-gray-50 dark:hover:bg-green-900/20'
              }`}
            >
              {t(loc)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
