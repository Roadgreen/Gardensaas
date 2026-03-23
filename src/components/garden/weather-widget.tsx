'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardTitle, CardContent } from '@/components/ui/card';
import {
  Cloud,
  Droplets,
  Wind,
  Thermometer,
  AlertTriangle,
  Sun,
  Sprout,
  Loader2,
  Snowflake,
} from 'lucide-react';

interface CurrentWeather {
  temperature: number;
  temperatureMax: number;
  temperatureMin: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  description: string;
}

interface ForecastDay {
  date: string;
  temperatureMax: number;
  temperatureMin: number;
  precipitation: number;
  weatherCode: number;
  description: string;
}

interface WateringInfo {
  shouldWater: boolean;
  reason: string;
  amountMm?: number;
}

interface FrostInfo {
  alert: boolean;
  message: string;
  date?: string;
  minTemp?: number;
}

interface WeekAction {
  action: string;
  plantName: string;
  reason: string;
}

interface WeatherWidgetData {
  current: CurrentWeather;
  forecast: ForecastDay[];
  watering: WateringInfo;
  frostAlert: FrostInfo;
  weekActions: WeekAction[];
  rainfall: {
    last7DaysMm: number;
    dailyMm: number[];
  };
}

interface WeatherWidgetProps {
  gardenId?: string;
  latitude?: number;
  longitude?: number;
}

export function WeatherWidget({ gardenId, latitude, longitude }: WeatherWidgetProps) {
  const t = useTranslations('dashboard.weather');
  const [data, setData] = useState<WeatherWidgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWeather() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (gardenId) params.set('gardenId', gardenId);
        if (latitude !== undefined) params.set('lat', latitude.toString());
        if (longitude !== undefined) params.set('lng', longitude.toString());

        const res = await fetch(`/api/garden/weather?${params.toString()}`);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to load weather');
        }

        setData(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load weather');
      } finally {
        setLoading(false);
      }
    }

    if (gardenId || (latitude !== undefined && longitude !== undefined)) {
      fetchWeather();
    } else {
      setLoading(false);
      setError(t('unavailable'));
    }
  }, [gardenId, latitude, longitude]);

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
          <span className="ml-2 text-green-300/60">{t('loading')}</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="w-5 h-5 text-green-400" />
          {t('gardenWeather')}
        </CardTitle>
        <CardContent>
          <p className="text-yellow-400/80 mt-4">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card>
      <CardTitle className="flex items-center gap-2 mb-4">
        <Cloud className="w-5 h-5 text-green-400" />
        {t('gardenWeather')}
      </CardTitle>

      {/* Current weather */}
      <div className="flex items-center gap-6 mb-4 p-4 rounded-lg bg-[#0D1F17]/60">
        <div className="text-center">
          <WeatherIcon code={data.current.description} />
          <p className="text-xs text-green-300/60 mt-1">{data.current.description}</p>
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-green-50">
              {data.current.temperature.toFixed(0)}°C
            </span>
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-green-300/60">
            <span className="flex items-center gap-1">
              <Thermometer className="w-3 h-3" />
              {data.current.temperatureMin.toFixed(0)}° / {data.current.temperatureMax.toFixed(0)}°
            </span>
            <span className="flex items-center gap-1">
              <Droplets className="w-3 h-3" />
              {data.current.humidity}%
            </span>
            <span className="flex items-center gap-1">
              <Wind className="w-3 h-3" />
              {data.current.windSpeed.toFixed(0)} km/h
            </span>
          </div>
        </div>
      </div>

      {/* Frost alert */}
      {data.frostAlert.alert && (
        <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-700/40">
          <div className="flex items-center gap-2">
            <Snowflake className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-sm text-red-300">{data.frostAlert.message}</p>
          </div>
        </div>
      )}

      {/* Watering recommendation */}
      <div
        className={`mb-4 p-3 rounded-lg ${
          data.watering.shouldWater
            ? 'bg-blue-900/30 border border-blue-700/40'
            : 'bg-green-900/30 border border-green-700/40'
        }`}
      >
        <div className="flex items-start gap-2">
          <Droplets
            className={`w-4 h-4 mt-0.5 shrink-0 ${
              data.watering.shouldWater ? 'text-blue-400' : 'text-green-400'
            }`}
          />
          <div>
            <p
              className={`text-sm font-medium ${
                data.watering.shouldWater ? 'text-blue-300' : 'text-green-300'
              }`}
            >
              {data.watering.shouldWater ? t('waterToday') : t('normalConditions')}
            </p>
            <p className="text-xs text-green-300/60 mt-0.5">{data.watering.reason}</p>
            {data.watering.amountMm && (
              <p className="text-xs text-blue-300/60 mt-0.5">
                ~{data.watering.amountMm}mm
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Best time to plant this week */}
      {data.weekActions.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-green-200 mb-2 flex items-center gap-2">
            <Sprout className="w-4 h-4 text-green-400" />
            {t('weekActions')}
          </h4>
          <div className="space-y-1">
            {data.weekActions.slice(0, 5).map((action, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="text-green-400 font-medium capitalize">
                  {action.action.replace('-', ' ')}:
                </span>
                <span className="text-green-200">{action.plantName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7-day forecast */}
      <div>
        <h4 className="text-sm font-medium text-green-200 mb-2">{t('forecast7Day')}</h4>
        <div className="grid grid-cols-7 gap-1">
          {data.forecast.map((day, i) => {
            const date = new Date(day.date);
            const dayName = date.toLocaleDateString('en', { weekday: 'short' });
            const isFrosty = day.temperatureMin <= 0;

            return (
              <div
                key={i}
                className={`text-center p-2 rounded-lg ${
                  isFrosty ? 'bg-red-900/20 border border-red-800/30' : 'bg-[#0D1F17]/40'
                }`}
              >
                <p className="text-xs text-green-300/60">{dayName}</p>
                <p className="text-sm font-medium text-green-200 my-1">
                  {day.temperatureMax.toFixed(0)}°
                </p>
                <p className="text-xs text-green-300/40">
                  {day.temperatureMin.toFixed(0)}°
                </p>
                {day.precipitation > 0 && (
                  <p className="text-xs text-blue-400 mt-1">
                    {day.precipitation.toFixed(0)}mm
                  </p>
                )}
                {isFrosty && (
                  <Snowflake className="w-3 h-3 text-red-400 mx-auto mt-1" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Rainfall summary */}
      <div className="mt-4 pt-4 border-t border-green-900/40">
        <div className="flex items-center justify-between text-sm">
          <span className="text-green-300/60">{t('rainfallLast7')}</span>
          <span className="text-green-200 font-medium">
            {data.rainfall.last7DaysMm.toFixed(1)} mm
          </span>
        </div>
      </div>
    </Card>
  );
}

function WeatherIcon({ code }: { code: string }) {
  const lower = code.toLowerCase();
  if (lower.includes('clear') || lower.includes('sunny')) {
    return <Sun className="w-8 h-8 text-yellow-400" />;
  }
  if (lower.includes('rain') || lower.includes('drizzle') || lower.includes('shower')) {
    return <Droplets className="w-8 h-8 text-blue-400" />;
  }
  if (lower.includes('snow') || lower.includes('sleet') || lower.includes('hail')) {
    return <Snowflake className="w-8 h-8 text-blue-200" />;
  }
  if (lower.includes('thunder')) {
    return <AlertTriangle className="w-8 h-8 text-yellow-500" />;
  }
  return <Cloud className="w-8 h-8 text-green-300/60" />;
}
