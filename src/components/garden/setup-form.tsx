'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGarden } from '@/lib/hooks';
import {
  SOIL_LABELS,
  CLIMATE_LABELS,
  SUN_LABELS,
  type SoilType,
  type ClimateZone,
  type SunExposure,
} from '@/types';
import { ArrowLeft, ArrowRight, Check, Ruler, Mountain, Cloud, Sun, Sprout, Trophy, Star, MapPin, Locate, Search } from 'lucide-react';

const stepConfigs = [
  { id: 'welcome', icon: Sprout, titleKey: 'welcome.title', descKey: 'welcome.description', questKey: 'welcome.quest' },
  { id: 'dimensions', icon: Ruler, titleKey: 'dimensions.title', descKey: 'dimensions.description', questKey: 'dimensions.quest' },
  { id: 'location', icon: MapPin, titleKey: 'location.title', descKey: 'location.description', questKey: 'location.quest' },
  { id: 'soil', icon: Mountain, titleKey: 'soil.title', descKey: 'soil.description', questKey: 'soil.quest' },
  { id: 'climate', icon: Cloud, titleKey: 'climate.title', descKey: 'climate.description', questKey: 'climate.quest' },
  { id: 'sun', icon: Sun, titleKey: 'sun.title', descKey: 'sun.description', questKey: 'sun.quest' },
];

const SOIL_KEYS = ['clay', 'sandy', 'loamy', 'silty', 'peaty', 'chalky'] as const;

const SOIL_EMOJIS: Record<string, string> = {
  clay: '\u{1F9F1}',
  sandy: '\u{1F3D6}',
  loamy: '\u{2B50}',
  silty: '\u{1F30A}',
  peaty: '\u{1F333}',
  chalky: '\u{26F0}',
};

const CLIMATE_KEYS = ['tropical', 'subtropical', 'mediterranean', 'temperate', 'continental', 'subarctic'] as const;

const CLIMATE_EMOJIS: Record<string, string> = {
  tropical: '\u{1F334}',
  subtropical: '\u{1F33A}',
  mediterranean: '\u{1F33B}',
  temperate: '\u{1F343}',
  continental: '\u{2744}\u{FE0F}',
  subarctic: '\u{1F9CA}',
};

const SUN_KEY_MAP: Record<string, string> = {
  'full-sun': 'fullSun',
  'partial-shade': 'partialShade',
  'full-shade': 'fullShade',
};

const SUN_EMOJIS: Record<string, string> = {
  'full-sun': '\u{2600}\u{FE0F}',
  'partial-shade': '\u{26C5}',
  'full-shade': '\u{1F327}\u{FE0F}',
};

const GARDEN_SIZE_PRESETS = [
  { labelKey: 'windowBox', length: 1, width: 0.5, emoji: '\u{1FA9F}' },
  { labelKey: 'balcony', length: 2, width: 1, emoji: '\u{1F3E0}' },
  { labelKey: 'smallPlot', length: 3, width: 2, emoji: '\u{1F331}' },
  { labelKey: 'mediumGarden', length: 5, width: 3, emoji: '\u{1F333}' },
  { labelKey: 'largeGarden', length: 8, width: 5, emoji: '\u{1F3E1}' },
  { labelKey: 'farmPlot', length: 12, width: 8, emoji: '\u{1F33E}' },
];

export function SetupForm() {
  const [step, setStep] = useState(0);
  const { config, updateConfig } = useGarden();
  const router = useRouter();
  const t = useTranslations('setup');

  const steps = stepConfigs.map((s) => ({
    ...s,
    title: t(s.titleKey),
    description: t(s.descKey),
    quest: t(s.questKey),
  }));
  const [xp, setXp] = useState(0);
  const [showXpGain, setShowXpGain] = useState(false);
  const [xpGainAmount, setXpGainAmount] = useState(0);

  const [length, setLength] = useState(config.length.toString());
  const [width, setWidth] = useState(config.width.toString());
  const [locationCity, setLocationCity] = useState(config.city || '');
  const [locationLat, setLocationLat] = useState(config.latitude?.toString() || '');
  const [locationLng, setLocationLng] = useState(config.longitude?.toString() || '');
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [citySearching, setCitySearching] = useState(false);

  const detectLocation = async () => {
    setGeoLoading(true);
    setGeoError('');
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setLocationLat(lat.toFixed(4));
      setLocationLng(lng.toFixed(4));
      updateConfig({ latitude: lat, longitude: lng });

      // Reverse geocode to get city name using Open-Meteo geocoding
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
          { headers: { 'User-Agent': 'GardenSaas/1.0' } }
        );
        if (res.ok) {
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || data.display_name?.split(',')[0] || '';
          if (city) {
            setLocationCity(city);
            updateConfig({ latitude: lat, longitude: lng, city });
          }
        }
      } catch {
        // Reverse geocoding failure is non-critical
      }

      gainXp(30);
    } catch {
      setGeoError(t('location.geoError'));
    } finally {
      setGeoLoading(false);
    }
  };

  const searchCity = async () => {
    if (!locationCity.trim()) return;
    setCitySearching(true);
    setGeoError('');
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationCity.trim())}&count=1&language=en&format=json`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const result = data.results[0];
          setLocationLat(result.latitude.toFixed(4));
          setLocationLng(result.longitude.toFixed(4));
          setLocationCity(result.name + (result.country ? `, ${result.country}` : ''));
          updateConfig({
            latitude: result.latitude,
            longitude: result.longitude,
            city: result.name,
          });
          gainXp(25);
        } else {
          setGeoError(t('location.cityNotFound'));
        }
      }
    } catch {
      setGeoError(t('location.searchFailed'));
    } finally {
      setCitySearching(false);
    }
  };

  const gainXp = (amount: number) => {
    setXpGainAmount(amount);
    setShowXpGain(true);
    setTimeout(() => {
      setXp((prev) => prev + amount);
      setShowXpGain(false);
    }, 800);
  };

  const canProceed = () => {
    if (step === 0) return true; // welcome
    if (step === 1) return parseFloat(length) > 0 && parseFloat(width) > 0;
    return true;
  };

  const handleNext = () => {
    if (step === 1) {
      updateConfig({ length: parseFloat(length), width: parseFloat(width) });
      gainXp(25);
    } else if (step === 2) {
      // Location step - XP already given via detect/search
      if (!locationLat && !locationLng) {
        // Skip is fine, location is optional
      }
    } else if (step === 3) {
      gainXp(20);
    } else if (step === 4) {
      gainXp(20);
    } else if (step === 5) {
      gainXp(35);
    }

    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      router.push('/garden/dashboard');
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const selectPreset = (preset: typeof GARDEN_SIZE_PRESETS[0]) => {
    setLength(preset.length.toString());
    setWidth(preset.width.toString());
    updateConfig({ length: preset.length, width: preset.width });
  };

  const soilOptions = SOIL_KEYS.map((key) => ({ value: key, label: t(`soil.${key}`), desc: t(`soil.${key}Desc`) }));
  const climateOptions = CLIMATE_KEYS.map((key) => ({ value: key, label: t(`climate.${key}`), desc: t(`climate.${key}Desc`) }));
  const sunOptions = Object.entries(SUN_KEY_MAP).map(([value, key]) => ({ value, label: t(`sun.${key}`), desc: t(`sun.${key}Desc`) }));

  return (
    <div className="min-h-screen bg-[#0D1F17] flex flex-col items-center justify-center px-6 py-12">
      {/* XP Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg mb-6"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-bold text-yellow-400">{xp} XP</span>
          </div>
          <span className="text-xs text-green-500/50">{t('level', { level: Math.floor(xp / 100) + 1 })}</span>
        </div>
        <div className="w-full h-3 rounded-full bg-[#1A2F23] border border-green-800/30 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-amber-400"
            animate={{ width: `${Math.min((xp % 100), 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        {/* XP gain popup */}
        <AnimatePresence>
          {showXpGain && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center mt-2"
            >
              <span className="text-yellow-400 font-bold text-lg">+{xpGainAmount} XP!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Quest banner */}
      <motion.div
        key={`quest-${step}`}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full max-w-lg mb-4"
      >
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-amber-900/20 border border-amber-700/30">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-amber-300 text-sm font-medium">{steps[step].quest}</span>
        </div>
      </motion.div>

      {/* Progress steps */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <motion.div
                animate={i === step ? { scale: [1, 1.1, 1] } : {}}
                transition={i === step ? { duration: 1.5, repeat: Infinity } : {}}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  i < step
                    ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                    : i === step
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white ring-4 ring-green-600/30 shadow-lg shadow-green-600/30'
                    : 'bg-[#1A2F23] text-green-600 border border-green-800/50'
                }`}
              >
                {i < step ? <Check className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
              </motion.div>
              {i < steps.length - 1 && (
                <div
                  className={`hidden sm:block w-10 lg:w-16 h-0.5 mx-1 transition-colors duration-300 ${
                    i < step ? 'bg-green-600' : 'bg-green-900/50'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35 }}
          >
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-600/30 to-emerald-600/20 border border-green-600/30 mb-4"
              >
                {(() => {
                  const Icon = steps[step].icon;
                  return <Icon className="w-8 h-8 text-green-400" />;
                })()}
              </motion.div>
              <h2 className="text-2xl md:text-3xl font-bold text-green-50 mb-2">
                {steps[step].title}
              </h2>
              <p className="text-green-200/60">{steps[step].description}</p>
            </div>

            <div className="bg-[#142A1E] rounded-2xl border border-green-900/40 p-8">
              {/* Welcome step */}
              {step === 0 && (
                <div className="text-center space-y-6">
                  {/* Gardener character SVG */}
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="flex justify-center"
                  >
                    <svg width="100" height="130" viewBox="0 0 120 160" className="drop-shadow-lg">
                      <ellipse cx="60" cy="155" rx="30" ry="5" fill="rgba(0,0,0,0.15)" />
                      <rect x="36" y="132" width="16" height="12" rx="3" fill="#5C3D1E" />
                      <rect x="68" y="132" width="16" height="12" rx="3" fill="#5C3D1E" />
                      <rect x="40" y="115" width="12" height="20" rx="4" fill="#5B8C5A" />
                      <rect x="68" y="115" width="12" height="20" rx="4" fill="#5B8C5A" />
                      <rect x="33" y="72" width="54" height="48" rx="8" fill="#4ADE80" />
                      <rect x="40" y="62" width="8" height="18" rx="3" fill="#2D9B52" />
                      <rect x="72" y="62" width="8" height="18" rx="3" fill="#2D9B52" />
                      <rect x="48" y="92" width="24" height="14" rx="4" fill="#2D9B52" />
                      <circle cx="42" cy="76" r="3" fill="#FFD700" />
                      <circle cx="78" cy="76" r="3" fill="#FFD700" />
                      <rect x="18" y="72" width="16" height="35" rx="6" fill="#4ADE80" />
                      <circle cx="26" cy="110" r="7" fill="#FFD5B8" />
                      <rect x="86" y="72" width="16" height="35" rx="6" fill="#4ADE80" />
                      <circle cx="94" cy="110" r="7" fill="#FFD5B8" />
                      <circle cx="60" cy="45" r="24" fill="#FFD5B8" />
                      <ellipse cx="60" cy="32" rx="20" ry="10" fill="#8B5E3C" />
                      <circle cx="52" cy="44" r="3.5" fill="#1a1a1a" />
                      <circle cx="68" cy="44" r="3.5" fill="#1a1a1a" />
                      <circle cx="53.5" cy="42.5" r="1.2" fill="#fff" />
                      <circle cx="69.5" cy="42.5" r="1.2" fill="#fff" />
                      <circle cx="44" cy="50" r="4" fill="#FCA5A5" opacity="0.5" />
                      <circle cx="76" cy="50" r="4" fill="#FCA5A5" opacity="0.5" />
                      <path d="M 53 53 Q 60 60 67 53" stroke="#E11D48" strokeWidth="2" fill="none" strokeLinecap="round" />
                      <circle cx="60" cy="48" r="1.5" fill="#F0C0A0" />
                      <ellipse cx="60" cy="28" rx="30" ry="6" fill="#A0724A" />
                      <rect x="44" y="10" width="32" height="18" rx="6" fill="#A0724A" />
                      <rect x="44" y="22" width="32" height="6" rx="2" fill="#DC2626" />
                      <circle cx="78" cy="18" r="5" fill="#FFB7D5" />
                      <circle cx="78" cy="18" r="2.5" fill="#FFEB3B" />
                    </svg>
                  </motion.div>

                  <div className="bg-white rounded-2xl px-5 py-4 text-[#1a1a1a] text-sm max-w-xs mx-auto border-3 border-green-400 shadow-lg relative"
                    style={{ fontFamily: '"Nunito", "Comic Sans MS", cursive, sans-serif' }}
                  >
                    <div className="text-green-600 font-bold text-xs mb-1">Sprout</div>
                    {t('welcome.sproutIntro')}
                  </div>

                  <div className="flex flex-wrap justify-center gap-3 mt-4">
                    {[
                      { icon: '\u{1F3AE}', textKey: 'welcome.earnXp' },
                      { icon: '\u{1F3C6}', textKey: 'welcome.getBadges' },
                      { icon: '\u{1F331}', textKey: 'welcome.growPlants' },
                      { icon: '\u{1F4AC}', textKey: 'welcome.getTips' },
                    ].map((item) => (
                      <span key={item.textKey} className="px-3 py-1.5 rounded-full bg-green-900/30 border border-green-800/30 text-xs text-green-300">
                        <span className="mr-1">{item.icon}</span> {t(item.textKey)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Garden size step */}
              {step === 1 && (
                <div className="space-y-6">
                  {/* Presets grid */}
                  <div>
                    <p className="text-sm text-green-300/60 mb-3">{t('dimensions.quickSelect')}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {GARDEN_SIZE_PRESETS.map((preset) => {
                        const isSelected = length === preset.length.toString() && width === preset.width.toString();
                        return (
                          <motion.button
                            key={preset.labelKey}
                            type="button"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => selectPreset(preset)}
                            className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                              isSelected
                                ? 'border-green-500 bg-green-900/30 text-green-50 shadow-lg shadow-green-900/20'
                                : 'border-green-900/40 bg-[#0D1F17] text-green-300/70 hover:border-green-700/50'
                            }`}
                          >
                            <span className="text-2xl block mb-1">{preset.emoji}</span>
                            <span className="font-medium text-sm block">{t(`dimensions.${preset.labelKey}`)}</span>
                            <span className="text-xs text-green-500/50">{preset.length}m x {preset.width}m</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t border-green-800/30 pt-4">
                    <p className="text-sm text-green-300/60 mb-3">{t('dimensions.customSize')}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        id="length"
                        label={t('dimensions.length')}
                        type="number"
                        min="0.5"
                        max="50"
                        step="0.5"
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                        placeholder="e.g. 4"
                      />
                      <Input
                        id="width"
                        label={t('dimensions.width')}
                        type="number"
                        min="0.5"
                        max="50"
                        step="0.5"
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                        placeholder="e.g. 3"
                      />
                    </div>
                  </div>

                  {parseFloat(length) > 0 && parseFloat(width) > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center p-3 rounded-xl bg-green-900/20 border border-green-800/30"
                    >
                      <span className="text-green-300/70 text-sm">
                        {t('dimensions.totalArea')} <span className="text-green-200 font-bold">{(parseFloat(length) * parseFloat(width)).toFixed(1)} m&sup2;</span>
                      </span>
                      <span className="text-green-500/50 text-xs block mt-1">
                        {t('dimensions.roomForPlants', { count: Math.floor(parseFloat(length) * parseFloat(width) * 4) })}
                      </span>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Location step */}
              {step === 2 && (
                <div className="space-y-5">
                  {/* GPS detect button */}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={detectLocation}
                    disabled={geoLoading}
                    className="w-full p-5 rounded-xl border border-green-700/50 bg-gradient-to-br from-green-900/40 to-emerald-900/20 text-left transition-all cursor-pointer hover:border-green-500/60 disabled:opacity-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-green-600/20 flex items-center justify-center">
                        {geoLoading ? (
                          <Sprout className="w-6 h-6 text-green-400 animate-spin" />
                        ) : (
                          <Locate className="w-6 h-6 text-green-400" />
                        )}
                      </div>
                      <div>
                        <span className="font-medium text-green-50 block text-lg">
                          {geoLoading ? t('location.detecting') : t('location.useMyLocation')}
                        </span>
                        <span className="text-xs text-green-500/50 block mt-0.5">
                          {t('location.autoDetect')}
                        </span>
                      </div>
                    </div>
                  </motion.button>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-green-800/30" />
                    <span className="text-xs text-green-500/40">{t('location.or')}</span>
                    <div className="flex-1 h-px bg-green-800/30" />
                  </div>

                  {/* City search */}
                  <div>
                    <label className="text-sm text-green-300/60 block mb-2">{t('location.searchByCity')}</label>
                    <div className="flex gap-2">
                      <Input
                        id="city"
                        type="text"
                        value={locationCity}
                        onChange={(e) => setLocationCity(e.target.value)}
                        placeholder={t('location.cityPlaceholder')}
                        onKeyDown={(e) => e.key === 'Enter' && searchCity()}
                      />
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={searchCity}
                        disabled={citySearching || !locationCity.trim()}
                        className="px-4 rounded-xl bg-green-600/20 border border-green-700/40 text-green-300 hover:bg-green-600/30 transition-all disabled:opacity-40 cursor-pointer"
                      >
                        {citySearching ? (
                          <Sprout className="w-4 h-4 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                      </motion.button>
                    </div>
                  </div>

                  {/* Manual coordinates */}
                  <div>
                    <label className="text-sm text-green-300/60 block mb-2">{t('location.manualCoords')}</label>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        id="latitude"
                        label={t('location.latitude')}
                        type="number"
                        step="0.0001"
                        min="-90"
                        max="90"
                        value={locationLat}
                        onChange={(e) => {
                          setLocationLat(e.target.value);
                          const lat = parseFloat(e.target.value);
                          const lng = parseFloat(locationLng);
                          if (!isNaN(lat) && !isNaN(lng)) {
                            updateConfig({ latitude: lat, longitude: lng });
                          }
                        }}
                        placeholder="48.8566"
                      />
                      <Input
                        id="longitude"
                        label={t('location.longitude')}
                        type="number"
                        step="0.0001"
                        min="-180"
                        max="180"
                        value={locationLng}
                        onChange={(e) => {
                          setLocationLng(e.target.value);
                          const lat = parseFloat(locationLat);
                          const lng = parseFloat(e.target.value);
                          if (!isNaN(lat) && !isNaN(lng)) {
                            updateConfig({ latitude: lat, longitude: lng });
                          }
                        }}
                        placeholder="2.3522"
                      />
                    </div>
                  </div>

                  {geoError && (
                    <p className="text-xs text-red-400/80 text-center">{geoError}</p>
                  )}

                  {locationLat && locationLng && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center p-3 rounded-xl bg-green-900/20 border border-green-800/30"
                    >
                      <MapPin className="w-4 h-4 text-green-400 inline mr-1" />
                      <span className="text-green-300/70 text-sm">
                        {locationCity ? (
                          <>{locationCity} ({locationLat}, {locationLng})</>
                        ) : (
                          <>{t('location.locationSet')} {locationLat}, {locationLng}</>
                        )}
                      </span>
                    </motion.div>
                  )}

                  {!locationLat && !locationLng && (
                    <p className="text-xs text-green-500/40 text-center">
                      {t('location.locationOptional')}
                    </p>
                  )}
                </div>
              )}

              {/* Soil step */}
              {step === 3 && (
                <div className="grid grid-cols-2 gap-3">
                  {soilOptions.map((opt) => (
                    <motion.button
                      key={opt.value}
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => updateConfig({ soilType: opt.value as SoilType })}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        config.soilType === opt.value
                          ? 'border-green-500 bg-green-900/30 text-green-50 shadow-lg shadow-green-900/20'
                          : 'border-green-900/40 bg-[#0D1F17] text-green-300/70 hover:border-green-700/50'
                      }`}
                    >
                      <span className="text-2xl block mb-1">{SOIL_EMOJIS[opt.value]}</span>
                      <span className="font-medium block">{opt.label}</span>
                      <span className="text-xs text-green-500/50 block mt-1">{opt.desc}</span>
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Climate step */}
              {step === 4 && (
                <div className="grid grid-cols-2 gap-3">
                  {climateOptions.map((opt) => (
                    <motion.button
                      key={opt.value}
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => updateConfig({ climateZone: opt.value as ClimateZone })}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        config.climateZone === opt.value
                          ? 'border-green-500 bg-green-900/30 text-green-50 shadow-lg shadow-green-900/20'
                          : 'border-green-900/40 bg-[#0D1F17] text-green-300/70 hover:border-green-700/50'
                      }`}
                    >
                      <span className="text-2xl block mb-1">{CLIMATE_EMOJIS[opt.value]}</span>
                      <span className="font-medium block">{opt.label}</span>
                      <span className="text-xs text-green-500/50 block mt-1">{opt.desc}</span>
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Sun step */}
              {step === 5 && (
                <div className="space-y-3">
                  {sunOptions.map((opt) => (
                    <motion.button
                      key={opt.value}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => updateConfig({ sunExposure: opt.value as SunExposure })}
                      className={`w-full p-5 rounded-xl border text-left transition-all cursor-pointer ${
                        config.sunExposure === opt.value
                          ? 'border-green-500 bg-green-900/30 text-green-50 shadow-lg shadow-green-900/20'
                          : 'border-green-900/40 bg-[#0D1F17] text-green-300/70 hover:border-green-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{SUN_EMOJIS[opt.value]}</span>
                        <div>
                          <span className="font-medium block text-lg">{opt.label}</span>
                          <span className="text-xs text-green-500/50 block mt-1">{opt.desc}</span>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={step === 0}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('back')}
          </Button>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="gap-2 bg-gradient-to-r from-green-600 to-emerald-500 px-8"
            >
              {step === steps.length - 1 ? (
                <>
                  <Trophy className="w-4 h-4" />
                  {t('completeQuest')}
                </>
              ) : step === 0 ? (
                <>
                  {t('beginAdventure')}
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  {t('nextQuest')}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
