'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { useGarden } from '@/lib/hooks';
import {
  SOIL_LABELS,
  CLIMATE_LABELS,
  SUN_LABELS,
  type SoilType,
  type ClimateZone,
  type SunExposure,
} from '@/types';
import { ArrowLeft, ArrowRight, Check, Ruler, Mountain, Cloud, Sun } from 'lucide-react';

const steps = [
  { id: 'dimensions', title: 'Garden Size', icon: Ruler, description: 'How big is your garden?' },
  { id: 'soil', title: 'Soil Type', icon: Mountain, description: 'What kind of soil do you have?' },
  { id: 'climate', title: 'Climate Zone', icon: Cloud, description: 'Where are you located?' },
  { id: 'sun', title: 'Sun Exposure', icon: Sun, description: 'How much sun does your garden get?' },
];

export function SetupForm() {
  const [step, setStep] = useState(0);
  const { config, updateConfig } = useGarden();
  const router = useRouter();

  const [length, setLength] = useState(config.length.toString());
  const [width, setWidth] = useState(config.width.toString());

  const canProceed = () => {
    if (step === 0) {
      return parseFloat(length) > 0 && parseFloat(width) > 0;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 0) {
      updateConfig({ length: parseFloat(length), width: parseFloat(width) });
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

  const soilOptions = Object.entries(SOIL_LABELS).map(([value, label]) => ({ value, label }));
  const climateOptions = Object.entries(CLIMATE_LABELS).map(([value, label]) => ({ value, label }));
  const sunOptions = Object.entries(SUN_LABELS).map(([value, label]) => ({ value, label }));

  return (
    <div className="min-h-screen bg-[#0D1F17] flex flex-col items-center justify-center px-6 py-12">
      {/* Progress bar */}
      <div className="w-full max-w-lg mb-12">
        <div className="flex items-center justify-between mb-4">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  i < step
                    ? 'bg-green-600 text-white'
                    : i === step
                    ? 'bg-green-600 text-white ring-4 ring-green-600/30'
                    : 'bg-[#1A2F23] text-green-600 border border-green-800/50'
                }`}
              >
                {i < step ? <Check className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`hidden sm:block w-16 lg:w-24 h-0.5 mx-2 transition-colors duration-300 ${
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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-green-50 mb-2">
                {steps[step].title}
              </h2>
              <p className="text-green-200/60">{steps[step].description}</p>
            </div>

            <div className="bg-[#142A1E] rounded-2xl border border-green-900/40 p-8">
              {step === 0 && (
                <div className="space-y-6">
                  <Input
                    id="length"
                    label="Length (meters)"
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
                    label="Width (meters)"
                    type="number"
                    min="0.5"
                    max="50"
                    step="0.5"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    placeholder="e.g. 3"
                  />
                  {parseFloat(length) > 0 && parseFloat(width) > 0 && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center text-green-300/70 text-sm"
                    >
                      Total area: {(parseFloat(length) * parseFloat(width)).toFixed(1)} m2
                    </motion.p>
                  )}
                </div>
              )}

              {step === 1 && (
                <div className="grid grid-cols-2 gap-3">
                  {soilOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateConfig({ soilType: opt.value as SoilType })}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        config.soilType === opt.value
                          ? 'border-green-500 bg-green-900/30 text-green-50'
                          : 'border-green-900/40 bg-[#0D1F17] text-green-300/70 hover:border-green-700/50'
                      }`}
                    >
                      <span className="font-medium">{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {step === 2 && (
                <div className="grid grid-cols-2 gap-3">
                  {climateOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateConfig({ climateZone: opt.value as ClimateZone })}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        config.climateZone === opt.value
                          ? 'border-green-500 bg-green-900/30 text-green-50'
                          : 'border-green-900/40 bg-[#0D1F17] text-green-300/70 hover:border-green-700/50'
                      }`}
                    >
                      <span className="font-medium">{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-3">
                  {sunOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateConfig({ sunExposure: opt.value as SunExposure })}
                      className={`w-full p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        config.sunExposure === opt.value
                          ? 'border-green-500 bg-green-900/30 text-green-50'
                          : 'border-green-900/40 bg-[#0D1F17] text-green-300/70 hover:border-green-700/50'
                      }`}
                    >
                      <span className="font-medium">{opt.label}</span>
                    </button>
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
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="gap-2"
          >
            {step === steps.length - 1 ? 'Finish Setup' : 'Next'}
            {step === steps.length - 1 ? (
              <Check className="w-4 h-4" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
