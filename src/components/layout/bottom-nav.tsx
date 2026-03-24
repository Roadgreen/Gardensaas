'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Sprout, Leaf, LayoutDashboard, Box, Settings } from 'lucide-react';

const navRoutes = [
  { href: '/', labelKey: 'home', icon: Sprout },
  { href: '/plants', labelKey: 'plants', icon: Leaf },
  { href: '/garden/dashboard', labelKey: 'myGarden', icon: LayoutDashboard },
  { href: '/garden/3d', labelKey: '3dView', icon: Box },
  { href: '/garden/settings', labelKey: 'settings', icon: Settings },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations('nav');

  const navLabels: Record<string, string> = {
    home: t('home'),
    plants: t('plants'),
    myGarden: t('myGarden'),
    '3dView': t('3dView'),
    settings: t('settings'),
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[60] md:hidden backdrop-blur-[20px]"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--nav-bg)',
        borderTop: '1px solid var(--outline-variant)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        willChange: 'transform',
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        contain: 'layout style',
        isolation: 'isolate',
      }}
    >
      <div
        className="flex items-stretch justify-around"
      >
        {navRoutes.map(({ href, labelKey, icon: Icon }) => {
          const isActive =
            pathname === href ||
            (href !== '/' && pathname.startsWith(href));
          const label = navLabels[labelKey] ?? labelKey;

          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-1 flex-1 py-3 min-h-[68px] transition-all duration-200 active:scale-95"
              style={{
                color: isActive ? 'var(--primary)' : 'var(--body-text)',
                opacity: isActive ? 1 : 0.6,
              }}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div
                className="relative flex items-center justify-center w-12 h-8 rounded-full transition-all duration-200"
                style={{
                  background: isActive ? 'var(--accent-muted)' : 'transparent',
                }}
              >
                <Icon
                  className="w-6 h-6"
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
              </div>
              <span
                className="text-xs font-medium leading-none tracking-wide"
                style={{ color: isActive ? 'var(--primary)' : 'inherit' }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
