'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
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
  Globe,
} from 'lucide-react';
import { useGarden } from '@/lib/hooks';

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
  const router = useRouter();
  const success = searchParams.get('success');
  const userPlan = (session?.user as Record<string, unknown>)?.plan as string || 'free';
  const userLocale = (session?.user as Record<string, unknown>)?.locale as string || 'en';
  const isPro = userPlan === 'pro';
  const [upgrading, setUpgrading] = useState(false);
  const { config, updateConfig, isLoaded } = useGarden();
  const [gardenLength, setGardenLength] = useState('');
  const [gardenWidth, setGardenWidth] = useState('');
  const [dimensionsSaved, setDimensionsSaved] = useState(false);
  const currentLocale = useLocale();
  const [selectedLocale, setSelectedLocale] = useState(currentLocale);
  const [localeSaving, setLocaleSaving] = useState(false);
  const [localeSaved, setLocaleSaved] = useState(false);
  const t = useTranslations('settings');
  const tLocale = useTranslations('locale');

  useEffect(() => {
    if (isLoaded) {
      setGardenLength(config.length.toString());
      setGardenWidth(config.width.toString());
    }
  }, [isLoaded, config.length, config.width]);

  // Initialize selected locale from user's DB preference
  useEffect(() => {
    if (userLocale && ['en', 'fr'].includes(userLocale)) {
      setSelectedLocale(userLocale);
    }
  }, [userLocale]);

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

  const handleLocaleChange = async (newLocale: string) => {
    setSelectedLocale(newLocale);
    setLocaleSaving(true);
    try {
      // Update user's locale in DB
      await fetch('/api/user/locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: newLocale }),
      });
      // Also set the cookie directly
      await fetch('/api/locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: newLocale }),
      });
      setLocaleSaved(true);
      setTimeout(() => setLocaleSaved(false), 2000);
      // Refresh to apply new locale
      router.refresh();
    } catch {
      // Revert on error
      setSelectedLocale(currentLocale);
    }
    setLocaleSaving(false);
  };

  return (
    <div className="min-h-screen py-8 px-6" style={{ background: 'var(--surface)' }}>
      <div className="max-w-3xl mx-auto">
        <Link href="/garden/dashboard" className="inline-flex items-center gap-2 text-sm mb-8 transition-colors" style={{ color: 'var(--on-surface-variant, #43483f)', opacity: 0.8 }}>
          <ArrowLeft className="w-4 h-4" />
          {t('backToDashboard')}
        </Link>

        <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--on-surface)' }}>{t('title')}</h1>

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl flex items-center gap-3 border"
            style={{ background: 'var(--surface-container)', borderColor: 'var(--outline-variant)' }}
          >
            <Check className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            <p style={{ color: 'var(--on-surface)' }}>
              {t('upgradeSuccess')}
            </p>
          </motion.div>
        )}

        <div className="space-y-6">
          {/* Language Preference */}
          <Card>
            <CardTitle className="flex items-center gap-2 mb-6">
              <Globe className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              {tLocale('switchLanguage')}
            </CardTitle>
            <CardContent>
              <p className="text-sm mb-4" style={{ color: 'var(--on-surface-variant, #43483f)' }}>
                {t('languageDescription')}
              </p>
              <div className="grid grid-cols-2 gap-4">
                {(['en', 'fr'] as const).map((loc) => (
                  <button
                    key={loc}
                    onClick={() => handleLocaleChange(loc)}
                    disabled={localeSaving}
                    className="p-4 rounded-xl border text-center transition-all cursor-pointer"
                    style={selectedLocale === loc
                      ? { borderColor: 'var(--primary)', background: 'var(--primary)', color: '#ffffff', boxShadow: '0 4px 12px rgba(35,66,42,0.25)' }
                      : { borderColor: 'var(--outline-variant)', background: 'var(--surface-container-lowest, #ffffff)', color: 'var(--on-surface)' }}
                  >
                    <span className="text-2xl block mb-1">{loc === 'en' ? '\uD83C\uDDEC\uD83C\uDDE7' : '\uD83C\uDDEB\uD83C\uDDF7'}</span>
                    <span className="font-medium block">{tLocale(loc)}</span>
                    {selectedLocale === loc && localeSaved && (
                      <span className="text-xs flex items-center justify-center gap-1 mt-1" style={{ color: '#a8d5b5' }}>
                        <Check className="w-3 h-3" /> {t('saved')}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Garden Dimensions */}
          <Card>
            <CardTitle className="flex items-center gap-2 mb-6">
              <Ruler className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              {t('gardenDimensions')}
            </CardTitle>
            <CardContent>
              <p className="text-sm mb-4" style={{ color: 'var(--on-surface-variant, #43483f)' }}>
                {t('gardenDimensionsDescription')}
              </p>

              {/* Presets */}
              <div className="mb-4">
                <p className="text-xs mb-2" style={{ color: 'var(--on-surface-variant, #43483f)' }}>{t('quickPresets')}:</p>
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
                        className="p-2 rounded-xl border text-center transition-all cursor-pointer"
                        style={isActive
                          ? { borderColor: 'var(--primary)', background: 'var(--surface-container)', color: 'var(--on-surface)' }
                          : { borderColor: 'var(--outline-variant)', background: 'var(--surface-container-lowest, #ffffff)', color: 'var(--on-surface)' }}
                      >
                        <span className="text-lg block">{preset.emoji}</span>
                        <span className="text-xs block">{preset.label}</span>
                        <span className="text-[10px]" style={{ color: 'var(--on-surface-variant, #43483f)' }}>{preset.length}m x {preset.width}m</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom dimensions */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Input
                  id="garden-length"
                  label={t('length')}
                  type="number"
                  min="0.5"
                  max="50"
                  step="0.5"
                  value={gardenLength}
                  onChange={(e) => setGardenLength(e.target.value)}
                />
                <Input
                  id="garden-width"
                  label={t('width')}
                  type="number"
                  min="0.5"
                  max="50"
                  step="0.5"
                  value={gardenWidth}
                  onChange={(e) => setGardenWidth(e.target.value)}
                />
              </div>

              {parseFloat(gardenLength) > 0 && parseFloat(gardenWidth) > 0 && (
                <p className="text-xs mb-3" style={{ color: 'var(--on-surface-variant, #43483f)' }}>
                  {t('totalArea')}: <span className="font-bold" style={{ color: 'var(--on-surface)' }}>{(parseFloat(gardenLength) * parseFloat(gardenWidth)).toFixed(1)} m&sup2;</span>
                  {' '} - ~{Math.floor(parseFloat(gardenLength) * parseFloat(gardenWidth) * 4)} {t('plantsCapacity')}
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
                    {t('dimensionsSaved')}
                  </>
                ) : (
                  <>
                    <Ruler className="w-4 h-4" />
                    {t('updateGardenSize')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Current Plan */}
          <Card>
            <CardTitle className="flex items-center gap-2 mb-6">
              <CreditCard className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              {t('currentPlan')}
            </CardTitle>
            <CardContent>
              <div className="p-6 rounded-xl border" style={isPro
                ? { borderColor: 'rgba(180,130,40,0.4)', background: 'rgba(180,130,40,0.06)' }
                : { borderColor: 'var(--outline-variant)', background: 'var(--surface-container-lowest, #ffffff)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {isPro ? (
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(180,130,40,0.15)' }}>
                        <Crown className="w-5 h-5" style={{ color: '#b4841f' }} />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface-container)' }}>
                        <Zap className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold" style={{ color: 'var(--on-surface)' }}>
                        {isPro ? t('proPlan') : t('freePlan')}
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--on-surface-variant, #43483f)' }}>
                        {isPro ? '9.99 EUR/' + t('month') : t('freeForever')}
                      </p>
                    </div>
                  </div>
                  {isPro && (
                    <span className="px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1" style={{ background: 'rgba(180,130,40,0.15)', color: 'var(--on-surface)' }}>
                      <Sparkles className="w-3 h-3" />
                      {t('active')}
                    </span>
                  )}
                </div>

                {!isPro && (
                  <Button
                    onClick={handleUpgrade}
                    disabled={upgrading}
                    className="w-full gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    {upgrading ? t('redirecting') : t('upgradeToPro')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardTitle className="flex items-center gap-2 mb-6">
              <User className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              {t('account')}
            </CardTitle>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ background: 'var(--surface-container-lowest, #ffffff)', borderColor: 'var(--outline-variant)' }}>
                  <User className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                  <div>
                    <p className="text-xs" style={{ color: 'var(--on-surface-variant, #43483f)' }}>{t('name')}</p>
                    <p className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>{session?.user?.name || t('notSignedIn')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ background: 'var(--surface-container-lowest, #ffffff)', borderColor: 'var(--outline-variant)' }}>
                  <Mail className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                  <div>
                    <p className="text-xs" style={{ color: 'var(--on-surface-variant, #43483f)' }}>{t('email')}</p>
                    <p className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>{session?.user?.email || t('notSignedIn')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ background: 'var(--surface-container-lowest, #ffffff)', borderColor: 'var(--outline-variant)' }}>
                  <Shield className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                  <div>
                    <p className="text-xs" style={{ color: 'var(--on-surface-variant, #43483f)' }}>{t('plan')}</p>
                    <p className="text-sm font-medium capitalize" style={{ color: 'var(--on-surface)' }}>{userPlan}</p>
                  </div>
                </div>
              </div>

              {session && (
                <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--outline-variant)' }}>
                  <Button
                    variant="ghost"
                    className="w-full gap-2 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    onClick={() => signOut({ callbackUrl: '/' })}
                  >
                    <LogOut className="w-4 h-4" />
                    {t('signOut')}
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
