'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
import { ArrowLeft, ArrowRight, Check, Ruler, Mountain, Cloud, Sun, Sprout, Trophy, Star, MapPin, Locate, Search, Plus, Trash2, Layers, Leaf, AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import type { GardenZone, RaisedBed, ZoneType } from '@/types';
import { ZONE_COLORS, ZONE_TYPE_LABELS } from '@/types';
import { useLocale } from 'next-intl';
import { getGardenPlantingPlan } from '@/lib/smart-planting';
import type { ZonePlantingPlan, PlantingSuggestionResult } from '@/lib/smart-planting';

// ===== Constants =====

const SOIL_KEYS = ['clay', 'sandy', 'loamy', 'silty', 'peaty', 'chalky'] as const;

const SOIL_EMOJIS: Record<string, string> = {
  clay: '\u{1F9F1}', sandy: '\u{1F3D6}', loamy: '\u{2B50}',
  silty: '\u{1F30A}', peaty: '\u{1F333}', chalky: '\u{26F0}',
};

const CLIMATE_KEYS = ['tropical', 'subtropical', 'mediterranean', 'temperate', 'continental', 'subarctic'] as const;

const CLIMATE_EMOJIS: Record<string, string> = {
  tropical: '\u{1F334}', subtropical: '\u{1F33A}', mediterranean: '\u{1F33B}',
  temperate: '\u{1F343}', continental: '\u{2744}\u{FE0F}', subarctic: '\u{1F9CA}',
};

const SUN_KEY_MAP: Record<string, string> = {
  'full-sun': 'fullSun', 'partial-shade': 'partialShade', 'full-shade': 'fullShade',
};

const SUN_EMOJIS: Record<string, string> = {
  'full-sun': '\u{2600}\u{FE0F}', 'partial-shade': '\u{26C5}', 'full-shade': '\u{1F327}\u{FE0F}',
};

const GARDEN_SIZE_PRESETS = [
  { labelKey: 'windowBox', length: 1, width: 0.5, emoji: '\u{1FA9F}' },
  { labelKey: 'balcony', length: 2, width: 1, emoji: '\u{1F3E0}' },
  { labelKey: 'smallPlot', length: 3, width: 2, emoji: '\u{1F331}' },
  { labelKey: 'mediumGarden', length: 5, width: 3, emoji: '\u{1F333}' },
  { labelKey: 'largeGarden', length: 8, width: 5, emoji: '\u{1F3E1}' },
  { labelKey: 'farmPlot', length: 12, width: 8, emoji: '\u{1F33E}' },
];

const SUGGESTION_PLANTS = [
  { id: 'lettuce', nameEn: 'Lettuce', nameFr: 'Laitue', spacingCm: 25 },
  { id: 'tomato', nameEn: 'Tomato', nameFr: 'Tomate', spacingCm: 60 },
  { id: 'radish', nameEn: 'Radish', nameFr: 'Radis', spacingCm: 5 },
  { id: 'carrot', nameEn: 'Carrot', nameFr: 'Carotte', spacingCm: 8 },
  { id: 'basil', nameEn: 'Basil', nameFr: 'Basilic', spacingCm: 25 },
  { id: 'zucchini', nameEn: 'Zucchini', nameFr: 'Courgette', spacingCm: 80 },
];

function getPlantingSuggestions(areaM2: number): Array<{ name: string; count: number }> {
  return SUGGESTION_PLANTS.map((p) => {
    const spacingM = p.spacingCm / 100;
    const count = Math.floor(areaM2 / (spacingM * spacingM));
    return { name: p.nameEn, count: Math.max(1, count) };
  }).filter((s) => s.count > 0);
}

const MONTH_NAMES_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTH_NAMES_FR = ['Janvier','Fevrier','Mars','Avril','Mai','Juin','Juillet','Aout','Septembre','Octobre','Novembre','Decembre'];

// ===== 3-Step Major Structure =====
// Major Step 1: Location (substeps: welcome, city input)
// Major Step 2: Garden Setup (substeps: dimensions, soil, climate, sun, zones)
// Major Step 3: Review & Plant (substeps: review, suggestions per zone)

const MAJOR_STEPS = [
  { id: 'location', icon: MapPin, labelKey: 'stepLabel1' },
  { id: 'zones', icon: Layers, labelKey: 'stepLabel2' },
  { id: 'suggestions', icon: Leaf, labelKey: 'stepLabel3' },
] as const;

// All sub-steps with their major step parent
const ALL_SUBSTEPS = [
  { id: 'welcome', majorStep: 0, icon: Sprout, titleKey: 'welcome.title', descKey: 'welcome.description', tipKey: 'location' },
  { id: 'location', majorStep: 0, icon: MapPin, titleKey: 'location.title', descKey: 'location.description', tipKey: 'location' },
  { id: 'dimensions', majorStep: 1, icon: Ruler, titleKey: 'dimensions.title', descKey: 'dimensions.description', tipKey: 'dimensions' },
  { id: 'soil', majorStep: 1, icon: Mountain, titleKey: 'soil.title', descKey: 'soil.description', tipKey: 'soil' },
  { id: 'climate', majorStep: 1, icon: Cloud, titleKey: 'climate.title', descKey: 'climate.description', tipKey: 'climate' },
  { id: 'sun', majorStep: 1, icon: Sun, titleKey: 'sun.title', descKey: 'sun.description', tipKey: 'sun' },
  { id: 'zones', majorStep: 1, icon: Layers, titleKey: 'zones.title', descKey: 'zones.description', tipKey: 'zones' },
  { id: 'review', majorStep: 2, icon: Search, titleKey: 'review.title', descKey: 'review.description', tipKey: 'review' },
  { id: 'suggestions', majorStep: 2, icon: Leaf, titleKey: 'suggestions.title', descKey: 'suggestions.description', tipKey: 'suggestions' },
];

// ===== City autocomplete result type =====
interface CityResult {
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

// ===== Gardener Character SVG =====
function GardenerCharacter({ size = 100 }: { size?: number }) {
  const scale = size / 120;
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 120 160" className="drop-shadow-lg">
      <g transform={`scale(${scale > 1 ? 1 : 1})`}>
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
      </g>
    </svg>
  );
}

// ===== Sprout Tip Bubble =====
function SproutTipBubble({ tip, compact = false }: { tip: string; compact?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className={`flex items-start gap-3 ${compact ? 'mb-4' : 'mb-6'}`}
    >
      <div className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 border-2 border-green-400 flex items-center justify-center shadow-lg shadow-green-900/30">
        <svg width="24" height="28" viewBox="0 0 120 140" className="drop-shadow">
          <circle cx="60" cy="50" r="28" fill="#FFD5B8" />
          <ellipse cx="60" cy="35" rx="22" ry="12" fill="#8B5E3C" />
          <circle cx="50" cy="48" r="4" fill="#1a1a1a" />
          <circle cx="70" cy="48" r="4" fill="#1a1a1a" />
          <circle cx="52" cy="46" r="1.5" fill="#fff" />
          <circle cx="72" cy="46" r="1.5" fill="#fff" />
          <circle cx="42" cy="55" r="5" fill="#FCA5A5" opacity="0.5" />
          <circle cx="78" cy="55" r="5" fill="#FCA5A5" opacity="0.5" />
          <path d="M 52 58 Q 60 66 68 58" stroke="#E11D48" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <ellipse cx="60" cy="30" rx="32" ry="7" fill="#A0724A" />
          <rect x="42" y="12" width="36" height="18" rx="6" fill="#A0724A" />
          <rect x="42" y="24" width="36" height="6" rx="2" fill="#DC2626" />
          <circle cx="80" cy="20" r="6" fill="#FFB7D5" />
          <circle cx="80" cy="20" r="3" fill="#FFEB3B" />
          <rect x="42" y="78" width="36" height="30" rx="8" fill="#4ADE80" />
          <rect x="49" y="70" width="6" height="14" rx="2" fill="#2D9B52" />
          <rect x="65" y="70" width="6" height="14" rx="2" fill="#2D9B52" />
        </svg>
      </div>
      <div className="flex-1 bg-white rounded-2xl px-4 py-3 text-[#1a1a1a] text-sm border-2 border-green-400 shadow-lg relative"
        style={{ fontFamily: '"Nunito", "Comic Sans MS", cursive, sans-serif', lineHeight: 1.5 }}
      >
        <div className="text-green-600 font-bold text-xs mb-1">Sprout</div>
        {tip}
        <div className="absolute -left-2.5 top-4 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-green-400" />
      </div>
    </motion.div>
  );
}

// ===== Main Progress Bar Component =====
function OnboardingProgressBar({ currentMajorStep, totalSteps, subStepProgress, t }: {
  currentMajorStep: number;
  totalSteps: number;
  subStepProgress: number; // 0-1 progress within the current major step
  t: ReturnType<typeof useTranslations<'setup'>>;
}) {
  const overallProgress = ((currentMajorStep + subStepProgress) / totalSteps) * 100;

  return (
    <div className="w-full max-w-lg mb-6">
      {/* Step X of Y label */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-green-300">
          {t('progressBar.step', { current: currentMajorStep + 1, total: totalSteps })}
        </span>
        <span className="text-xs text-green-500/50">
          {Math.round(overallProgress)}%
        </span>
      </div>

      {/* Main progress bar */}
      <div className="w-full h-2.5 rounded-full bg-[#1A2F23] border border-green-800/30 overflow-hidden mb-4">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
          animate={{ width: `${Math.min(overallProgress, 100)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* 3 Major step indicators */}
      <div className="flex items-center justify-between">
        {MAJOR_STEPS.map((step, i) => {
          const isComplete = i < currentMajorStep;
          const isCurrent = i === currentMajorStep;
          const Icon = step.icon;
          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <motion.div
                  animate={isCurrent ? { scale: [1, 1.08, 1] } : {}}
                  transition={isCurrent ? { duration: 2, repeat: Infinity } : {}}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isComplete
                      ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                      : isCurrent
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white ring-4 ring-green-600/30 shadow-lg'
                      : 'bg-[#1A2F23] text-green-600/40 border border-green-800/50'
                  }`}
                >
                  {isComplete ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </motion.div>
                <span className={`text-[10px] mt-1.5 font-medium ${
                  isCurrent ? 'text-green-300' : isComplete ? 'text-green-500' : 'text-green-700/50'
                }`}>
                  {t(`progressBar.${step.labelKey}`)}
                </span>
              </div>
              {i < MAJOR_STEPS.length - 1 && (
                <div className={`w-12 sm:w-20 lg:w-28 h-0.5 mx-2 transition-colors duration-300 ${
                  isComplete ? 'bg-green-600' : 'bg-green-900/30'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===== Main SetupForm =====
export function SetupForm() {
  const [step, setStep] = useState(0); // index into ALL_SUBSTEPS
  const { config, updateConfig, addZone, removeZone, addRaisedBed, removeRaisedBed, addPlant } = useGarden();
  const router = useRouter();
  const t = useTranslations('setup');
  const locale = useLocale();

  const currentSubStep = ALL_SUBSTEPS[step];
  const currentMajorStep = currentSubStep.majorStep;

  // Calculate sub-step progress within current major step
  const stepsInCurrentMajor = ALL_SUBSTEPS.filter(s => s.majorStep === currentMajorStep);
  const currentIndexInMajor = stepsInCurrentMajor.findIndex(s => s.id === currentSubStep.id);
  const subStepProgress = stepsInCurrentMajor.length > 1
    ? currentIndexInMajor / stepsInCurrentMajor.length
    : 0;

  // XP state
  const [xp, setXp] = useState(0);
  const [showXpGain, setShowXpGain] = useState(false);
  const [xpGainAmount, setXpGainAmount] = useState(0);

  // Form state
  const [length, setLength] = useState(config.length.toString());
  const [width, setWidth] = useState(config.width.toString());
  const [locationCity, setLocationCity] = useState(config.city || '');
  const [locationLat, setLocationLat] = useState(config.latitude?.toString() || '');
  const [locationLng, setLocationLng] = useState(config.longitude?.toString() || '');
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [citySearching, setCitySearching] = useState(false);

  // City autocomplete state
  const [citySuggestions, setCitySuggestions] = useState<CityResult[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const autocompleteTimerRef = useRef<NodeJS.Timeout | null>(null);

  const gainXp = (amount: number) => {
    setXpGainAmount(amount);
    setShowXpGain(true);
    setTimeout(() => {
      setXp((prev) => prev + amount);
      setShowXpGain(false);
    }, 800);
  };

  // City autocomplete handler
  const handleCityInputChange = useCallback((value: string) => {
    setLocationCity(value);
    setGeoError('');

    if (autocompleteTimerRef.current) {
      clearTimeout(autocompleteTimerRef.current);
    }

    if (value.trim().length < 2) {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
      return;
    }

    autocompleteTimerRef.current = setTimeout(async () => {
      try {
        setCitySearching(true);
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(value.trim())}&count=5&language=${locale}&format=json`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            setCitySuggestions(data.results.map((r: Record<string, unknown>) => ({
              name: r.name as string,
              country: r.country as string || '',
              admin1: r.admin1 as string || '',
              latitude: r.latitude as number,
              longitude: r.longitude as number,
            })));
            setShowCitySuggestions(true);
          } else {
            setCitySuggestions([]);
            setShowCitySuggestions(false);
          }
        }
      } catch {
        // silent fail on autocomplete
      } finally {
        setCitySearching(false);
      }
    }, 300);
  }, [locale]);

  // Auto-detect climate zone from latitude
  const detectClimateFromLat = useCallback((lat: number) => {
    const absLat = Math.abs(lat);
    let zone: ClimateZone = 'temperate';
    if (absLat < 10) zone = 'tropical';
    else if (absLat < 23.5) zone = 'subtropical';
    else if (absLat < 35) zone = 'mediterranean';
    else if (absLat < 50) zone = 'temperate';
    else if (absLat < 60) zone = 'continental';
    else zone = 'subarctic';
    updateConfig({ climateZone: zone });
  }, [updateConfig]);

  const selectCity = (city: CityResult) => {
    const displayName = city.admin1
      ? `${city.name}, ${city.admin1}, ${city.country}`
      : `${city.name}, ${city.country}`;
    setLocationCity(displayName);
    setLocationLat(city.latitude.toFixed(4));
    setLocationLng(city.longitude.toFixed(4));
    updateConfig({
      latitude: city.latitude,
      longitude: city.longitude,
      city: city.name,
    });
    detectClimateFromLat(city.latitude);
    setShowCitySuggestions(false);
    setCitySuggestions([]);
    gainXp(25);
  };

  const searchCity = async () => {
    if (!locationCity.trim()) return;
    setCitySearching(true);
    setGeoError('');
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationCity.trim())}&count=1&language=${locale}&format=json`
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
          detectClimateFromLat(result.latitude);
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
      detectClimateFromLat(lat);

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
        // non-critical
      }

      gainXp(30);
    } catch {
      setGeoError(t('location.geoError'));
    } finally {
      setGeoLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 0) return true; // welcome
    if (currentSubStep.id === 'dimensions') return parseFloat(length) > 0 && parseFloat(width) > 0;
    return true;
  };

  const handleNext = () => {
    const id = currentSubStep.id;
    if (id === 'location') {
      // XP already given via city search
    } else if (id === 'dimensions') {
      updateConfig({ length: parseFloat(length), width: parseFloat(width) });
      gainXp(25);
    } else if (id === 'soil') {
      gainXp(20);
    } else if (id === 'climate') {
      gainXp(20);
    } else if (id === 'sun') {
      gainXp(35);
    } else if (id === 'zones') {
      gainXp(40);
    } else if (id === 'review') {
      gainXp(15);
    } else if (id === 'suggestions') {
      gainXp(50);
    }

    if (step < ALL_SUBSTEPS.length - 1) {
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

  // Get the right sprout tip for the current step
  const getSproutTip = (): string => {
    if (currentSubStep.id === 'location' && locationLat && locationCity) {
      return t('sproutTips.locationDone');
    }
    if (currentSubStep.id === 'climate' && locationLat) {
      return t('sproutTips.climateAutoDetected');
    }
    if (currentSubStep.id === 'review') {
      return t('sproutTips.review');
    }
    return t(`sproutTips.${currentSubStep.tipKey}`);
  };

  return (
    <div className="min-h-screen bg-[#0D1F17] flex flex-col items-center justify-center px-6 py-12">
      {/* XP Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg mb-4"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-bold text-yellow-400">{xp} XP</span>
          </div>
          <span className="text-xs text-green-500/50">{t('level', { level: Math.floor(xp / 100) + 1 })}</span>
        </div>
        <div className="w-full h-2 rounded-full bg-[#1A2F23] border border-green-800/30 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-amber-400"
            animate={{ width: `${Math.min((xp % 100), 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <AnimatePresence>
          {showXpGain && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center mt-1"
            >
              <span className="text-yellow-400 font-bold text-lg">+{xpGainAmount} XP!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 3-Step Progress Bar - shown after welcome */}
      {step > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          <OnboardingProgressBar
            currentMajorStep={currentMajorStep}
            totalSteps={3}
            subStepProgress={subStepProgress}
            t={t}
          />
        </motion.div>
      )}

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
            {/* Step header */}
            {step > 0 && (
              <div className="text-center mb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                  className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-green-600/30 to-emerald-600/20 border border-green-600/30 mb-3"
                >
                  {(() => {
                    const Icon = ALL_SUBSTEPS[step].icon;
                    return <Icon className="w-7 h-7 text-green-400" />;
                  })()}
                </motion.div>
                <h2 className="text-2xl md:text-3xl font-bold text-green-50 mb-1">
                  {t(currentSubStep.titleKey)}
                </h2>
                <p className="text-green-200/60 text-sm">{t(currentSubStep.descKey)}</p>
              </div>
            )}

            {/* Sprout tip - shown on every step except welcome */}
            {step > 0 && (
              <SproutTipBubble tip={getSproutTip()} compact />
            )}

            <div className={step > 0 ? "bg-[#142A1E] rounded-2xl border border-green-900/40 p-6 sm:p-8" : ""}>
              {/* ===== Welcome Step (0) ===== */}
              {step === 0 && (
                <div className="text-center space-y-6">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="flex justify-center"
                  >
                    <GardenerCharacter size={100} />
                  </motion.div>

                  <div className="bg-white rounded-2xl px-5 py-4 text-[#1a1a1a] text-sm max-w-xs mx-auto border-3 border-green-400 shadow-lg relative"
                    style={{ fontFamily: '"Nunito", "Comic Sans MS", cursive, sans-serif' }}
                  >
                    <div className="text-green-600 font-bold text-xs mb-1">Sprout</div>
                    {t('welcome.sproutIntro')}
                  </div>

                  <div className="bg-[#142A1E] rounded-2xl border border-green-900/40 p-6">
                    <h2 className="text-xl font-bold text-green-50 mb-3">{t('welcome.title')}</h2>
                    <p className="text-green-200/60 text-sm mb-4">{t('welcome.description')}</p>

                    <div className="flex flex-wrap justify-center gap-3">
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

                    {/* 3 steps preview */}
                    <div className="mt-6 space-y-2">
                      {MAJOR_STEPS.map((ms, i) => {
                        const Icon = ms.icon;
                        return (
                          <div key={ms.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0D1F17] border border-green-900/30">
                            <div className="w-8 h-8 rounded-full bg-green-600/20 flex items-center justify-center text-green-400">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <span className="text-xs font-bold text-green-300">
                                {t('progressBar.step', { current: i + 1, total: 3 })}
                              </span>
                              <span className="text-xs text-green-500/50 ml-2">
                                {t(`progressBar.${ms.labelKey}`)}
                              </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-green-700/50" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ===== Location Step (1) ===== */}
              {currentSubStep.id === 'location' && (
                <div className="space-y-5">
                  {/* City search - PRIMARY input */}
                  <div className="relative">
                    <label className="text-sm font-medium text-green-200 block mb-1.5">{t('location.searchByCity')}</label>
                    <p className="text-xs text-green-500/50 mb-2">{t('location.cityHint')}</p>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Input
                          ref={cityInputRef}
                          id="city"
                          type="text"
                          value={locationCity}
                          onChange={(e) => handleCityInputChange(e.target.value)}
                          onFocus={() => citySuggestions.length > 0 && setShowCitySuggestions(true)}
                          onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                          placeholder={t('location.cityPlaceholder')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setShowCitySuggestions(false);
                              searchCity();
                            }
                          }}
                        />
                        {citySearching && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Sprout className="w-4 h-4 text-green-400 animate-spin" />
                          </div>
                        )}
                      </div>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setShowCitySuggestions(false); searchCity(); }}
                        disabled={citySearching || !locationCity.trim()}
                        className="px-4 rounded-xl bg-green-600/20 border border-green-700/40 text-green-300 hover:bg-green-600/30 transition-all disabled:opacity-40 cursor-pointer"
                      >
                        <Search className="w-4 h-4" />
                      </motion.button>
                    </div>

                    {/* Autocomplete dropdown */}
                    <AnimatePresence>
                      {showCitySuggestions && citySuggestions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="absolute z-50 w-full mt-1 bg-[#1A2F23] border border-green-700/50 rounded-xl shadow-xl overflow-hidden"
                        >
                          {citySuggestions.map((city, i) => (
                            <button
                              key={`${city.name}-${city.latitude}-${i}`}
                              type="button"
                              onMouseDown={(e) => { e.preventDefault(); selectCity(city); }}
                              className="w-full px-4 py-3 text-left hover:bg-green-600/20 transition-colors cursor-pointer flex items-center gap-3 border-b border-green-800/20 last:border-0"
                            >
                              <MapPin className="w-4 h-4 text-green-400 shrink-0" />
                              <div>
                                <span className="text-sm text-green-50 font-medium">{city.name}</span>
                                <span className="text-xs text-green-500/50 block">
                                  {city.admin1 ? `${city.admin1}, ` : ''}{city.country}
                                </span>
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {!locationCity && (
                      <p className="text-xs text-green-600/40 mt-1.5">{t('location.typingHint')}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-green-800/30" />
                    <span className="text-xs text-green-500/40">{t('location.or')}</span>
                    <div className="flex-1 h-px bg-green-800/30" />
                  </div>

                  {/* GPS button - secondary option */}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={detectLocation}
                    disabled={geoLoading}
                    className="w-full p-4 rounded-xl border border-green-800/40 bg-[#0D1F17] text-left transition-all cursor-pointer hover:border-green-700/50 disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-600/15 flex items-center justify-center">
                        {geoLoading ? (
                          <Sprout className="w-5 h-5 text-green-400 animate-spin" />
                        ) : (
                          <Locate className="w-5 h-5 text-green-500/60" />
                        )}
                      </div>
                      <div>
                        <span className="font-medium text-green-300/80 block text-sm">
                          {geoLoading ? t('location.detecting') : t('location.useMyLocation')}
                        </span>
                        <span className="text-xs text-green-600/40 block mt-0.5">
                          {t('location.autoDetect')}
                        </span>
                      </div>
                    </div>
                  </motion.button>

                  {geoError && (
                    <p className="text-xs text-red-400/80 text-center">{geoError}</p>
                  )}

                  {locationLat && locationLng && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center p-3 rounded-xl bg-green-900/20 border border-green-700/30"
                    >
                      <MapPin className="w-4 h-4 text-green-400 inline mr-1" />
                      <span className="text-green-300/70 text-sm">
                        {locationCity ? (
                          <>{locationCity}</>
                        ) : (
                          <>{t('location.locationSet')} {locationLat}, {locationLng}</>
                        )}
                      </span>
                      <Check className="w-4 h-4 text-green-400 inline ml-2" />
                    </motion.div>
                  )}

                  {!locationLat && !locationLng && (
                    <p className="text-xs text-green-500/40 text-center">
                      {t('location.locationOptional')}
                    </p>
                  )}
                </div>
              )}

              {/* ===== Dimensions Step ===== */}
              {currentSubStep.id === 'dimensions' && (
                <div className="space-y-6">
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

              {/* ===== Soil Step ===== */}
              {currentSubStep.id === 'soil' && (
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

              {/* ===== Climate Step ===== */}
              {currentSubStep.id === 'climate' && (
                <div className="space-y-4">
                  {locationLat && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-3 rounded-xl bg-blue-900/20 border border-blue-700/30"
                    >
                      <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                      <p className="text-xs text-blue-300">
                        {t('climate.autoDetectedHint', { city: locationCity || `${locationLat}, ${locationLng}` })}
                      </p>
                    </motion.div>
                  )}
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
                </div>
              )}

              {/* ===== Sun Step ===== */}
              {currentSubStep.id === 'sun' && (
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

              {/* ===== Zones Step ===== */}
              {currentSubStep.id === 'zones' && (
                <ZonesStep
                  config={config}
                  onAddZone={addZone}
                  onRemoveZone={removeZone}
                  onAddRaisedBed={addRaisedBed}
                  onRemoveRaisedBed={removeRaisedBed}
                  t={t}
                  onXpGain={gainXp}
                />
              )}

              {/* ===== Review Step ===== */}
              {currentSubStep.id === 'review' && (
                <GardenReviewStep config={config} t={t} locale={locale} />
              )}

              {/* ===== Smart Suggestions Step ===== */}
              {currentSubStep.id === 'suggestions' && (
                <SmartSuggestionsStep
                  config={config}
                  t={t}
                  onAddPlant={(plantId: string) => {
                    const x = Math.random() * config.length;
                    const z = Math.random() * config.width;
                    addPlant(plantId, x, z);
                    gainXp(10);
                  }}
                />
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex justify-between mt-6">
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
              {step === ALL_SUBSTEPS.length - 1 ? (
                <>
                  <Trophy className="w-4 h-4" />
                  {t('goToMyGarden')}
                </>
              ) : step === 0 ? (
                <>
                  {t('beginAdventure')}
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                // Show "Next Step" when transitioning between major steps
                (() => {
                  const nextStep = ALL_SUBSTEPS[step + 1];
                  const isTransition = nextStep && nextStep.majorStep !== currentMajorStep;
                  return (
                    <>
                      {isTransition ? t('nextStep') : t('nextQuest')}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  );
                })()
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ===== Zones Step Component =====
interface ZonesStepProps {
  config: import('@/types').GardenConfig;
  onAddZone: (zone: GardenZone) => void;
  onRemoveZone: (zoneId: string) => void;
  onAddRaisedBed: (bed: RaisedBed) => void;
  onRemoveRaisedBed: (bedId: string) => void;
  t: ReturnType<typeof useTranslations<'setup'>>;
  onXpGain: (amount: number) => void;
}

function ZonesStep({ config, onAddZone, onRemoveZone, onAddRaisedBed, onRemoveRaisedBed, t, onXpGain }: ZonesStepProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [zoneType, setZoneType] = useState<ZoneType>('raised-bed');
  const [zoneName, setZoneName] = useState('');
  const [zoneLength, setZoneLength] = useState('1.2');
  const [zoneWidth, setZoneWidth] = useState('0.8');
  const [zoneHeight, setZoneHeight] = useState('0.35');
  const [zoneSoil, setZoneSoil] = useState<SoilType>('loamy');

  const totalGardenArea = config.length * config.width;
  const zoneArea = (config.zones || []).reduce((s, z) => s + z.lengthM * z.widthM, 0);
  const bedArea = (config.raisedBeds || []).reduce((s, b) => s + b.lengthM * b.widthM, 0);
  const usedArea = zoneArea + bedArea;
  const remainingArea = Math.max(0, totalGardenArea - usedArea);

  const suggestions = getPlantingSuggestions(remainingArea);

  const allZones = [
    ...(config.zones || []).map((z) => ({ ...z, type: (z.zoneType || 'in-ground') as ZoneType })),
    ...(config.raisedBeds || []).map((b) => ({ ...b, type: 'raised-bed' as ZoneType, soilType: b.soilType as SoilType, sunExposure: 'full-sun' as SunExposure, zoneType: 'raised-bed' as ZoneType, color: '#D4A06C' })),
  ];

  const handleAdd = () => {
    const defaultNames: Record<ZoneType, string> = {
      'raised-bed': t('zones.defaultBedName'),
      'in-ground': t('zones.defaultPlotName'),
      'pot': t('zones.defaultPotName'),
      'greenhouse': t('zones.defaultGreenhouseName'),
    };
    const name = zoneName.trim() || defaultNames[zoneType] + ' ' + (allZones.length + 1);

    if (zoneType === 'raised-bed') {
      // Place raised beds outside the garden by default, distributed around the perimeter
      const bedCount = (config.raisedBeds || []).length;
      const outsidePositions = [
        { x: 120, z: 25 },
        { x: 120, z: 75 },
        { x: 50, z: 120 },
        { x: -20, z: 25 },
        { x: -20, z: 75 },
        { x: 50, z: -20 },
        { x: 130, z: 50 },
        { x: -30, z: 50 },
      ];
      const pos = outsidePositions[bedCount % outsidePositions.length];
      const bed: RaisedBed = {
        id: 'bed-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        name,
        x: pos.x,
        z: pos.z,
        widthM: parseFloat(zoneWidth) || 0.8,
        lengthM: parseFloat(zoneLength) || 1.2,
        heightM: parseFloat(zoneHeight) || 0.35,
        soilType: zoneSoil === 'loamy' ? 'loamy' : zoneSoil === 'sandy' ? 'sandy' : zoneSoil === 'clay' ? 'clay-mix' : zoneSoil === 'peaty' ? 'peat-mix' : 'potting-mix',
        outsideGarden: true,
      };
      onAddRaisedBed(bed);
    } else {
      const zone: GardenZone = {
        id: 'zone-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        name,
        x: 50 + (allZones.length * 10) % 30,
        z: 50 + (allZones.length * 10) % 30,
        widthM: parseFloat(zoneWidth) || 1.5,
        lengthM: parseFloat(zoneLength) || 2,
        soilType: zoneSoil,
        sunExposure: config.sunExposure,
        zoneType,
        color: ZONE_COLORS[allZones.length % ZONE_COLORS.length],
      };
      onAddZone(zone);
    }

    onXpGain(15);
    setShowAddForm(false);
    setZoneName('');
    setZoneLength(zoneType === 'raised-bed' ? '1.2' : '2');
    setZoneWidth(zoneType === 'raised-bed' ? '0.8' : '1.5');
  };

  return (
    <div className="space-y-5">
      {/* Existing zones list */}
      {allZones.length > 0 && (
        <div className="space-y-2">
          {allZones.map((zone) => (
            <div key={zone.id} className="flex items-center justify-between p-3 rounded-xl bg-[#0D1F17] border border-green-900/40">
              <div className="flex items-center gap-3">
                <span className="text-lg">{zone.type === 'raised-bed' ? '\uD83E\uDDF1' : zone.type === 'pot' ? '\uD83E\uDEB4' : zone.type === 'greenhouse' ? '\uD83C\uDFE1' : '\uD83D\uDFE9'}</span>
                <div>
                  <div className="text-sm font-medium text-green-50">{zone.name}</div>
                  <div className="text-xs text-green-500/50">
                    {zone.type === 'raised-bed' ? t('zones.raisedBed') : zone.type === 'pot' ? t('zones.pot') : zone.type === 'greenhouse' ? t('zones.greenhouse') : t('zones.inGroundPlot')} - {zone.lengthM}m x {zone.widthM}m
                    {zone.type === 'raised-bed' && 'heightM' in zone && ` (h: ${zone.heightM}m)`}
                  </div>
                </div>
              </div>
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  if (zone.type === 'raised-bed') {
                    onRemoveRaisedBed(zone.id);
                  } else {
                    onRemoveZone(zone.id);
                  }
                }}
                className="p-2 rounded-lg bg-red-900/20 border border-red-800/30 text-red-400 hover:bg-red-900/30 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          ))}
        </div>
      )}

      {/* Area summary */}
      <div className="p-3 rounded-xl bg-green-900/20 border border-green-800/30 text-center">
        <div className="text-sm text-green-300/70">
          {t('zones.totalArea')} <span className="font-bold text-green-200">{usedArea.toFixed(1)} m&sup2;</span> / {totalGardenArea.toFixed(1)} m&sup2;
        </div>
        {remainingArea > 0.5 && (
          <div className="mt-2 text-xs text-green-500/50">
            <div className="mb-1">{t('zones.remainingArea', { area: remainingArea.toFixed(1) })}</div>
            <div className="flex flex-wrap justify-center gap-1.5">
              {suggestions.slice(0, 4).map((s) => (
                <span key={s.name} className="px-2 py-0.5 rounded-full bg-green-800/20 border border-green-700/20 text-green-300/60">
                  {s.count} {s.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add zone form or button */}
      {showAddForm ? (
        <div className="space-y-4 p-4 rounded-xl bg-[#0D1F17] border border-green-800/40">
          {/* Zone type toggle */}
          <div className="grid grid-cols-2 gap-2">
            {([
              { type: 'raised-bed' as ZoneType, emoji: '\uD83E\uDDF1', labelKey: 'raisedBed', descKey: 'raisedBedDesc', color: 'amber', defaultL: '1.2', defaultW: '0.8' },
              { type: 'in-ground' as ZoneType, emoji: '\uD83D\uDFE9', labelKey: 'inGroundPlot', descKey: 'inGroundDesc', color: 'green', defaultL: '2', defaultW: '1.5' },
              { type: 'pot' as ZoneType, emoji: '\uD83E\uDEB4', labelKey: 'pot', descKey: 'potDesc', color: 'orange', defaultL: '0.4', defaultW: '0.4' },
              { type: 'greenhouse' as ZoneType, emoji: '\uD83C\uDFE1', labelKey: 'greenhouse', descKey: 'greenhouseDesc', color: 'blue', defaultL: '3', defaultW: '2' },
            ] as const).map((item) => (
              <motion.button
                key={item.type}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => { setZoneType(item.type); setZoneLength(item.defaultL); setZoneWidth(item.defaultW); }}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  zoneType === item.type
                    ? `border-${item.color}-500/50 bg-${item.color}-900/20 text-${item.color}-200`
                    : 'border-green-900/40 text-green-300/60 hover:border-green-700/50'
                }`}
                style={zoneType === item.type ? {
                  borderColor: item.color === 'amber' ? 'rgba(245, 158, 11, 0.5)' :
                               item.color === 'green' ? 'rgba(34, 197, 94, 0.5)' :
                               item.color === 'orange' ? 'rgba(249, 115, 22, 0.5)' :
                               'rgba(59, 130, 246, 0.5)',
                  backgroundColor: item.color === 'amber' ? 'rgba(120, 53, 15, 0.2)' :
                                   item.color === 'green' ? 'rgba(20, 83, 45, 0.2)' :
                                   item.color === 'orange' ? 'rgba(124, 45, 18, 0.2)' :
                                   'rgba(30, 58, 138, 0.2)',
                } : {}}
              >
                <span className="text-xl block mb-1">{item.emoji}</span>
                <span className="text-xs font-medium block">{t(`zones.${item.labelKey}`)}</span>
                <span className="text-[10px] text-green-500/40 block mt-0.5">{t(`zones.${item.descKey}`)}</span>
              </motion.button>
            ))}
          </div>

          {/* Name */}
          <Input
            id="zone-name"
            label={t('zones.zoneName')}
            type="text"
            value={zoneName}
            onChange={(e) => setZoneName(e.target.value)}
            placeholder={zoneType === 'raised-bed' ? t('zones.defaultBedName') : t('zones.defaultPlotName')}
          />

          {/* Dimensions */}
          <div className={`grid gap-3 ${zoneType === 'raised-bed' ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <Input
              id="zone-length"
              label={t('zones.length')}
              type="number"
              min="0.3"
              max="10"
              step="0.1"
              value={zoneLength}
              onChange={(e) => setZoneLength(e.target.value)}
            />
            <Input
              id="zone-width"
              label={t('zones.width')}
              type="number"
              min="0.3"
              max="10"
              step="0.1"
              value={zoneWidth}
              onChange={(e) => setZoneWidth(e.target.value)}
            />
            {zoneType === 'raised-bed' && (
              <Input
                id="zone-height"
                label={t('zones.height')}
                type="number"
                min="0.15"
                max="1"
                step="0.05"
                value={zoneHeight}
                onChange={(e) => setZoneHeight(e.target.value)}
              />
            )}
          </div>

          {/* Soil type */}
          <div>
            <label className="text-sm text-green-300/60 block mb-2">{t('zones.soilType')}</label>
            <div className="grid grid-cols-3 gap-2">
              {SOIL_KEYS.map((s) => (
                <motion.button
                  key={s}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setZoneSoil(s)}
                  className={`p-2 rounded-lg border text-xs text-center cursor-pointer transition-all ${
                    zoneSoil === s
                      ? 'border-green-500 bg-green-900/30 text-green-200'
                      : 'border-green-900/40 text-green-400/50 hover:border-green-700/50'
                  }`}
                >
                  {SOIL_EMOJIS[s]} {t(`soil.${s}`)}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setShowAddForm(false)} className="flex-1">
              {t('back')}
            </Button>
            <Button onClick={handleAdd} className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500">
              <Plus className="w-4 h-4 mr-1" />
              {t('zones.addZone')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {([
            { type: 'raised-bed' as ZoneType, emoji: '\uD83E\uDDF1', labelKey: 'addRaisedBed', borderColor: 'rgba(180, 83, 9, 0.4)', textColor: 'rgba(252, 211, 77, 0.7)', hoverBorder: 'rgba(245, 158, 11, 0.5)' },
            { type: 'in-ground' as ZoneType, emoji: '\uD83D\uDFE9', labelKey: 'addInGroundPlot', borderColor: 'rgba(21, 128, 61, 0.4)', textColor: 'rgba(134, 239, 172, 0.7)', hoverBorder: 'rgba(34, 197, 94, 0.5)' },
            { type: 'pot' as ZoneType, emoji: '\uD83E\uDEB4', labelKey: 'addPot', borderColor: 'rgba(194, 65, 12, 0.4)', textColor: 'rgba(251, 146, 60, 0.7)', hoverBorder: 'rgba(249, 115, 22, 0.5)' },
            { type: 'greenhouse' as ZoneType, emoji: '\uD83C\uDFE1', labelKey: 'addGreenhouse', borderColor: 'rgba(30, 64, 175, 0.4)', textColor: 'rgba(147, 197, 253, 0.7)', hoverBorder: 'rgba(59, 130, 246, 0.5)' },
          ]).map((item) => (
            <motion.button
              key={item.type}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setShowAddForm(true); setZoneType(item.type); }}
              className="p-3 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center"
              style={{ borderColor: item.borderColor, color: item.textColor }}
            >
              <span className="text-xl block mb-1">{item.emoji}</span>
              <span className="text-xs font-medium">{t(`zones.${item.labelKey}`)}</span>
            </motion.button>
          ))}
        </div>
      )}

      {allZones.length === 0 && !showAddForm && (
        <p className="text-xs text-green-500/40 text-center mt-2">{t('zones.noZonesYet')}</p>
      )}
    </div>
  );
}

// ===== Garden Review Step Component =====
interface GardenReviewStepProps {
  config: import('@/types').GardenConfig;
  t: ReturnType<typeof useTranslations<'setup'>>;
  locale: string;
}

function GardenReviewStep({ config, t, locale }: GardenReviewStepProps) {
  const lang = (locale === 'fr' ? 'fr' : 'en') as 'en' | 'fr';
  const [weather, setWeather] = useState<{ temp: number; description: string; humidity: number } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const allZones = [
    ...(config.zones || []),
    ...(config.raisedBeds || []).map(b => ({
      id: b.id, name: b.name, widthM: b.widthM, lengthM: b.lengthM,
      soilType: b.soilType as string, sunExposure: config.sunExposure,
      zoneType: 'raised-bed' as ZoneType, x: b.x, z: b.z, color: '#D4A06C',
    })),
  ];

  const totalArea = config.length * config.width;
  const zoneArea = allZones.reduce((s, z) => s + z.widthM * z.lengthM, 0);

  // Fetch weather on mount if we have coordinates
  useEffect(() => {
    if (config.latitude && config.longitude) {
      setWeatherLoading(true);
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${config.latitude}&longitude=${config.longitude}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`)
        .then(res => res.json())
        .then(data => {
          if (data.current) {
            const code = data.current.weather_code as number;
            let desc = 'Clear';
            if (code >= 1 && code <= 3) desc = lang === 'fr' ? 'Partiellement nuageux' : 'Partly cloudy';
            else if (code >= 45 && code <= 48) desc = lang === 'fr' ? 'Brouillard' : 'Foggy';
            else if (code >= 51 && code <= 67) desc = lang === 'fr' ? 'Pluie' : 'Rainy';
            else if (code >= 71 && code <= 77) desc = lang === 'fr' ? 'Neige' : 'Snowy';
            else if (code >= 80 && code <= 99) desc = lang === 'fr' ? 'Orageux' : 'Stormy';
            else desc = lang === 'fr' ? 'Ensoleille' : 'Sunny';

            setWeather({
              temp: Math.round(data.current.temperature_2m),
              description: desc,
              humidity: data.current.relative_humidity_2m,
            });
          }
        })
        .catch(() => {})
        .finally(() => setWeatherLoading(false));
    }
  }, [config.latitude, config.longitude, lang]);

  const climateLabel = CLIMATE_LABELS[config.climateZone] || config.climateZone;
  const sunLabel = SUN_LABELS[config.sunExposure] || config.sunExposure;
  const soilLabel = SOIL_LABELS[config.soilType] || config.soilType;

  return (
    <div className="space-y-4">
      {/* Weather card */}
      {weather && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-gradient-to-r from-blue-900/30 to-cyan-900/20 border border-blue-700/30"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-100">{weather.temp}°C</div>
              <div className="text-xs text-blue-300">{weather.description}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-blue-400/60">{config.city || ''}</div>
              <div className="text-xs text-blue-400/60">{t('review.humidity')}: {weather.humidity}%</div>
            </div>
          </div>
        </motion.div>
      )}
      {weatherLoading && (
        <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-blue-900/20 border border-blue-700/30">
          <Sprout className="w-4 h-4 text-blue-400 animate-spin" />
          <span className="text-xs text-blue-300">{t('review.fetchingWeather')}</span>
        </div>
      )}

      {/* Garden overview card */}
      <div className="p-4 rounded-xl bg-[#0D1F17] border border-green-900/40">
        <div className="text-sm font-bold text-green-200 mb-3">{t('review.gardenOverview')}</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-2.5 rounded-lg bg-green-900/20 border border-green-800/30">
            <Ruler className="w-4 h-4 text-green-400 mb-1" />
            <div className="text-xs text-green-500/60">{t('review.size')}</div>
            <div className="text-sm text-green-200 font-medium">{config.length}m x {config.width}m</div>
            <div className="text-[10px] text-green-500/40">{totalArea.toFixed(1)} m&sup2;</div>
          </div>
          <div className="p-2.5 rounded-lg bg-green-900/20 border border-green-800/30">
            <Mountain className="w-4 h-4 text-green-400 mb-1" />
            <div className="text-xs text-green-500/60">{t('review.soil')}</div>
            <div className="text-sm text-green-200 font-medium">{soilLabel}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-green-900/20 border border-green-800/30">
            <Cloud className="w-4 h-4 text-green-400 mb-1" />
            <div className="text-xs text-green-500/60">{t('review.climate')}</div>
            <div className="text-sm text-green-200 font-medium">{climateLabel}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-green-900/20 border border-green-800/30">
            <Sun className="w-4 h-4 text-green-400 mb-1" />
            <div className="text-xs text-green-500/60">{t('review.sun')}</div>
            <div className="text-sm text-green-200 font-medium">{sunLabel.split('(')[0].trim()}</div>
          </div>
        </div>
      </div>

      {/* Zones mini-map */}
      {allZones.length > 0 && (
        <div className="p-4 rounded-xl bg-[#0D1F17] border border-green-900/40">
          <div className="text-sm font-bold text-green-200 mb-3">
            {t('review.zones')} ({allZones.length})
          </div>

          {/* Visual mini-map */}
          <div className="relative w-full aspect-[4/3] rounded-xl bg-gradient-to-b from-green-900/30 to-green-950/40 border border-green-800/30 mb-3 overflow-hidden">
            {/* Garden boundary */}
            <div className="absolute inset-2 border-2 border-dashed border-green-700/30 rounded-lg" />
            {/* Zone blocks */}
            {allZones.map((zone, i) => {
              const wPct = Math.min((zone.widthM / config.width) * 100, 90);
              const lPct = Math.min((zone.lengthM / config.length) * 100, 90);
              const xPct = 5 + (i * 20) % 70;
              const yPct = 5 + (i * 15) % 60;
              const color = zone.color || ZONE_COLORS[i % ZONE_COLORS.length];
              return (
                <motion.div
                  key={zone.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="absolute rounded-md flex items-center justify-center"
                  style={{
                    left: `${xPct}%`, top: `${yPct}%`,
                    width: `${Math.max(wPct, 15)}%`, height: `${Math.max(lPct, 15)}%`,
                    backgroundColor: `${color}20`, borderColor: `${color}60`,
                    borderWidth: 2,
                  }}
                >
                  <span className="text-[9px] text-green-200/80 font-medium truncate px-1">
                    {zone.name}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Zone list */}
          <div className="space-y-1.5">
            {allZones.map((zone) => (
              <div key={zone.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg bg-green-900/15">
                <div className="flex items-center gap-2">
                  <span>{zone.zoneType === 'raised-bed' ? '\uD83E\uDDF1' : zone.zoneType === 'pot' ? '\uD83E\uDEB4' : zone.zoneType === 'greenhouse' ? '\uD83C\uDFE1' : '\uD83D\uDFE9'}</span>
                  <span className="text-green-200">{zone.name}</span>
                </div>
                <span className="text-green-500/50">{(zone.widthM * zone.lengthM).toFixed(1)} m&sup2;</span>
              </div>
            ))}
          </div>
          <div className="text-center text-xs text-green-400/50 mt-2">
            {t('review.totalZoneArea')}: {zoneArea.toFixed(1)} m&sup2; / {totalArea.toFixed(1)} m&sup2;
          </div>
        </div>
      )}

      {allZones.length === 0 && (
        <div className="text-center p-4 rounded-xl bg-amber-900/15 border border-amber-700/30">
          <AlertTriangle className="w-5 h-5 text-amber-400 mx-auto mb-2" />
          <p className="text-xs text-amber-300">{t('review.noZonesWarning')}</p>
        </div>
      )}

      {/* Ready banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center p-4 rounded-xl bg-gradient-to-r from-green-900/30 to-emerald-900/20 border border-green-700/30"
      >
        <Leaf className="w-6 h-6 text-green-400 mx-auto mb-2" />
        <p className="text-sm text-green-200 font-medium">{t('review.readyMessage')}</p>
        <p className="text-xs text-green-500/50 mt-1">{t('review.readyHint')}</p>
      </motion.div>
    </div>
  );
}

// ===== Smart Suggestions Step Component =====
interface SmartSuggestionsStepProps {
  config: import('@/types').GardenConfig;
  t: ReturnType<typeof useTranslations<'setup'>>;
  onAddPlant: (plantId: string) => void;
}

const plantEmojisSetup: Record<string, string> = {
  tomato: '\uD83C\uDF45', carrot: '\uD83E\uDD55', pepper: '\uD83C\uDF36\uFE0F',
  corn: '\uD83C\uDF3D', lettuce: '\uD83E\uDD6C', strawberry: '\uD83C\uDF53',
  potato: '\uD83E\uDD54', onion: '\uD83E\uDDC5', garlic: '\uD83E\uDDC4',
  broccoli: '\uD83E\uDD66', eggplant: '\uD83C\uDF46', cucumber: '\uD83E\uDD52',
  pea: '\uD83E\uDEBB', bean: '\uD83E\uDEBB', radish: '\uD83E\uDD55',
  spinach: '\uD83E\uDD6C', zucchini: '\uD83E\uDD52', basil: '\uD83C\uDF3F',
  default: '\uD83C\uDF31',
};

function getSetupPlantEmoji(id: string): string {
  for (const [key, emoji] of Object.entries(plantEmojisSetup)) {
    if (id.includes(key)) return emoji;
  }
  return plantEmojisSetup.default;
}

function SmartSuggestionsStep({ config, t, onAddPlant }: SmartSuggestionsStepProps) {
  const locale = useLocale();
  const lang = (locale === 'fr' ? 'fr' : 'en') as 'en' | 'fr';
  const [addedPlants, setAddedPlants] = useState<Set<string>>(new Set());
  const [activeZoneIdx, setActiveZoneIdx] = useState(0);
  const [weatherTemp, setWeatherTemp] = useState<number | undefined>(undefined);

  const currentMonth = new Date().getMonth();
  const monthName = lang === 'fr' ? MONTH_NAMES_FR[currentMonth] : MONTH_NAMES_EN[currentMonth];

  // Fetch weather temperature for better scoring
  useEffect(() => {
    if (config.latitude && config.longitude) {
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${config.latitude}&longitude=${config.longitude}&current=temperature_2m&timezone=auto`)
        .then(res => res.json())
        .then(data => {
          if (data.current?.temperature_2m !== undefined) {
            setWeatherTemp(Math.round(data.current.temperature_2m));
          }
        })
        .catch(() => {});
    }
  }, [config.latitude, config.longitude]);

  // Generate planting plans for all zones
  const zones = (config.zones || []).map(z => ({
    id: z.id, name: z.name, widthM: z.widthM, lengthM: z.lengthM,
    soilType: z.soilType, sunExposure: z.sunExposure,
  }));

  const beds = (config.raisedBeds || []).map(b => ({
    id: b.id, name: b.name, widthM: b.widthM, lengthM: b.lengthM,
    soilType: b.soilType,
  }));

  const existingPlantIds = config.plantedItems.map(p => p.plantId);

  const plans = getGardenPlantingPlan(
    zones, beds, config.climateZone, config.sunExposure, existingPlantIds, weatherTemp
  );

  const hasZones = plans.length > 0;

  const handleAddPlant = (plantId: string) => {
    onAddPlant(plantId);
    setAddedPlants(prev => new Set(prev).add(plantId));
  };

  if (!hasZones) {
    return (
      <div className="text-center space-y-4">
        <span className="text-4xl block">{'\uD83C\uDF31'}</span>
        <p className="text-green-300/70 text-sm">{t('suggestions.noZonesHint')}</p>
      </div>
    );
  }

  const activePlan = plans[activeZoneIdx] || plans[0];

  return (
    <div className="space-y-5">
      {/* Context banner: current month + city + weather */}
      <div className="flex flex-wrap gap-2">
        <div className="px-3 py-1.5 rounded-full bg-blue-900/20 border border-blue-700/30 text-xs text-blue-300">
          {'\uD83D\uDCC5'} {t('suggestions.currentMonth', { month: monthName })}
        </div>
        {config.city && (
          <div className="px-3 py-1.5 rounded-full bg-emerald-900/20 border border-emerald-700/30 text-xs text-emerald-300">
            {'\uD83C\uDF0D'} {t('suggestions.basedOnClimate', { city: config.city })}
          </div>
        )}
        {weatherTemp !== undefined && (
          <div className="px-3 py-1.5 rounded-full bg-cyan-900/20 border border-cyan-700/30 text-xs text-cyan-300">
            {'\uD83C\uDF21\uFE0F'} {weatherTemp}°C {t('suggestions.currentTemp')}
          </div>
        )}
      </div>

      {/* Algorithm explanation */}
      <div className="p-2.5 rounded-xl bg-[#0D1F17] border border-green-900/30">
        <p className="text-[10px] text-green-500/40 text-center">
          {t('suggestions.algorithmExplain')}
        </p>
      </div>

      {/* Zone tabs */}
      {plans.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {plans.map((plan, idx) => (
            <motion.button
              key={plan.zoneId}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveZoneIdx(idx)}
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                idx === activeZoneIdx
                  ? 'bg-green-600/30 border border-green-500/50 text-green-200'
                  : 'bg-[#0D1F17] border border-green-900/40 text-green-400/60 hover:border-green-700/50'
              }`}
            >
              {plan.zoneName} ({plan.zoneAreaM2.toFixed(1)}m&sup2;)
            </motion.button>
          ))}
        </div>
      )}

      {/* Zone info */}
      <div className="p-3 rounded-xl bg-green-900/20 border border-green-800/30">
        <div className="flex items-center justify-between">
          <div className="text-sm text-green-200 font-medium">{activePlan.zoneName}</div>
          <div className="text-xs text-green-400/60">{activePlan.zoneAreaM2.toFixed(1)}m&sup2;</div>
        </div>
        <div className="text-xs text-green-500/50 mt-1">
          {t('suggestions.soilLabel')}: {activePlan.soilType} | {t('suggestions.sunLabel')}: {activePlan.sunExposure}
        </div>
      </div>

      {/* Warnings */}
      {activePlan.warnings.length > 0 && (
        <div className="space-y-2">
          {activePlan.warnings.map((warning, i) => (
            <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-amber-900/20 border border-amber-700/30">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300">{warning.message[lang]}</p>
            </div>
          ))}
        </div>
      )}

      {/* Plant suggestions */}
      <div className="space-y-2">
        {activePlan.suggestions.map((suggestion) => {
          const isAdded = addedPlants.has(suggestion.plantId) || existingPlantIds.includes(suggestion.plantId);
          return (
            <motion.div
              key={suggestion.plantId}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-xl border transition-all ${
                isAdded
                  ? 'bg-green-900/20 border-green-700/30'
                  : 'bg-[#0D1F17] border-green-900/40 hover:border-green-700/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl shrink-0">{getSetupPlantEmoji(suggestion.plantId)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-green-50">
                      {suggestion.plantName[lang]}
                    </span>
                    {suggestion.canSowNow && (
                      <span className="px-1.5 py-0.5 rounded-full bg-green-600/20 text-green-400 text-[10px] font-semibold">
                        {t('suggestions.sowNow')}
                      </span>
                    )}
                    {!suggestion.canSowNow && suggestion.canSowIndoors && (
                      <span className="px-1.5 py-0.5 rounded-full bg-amber-600/20 text-amber-400 text-[10px] font-semibold">
                        {t('suggestions.indoors')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-green-500/50 mt-0.5">{suggestion.reason[lang]}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-green-500/40">
                    <span>{t('suggestions.qty')}: {suggestion.quantity}</span>
                    <span>{t('suggestions.spacing')}: {suggestion.spacingCm}cm</span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />
                      {suggestion.harvestDays}{t('suggestions.days')}
                    </span>
                  </div>
                  {suggestion.companions.length > 0 && (
                    <div className="mt-1 text-[10px] text-green-400/50">
                      {t('suggestions.goodWith')}: {suggestion.companions.slice(0, 3).map(id => getSetupPlantEmoji(id)).join(' ')}
                    </div>
                  )}
                </div>
                <div className="shrink-0">
                  {isAdded ? (
                    <span className="text-xs text-green-500/50 px-2 py-1 rounded-lg bg-green-900/30">
                      {'\u2705'}
                    </span>
                  ) : (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleAddPlant(suggestion.plantId)}
                      className="p-2 rounded-lg bg-green-600/20 border border-green-700/40 text-green-400 hover:bg-green-600/30 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Score bar */}
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-[#0D1F17] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${suggestion.score}%`,
                      background: suggestion.score > 70
                        ? 'linear-gradient(90deg, #22C55E, #4ADE80)'
                        : suggestion.score > 50
                        ? 'linear-gradient(90deg, #EAB308, #FACC15)'
                        : 'linear-gradient(90deg, #F97316, #FB923C)',
                    }}
                  />
                </div>
                <span className="text-[10px] text-green-500/40 w-8 text-right">{suggestion.score}%</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {addedPlants.size > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center p-3 rounded-xl bg-green-900/20 border border-green-800/30"
        >
          <span className="text-green-300 text-sm font-medium">
            {'\uD83C\uDF31'} {t('suggestions.plantsAdded', { count: addedPlants.size })}
          </span>
        </motion.div>
      )}
    </div>
  );
}
