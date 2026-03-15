'use client';

import { useState, useEffect } from 'react';
import { Card, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  RotateCcw,
  AlertTriangle,
  Check,
  Loader2,
  Leaf,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SpotHistoryEntry {
  year: number;
  plantId: string;
  family?: string;
  feeding: string;
}

interface RotationCheck {
  allowed: boolean;
  reason?: string;
  warnings: string[];
}

interface PlantSuggestion {
  id: string;
  name: string;
}

interface RotationData {
  spotHistory: SpotHistoryEntry[];
  rotationCheck: RotationCheck | null;
  suggestions: {
    best: PlantSuggestion[];
    acceptable: PlantSuggestion[];
    avoid: PlantSuggestion[];
  };
  greenManure: string[];
  companionPlanting: {
    warnings: string[];
    benefits: string[];
  };
}

const FEEDING_COLORS: Record<string, { bg: string; text: string }> = {
  'heavy-feeder': { bg: 'bg-red-900/30', text: 'text-red-400' },
  'light-feeder': { bg: 'bg-yellow-900/30', text: 'text-yellow-400' },
  'nitrogen-fixer': { bg: 'bg-blue-900/30', text: 'text-blue-400' },
  'soil-builder': { bg: 'bg-green-900/30', text: 'text-green-400' },
};

const HEALTH_COLORS: Record<string, string> = {
  good: 'bg-green-500',
  average: 'bg-yellow-500',
  poor: 'bg-red-500',
};

interface RotationAdvisorProps {
  gardenId: string;
  selectedX?: number;
  selectedZ?: number;
  selectedPlantId?: string;
}

export function RotationAdvisor({
  gardenId,
  selectedX = 0,
  selectedZ = 0,
  selectedPlantId,
}: RotationAdvisorProps) {
  const [data, setData] = useState<RotationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showGreenManure, setShowGreenManure] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          gardenId,
          x: selectedX.toString(),
          z: selectedZ.toString(),
        });
        if (selectedPlantId) params.set('plantId', selectedPlantId);

        const res = await fetch(`/api/garden/rotation?${params.toString()}`);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to load rotation data');
        }

        setData(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    if (gardenId) {
      fetchData();
    }
  }, [gardenId, selectedX, selectedZ, selectedPlantId]);

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
          <span className="ml-2 text-green-300/60">Analyzing rotation...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardTitle className="flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-green-400" />
          Rotation Advisor
        </CardTitle>
        <CardContent>
          <p className="text-yellow-400/80 mt-4">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardTitle className="flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-green-400" />
          Rotation Advisor
        </CardTitle>
        <CardContent>
          <p className="text-green-300/60 text-sm mt-2">
            Select a spot in your garden to see rotation recommendations.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardTitle className="flex items-center gap-2 mb-4">
        <RotateCcw className="w-5 h-5 text-green-400" />
        Rotation Advisor
        <span className="text-xs text-green-300/40 font-normal ml-auto">
          Spot ({selectedX.toFixed(1)}, {selectedZ.toFixed(1)})
        </span>
      </CardTitle>

      {/* Rotation check result */}
      {data.rotationCheck && (
        <div
          className={`mb-4 p-3 rounded-lg ${
            data.rotationCheck.allowed
              ? 'bg-green-900/30 border border-green-700/40'
              : 'bg-red-900/30 border border-red-700/40'
          }`}
        >
          <div className="flex items-start gap-2">
            {data.rotationCheck.allowed ? (
              <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            )}
            <div>
              {data.rotationCheck.allowed ? (
                <p className="text-sm text-green-300">
                  This plant can be planted here.
                </p>
              ) : (
                <p className="text-sm text-red-300">{data.rotationCheck.reason}</p>
              )}
              {data.rotationCheck.warnings.map((w, i) => (
                <p key={i} className="text-xs text-yellow-400/80 mt-1">
                  {w}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Spot history */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-green-200 mb-2">Planting History</h4>
        {data.spotHistory.length === 0 ? (
          <p className="text-green-300/40 text-sm">No previous plantings recorded for this spot.</p>
        ) : (
          <div className="space-y-2">
            {data.spotHistory.map((entry, i) => {
              const feedStyle = FEEDING_COLORS[entry.feeding] || FEEDING_COLORS['light-feeder'];
              return (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-[#0D1F17]/60">
                  <span className="text-sm font-mono text-green-300/60 w-12">{entry.year}</span>
                  <span className="text-sm text-green-200 flex-1">{entry.plantId}</span>
                  {entry.family && (
                    <span className="text-xs text-green-300/40">{entry.family}</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded ${feedStyle.bg} ${feedStyle.text}`}>
                    {entry.feeding}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Soil health indicator */}
      {data.spotHistory.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-green-200 mb-2">Soil Health Indicator</h4>
          <SoilHealthBar history={data.spotHistory} />
        </div>
      )}

      {/* Companion planting */}
      {(data.companionPlanting.warnings.length > 0 || data.companionPlanting.benefits.length > 0) && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-green-200 mb-2">Companion Planting</h4>
          {data.companionPlanting.benefits.map((b, i) => (
            <div key={`b-${i}`} className="flex items-center gap-2 text-sm text-green-400 mb-1">
              <Leaf className="w-3 h-3 shrink-0" />
              {b}
            </div>
          ))}
          {data.companionPlanting.warnings.map((w, i) => (
            <div key={`w-${i}`} className="flex items-center gap-2 text-sm text-yellow-400 mb-1">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              {w}
            </div>
          ))}
        </div>
      )}

      {/* Suggestions toggle */}
      <div className="mb-2">
        <Button
          className="w-full flex items-center justify-between p-2 text-sm text-green-300 bg-transparent hover:bg-green-900/20 border border-green-900/40 rounded-lg"
          onClick={() => setShowSuggestions(!showSuggestions)}
        >
          <span className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-green-400" />
            What to plant next
          </span>
          {showSuggestions ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>

        {showSuggestions && (
          <div className="mt-2 space-y-3">
            {data.suggestions.best.length > 0 && (
              <div>
                <h5 className="text-xs font-medium text-green-400 mb-1">Best choices</h5>
                <div className="flex flex-wrap gap-1">
                  {data.suggestions.best.slice(0, 8).map((p) => (
                    <span
                      key={p.id}
                      className="text-xs px-2 py-1 rounded bg-green-900/40 text-green-300 border border-green-800/40"
                    >
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {data.suggestions.acceptable.length > 0 && (
              <div>
                <h5 className="text-xs font-medium text-yellow-400 mb-1">Acceptable</h5>
                <div className="flex flex-wrap gap-1">
                  {data.suggestions.acceptable.slice(0, 8).map((p) => (
                    <span
                      key={p.id}
                      className="text-xs px-2 py-1 rounded bg-yellow-900/30 text-yellow-300 border border-yellow-800/40"
                    >
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {data.suggestions.avoid.length > 0 && (
              <div>
                <h5 className="text-xs font-medium text-red-400 mb-1">Avoid (rotation conflict)</h5>
                <div className="flex flex-wrap gap-1">
                  {data.suggestions.avoid.slice(0, 8).map((p) => (
                    <span
                      key={p.id}
                      className="text-xs px-2 py-1 rounded bg-red-900/30 text-red-300 border border-red-800/40"
                    >
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Green manure toggle */}
      {data.greenManure.length > 0 && (
        <div>
          <Button
            className="w-full flex items-center justify-between p-2 text-sm text-green-300 bg-transparent hover:bg-green-900/20 border border-green-900/40 rounded-lg"
            onClick={() => setShowGreenManure(!showGreenManure)}
          >
            <span className="flex items-center gap-2">
              <Info className="w-4 h-4 text-green-400" />
              Green manure tips
            </span>
            {showGreenManure ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>

          {showGreenManure && (
            <div className="mt-2 space-y-1">
              {data.greenManure.map((tip, i) => (
                <p key={i} className="text-xs text-green-300/70 pl-2 border-l-2 border-green-800/40">
                  {tip}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

/**
 * Soil health bar based on rotation diversity.
 * More diverse families + nitrogen fixers = healthier soil.
 */
function SoilHealthBar({ history }: { history: SpotHistoryEntry[] }) {
  const recentHistory = history.slice(0, 4); // last 4 years
  const families = new Set(recentHistory.map((h) => h.family).filter(Boolean));
  const hasNitrogenFixer = recentHistory.some((h) => h.feeding === 'nitrogen-fixer');
  const hasSoilBuilder = recentHistory.some((h) => h.feeding === 'soil-builder');

  // Score: diverse families (0-3 pts), nitrogen fixer (+2), soil builder (+1), max 6
  let score = Math.min(families.size, 3);
  if (hasNitrogenFixer) score += 2;
  if (hasSoilBuilder) score += 1;
  const maxScore = 6;
  const pct = Math.round((score / maxScore) * 100);

  let color = 'bg-red-500';
  let label = 'Poor';
  if (pct >= 80) {
    color = 'bg-green-500';
    label = 'Excellent';
  } else if (pct >= 60) {
    color = 'bg-green-400';
    label = 'Good';
  } else if (pct >= 40) {
    color = 'bg-yellow-500';
    label = 'Average';
  } else if (pct >= 20) {
    color = 'bg-orange-500';
    label = 'Below Average';
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-green-300/60">{label}</span>
        <span className="text-xs text-green-300/40">{pct}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-[#0D1F17]">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
