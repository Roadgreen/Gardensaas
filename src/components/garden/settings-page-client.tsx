'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardTitle, CardContent } from '@/components/ui/card';
import {
  CreditCard,
  Check,
  Sparkles,
  ArrowLeft,
  User,
  Mail,
  Shield,
  LogOut,
  Crown,
  Zap,
  Ruler,
} from 'lucide-react';
import { useGarden } from '@/lib/hooks';
import { SOIL_LABELS, type SoilType } from '@/types';

const GARDEN_SIZE_PRESETS = [
  { label: 'Window Box', length: 1, width: 0.5, emoji: '\uD83E\uDE9F' },
  { label: 'Balcony', length: 2, width: 1, emoji: '\uD83C\uDFE0' },
  { label: 'Small Plot', length: 3, width: 2, emoji: '\uD83C\uDF31' },
  { label: 'Medium Garden', length: 5, width: 3, emoji: '\uD83C\uDF33' },
  { label: 'Large Garden', length: 8, width: 5, emoji: '\uD83C\uDFE1' },
  { label: 'Farm Plot', length: 12, width: 8, emoji: '\uD83C\uDF3E' },
];

export function SettingsPageClient() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const userPlan = (session?.user as Record<string, unknown>)?.plan as string || 'free';
  const isPro = userPlan === 'pro';
  const [upgrading, setUpgrading] = useState(false);
  const { config, updateConfig, isLoaded } = useGarden();
  const [gardenLength, setGardenLength] = useState('');
  const [gardenWidth, setGardenWidth] = useState('');
  const [dimensionsSaved, setDimensionsSaved] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      setGardenLength(config.length.toString());
      setGardenWidth(config.width.toString());
    }
  }, [isLoaded, config.length, config.width]);

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to create checkout session');
      }
    } catch {
      alert('An error occurred');
    }
    setUpgrading(false);
  };

  return (
    <div className="min-h-screen bg-[#0D1F17] py-8 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/garden/dashboard" className="inline-flex items-center gap-2 text-green-400/60 hover:text-green-300 text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold text-green-50 mb-8">Billing & Settings</h1>

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-green-900/30 border border-green-700/30 flex items-center gap-3"
          >
            <Check className="w-5 h-5 text-green-400" />
            <p className="text-green-200">
              You have been upgraded to PRO! Enjoy your new features.
            </p>
          </motion.div>
        )}

        <div className="space-y-6">
          {/* Garden Dimensions */}
          <Card>
            <CardTitle className="flex items-center gap-2 mb-6">
              <Ruler className="w-5 h-5 text-green-400" />
              Garden Dimensions
            </CardTitle>
            <CardContent>
              <p className="text-sm text-green-200/60 mb-4">
                Set the exact width and length of your garden in meters. The 3D view will render your garden at the correct proportions.
              </p>

              {/* Presets */}
              <div className="mb-4">
                <p className="text-xs text-green-400/50 mb-2">Quick presets:</p>
                <div className="grid grid-cols-3 gap-2">
                  {GARDEN_SIZE_PRESETS.map((preset) => {
                    const isActive = gardenLength === preset.length.toString() && gardenWidth === preset.width.toString();
                    return (
                      <button
                        key={preset.label}
                        onClick={() => {
                          setGardenLength(preset.length.toString());
                          setGardenWidth(preset.width.toString());
                          updateConfig({ length: preset.length, width: preset.width });
                          setDimensionsSaved(true);
                          setTimeout(() => setDimensionsSaved(false), 2000);
                        }}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          isActive
                            ? 'border-green-500 bg-green-900/30 text-green-50'
                            : 'border-green-900/40 bg-[#0D1F17] text-green-300/70 hover:border-green-700/50'
                        }`}
                      >
                        <span className="text-lg block">{preset.emoji}</span>
                        <span className="text-xs block">{preset.label}</span>
                        <span className="text-[10px] text-green-500/50">{preset.length}m x {preset.width}m</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom dimensions */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Input
                  id="garden-length"
                  label="Length (m)"
                  type="number"
                  min="0.5"
                  max="50"
                  step="0.5"
                  value={gardenLength}
                  onChange={(e) => setGardenLength(e.target.value)}
                />
                <Input
                  id="garden-width"
                  label="Width (m)"
                  type="number"
                  min="0.5"
                  max="50"
                  step="0.5"
                  value={gardenWidth}
                  onChange={(e) => setGardenWidth(e.target.value)}
                />
              </div>

              {parseFloat(gardenLength) > 0 && parseFloat(gardenWidth) > 0 && (
                <p className="text-xs text-green-300/60 mb-3">
                  Total area: <span className="text-green-200 font-bold">{(parseFloat(gardenLength) * parseFloat(gardenWidth)).toFixed(1)} m&sup2;</span>
                  {' '} - Room for ~{Math.floor(parseFloat(gardenLength) * parseFloat(gardenWidth) * 4)} plants
                </p>
              )}

              <Button
                onClick={() => {
                  const l = parseFloat(gardenLength);
                  const w = parseFloat(gardenWidth);
                  if (l > 0 && w > 0) {
                    updateConfig({ length: l, width: w });
                    setDimensionsSaved(true);
                    setTimeout(() => setDimensionsSaved(false), 2000);
                  }
                }}
                className="w-full gap-2"
                disabled={!parseFloat(gardenLength) || !parseFloat(gardenWidth)}
              >
                {dimensionsSaved ? (
                  <>
                    <Check className="w-4 h-4" />
                    Dimensions Saved!
                  </>
                ) : (
                  <>
                    <Ruler className="w-4 h-4" />
                    Update Garden Size
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Current Plan */}
          <Card>
            <CardTitle className="flex items-center gap-2 mb-6">
              <CreditCard className="w-5 h-5 text-green-400" />
              Current Plan
            </CardTitle>
            <CardContent>
              <div className={`p-6 rounded-xl border ${
                isPro
                  ? 'border-amber-500/30 bg-gradient-to-br from-amber-900/20 to-amber-900/5'
                  : 'border-green-800/30 bg-[#0D1F17]'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {isPro ? (
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                        <Crown className="w-5 h-5 text-amber-400" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-green-600/20 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-green-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-green-50">
                        {isPro ? 'Pro Plan' : 'Free Plan'}
                      </h3>
                      <p className="text-sm text-green-400/60">
                        {isPro ? '9.99 EUR/month' : 'Free forever'}
                      </p>
                    </div>
                  </div>
                  {isPro && (
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Active
                    </span>
                  )}
                </div>

                {isPro ? (
                  <div className="space-y-2">
                    {[
                      'AI Garden Advisor (10 questions/day)',
                      'Unlimited gardens & plants',
                      'Advanced 3D garden view',
                      'Companion planting alerts',
                      'Export garden plans',
                      'Priority support',
                    ].map((feature) => (
                      <div key={feature} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-amber-400" />
                        <span className="text-sm text-green-200/80">{feature}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 mb-6">
                      {[
                        'Garden setup & configuration',
                        'Plant encyclopedia (150+ plants)',
                        'Basic garden planner',
                        'Daily gardening tips',
                        '1 garden, up to 5 plants',
                      ].map((feature) => (
                        <div key={feature} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-green-200/80">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Button
                      onClick={handleUpgrade}
                      disabled={upgrading}
                      className="w-full gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      {upgrading ? 'Redirecting to Stripe...' : 'Upgrade to Pro - 9.99 EUR/month'}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardTitle className="flex items-center gap-2 mb-6">
              <User className="w-5 h-5 text-green-400" />
              Account
            </CardTitle>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0D1F17] border border-green-900/30">
                  <User className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-xs text-green-500/50">Name</p>
                    <p className="text-sm text-green-100">{session?.user?.name || 'Not signed in'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0D1F17] border border-green-900/30">
                  <Mail className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-xs text-green-500/50">Email</p>
                    <p className="text-sm text-green-100">{session?.user?.email || 'Not signed in'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0D1F17] border border-green-900/30">
                  <Shield className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-xs text-green-500/50">Plan</p>
                    <p className="text-sm text-green-100 capitalize">{userPlan}</p>
                  </div>
                </div>
              </div>

              {session && (
                <div className="mt-6 pt-6 border-t border-green-900/30">
                  <Button
                    variant="ghost"
                    className="w-full gap-2 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    onClick={() => signOut({ callbackUrl: '/' })}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
