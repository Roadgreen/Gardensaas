'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sprout, Mail, Lock, Leaf, TreeDeciduous, Flower2, Sun, Droplets, Star, Users, ArrowRight } from 'lucide-react';

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

      // Fetch user's saved locale and sync cookie so the app renders in their language
      try {
        const sessionRes = await fetch('/api/auth/session');
        if (sessionRes.ok) {
          const session = await sessionRes.json();
          const userLocale = session?.user?.locale;
          if (userLocale && ['en', 'fr'].includes(userLocale)) {
            await fetch('/api/locale', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ locale: userLocale }),
            });
          }
        }
      } catch {
        // Non-critical: locale sync failure should not block login
      }

      const callbackUrl = searchParams.get('callbackUrl');
      if (callbackUrl) {
        router.push(callbackUrl);
      } else {
        // Check if garden is already configured (has data in localStorage)
        try {
          const stored = localStorage.getItem('garden-config');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.length > 0 && parsed.width > 0 && (parsed.plantedItems?.length > 0 || (parsed.zones?.length > 0) || (parsed.raisedBeds?.length > 0))) {
              router.push('/garden/dashboard');
              return;
            }
          }
        } catch {
          // ignore parse errors
        }
        router.push('/garden/setup');
      }
    } catch {
      setError(t('genericError'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1a10] via-[#0D1F17] to-[#0a1a10] flex relative overflow-hidden">
      {/* Left side - Garden illustration panel */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/30 via-emerald-900/20 to-transparent" />

        {/* Animated garden scene */}
        <div className="relative z-10 max-w-lg w-full">
          {/* Garden illustration with SVG */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="relative"
          >
            {/* Main garden card */}
            <div className="relative rounded-3xl bg-gradient-to-br from-green-900/40 to-emerald-900/30 border border-green-700/30 p-8 backdrop-blur-sm overflow-hidden">
              {/* Dot pattern */}
              <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />

              {/* Garden SVG illustration */}
              <svg viewBox="0 0 400 280" className="w-full mb-6" role="img" aria-label="Garden illustration">
                {/* Sky gradient */}
                <defs>
                  <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#0D1F17" />
                    <stop offset="100%" stopColor="#1a3a2a" />
                  </linearGradient>
                  <linearGradient id="grassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#4ade80" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#166534" stopOpacity="0.5" />
                  </linearGradient>
                </defs>
                {/* Ground */}
                <rect x="0" y="200" width="400" height="80" fill="url(#grassGrad)" rx="8" />
                {/* Raised bed 1 */}
                <rect x="30" y="170" width="100" height="40" fill="#5C3D1E" rx="6" />
                <rect x="35" y="160" width="90" height="15" fill="#4ade80" opacity="0.4" rx="4" />
                {/* Plants in bed 1 */}
                <circle cx="55" cy="148" r="12" fill="#22c55e" opacity="0.6" />
                <circle cx="80" cy="145" r="10" fill="#16a34a" opacity="0.7" />
                <circle cx="105" cy="150" r="11" fill="#4ade80" opacity="0.5" />
                {/* Raised bed 2 */}
                <rect x="160" y="175" width="110" height="35" fill="#5C3D1E" rx="6" />
                <rect x="165" y="165" width="100" height="15" fill="#4ade80" opacity="0.3" rx="4" />
                {/* Tomato plants */}
                <line x1="185" y1="165" x2="185" y2="130" stroke="#4ade80" strokeWidth="2" />
                <circle cx="185" cy="125" r="8" fill="#ef4444" opacity="0.7" />
                <line x1="215" y1="165" x2="215" y2="135" stroke="#4ade80" strokeWidth="2" />
                <circle cx="215" cy="130" r="7" fill="#ef4444" opacity="0.6" />
                <line x1="245" y1="165" x2="245" y2="138" stroke="#4ade80" strokeWidth="2" />
                <circle cx="245" cy="133" r="6" fill="#f97316" opacity="0.7" />
                {/* Flowers */}
                <rect x="300" y="178" width="80" height="32" fill="#5C3D1E" rx="6" />
                <circle cx="320" cy="160" r="9" fill="#ec4899" opacity="0.6" />
                <circle cx="340" cy="155" r="8" fill="#a855f7" opacity="0.5" />
                <circle cx="360" cy="158" r="10" fill="#f59e0b" opacity="0.6" />
                {/* Sun */}
                <circle cx="350" cy="50" r="25" fill="#fbbf24" opacity="0.2" />
                <circle cx="350" cy="50" r="15" fill="#fbbf24" opacity="0.3" />
                {/* Clouds */}
                <ellipse cx="80" cy="40" rx="35" ry="15" fill="#ffffff" opacity="0.05" />
                <ellipse cx="200" cy="30" rx="45" ry="18" fill="#ffffff" opacity="0.04" />
                {/* Watering can */}
                <rect x="15" y="220" width="20" height="15" fill="#64748b" opacity="0.4" rx="3" />
                <line x1="35" y1="225" x2="50" y2="218" stroke="#64748b" strokeWidth="2" opacity="0.4" />
                {/* Path */}
                <rect x="140" y="210" width="15" height="70" fill="#92400e" opacity="0.2" rx="3" />
              </svg>

              {/* Tagline */}
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-bold text-green-50">{t('illustrationTitle')}</h2>
                <p className="text-green-300/60 text-sm">{t('illustrationDesc')}</p>
              </div>
            </div>

            {/* Floating elements around the card */}
            <motion.div
              className="absolute -top-6 -left-6 w-14 h-14 rounded-2xl bg-green-600/20 border border-green-600/30 flex items-center justify-center"
              animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Sun className="w-7 h-7 text-yellow-400/60" />
            </motion.div>
            <motion.div
              className="absolute -bottom-4 -right-4 w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-600/30 flex items-center justify-center"
              animate={{ y: [0, -6, 0], rotate: [0, -5, 0] }}
              transition={{ duration: 5, repeat: Infinity, delay: 1 }}
            >
              <Droplets className="w-6 h-6 text-blue-400/60" />
            </motion.div>
            <motion.div
              className="absolute top-1/2 -right-8 w-10 h-10 rounded-xl bg-pink-600/20 border border-pink-600/30 flex items-center justify-center"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, delay: 2 }}
            >
              <Flower2 className="w-5 h-5 text-pink-400/60" />
            </motion.div>
          </motion.div>

          {/* Social proof below illustration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-8 flex items-center justify-center gap-4"
          >
            <div className="flex -space-x-2">
              {['bg-pink-500', 'bg-blue-500', 'bg-amber-500', 'bg-emerald-500'].map((color, i) => (
                <div key={i} className={`w-8 h-8 rounded-full ${color} border-2 border-[#0D1F17] flex items-center justify-center text-white text-xs font-bold`}>
                  {['S', 'T', 'E', 'M'][i]}
                </div>
              ))}
            </div>
            <div className="text-sm">
              <span className="text-green-300 font-semibold">{t('socialProof')}</span>
              <div className="flex items-center gap-1 mt-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                ))}
                <span className="text-green-400/50 text-xs ml-1">4.9/5</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 relative">
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
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md relative z-10"
        >
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center justify-center gap-2 mb-4">
              <motion.div
                className="w-12 h-12 rounded-2xl bg-green-600/20 border border-green-600/30 flex items-center justify-center"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <Sprout className="w-7 h-7 text-green-400" />
              </motion.div>
            </Link>
            <h1 className="text-3xl font-bold text-green-50 mb-2">{t('welcomeBack')}</h1>
            <p className="text-green-300/60">{t('signInSubtitle')}</p>
          </div>

          {/* Mobile-only social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="lg:hidden flex items-center justify-center gap-3 mb-6 p-3 rounded-xl bg-green-900/20 border border-green-800/30"
          >
            <div className="flex -space-x-1.5">
              {['bg-pink-500', 'bg-blue-500', 'bg-amber-500'].map((color, i) => (
                <div key={i} className={`w-6 h-6 rounded-full ${color} border-2 border-[#142A1E] flex items-center justify-center text-white text-[10px] font-bold`}>
                  {['S', 'T', 'E'][i]}
                </div>
              ))}
            </div>
            <span className="text-green-300/70 text-sm">{t('socialProof')}</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[#142A1E]/80 backdrop-blur-sm rounded-2xl border border-green-900/40 p-8 shadow-2xl shadow-black/20"
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="p-3 rounded-xl bg-red-900/20 border border-red-800/30 text-sm text-red-300 flex items-center gap-2"
                >
                  <span className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">!</span>
                  {error}
                </motion.div>
              )}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="relative"
              >
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
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="relative"
              >
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
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button type="submit" disabled={loading} className="w-full gap-2">
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
                    <>
                      {t('signIn')}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </motion.div>
            </form>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center mt-6 text-sm text-green-400/60"
          >
            {t('noAccount')}{' '}
            <Link href="/auth/register" className="text-green-400 hover:text-green-300 font-medium transition-colors">
              {t('signUp')}
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
