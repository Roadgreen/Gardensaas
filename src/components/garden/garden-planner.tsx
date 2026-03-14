'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, CardContent } from '@/components/ui/card';
import { useGarden, usePlants } from '@/lib/hooks';
import { getPlantById } from '@/lib/garden-utils';
import {
  Grid3x3,
  Plus,
  Trash2,
  AlertTriangle,
  Check,
  Eye,
  ArrowLeft,
  Info,
} from 'lucide-react';
import type { Plant } from '@/types';

const CELL_SIZE = 40; // px per 10cm

export function GardenPlanner() {
  const { config, isLoaded, addPlant, removePlant, clearGarden } = useGarden();
  const { plants } = usePlants();
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [showPlantPicker, setShowPlantPicker] = useState(false);

  const gridCols = Math.floor(config.width * 10); // 10cm cells
  const gridRows = Math.floor(config.length * 10);
  const displayCols = Math.min(gridCols, 30);
  const displayRows = Math.min(gridRows, 40);
  const cellW = Math.max(20, Math.min(CELL_SIZE, 600 / displayCols));
  const cellH = cellW;

  const plantedWithInfo = useMemo(() => {
    return config.plantedItems.map((item, idx) => ({
      ...item,
      idx,
      plant: getPlantById(item.plantId),
    }));
  }, [config.plantedItems]);

  // Check companion/enemy issues
  const warnings = useMemo(() => {
    const w: string[] = [];
    for (let i = 0; i < plantedWithInfo.length; i++) {
      for (let j = i + 1; j < plantedWithInfo.length; j++) {
        const a = plantedWithInfo[i];
        const b = plantedWithInfo[j];
        if (!a.plant || !b.plant) continue;
        if (a.plant.enemyPlants.includes(b.plantId) || b.plant.enemyPlants.includes(a.plantId)) {
          const dist = Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.z - b.z, 2));
          if (dist < 1) {
            w.push(`${a.plant.name.en} and ${b.plant.name.en} should not be planted near each other.`);
          }
        }
      }
    }
    return w;
  }, [plantedWithInfo]);

  const handleCellClick = (col: number, row: number) => {
    if (!selectedPlant) return;
    const x = (col / displayCols) * config.width;
    const z = (row / displayRows) * config.length;
    addPlant(selectedPlant.id, x, z);
  };

  const usedArea = plantedWithInfo.reduce((acc, p) => {
    if (!p.plant) return acc;
    return acc + Math.pow(p.plant.spacingCm / 100, 2);
  }, 0);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0D1F17] flex items-center justify-center">
        <div className="animate-pulse text-green-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1F17] py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <Link href="/garden/dashboard">
              <Button variant="ghost" size="sm" className="mb-2 gap-2">
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-green-50">Garden Planner</h1>
            <p className="text-green-300/60 text-sm">
              {config.length}m x {config.width}m | Click a cell to place the selected plant
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/garden/3d">
              <Button variant="secondary" size="sm" className="gap-2">
                <Eye className="w-4 h-4" />
                3D View
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={clearGarden} className="gap-2 text-red-400 hover:text-red-300">
              <Trash2 className="w-4 h-4" />
              Clear
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Grid area */}
          <Card className="overflow-auto">
            <CardTitle className="flex items-center gap-2 mb-4">
              <Grid3x3 className="w-5 h-5 text-green-400" />
              Garden Grid
            </CardTitle>
            <CardContent>
              <div className="overflow-auto pb-4">
                <div
                  className="inline-grid border border-green-800/30 rounded-lg overflow-hidden"
                  style={{
                    gridTemplateColumns: `repeat(${displayCols}, ${cellW}px)`,
                    gridTemplateRows: `repeat(${displayRows}, ${cellH}px)`,
                  }}
                >
                  {Array.from({ length: displayRows * displayCols }, (_, idx) => {
                    const col = idx % displayCols;
                    const row = Math.floor(idx / displayCols);
                    const cellX = (col / displayCols) * config.width;
                    const cellZ = (row / displayRows) * config.length;

                    // Find planted item in this cell
                    const planted = plantedWithInfo.find((p) => {
                      const pCol = Math.round((p.x / config.width) * displayCols);
                      const pRow = Math.round((p.z / config.length) * displayRows);
                      return pCol === col && pRow === row;
                    });

                    return (
                      <div
                        key={idx}
                        onClick={() => handleCellClick(col, row)}
                        className={`border border-green-900/20 transition-colors ${
                          selectedPlant ? 'cursor-pointer hover:bg-green-800/30' : 'cursor-default'
                        } ${planted ? '' : 'bg-[#0D1F17]'}`}
                        style={{
                          backgroundColor: planted?.plant ? planted.plant.color + '40' : undefined,
                        }}
                        title={planted?.plant ? planted.plant.name.en : `${cellX.toFixed(1)}m, ${cellZ.toFixed(1)}m`}
                      >
                        {planted?.plant && (
                          <div
                            className="w-full h-full flex items-center justify-center"
                          >
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: planted.plant.color }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Plant picker */}
            <Card>
              <CardTitle className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-green-400" />
                  Select Plant
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPlantPicker(!showPlantPicker)}
                >
                  {showPlantPicker ? 'Hide' : 'Show'}
                </Button>
              </CardTitle>
              {selectedPlant && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-green-900/30 border border-green-700/40 mb-3">
                  <div
                    className="w-8 h-8 rounded-lg"
                    style={{ backgroundColor: selectedPlant.color + '30', border: `2px solid ${selectedPlant.color}50` }}
                  />
                  <div>
                    <span className="text-green-50 font-medium text-sm">{selectedPlant.name.en}</span>
                    <span className="text-xs text-green-400/60 block">Spacing: {selectedPlant.spacingCm}cm</span>
                  </div>
                </div>
              )}
              {showPlantPicker && (
                <CardContent>
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {plants.map((plant) => (
                      <button
                        key={plant.id}
                        onClick={() => {
                          setSelectedPlant(plant);
                          setShowPlantPicker(false);
                        }}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors cursor-pointer ${
                          selectedPlant?.id === plant.id
                            ? 'bg-green-900/40 border border-green-700/50'
                            : 'hover:bg-[#0D1F17]'
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded flex-shrink-0"
                          style={{ backgroundColor: plant.color + '40', border: `1px solid ${plant.color}60` }}
                        />
                        <span className="text-sm text-green-100 truncate">{plant.name.en}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Summary */}
            <Card>
              <CardTitle className="flex items-center gap-2 mb-3">
                <Info className="w-5 h-5 text-green-400" />
                Summary
              </CardTitle>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-300/60">Total plants</span>
                    <span className="text-green-100 font-medium">{config.plantedItems.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-300/60">Garden area</span>
                    <span className="text-green-100 font-medium">{(config.length * config.width).toFixed(1)} m2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-300/60">Used area (est.)</span>
                    <span className="text-green-100 font-medium">{usedArea.toFixed(1)} m2</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Planted items list */}
            {plantedWithInfo.length > 0 && (
              <Card>
                <CardTitle className="mb-3">Planted ({plantedWithInfo.length})</CardTitle>
                <CardContent>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {plantedWithInfo.map((p) => (
                      <div key={p.idx} className="flex items-center justify-between p-2 rounded-lg bg-[#0D1F17]">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: p.plant?.color || '#333' }}
                          />
                          <span className="text-xs text-green-200">{p.plant?.name.en || p.plantId}</span>
                        </div>
                        <button
                          onClick={() => removePlant(p.idx)}
                          className="text-green-700 hover:text-red-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Warnings */}
            {warnings.length > 0 && (
              <Card className="border-yellow-800/40">
                <CardTitle className="flex items-center gap-2 mb-3 text-yellow-400">
                  <AlertTriangle className="w-5 h-5" />
                  Warnings
                </CardTitle>
                <CardContent>
                  <ul className="space-y-2">
                    {warnings.map((w, i) => (
                      <li key={i} className="text-xs text-yellow-300/80">{w}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {warnings.length === 0 && plantedWithInfo.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-green-400/60 p-3">
                <Check className="w-4 h-4" />
                No companion planting issues detected
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
