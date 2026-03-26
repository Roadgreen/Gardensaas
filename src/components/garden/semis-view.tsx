'use client';

import { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGarden, usePlants } from '@/lib/hooks';
import type { Plant, Seedling } from '@/types';
import { Plus, X, Search, Trash2, ArrowRightLeft, ChevronUp } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Color palette                                                      */
/* ------------------------------------------------------------------ */
const C = {
  ink: '#1B2B1A',
  inkMid: '#3B5438',
  inkSoft: '#5E7B58',
  leaf: '#22c55e',
  leafDeep: '#16a34a',
  leafGlow: '#4ade80',
  dew: '#C8DFC1',
  paper: '#F5F1E8',
  paperMid: '#EDE8DC',
  parchment: '#F9F6EE',
  terra: '#f97316',
  terraDk: '#ea580c',
  terraLt: '#fb923c',
  terraPal: '#fff7ed',
  gold: '#eab308',
  cream: '#FDFAF4',
};

/* ------------------------------------------------------------------ */
/*  Growth stage helpers                                                */
/* ------------------------------------------------------------------ */
type SeedlingStage = 0 | 1 | 2 | 3;

function getSeedlingStage(seededAt: string): SeedlingStage {
  const days = Math.floor((Date.now() - new Date(seededAt).getTime()) / (1000 * 60 * 60 * 24));
  if (days < 3) return 0;
  if (days < 7) return 1;
  if (days < 14) return 2;
  return 3;
}

function getDaysSince(date: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)));
}

const STAGE_INFO: Record<SeedlingStage, { label: string; emoji: string; color: string; tip: string }> = {
  0: { label: 'Graine', emoji: '\uD83E\uDEB4', color: '#8B6914', tip: 'Gardez le sol humide, temperature ideale 20-25\u00B0C' },
  1: { label: 'Cotyledons', emoji: '\uD83C\uDF31', color: '#7BC67E', tip: 'Premiere lumiere ! Placez pres d\'une fenetre' },
  2: { label: 'Vraies feuilles', emoji: '\uD83C\uDF3F', color: '#22c55e', tip: 'Arrosez regulierement, ajoutez de l\'engrais' },
  3: { label: 'Pret a transplanter', emoji: '\uD83C\uDF3B', color: '#16a34a', tip: 'Pret pour le repiquage en pleine terre !' },
};

/* ------------------------------------------------------------------ */
/*  3D: Seedling growth models                                          */
/* ------------------------------------------------------------------ */

function TerracottaPot() {
  return (
    <group position={[0, -0.3, 0]}>
      <mesh>
        <latheGeometry args={[
          [
            new THREE.Vector2(0.2, 0),
            new THREE.Vector2(0.22, 0),
            new THREE.Vector2(0.35, 0.5),
            new THREE.Vector2(0.4, 0.55),
            new THREE.Vector2(0.42, 0.55),
            new THREE.Vector2(0.42, 0.6),
            new THREE.Vector2(0.38, 0.6),
            new THREE.Vector2(0.36, 0.58),
            new THREE.Vector2(0.33, 0.5),
            new THREE.Vector2(0.19, 0.03),
            new THREE.Vector2(0.19, 0),
          ],
          32,
        ]} />
        <meshStandardMaterial color={C.terra} roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.02, 0]}>
        <cylinderGeometry args={[0.44, 0.46, 0.04, 32]} />
        <meshStandardMaterial color={C.terraLt} roughness={0.7} />
      </mesh>
    </group>
  );
}

function SoilDisc() {
  return (
    <mesh position={[0, 0.28, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.38, 32]} />
      <meshStandardMaterial color="#3E2723" roughness={1} />
    </mesh>
  );
}

// Stage 0: seed in soil (small brown point)
function SeedModel() {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.y = 0.3 + Math.sin(performance.now() * 0.002) * 0.003;
  });
  return (
    <group ref={ref} position={[0, 0.3, 0]}>
      <mesh>
        <sphereGeometry args={[0.04, 8, 6]} />
        <meshStandardMaterial color="#6B4423" roughness={0.9} />
      </mesh>
    </group>
  );
}

// Stage 1: cotyledons (2 small green leaves)
function CotyledonModel({ color }: { color: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    ref.current.rotation.z = Math.sin(performance.now() * 0.002) * 0.06;
  });
  return (
    <group ref={ref} position={[0, 0.28, 0]}>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.01, 0.015, 0.12, 6]} />
        <meshStandardMaterial color="#4CAF50" />
      </mesh>
      <mesh position={[-0.03, 0.13, 0]} rotation={[0.2, 0, -0.5]}>
        <sphereGeometry args={[0.022, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color || '#66BB6A'} />
      </mesh>
      <mesh position={[0.03, 0.13, 0]} rotation={[0.2, 0, 0.5]}>
        <sphereGeometry args={[0.022, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color || '#66BB6A'} />
      </mesh>
    </group>
  );
}

// Stage 2: true leaves (3-4 leaves, taller stem)
function TrueLeavesModel({ color }: { color: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    ref.current.rotation.z = Math.sin(performance.now() * 0.0015) * 0.03;
  });
  return (
    <group ref={ref} position={[0, 0.28, 0]}>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.013, 0.022, 0.2, 6]} />
        <meshStandardMaterial color="#388E3C" />
      </mesh>
      {[0.08, 0.14, 0.19].map((h, i) => (
        <group key={i} position={[0, h, 0]} rotation={[0, i * 1.2, 0]}>
          <mesh position={[-0.035, 0, 0]} rotation={[0.3, 0, -0.4 - i * 0.1]}>
            <sphereGeometry args={[0.025 - i * 0.003, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={color || C.leaf} />
          </mesh>
          <mesh position={[0.035, 0, 0]} rotation={[0.3, 0, 0.4 + i * 0.1]}>
            <sphereGeometry args={[0.025 - i * 0.003, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={color || C.leaf} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Stage 3: adult plant ready to transplant (larger model)
function AdultModel({ color }: { color: string }) {
  const ref = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  useFrame(() => {
    if (!ref.current) return;
    ref.current.rotation.z = Math.sin(performance.now() * 0.001) * 0.015;
    if (glowRef.current) {
      glowRef.current.intensity = 0.4 + Math.sin(performance.now() * 0.003) * 0.15;
    }
  });
  return (
    <group ref={ref} position={[0, 0.28, 0]}>
      <pointLight ref={glowRef} position={[0, 0.3, 0]} color={C.gold} intensity={0.4} distance={1.5} />
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.018, 0.03, 0.3, 8]} />
        <meshStandardMaterial color="#2E7D32" />
      </mesh>
      {[0.12, 0.2, 0.27, 0.33].map((h, i) => (
        <group key={i} position={[0, h, 0]} rotation={[0, i * 0.9, 0]}>
          <mesh position={[-0.045, 0, 0.01]} rotation={[0.2, 0, -0.5]}>
            <sphereGeometry args={[0.032, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={color || C.leafDeep} />
          </mesh>
          <mesh position={[0.045, 0, -0.01]} rotation={[0.2, 0, 0.5]}>
            <sphereGeometry args={[0.032, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={color || C.leafDeep} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.37, 0]}>
        <sphereGeometry args={[0.022, 8, 6]} />
        <meshStandardMaterial color={color || '#E8F5E9'} emissive={C.gold} emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}

function SeedlingScene3D({ plant, seededAt }: { plant: Plant; seededAt: string }) {
  const stage = getSeedlingStage(seededAt);
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 2]} intensity={1.0} castShadow color="#FFF8E1" />
      <directionalLight position={[-2, 3, -1]} intensity={0.3} color="#E8F5E9" />
      <mesh position={[0, -0.34, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4, 4]} />
        <meshStandardMaterial color={C.paperMid} roughness={1} />
      </mesh>
      <TerracottaPot />
      <SoilDisc />
      {stage === 0 && <SeedModel />}
      {stage === 1 && <CotyledonModel color={plant.color} />}
      {stage === 2 && <TrueLeavesModel color={plant.color} />}
      {stage === 3 && <AdultModel color={plant.color} />}
      <OrbitControls
        autoRotate
        autoRotateSpeed={1.2}
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Sow modal (Nouveau semis)                                          */
/* ------------------------------------------------------------------ */
function SowModal({
  plants,
  onSow,
  onClose,
}: {
  plants: Plant[];
  onSow: (plantId: string, date: string, pots: number) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [sowDate, setSowDate] = useState(new Date().toISOString().slice(0, 10));
  const [pots, setPots] = useState(1);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return plants;
    return plants.filter(
      (p) =>
        p.name.fr.toLowerCase().includes(q) ||
        p.name.en.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [plants, search]);

  const handleConfirm = () => {
    if (selectedPlant) {
      onSow(selectedPlant.id, new Date(sowDate).toISOString(), pots);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(27,43,26,0.6)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: C.parchment, maxHeight: '85vh' }}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${C.dew}` }}>
          <h3 className="text-lg font-semibold" style={{ color: C.ink }}>
            {'\uD83C\uDF31'} Nouveau semis
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/5 transition-colors">
            <X className="w-5 h-5" style={{ color: C.inkSoft }} />
          </button>
        </div>

        {!selectedPlant ? (
          <>
            <div className="px-5 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.inkSoft }} />
                <input
                  type="text"
                  placeholder="Rechercher une plante..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
                  style={{ background: C.paper, border: `1px solid ${C.dew}`, color: C.ink }}
                  autoFocus
                />
              </div>
            </div>
            <div className="px-5 pb-5 overflow-y-auto" style={{ maxHeight: '50vh' }}>
              <div className="space-y-1.5">
                {filtered.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlant(p)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all hover:scale-[1.01]"
                    style={{ background: C.cream }}
                  >
                    <span
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
                      style={{ background: p.color + '20' }}
                    >
                      {p.category === 'vegetable' ? '\uD83E\uDD66' : p.category === 'herb' ? '\uD83C\uDF3F' : p.category === 'fruit' ? '\uD83C\uDF53' : '\uD83E\uDEB4'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: C.ink }}>{p.name.fr}</div>
                      <div className="text-xs truncate" style={{ color: C.inkSoft }}>
                        {p.harvestDays}j &middot; {p.difficulty}
                      </div>
                    </div>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <p className="text-center py-8 text-sm" style={{ color: C.inkSoft }}>Aucune plante trouvee</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="px-5 py-6 space-y-5">
            <div className="flex items-center gap-3">
              <span
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ background: selectedPlant.color + '20' }}
              >
                {selectedPlant.category === 'vegetable' ? '\uD83E\uDD66' : selectedPlant.category === 'herb' ? '\uD83C\uDF3F' : '\uD83C\uDF53'}
              </span>
              <div>
                <div className="font-semibold" style={{ color: C.ink }}>{selectedPlant.name.fr}</div>
                <div className="text-xs" style={{ color: C.inkSoft }}>{selectedPlant.harvestDays}j jusqu&apos;a la recolte</div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: C.inkMid }}>Date de semis</label>
              <input
                type="date"
                value={sowDate}
                onChange={(e) => setSowDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: C.paper, border: `1px solid ${C.dew}`, color: C.ink }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: C.inkMid }}>Nombre de godets</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPots(Math.max(1, pots - 1))}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold transition-colors"
                  style={{ background: C.paper, border: `1px solid ${C.dew}`, color: C.ink }}
                >-</button>
                <span className="text-xl font-bold min-w-[40px] text-center" style={{ color: C.leaf }}>{pots}</span>
                <button
                  onClick={() => setPots(pots + 1)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold transition-colors"
                  style={{ background: C.paper, border: `1px solid ${C.dew}`, color: C.ink }}
                >+</button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSelectedPlant(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{ background: C.paper, color: C.inkMid }}
              >Retour</button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:brightness-110"
                style={{ background: C.leaf }}
              >{'\uD83C\uDF31'} Semer</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Seedling card                                                       */
/* ------------------------------------------------------------------ */
function SeedlingCard({
  seedling,
  plant,
  isSelected,
  onSelect,
}: {
  seedling: Seedling;
  plant: Plant;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const stage = getSeedlingStage(seedling.seededAt);
  const info = STAGE_INFO[stage];
  const days = getDaysSince(seedling.seededAt);
  const progress = Math.min(1, days / 14);

  return (
    <button
      onClick={onSelect}
      className="w-full text-left rounded-xl p-3 transition-all duration-200 shrink-0"
      style={{
        background: isSelected ? C.leafGlow + '25' : C.cream,
        border: `2px solid ${isSelected ? C.leaf : 'transparent'}`,
        minWidth: '160px',
      }}
    >
      <div className="flex items-start gap-2.5">
        <span className="text-lg">{info.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate" style={{ color: C.ink }}>{plant.name.fr}</div>
          <div className="text-xs mt-0.5" style={{ color: C.inkSoft }}>
            Jour {days} &middot; {info.label} &middot; {seedling.pots} godet{seedling.pots > 1 ? 's' : ''}
          </div>
        </div>
      </div>
      <div className="mt-2.5 h-1.5 rounded-full overflow-hidden" style={{ background: C.paperMid }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.round(progress * 100)}%`, background: info.color }}
        />
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Info panel                                                          */
/* ------------------------------------------------------------------ */
function InfoPanel({
  seedling,
  plant,
  onRemove,
  onTransplant,
}: {
  seedling: Seedling;
  plant: Plant;
  onRemove: () => void;
  onTransplant: () => void;
}) {
  const stage = getSeedlingStage(seedling.seededAt);
  const info = STAGE_INFO[stage];
  const days = getDaysSince(seedling.seededAt);
  const progress = Math.min(1, days / 14);
  const sowDate = new Date(seedling.seededAt).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="rounded-2xl p-4 md:p-5 space-y-4" style={{ background: C.cream, border: `1px solid ${C.dew}` }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{info.emoji}</span>
          <div>
            <h3 className="font-semibold text-base" style={{ color: C.ink }}>{plant.name.fr}</h3>
            <p className="text-xs" style={{ color: C.inkSoft }}>{plant.name.en} &middot; {seedling.pots} godet{seedling.pots > 1 ? 's' : ''}</p>
          </div>
        </div>
        <div
          className="px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{ background: info.color + '20', color: info.color }}
        >{info.label}</div>
      </div>

      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span style={{ color: C.inkSoft }}>Progression</span>
          <span className="font-semibold" style={{ color: info.color }}>{Math.round(progress * 100)}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: C.paperMid }}>
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.round(progress * 100)}%`, background: info.color }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-3" style={{ background: C.parchment }}>
          <div className="text-[10px] uppercase tracking-wider font-medium mb-1" style={{ color: C.inkSoft }}>Seme le</div>
          <div className="text-sm font-semibold" style={{ color: C.ink }}>{sowDate}</div>
        </div>
        <div className="rounded-xl p-3" style={{ background: C.parchment }}>
          <div className="text-[10px] uppercase tracking-wider font-medium mb-1" style={{ color: C.inkSoft }}>Age</div>
          <div className="text-sm font-semibold" style={{ color: C.ink }}>{days} jours</div>
        </div>
      </div>

      <div className="rounded-xl p-3" style={{ background: C.leafDeep + '12' }}>
        <div className="text-[10px] uppercase tracking-wider font-medium mb-1" style={{ color: C.leaf }}>Conseil</div>
        <p className="text-sm" style={{ color: C.inkMid }}>{info.tip}</p>
      </div>

      <div className="flex gap-2 pt-1">
        {stage >= 2 && (
          <button
            onClick={onTransplant}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:brightness-110 flex-1"
            style={{ background: C.leaf }}
          >
            <ArrowRightLeft className="w-4 h-4" />
            Repiquer au jardin
          </button>
        )}
        <button
          onClick={onRemove}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:brightness-95"
          style={{ background: C.terraPal, color: C.terraDk }}
        >
          <Trash2 className="w-4 h-4" />
          Supprimer
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                         */
/* ------------------------------------------------------------------ */
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="text-6xl mb-4">{'\uD83C\uDF31'}</div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: C.ink }}>Aucun semis en cours</h3>
      <p className="text-sm mb-6 max-w-xs" style={{ color: C.inkSoft }}>
        Commencez par ajouter votre premier semis pour suivre sa croissance en 3D.
      </p>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:brightness-110 shadow-md"
        style={{ background: C.leaf }}
      >
        <Plus className="w-4 h-4" />
        Nouveau semis
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main view                                                           */
/* ------------------------------------------------------------------ */
export function SemisView() {
  const { config, addSeedling, removeSeedling, transplantSeedling, isLoaded } = useGarden();
  const { plants, isLoading: plantsLoading } = usePlants();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showSowModal, setShowSowModal] = useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const seedlings = config.seedlings || [];

  // Keep selection valid
  useEffect(() => {
    if (selectedId && !seedlings.find(s => s.id === selectedId)) {
      setSelectedId(seedlings.length > 0 ? seedlings[0].id : null);
    }
  }, [seedlings, selectedId]);

  // Auto-select first seedling
  useEffect(() => {
    if (!selectedId && seedlings.length > 0) {
      setSelectedId(seedlings[0].id);
    }
  }, [seedlings.length, selectedId]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    const seedling = seedlings.find(s => s.id === selectedId);
    if (!seedling) return null;
    const plant = plants.find(p => p.id === seedling.plantId);
    if (!plant) return null;
    return { seedling, plant };
  }, [selectedId, seedlings, plants]);

  const handleSow = useCallback((plantId: string, date: string, pots: number) => {
    const id = `seedling-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    addSeedling({ id, plantId, seededAt: date, pots });
    setSelectedId(id);
    setShowSowModal(false);
  }, [addSeedling]);

  const handleRemove = useCallback((seedlingId: string) => {
    removeSeedling(seedlingId);
  }, [removeSeedling]);

  const handleTransplant = useCallback((seedlingId: string) => {
    // Place at center of garden
    const x = 50;
    const z = 50;
    transplantSeedling(seedlingId, x, z);
  }, [transplantSeedling]);

  if (!isLoaded || plantsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="text-4xl">{'\uD83C\uDF31'}</div>
          <p className="text-sm" style={{ color: C.inkSoft }}>Chargement des semis...</p>
        </div>
      </div>
    );
  }

  if (seedlings.length === 0) {
    return (
      <>
        <div className="min-h-screen" style={{ background: `linear-gradient(180deg, ${C.paper} 0%, ${C.paperMid} 100%)` }}>
          <div className="px-4 md:px-8 pt-6 pb-4">
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: C.ink }}>{'\uD83C\uDF31'} Mes Semis</h1>
            <p className="text-sm mt-1" style={{ color: C.inkSoft }}>Suivez la croissance de vos semis en 3D</p>
          </div>
          <EmptyState onAdd={() => setShowSowModal(true)} />
        </div>
        {showSowModal && <SowModal plants={plants} onSow={handleSow} onClose={() => setShowSowModal(false)} />}
      </>
    );
  }

  return (
    <>
      <div
        className="min-h-screen pb-20 md:pb-8"
        style={{ background: `linear-gradient(180deg, ${C.paper} 0%, ${C.paperMid} 100%)` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-8 pt-6 pb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: C.ink }}>{'\uD83C\uDF31'} Mes Semis</h1>
            <p className="text-sm mt-1" style={{ color: C.inkSoft }}>{seedlings.length} semis en cours</p>
          </div>
          <button
            onClick={() => setShowSowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:brightness-110 shadow-md"
            style={{ background: C.leaf }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Semer</span>
          </button>
        </div>

        {/* ============= DESKTOP LAYOUT ============= */}
        <div className="hidden md:grid md:grid-cols-[280px_1fr] gap-5 px-8">
          {/* Left panel: seedling list */}
          <div className="space-y-2 max-h-[calc(100vh-160px)] overflow-y-auto pr-1">
            {seedlings.map((s) => {
              const plant = plants.find(p => p.id === s.plantId);
              if (!plant) return null;
              return (
                <SeedlingCard
                  key={s.id}
                  seedling={s}
                  plant={plant}
                  isSelected={s.id === selectedId}
                  onSelect={() => setSelectedId(s.id)}
                />
              );
            })}
          </div>

          {/* Right: 3D viewer + info */}
          <div className="space-y-5">
            <div
              className="rounded-2xl overflow-hidden shadow-lg"
              style={{
                height: '420px',
                background: `linear-gradient(180deg, ${C.paper} 0%, ${C.paperMid} 100%)`,
                border: `1px solid ${C.dew}`,
              }}
            >
              {selected && (
                <Suspense
                  fallback={
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="animate-pulse text-2xl">{'\uD83C\uDF31'}</div>
                    </div>
                  }
                >
                  <Canvas camera={{ position: [0, 0.5, 1.3], fov: 40 }} shadows>
                    <SeedlingScene3D plant={selected.plant} seededAt={selected.seedling.seededAt} />
                  </Canvas>
                </Suspense>
              )}
            </div>

            {selected && (
              <InfoPanel
                seedling={selected.seedling}
                plant={selected.plant}
                onRemove={() => handleRemove(selected.seedling.id)}
                onTransplant={() => handleTransplant(selected.seedling.id)}
              />
            )}
          </div>
        </div>

        {/* ============= MOBILE LAYOUT ============= */}
        <div className="md:hidden">
          <div
            style={{
              height: '50vh',
              background: `linear-gradient(180deg, ${C.paper} 0%, ${C.paperMid} 100%)`,
            }}
          >
            {selected && (
              <Suspense
                fallback={
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="animate-pulse text-2xl">{'\uD83C\uDF31'}</div>
                  </div>
                }
              >
                <Canvas camera={{ position: [0, 0.5, 1.3], fov: 40 }} shadows>
                  <SeedlingScene3D plant={selected.plant} seededAt={selected.seedling.seededAt} />
                </Canvas>
              </Suspense>
            )}
          </div>

          <div className="px-4 py-3">
            <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
              {seedlings.map((s) => {
                const plant = plants.find(p => p.id === s.plantId);
                if (!plant) return null;
                return (
                  <div key={s.id} className="snap-start">
                    <SeedlingCard
                      seedling={s}
                      plant={plant}
                      isSelected={s.id === selectedId}
                      onSelect={() => {
                        setSelectedId(s.id);
                        setMobileDetailOpen(true);
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {selected && (
            <div className="px-4">
              <button
                onClick={() => setMobileDetailOpen(!mobileDetailOpen)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-colors mb-3"
                style={{ background: C.dew, color: C.inkMid }}
              >
                <ChevronUp
                  className="w-4 h-4 transition-transform"
                  style={{ transform: mobileDetailOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
                {mobileDetailOpen ? 'Masquer les details' : 'Voir les details'}
              </button>

              {mobileDetailOpen && (
                <div className="pb-4">
                  <InfoPanel
                    seedling={selected.seedling}
                    plant={selected.plant}
                    onRemove={() => handleRemove(selected.seedling.id)}
                    onTransplant={() => handleTransplant(selected.seedling.id)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showSowModal && <SowModal plants={plants} onSow={handleSow} onClose={() => setShowSowModal(false)} />}
    </>
  );
}
