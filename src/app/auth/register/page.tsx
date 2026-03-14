'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sprout, Mail, Lock, User, Leaf, Flower2 } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

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

      router.push('/garden/dashboard');
    } catch {
      setError('An error occurred. Please try again.');
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
          <h1 className="text-3xl font-bold text-green-50 mb-2">Create Your Account</h1>
          <p className="text-green-300/60">Start planning your dream garden</p>
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
                label="Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                className="pl-10"
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-9 w-4 h-4 text-green-600" />
              <Input
                id="email"
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="pl-10"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-9 w-4 h-4 text-green-600" />
              <Input
                id="password"
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                minLength={8}
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
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-5 pt-5 border-t border-green-900/30 text-center">
            <p className="text-xs text-green-500/40">
              Free plan includes 1 garden, 5 plants, and daily tips.
              <br />
              Upgrade to Pro anytime for AI advisor and unlimited gardens.
            </p>
          </div>
        </div>

        <p className="text-center mt-6 text-sm text-green-400/60">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-green-400 hover:text-green-300 font-medium transition-colors">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
