'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import React, { useState, useRef, useEffect, useCallback } from 'react';

function FlagGB({ size = 20 }: { size?: number }) {
  const h = Math.round(size * 0.75);
  return (
    <svg width={size} height={h} viewBox="0 0 60 40" className="rounded-sm inline-block shrink-0" aria-hidden="true">
      <rect width="60" height="40" fill="#012169"/>
      <path d="M0,0 L60,40 M60,0 L0,40" stroke="white" strokeWidth="8"/>
      <path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="5"/>
      <path d="M30,0 V40 M0,20 H60" stroke="white" strokeWidth="13"/>
      <path d="M30,0 V40 M0,20 H60" stroke="#C8102E" strokeWidth="8"/>
    </svg>
  );
}

function FlagFR({ size = 20 }: { size?: number }) {
  const h = Math.round(size * 0.75);
  return (
    <svg width={size} height={h} viewBox="0 0 60 40" className="rounded-sm inline-block shrink-0" aria-hidden="true">
      <rect width="20" height="40" fill="#002395"/>
      <rect x="20" width="20" height="40" fill="white"/>
      <rect x="40" width="20" height="40" fill="#ED2939"/>
    </svg>
  );
}

const FLAG_COMPONENTS: Record<string, ({ size }: { size?: number }) => React.ReactElement> = {
  en: FlagGB,
  fr: FlagFR,
};

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
  const [switching, setSwitching] = useState(false);
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

  const switchLocale = useCallback(async (newLocale: string) => {
    if (newLocale === locale) { setIsOpen(false); return; }
    setSwitching(true);
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
    // Small delay to let the page rerender
    setTimeout(() => setSwitching(false), 600);
  }, [locale, session, router]);

  // Quick toggle: click the button to switch directly (no dropdown needed for 2 languages)
  const handleQuickSwitch = useCallback(() => {
    switchLocale(otherLocale);
  }, [otherLocale, switchLocale]);

  const CurrentFlag = FLAG_COMPONENTS[locale];
  const OtherFlag = FLAG_COMPONENTS[otherLocale];

  return (
    <div className="relative" ref={ref}>
      {/* Main toggle button - highly visible with flag */}
      <button
        onClick={handleQuickSwitch}
        onContextMenu={(e) => { e.preventDefault(); setIsOpen(!isOpen); }}
        className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 rounded-xl border-2 border-green-400/60 dark:border-green-500/40 bg-white/90 dark:bg-green-900/50 text-gray-800 dark:text-green-100 hover:bg-green-50 dark:hover:bg-green-800/60 hover:border-green-500 dark:hover:border-green-400/60 transition-all duration-200 cursor-pointer text-sm shadow-md hover:shadow-lg sm:hover:scale-105 active:scale-95 shrink-0 ${switching ? 'opacity-70 pointer-events-none' : ''}`}
        aria-label={t('switchLanguage')}
        title={`${t('switchLanguage')} - ${t(otherLocale)}`}
      >
        {CurrentFlag && <CurrentFlag size={18} />}
        <span className="font-bold tracking-wide text-xs">{localeLabels[locale]}</span>
        <span className="text-green-400 dark:text-green-500/70 text-xs font-medium mx-0.5">{'\u2192'}</span>
        {OtherFlag && <OtherFlag size={18} />}
        <span className="font-medium tracking-wide text-xs text-gray-500 dark:text-green-400/60">{localeLabels[otherLocale]}</span>
      </button>

      {/* Optional dropdown (accessible via right-click) */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 sm:w-44 rounded-xl border border-gray-200 dark:border-green-800/60 bg-white dark:bg-[#142A1E] shadow-xl overflow-hidden z-50 ring-1 ring-black/5 dark:ring-green-500/10 animate-bounce-in">
          {(['en', 'fr'] as const).map((loc) => {
            const LocFlag = FLAG_COMPONENTS[loc];
            return (
            <button
              key={loc}
              onClick={() => switchLocale(loc)}
              className={`w-full text-left px-4 py-3 text-sm transition-colors cursor-pointer flex items-center gap-3 ${
                locale === loc
                  ? 'bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-300 font-semibold'
                  : 'text-gray-600 dark:text-green-400/70 hover:bg-gray-50 dark:hover:bg-green-900/30 hover:text-gray-900 dark:hover:text-green-200'
              }`}
            >
              {LocFlag && <LocFlag size={20} />}
              <span className="flex-1">{t(loc)}</span>
              {locale === loc && (
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-glow" />
              )}
            </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
