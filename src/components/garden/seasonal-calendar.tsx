'use client';

import { useState, useEffect } from 'react';
import { Card, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MONTH_NAMES } from '@/types';
import {
  Calendar,
  Sprout,
  Droplets,
  Sun,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';

interface CalendarAction {
  action: string;
  plantName: string;
}

interface WeatherResponse {
  annualCalendar: Record<number, CalendarAction[]>;
  watering: {
    shouldWater: boolean;
    reason: string;
    amountMm?: number;
  };
  frostAlert: {
    alert: boolean;
    message: string;
    date?: string;
    minTemp?: number;
  };
  weekActions: { action: string; plantName: string; reason: string }[];
}

const ACTION_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  'sow-indoors': { bg: 'bg-green-900/40', text: 'text-green-400', label: 'Sow Indoors' },
  'sow-outdoors': { bg: 'bg-green-700/40', text: 'text-green-300', label: 'Sow Outdoors' },
  transplant: { bg: 'bg-amber-900/40', text: 'text-amber-400', label: 'Transplant' },
  harvest: { bg: 'bg-orange-900/40', text: 'text-orange-400', label: 'Harvest' },
  water: { bg: 'bg-blue-900/40', text: 'text-blue-400', label: 'Water' },
};

interface SeasonalCalendarProps {
  gardenId?: string;
  latitude?: number;
  longitude?: number;
}

export function SeasonalCalendar({ gardenId, latitude, longitude }: SeasonalCalendarProps) {
  const [data, setData] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    async function fetchData() {
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
          throw new Error(errData.error || 'Failed to load weather data');
        }

        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    if (gardenId || (latitude !== undefined && longitude !== undefined)) {
      fetchData();
    } else {
      setLoading(false);
      setError('Set your garden location to see the seasonal calendar.');
    }
  }, [gardenId, latitude, longitude]);

  const prevMonth = () => setSelectedMonth((m) => (m === 1 ? 12 : m - 1));
  const nextMonth = () => setSelectedMonth((m) => (m === 12 ? 1 : m + 1));

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-green-400 animate-spin" />
          <span className="ml-2 text-green-300/60">Loading calendar...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-green-400" />
          Seasonal Calendar
        </CardTitle>
        <CardContent>
          <p className="text-yellow-400/80 mt-4">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const monthActions = data.annualCalendar[selectedMonth] || [];
  const currentMonth = new Date().getMonth() + 1;

  return (
    <Card>
      <CardTitle className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-green-400" />
        Seasonal Calendar
      </CardTitle>

      {/* This week's alerts */}
      {data.frostAlert.alert && (
        <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-700/40">
          <p className="text-red-300 text-sm font-medium">
            {data.frostAlert.message}
          </p>
        </div>
      )}

      {data.watering && (
        <div
          className={`mb-4 p-3 rounded-lg ${
            data.watering.shouldWater
              ? 'bg-blue-900/30 border border-blue-700/40'
              : 'bg-green-900/30 border border-green-700/40'
          }`}
        >
          <div className="flex items-center gap-2">
            <Droplets className={`w-4 h-4 ${data.watering.shouldWater ? 'text-blue-400' : 'text-green-400'}`} />
            <p className={`text-sm ${data.watering.shouldWater ? 'text-blue-300' : 'text-green-300'}`}>
              {data.watering.reason}
            </p>
          </div>
        </div>
      )}

      {/* This week's actions */}
      {data.weekActions.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-green-200 mb-2">This Week</h4>
          <div className="space-y-2">
            {data.weekActions.map((action, i) => {
              const style = ACTION_COLORS[action.action] || ACTION_COLORS['sow-outdoors'];
              return (
                <div key={i} className={`p-2 rounded-lg ${style.bg} flex items-center gap-2`}>
                  <Sprout className={`w-4 h-4 ${style.text}`} />
                  <span className={`text-sm font-medium ${style.text}`}>{style.label}:</span>
                  <span className="text-sm text-green-200">{action.plantName}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Month selector */}
      <div className="flex items-center justify-between mb-4">
        <Button
          className="p-1 text-green-400 hover:text-green-300 bg-transparent hover:bg-green-900/30"
          onClick={prevMonth}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h4
          className={`text-lg font-semibold ${
            selectedMonth === currentMonth ? 'text-green-400' : 'text-green-200'
          }`}
        >
          {MONTH_NAMES[selectedMonth - 1]}
          {selectedMonth === currentMonth && (
            <span className="ml-2 text-xs text-green-400/60">(current)</span>
          )}
        </h4>
        <Button
          className="p-1 text-green-400 hover:text-green-300 bg-transparent hover:bg-green-900/30"
          onClick={nextMonth}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Actions for selected month */}
      <CardContent>
        {monthActions.length === 0 ? (
          <p className="text-green-300/40 text-sm text-center py-4">
            No scheduled actions for {MONTH_NAMES[selectedMonth - 1]}.
          </p>
        ) : (
          <div className="space-y-2">
            {monthActions.map((item, i) => {
              const style = ACTION_COLORS[item.action] || ACTION_COLORS['sow-outdoors'];
              return (
                <div key={i} className={`p-2 rounded-lg ${style.bg} flex items-center gap-2`}>
                  {item.action.includes('sow') && <Sprout className={`w-4 h-4 ${style.text}`} />}
                  {item.action === 'harvest' && <Sun className={`w-4 h-4 ${style.text}`} />}
                  {item.action === 'transplant' && <Sprout className={`w-4 h-4 ${style.text}`} />}
                  <span className={`text-sm font-medium ${style.text}`}>{style.label}</span>
                  <span className="text-sm text-green-200">{item.plantName}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-green-900/40">
        <div className="flex flex-wrap gap-3">
          {Object.entries(ACTION_COLORS).map(([key, style]) => (
            <div key={key} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded ${style.bg} border border-green-800/40`} />
              <span className="text-xs text-green-300/60">{style.label}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
