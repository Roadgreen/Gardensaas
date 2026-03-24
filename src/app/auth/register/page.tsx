'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sprout, Mail, Lock, User, Leaf, Flower2, Globe } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const currentLocale = useLocale();
  const [selectedLocale, setSelectedLocale] = useState(currentLocale);
  const router = useRouter();
  const t = useTranslations('auth');
  const tLocale = useTranslations('locale');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, locale: selectedLocale }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t('genericError'));
        setLoading(false);
        return;
      }

      // Set locale cookie to match user's choice
      await fetch('/api/locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: selectedLocale }),
      });

      // Auto sign in after registration
      const signInResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        // Registration succeeded but auto-login failed, redirect to login
        router.push('/auth/login');
        return;
      }

      // New user always goes to setup
      router.push('/garden/setup');
    } catch {
      setError(t('genericError'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1a10] via-[#0D1F17] to-[#0a1a10] flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-24 right-12 text-green-800/20"
          animate={{ y: [0, -10, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 7, repeat: Infinity }}
        >
          <Flower2 className="w-20 h-20" />
        </motion.div>
        <motion.div
          className="absolute bottom-24 left-8 text-green-800/15"
          animate={{ y: [0, -12, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
        >
          <Leaf className="w-28 h-28" />
        </motion.div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-green-900/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-green-600/20 border border-green-600/30 flex items-center justify-center">
              <Sprout className="w-7 h-7 text-green-400" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-green-50 mb-2">{t('createAccount')}</h1>
          <p className="text-green-300/60">{t('registerSubtitle')}</p>
        </div>

        <div className="bg-[#142A1E]/80 backdrop-blur-sm rounded-2xl border border-green-900/40 p-8 shadow-2xl shadow-black/20">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-red-900/20 border border-red-800/30 text-sm text-red-300"
              >
                {error}
              </motion.div>
            )}
            <div className="relative">
              <User className="absolute left-3 top-9 w-4 h-4 text-green-600" />
              <Input
                id="name"
                label={t('name')}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('namePlaceholder')}
                required
                className="pl-10"
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-9 w-4 h-4 text-green-600" />
              <Input
                id="email"
                label={t('email')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                required
                className="pl-10"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-9 w-4 h-4 text-green-600" />
              <Input
                id="password"
                label={t('password')}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('passwordHint')}
                minLength={8}
                required
                className="pl-10"
              />
            </div>
            {/* Language selection */}
            <div>
              <label className="block text-sm font-medium text-green-200/80 mb-2">
                <Globe className="w-4 h-4 inline mr-1.5" />
                {tLocale('switchLanguage')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(['en', 'fr'] as const).map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setSelectedLocale(loc)}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedLocale === loc
                        ? 'border-green-500 bg-green-900/30 text-green-50'
                        : 'border-green-900/40 bg-[#0D1F17] text-green-300/70 hover:border-green-700/50'
                    }`}
                  >
                    <span className="text-lg block mb-0.5" aria-hidden="true">{loc === 'en' ? '\uD83C\uDDEC\uD83C\uDDE7' : '\uD83C\uDDEB\uD83C\uDDF7'}</span>
                    <span className="text-sm font-medium">{tLocale(loc)}</span>
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <span className="flex items-center gap-2">
                  <motion.div
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  />
                  {t('creatingAccount')}
                </span>
              ) : (
                t('createAccountBtn')
              )}
            </Button>
          </form>

          <div className="mt-5 pt-5 border-t border-green-900/30 text-center">
            <p className="text-xs text-green-500/40">
              {t('freeIncludes')}
              <br />
              {t('upgradeAnytime')}
            </p>
          </div>
        </div>

        <p className="text-center mt-6 text-sm text-green-400/60">
          {t('alreadyHaveAccount')}{' '}
          <Link href="/auth/login" className="text-green-400 hover:text-green-300 font-medium transition-colors">
            {t('signIn')}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
