'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, Menu, X, LogOut, User, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/providers/theme-provider';
import { LocaleSwitcher } from '@/components/locale-switcher';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const t = useTranslations('nav');

  const navLinks = [
    { href: '/', label: t('home') },
    { href: '/plants', label: t('plants') },
    { href: '/garden/dashboard', label: t('myGarden') },
    { href: '/garden/3d', label: t('3dView') },
    { href: '/pricing', label: t('pricing') },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b transition-colors duration-300"
      style={{ background: 'var(--nav-bg)', borderColor: 'var(--nav-border)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:shadow-green-500/20 transition-all duration-300">
              <Sprout className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-bold" style={{ color: 'var(--heading)' }}>
              Garden<span className="text-gradient">Saas</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/40'
                      : 'text-gray-600 dark:text-green-300/60 hover:text-green-700 dark:hover:text-green-200 hover:bg-green-50 dark:hover:bg-green-900/20'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* CTA / User menu / Theme / Locale */}
          <div className="hidden md:flex items-center gap-2">
            <LocaleSwitcher />
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 dark:text-green-400/60 hover:text-green-600 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200 cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
            {session ? (
              <>
                <Link href="/garden/settings">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    {session.user?.name || t('account')}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="gap-2 text-gray-400 dark:text-green-400/60 hover:text-red-500 dark:hover:text-red-400"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">{t('signIn')}</Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">{t('startFree')}</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile: theme + locale + menu */}
          <div className="md:hidden flex items-center gap-1">
            <LocaleSwitcher />
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-lg text-gray-500 dark:text-green-400/60 hover:text-green-600 dark:hover:text-green-300 transition-colors cursor-pointer touch-target"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2.5 rounded-lg text-gray-600 dark:text-green-300 hover:text-green-700 dark:hover:text-green-100 transition-colors cursor-pointer touch-target"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t backdrop-blur-xl overflow-hidden"
            style={{ borderColor: 'var(--nav-border)', background: 'var(--nav-bg)' }}
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors touch-target ${
                      isActive
                        ? 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/40'
                        : 'text-gray-600 dark:text-green-300/60 hover:text-green-700 dark:hover:text-green-200 hover:bg-green-50 dark:hover:bg-green-900/20'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <div className="pt-3 flex gap-3">
                {session ? (
                  <>
                    <Link href="/garden/settings" className="flex-1" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full touch-target">{t('account')}</Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { signOut({ callbackUrl: '/' }); setIsOpen(false); }}
                      className="gap-2 touch-target"
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login" className="flex-1" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full touch-target">{t('signIn')}</Button>
                    </Link>
                    <Link href="/auth/register" className="flex-1" onClick={() => setIsOpen(false)}>
                      <Button size="sm" className="w-full touch-target">{t('startFree')}</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
