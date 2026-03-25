import type { Plant, PlantedItem } from '@/types';

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

/** An order to place N copies of a given plant. */
export interface PlantOrder {
  plantId: string;
  quantity: number;
}

/** A single placement result (coordinates are percentage 0-100). */
export interface PlacementResult {
  plantId: string;
  /** Horizontal position as percentage of garden width (0-100). */
  x: number;
  /** Depth position as percentage of garden length (0-100). */
  z: number;
}

/** A validation finding for an existing set of planted items. */
export interface ValidationResult {
  type: 'error' | 'warning' | 'good';
  message: string;
  /** Indices into the items array that this finding relates to. */
  plantIndices: number[];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface OccupiedCell {
  plantId: string;
  /** Absolute x position in centimeters. */
  xCm: number;
  /** Absolute z position in centimeters. */
  zCm: number;
  /** Plant spacing requirement in cm. */
  spacingCm: number;
}

/** Euclidean distance between two points in cm. */
function dist(ax: number, az: number, bx: number, bz: number): number {
  const dx = ax - bx;
  const dz = az - bz;
  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Effective row spacing for a plant.
 * Falls back to spacingCm * 1.5 when rowSpacingCm is not set.
 */
function rowSpacing(plant: Plant): number {
  return plant.rowSpacingCm ?? plant.spacingCm * 1.5;
}

/** Convert percentage (0-100) to centimeters given a total dimension in meters. */
function pctToCm(pct: number, totalMeters: number): number {
  return (pct / 100) * totalMeters * 100;
}

/** Convert centimeters to percentage (0-100) given a total dimension in meters. */
function cmToPct(cm: number, totalMeters: number): number {
  return (cm / (totalMeters * 100)) * 100;
}

// ---------------------------------------------------------------------------
// computePlacements
// ---------------------------------------------------------------------------

/**
 * Compute optimal placement positions for a batch of plant orders.
 *
 * The algorithm works entirely in centimeters internally and converts back
 * to percentage coordinates (0-100) for the returned results.
 *
 * Strategy:
 * 1. Build an occupancy list from existing planted items.
 * 2. Sort orders largest-spacing-first (hardest to fit).
 * 3. For each plant unit, generate candidate positions on a grid,
 *    filter by minimum distance constraints, score by companion/enemy
 *    proximity and row alignment, then pick the best candidate.
 *
 * @param orders       - Which plants and how many of each to place.
 * @param existingItems - Items already present in the garden.
 * @param gardenWidthM  - Garden width in meters.
 * @param gardenLengthM - Garden length in meters.
 * @param getPlantById  - Lookup function so this module stays import-free and testable.
 * @returns An array of placements. Plants that cannot fit are silently skipped.
 */
export function computePlacements(
  orders: PlantOrder[],
  existingItems: PlantedItem[],
  gardenWidthM: number,
  gardenLengthM: number,
  getPlantById: (id: string) => Plant | undefined,
): PlacementResult[] {
  const widthCm = gardenWidthM * 100;
  const lengthCm = gardenLengthM * 100;

  // --- 1. Build occupancy from existing items ---
  const occupied: OccupiedCell[] = [];
  for (const item of existingItems) {
    const plant = getPlantById(item.plantId);
    if (!plant) continue;
    occupied.push({
      plantId: item.plantId,
      xCm: pctToCm(item.x, gardenWidthM),
      zCm: pctToCm(item.z, gardenLengthM),
      spacingCm: plant.spacingCm,
    });
  }

  // --- 2. Expand orders into individual units & sort largest spacing first ---
  interface PlaceUnit {
    plantId: string;
    spacingCm: number;
  }
  const units: PlaceUnit[] = [];
  for (const order of orders) {
    const plant = getPlantById(order.plantId);
    if (!plant) continue;
    for (let i = 0; i < order.quantity; i++) {
      units.push({ plantId: order.plantId, spacingCm: plant.spacingCm });
    }
  }
  units.sort((a, b) => b.spacingCm - a.spacingCm);

  const results: PlacementResult[] = [];
  const EDGE_MARGIN_CM = 5;

  for (const unit of units) {
    const plant = getPlantById(unit.plantId);
    if (!plant) continue;

    const step = Math.max(unit.spacingCm / 2, 5); // grid step, minimum 5 cm
    const rSpacing = rowSpacing(plant);

    let bestScore = -Infinity;
    let bestX = -1;
    let bestZ = -1;

    // --- 3a. Generate candidate positions ---
    for (let cx = EDGE_MARGIN_CM; cx <= widthCm - EDGE_MARGIN_CM; cx += step) {
      for (let cz = EDGE_MARGIN_CM; cz <= lengthCm - EDGE_MARGIN_CM; cz += step) {
        // --- 3b. Distance check ---
        let valid = true;
        for (const occ of occupied) {
          const minDist = (unit.spacingCm + occ.spacingCm) / 2;
          if (dist(cx, cz, occ.xCm, occ.zCm) < minDist) {
            valid = false;
            break;
          }
        }
        if (!valid) continue;

        // --- 3c. Score candidate ---
        let score = 0;
        const companionRange = unit.spacingCm * 2;
        const enemyRange = unit.spacingCm * 3;

        for (const occ of occupied) {
          const d = dist(cx, cz, occ.xCm, occ.zCm);
          const occPlant = getPlantById(occ.plantId);

          // Companion bonus
          if (plant.companionPlants.includes(occ.plantId) && d <= companionRange) {
            score += 15;
          }

          // Enemy penalty
          if (plant.enemyPlants.includes(occ.plantId) && d <= enemyRange) {
            score -= 25;
          }

          // Row alignment bonus (same plant type within 10 cm of same z)
          if (occ.plantId === unit.plantId && Math.abs(occ.zCm - cz) <= 10) {
            score += 5;
          }
        }

        // Small penalty for distance from origin (prefer compact layout)
        const maxDiag = Math.sqrt(widthCm * widthCm + lengthCm * lengthCm);
        const originDist = dist(cx, cz, EDGE_MARGIN_CM, EDGE_MARGIN_CM);
        score -= (originDist / maxDiag) * 2;

        if (score > bestScore) {
          bestScore = score;
          bestX = cx;
          bestZ = cz;
        }
      }
    }

    // --- 3d/3e. Place at best position or skip ---
    if (bestX >= 0 && bestZ >= 0) {
      occupied.push({
        plantId: unit.plantId,
        xCm: bestX,
        zCm: bestZ,
        spacingCm: unit.spacingCm,
      });
      results.push({
        plantId: unit.plantId,
        x: Math.round(cmToPct(bestX, gardenWidthM) * 100) / 100,
        z: Math.round(cmToPct(bestZ, gardenLengthM) * 100) / 100,
      });
    }
    // else: garden full for this plant, skip silently
  }

  return results;
}

// ---------------------------------------------------------------------------
// validatePlacement
// ---------------------------------------------------------------------------

/**
 * Validate an existing set of planted items.
 *
 * Checks every pair of plants for:
 * - **Spacing violations** (error) -- plants are closer than their combined
 *   minimum spacing allows.
 * - **Enemy proximity** (warning) -- enemy plants are within 3x spacing.
 * - **Companion bonus** (good) -- companion plants are within 2x spacing.
 *
 * @param items         - The planted items to validate.
 * @param gardenWidthM  - Garden width in meters.
 * @param gardenLengthM - Garden length in meters.
 * @param getPlantById  - Lookup function for plant metadata.
 * @returns An array of validation findings.
 */
export function validatePlacement(
  items: PlantedItem[],
  gardenWidthM: number,
  gardenLengthM: number,
  getPlantById: (id: string) => Plant | undefined,
): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Pre-resolve plant data & absolute positions
  interface Resolved {
    plant: Plant;
    xCm: number;
    zCm: number;
  }
  const resolved: (Resolved | null)[] = items.map((item) => {
    const plant = getPlantById(item.plantId);
    if (!plant) return null;
    return {
      plant,
      xCm: pctToCm(item.x, gardenWidthM),
      zCm: pctToCm(item.z, gardenLengthM),
    };
  });

  for (let i = 0; i < items.length; i++) {
    const a = resolved[i];
    if (!a) continue;

    for (let j = i + 1; j < items.length; j++) {
      const b = resolved[j];
      if (!b) continue;

      const d = dist(a.xCm, a.zCm, b.xCm, b.zCm);
      const minDist = (a.plant.spacingCm + b.plant.spacingCm) / 2;

      // Spacing violation
      if (d < minDist) {
        results.push({
          type: 'error',
          message:
            `${a.plant.name.en} and ${b.plant.name.en} are too close ` +
            `(${Math.round(d)} cm apart, need at least ${Math.round(minDist)} cm).`,
          plantIndices: [i, j],
        });
      }

      // Enemy proximity
      const enemyRange = Math.max(a.plant.spacingCm, b.plant.spacingCm) * 3;
      if (
        d <= enemyRange &&
        (a.plant.enemyPlants.includes(b.plant.id) ||
          b.plant.enemyPlants.includes(a.plant.id))
      ) {
        results.push({
          type: 'warning',
          message:
            `${a.plant.name.en} and ${b.plant.name.en} are enemies and are ` +
            `only ${Math.round(d)} cm apart.`,
          plantIndices: [i, j],
        });
      }

      // Companion bonus
      const companionRange = Math.max(a.plant.spacingCm, b.plant.spacingCm) * 2;
      if (
        d <= companionRange &&
        (a.plant.companionPlants.includes(b.plant.id) ||
          b.plant.companionPlants.includes(a.plant.id))
      ) {
        results.push({
          type: 'good',
          message:
            `${a.plant.name.en} and ${b.plant.name.en} are good companions ` +
            `(${Math.round(d)} cm apart).`,
          plantIndices: [i, j],
        });
      }
    }
  }

  return results;
}
