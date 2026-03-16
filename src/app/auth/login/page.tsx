'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sprout, Mail, Lock, Leaf, TreeDeciduous } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('auth');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(t('invalidCredentials'));
        setLoading(false);
        return;
      }

      const callbackUrl = searchParams.get('callbackUrl') || '/garden/dashboard';
      router.push(callbackUrl);
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
          className="absolute top-20 left-10 text-green-800/20"
          animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
        >
          <Leaf className="w-24 h-24" />
        </motion.div>
        <motion.div
          className="absolute bottom-32 right-10 text-green-800/15"
          animate={{ y: [0, -15, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        >
          <TreeDeciduous className="w-32 h-32" />
        </motion.div>
        <motion.div
          className="absolute top-40 right-20 text-green-700/10"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
        >
          <Sprout className="w-16 h-16" />
        </motion.div>
        {/* Glow effect */}
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
          <h1 className="text-3xl font-bold text-green-50 mb-2">{t('welcomeBack')}</h1>
          <p className="text-green-300/60">{t('signInSubtitle')}</p>
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
                placeholder={t('passwordPlaceholder')}
                required
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <span className="flex items-center gap-2">
                  <motion.div
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  />
                  {t('signingIn')}
                </span>
              ) : (
                t('signIn')
              )}
            </Button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-green-400/60">
          {t('noAccount')}{' '}
          <Link href="/auth/register" className="text-green-400 hover:text-green-300 font-medium transition-colors">
            {t('signUp')}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
