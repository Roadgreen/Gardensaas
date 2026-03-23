'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Plant, PlantedItem, RaisedBed, GardenZone } from '@/types';
import { RAISED_BED_SOIL_LABELS, SOIL_LABELS } from '@/types';

interface PlantInfoPanelProps {
  plant: Plant;
  plantedDate: string;
  allPlants: Plant[];
  plantedItems?: PlantedItem[];
  gardenLength?: number;
  gardenWidth?: number;
  raisedBedId?: string;
  raisedBeds?: RaisedBed[];
  varietyId?: string;
  zoneId?: string;
  zones?: GardenZone[];
  onClose: () => void;
  onRemove?: () => void;
}

const SUN_ICONS: Record<string, string> = {
  'full-sun': '\u2600\uFE0F',
  'partial-shade': '\u26C5',
  'full-shade': '\uD83C\uDF27\uFE0F',
};

// Sun and water labels are now loaded via translations (garden3d.infoPanel)

const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const;

// FR translations for common English growing tips
const TIPS_EN_TO_FR: Record<string, string> = {
  'Pinch off suckers for bigger fruits': 'Supprimez les gourmands pour de plus gros fruits',
  'Water at the base, not the leaves': 'Arrosez à la base, pas sur les feuilles',
  'Add calcium to prevent blossom end rot': 'Ajoutez du calcium pour éviter la pourriture apicale',
  'Stake or cage plants early for support': 'Tuteurez ou installez des cages tôt pour soutenir les plants',
  'Keep soil consistently moist for even growth': 'Maintenez le sol constamment humide pour une croissance régulière',
  'Thin seedlings to proper spacing': 'Éclaircissez les semis au bon espacement',
  'Harvest outer leaves for continuous production': 'Récoltez les feuilles extérieures pour une production continue',
  'Provide afternoon shade in hot weather': 'Protégez du soleil de l\'après-midi par temps chaud',
  'Pinch flower buds to promote leaf growth': 'Pincez les boutons floraux pour favoriser la croissance des feuilles',
  'Harvest from the top down': 'Récoltez de haut en bas',
  'Start seeds indoors 8 weeks before last frost': 'Semez en intérieur 8 semaines avant les dernières gelées',
  'Use black plastic mulch to warm soil': 'Utilisez du paillage plastique noir pour réchauffer le sol',
  'Harvest when 15-20cm long for best flavor': 'Récoltez à 15-20 cm de long pour le meilleur goût',
  'Provide a trellis for vertical growing': 'Installez un treillis pour la culture verticale',
  'Stop watering when tops begin to fall over': 'Arrêtez d\'arroser quand les fanes commencent à tomber',
  'Plant individual cloves pointy side up': 'Plantez les gousses individuelles pointe vers le haut',
  'Sow every 2 weeks for continuous harvest': 'Semez toutes les 2 semaines pour une récolte continue',
  'Grows best in cool weather below 24C': 'Pousse mieux par temps frais, en dessous de 24°C',
  'Provide support for climbing varieties': 'Installez un support pour les variétés grimpantes',
  'Do not soak seeds before planting': 'Ne faites pas tremper les graines avant de planter',
  'Hill soil around stems to increase yield': 'Buttez le sol autour des tiges pour augmenter le rendement',
  'Harvest when skin is glossy and firm': 'Récoltez quand la peau est brillante et ferme',
  'Use collars to protect from cabbage root fly': 'Utilisez des collerettes pour protéger de la mouche du chou',
  'Harvest before flower buds open': 'Récoltez avant que les boutons floraux s\'ouvrent',
  'Plant in blocks of at least 4x4 for pollination': 'Plantez en blocs d\'au moins 4x4 pour la pollinisation',
  'Remove runners for larger berries': 'Supprimez les stolons pour de plus grosses baies',
  'Prefers well-drained soil': 'Préfère un sol bien drainé',
  'Cut back after flowering': 'Taillez après la floraison',
  'Grow in a pot to control spreading': 'Cultivez en pot pour contrôler l\'envahissement',
  'Soak seeds overnight for faster germination': 'Faites tremper les graines une nuit pour germer plus vite',
  'Cut to 5cm above ground for regrowth': 'Coupez à 5 cm du sol pour la repousse',
  'Replace plants every 4-5 years': 'Remplacez les plants tous les 4-5 ans',
  'Flavor intensifies when dried': 'La saveur s\'intensifie à la dessiccation',
  'Harvest lower leaves first': 'Récoltez les feuilles inférieures en premier',
  'Each seed cluster produces multiple seedlings - thin early': 'Chaque grappe de graines produit plusieurs semis - éclaircissez tôt',
  'Harvest small for sweetest flavor': 'Récoltez petit pour la saveur la plus douce',
  'Plant deep or hill soil for longer white stems': 'Plantez profond ou buttez pour de plus longs tiges blanches',
  'Needs rich, moisture-retentive soil': 'Nécessite un sol riche et retenteur d\'humidité',
  'Sow directly - does not transplant well': 'Semez en place - ne se transplante pas bien',
  'Sow every 3 weeks for continuous supply': 'Semez toutes les 3 semaines pour un approvisionnement continu',
  'Stake tall varieties against wind': 'Tuteurez les variétés hautes contre le vent',
  'Needs lots of space to sprawl': 'Nécessite beaucoup d\'espace pour s\'étaler',
  'Thump test - ripe melons sound hollow': 'Test de percussion - les melons mûrs sonnent creux',
  'Provide a trellis or support system': 'Installez un treillis ou un système de support',
  'Needs excellent drainage': 'Nécessite un excellent drainage',
  'Use fresh seed each year as viability drops quickly': 'Utilisez des graines fraîches chaque année car la viabilité baisse vite',
  'Can become invasive - harvest all tubers or contain': 'Peut devenir envahissant - récoltez tous les tubercules ou contenerisez',
};

function getLocalizedTip(tip: string, locale: string): string {
  if (locale !== 'fr') return tip;
  return TIPS_EN_TO_FR[tip] || tip;
}

export function PlantInfoPanel({ plant, plantedDate, allPlants, plantedItems, gardenLength, gardenWidth, raisedBedId, raisedBeds, varietyId, zoneId, zones, onClose, onRemove }: PlantInfoPanelProps) {
  const locale = useLocale();
  const t = useTranslations('garden3d.infoPanel');
  const tMonths = useTranslations('garden3d.months');
  const tCat = useTranslations('garden3d.categories');
  const tDiff = useTranslations('garden3d.difficulties');
  const daysPlanted = useMemo(() => {
    const now = new Date();
    const planted = new Date(plantedDate);
    return Math.floor((now.getTime() - planted.getTime()) / (1000 * 60 * 60 * 24));
  }, [plantedDate]);

  const progress = Math.min(daysPlanted / plant.harvestDays, 1);
  const isHarvest = progress >= 1;

  const rowSpacing = plant.rowSpacingCm || Math.round(plant.spacingCm * 1.5);

  const companionNames = useMemo(() =>
    plant.companionPlants.map((id) => {
      const p = allPlants.find((ap) => ap.id === id);
      return p ? (locale === 'fr' ? p.name.fr : p.name.en) : id;
    }),
  [plant.companionPlants, allPlants, locale]);

  const enemyNames = useMemo(() =>
    plant.enemyPlants.map((id) => {
      const p = allPlants.find((ap) => ap.id === id);
      return p ? (locale === 'fr' ? p.name.fr : p.name.en) : id;
    }),
  [plant.enemyPlants, allPlants, locale]);

  const plantingMonthsStr = useMemo(() =>
    plant.plantingMonths.map((m) => tMonths(MONTH_KEYS[m - 1])).join(', '),
  [plant.plantingMonths, tMonths]);

  // Compute nearby plants and warnings
  const nearbyAnalysis = useMemo(() => {
    if (!plantedItems || !gardenLength || !gardenWidth) return null;

    // Find this plant's position
    const thisItem = plantedItems.find(
      (item) => item.plantId === plant.id && item.plantedDate === plantedDate
    );
    if (!thisItem) return null;

    const halfL = gardenLength / 2;
    const halfW = gardenWidth / 2;
    const thisX = -halfL + (thisItem.x / 100) * gardenLength;
    const thisZ = -halfW + (thisItem.z / 100) * gardenWidth;

    const nearby: Array<{ name: string; distance: number; isCompanion: boolean; isEnemy: boolean; tooClose: boolean }> = [];

    plantedItems.forEach((item) => {
      if (item === thisItem) return;
      const otherPlant = allPlants.find((p) => p.id === item.plantId);
      if (!otherPlant) return;

      const otherX = -halfL + (item.x / 100) * gardenLength;
      const otherZ = -halfW + (item.z / 100) * gardenWidth;
      const distance = Math.sqrt((thisX - otherX) ** 2 + (thisZ - otherZ) ** 2);

      if (distance < 2) {
        const requiredDist = (plant.spacingCm + otherPlant.spacingCm) / 100 / 2;
        nearby.push({
          name: locale === 'fr' ? otherPlant.name.fr : otherPlant.name.en,
          distance: Math.round(distance * 100),
          isCompanion: plant.companionPlants.includes(otherPlant.id),
          isEnemy: plant.enemyPlants.includes(otherPlant.id),
          tooClose: distance < requiredDist,
        });
      }
    });

    return nearby;
  }, [plantedItems, gardenLength, gardenWidth, plant, plantedDate, allPlants]);

  const panelContent = (
    <>
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'rgba(255,255,255,0.1)',
          border: 'none',
          borderRadius: '8px',
          color: '#9CA3AF',
          cursor: 'pointer',
          padding: '4px 8px',
          fontSize: '14px',
          fontFamily: '"Nunito", system-ui, sans-serif',
        }}
      >
        {'\u2715'}
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '12px',
          background: `linear-gradient(135deg, ${plant.color}, ${plant.color}88)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid rgba(255,255,255,0.2)',
          fontSize: '24px',
        }}>
          {plant.category === 'vegetable' ? '\uD83E\uDD66' :
           plant.category === 'herb' ? '\uD83C\uDF3F' :
           plant.category === 'fruit' ? '\uD83C\uDF53' :
           plant.category === 'root' ? '\uD83E\uDD55' : '\uD83C\uDF31'}
        </div>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#86EFAC' }}>
            {locale === 'fr' ? plant.name.fr : plant.name.en}
          </div>
          <div style={{ fontSize: '13px', color: '#6EE7B7', opacity: 0.7 }}>
            {plant.name.fr}
          </div>
          <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px', textTransform: 'capitalize' }}>
            {tCat.has(plant.category) ? tCat(plant.category as Parameters<typeof tCat>[0]) : plant.category} - {tDiff.has(plant.difficulty) ? tDiff(plant.difficulty as Parameters<typeof tDiff>[0]) : plant.difficulty}
          </div>
        </div>
      </div>

      {/* Description */}
      <div style={{
        fontSize: '12px', color: '#D1D5DB', lineHeight: '1.5',
        padding: '10px', borderRadius: '10px',
        background: 'rgba(0,0,0,0.2)',
        marginBottom: '14px',
      }}>
        {locale === 'fr' ? plant.description.fr : plant.description.en}
      </div>

      {/* Variety indicator */}
      {varietyId && plant.varieties && (() => {
        const variety = plant.varieties.find(v => v.id === varietyId);
        if (!variety) return null;
        return (
          <div style={{
            marginBottom: '14px', padding: '10px', borderRadius: '10px',
            background: 'rgba(168, 85, 247, 0.1)',
            border: '1px solid rgba(168, 85, 247, 0.25)',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <div style={{
              width: '24px', height: '24px', borderRadius: '6px',
              background: variety.color || plant.color,
              border: '1px solid rgba(255,255,255,0.15)',
            }} />
            <div>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#C084FC' }}>
                {t('variety', { name: locale === 'fr' ? variety.name.fr : variety.name.en })}
              </div>
              {variety.description && (
                <div style={{ fontSize: '9px', color: '#9CA3AF' }}>
                  {locale === 'fr' ? variety.description.fr : variety.description.en}
                </div>
              )}
              {variety.harvestDays && variety.harvestDays !== plant.harvestDays && (
                <div style={{ fontSize: '9px', color: '#A78BFA' }}>
                  {t('harvest', { days: variety.harvestDays })}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Zone indicator */}
      {zoneId && zones && (() => {
        const zone = zones.find(z => z.id === zoneId);
        if (!zone) return null;
        return (
          <div style={{
            marginBottom: '14px', padding: '10px', borderRadius: '10px',
            background: `${zone.color}15`,
            border: `1px solid ${zone.color}40`,
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <div style={{
              width: '12px', height: '12px', borderRadius: '3px',
              background: zone.color,
            }} />
            <div>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: zone.color }}>
                {t('zone', { name: zone.name })}
              </div>
              <div style={{ fontSize: '9px', color: '#9CA3AF' }}>
                {zone.lengthM}x{zone.widthM}m - {SOIL_LABELS[zone.soilType]}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Raised bed indicator */}
      {raisedBedId && raisedBeds && (() => {
        const bed = raisedBeds.find(b => b.id === raisedBedId);
        if (!bed) return null;
        return (
          <div style={{
            marginBottom: '14px', padding: '10px', borderRadius: '10px',
            background: 'rgba(210, 160, 108, 0.1)',
            border: '1px solid rgba(210, 160, 108, 0.25)',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{ fontSize: '16px' }}>{'\uD83E\uDDF1'}</span>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#D4A06C' }}>
                {t('plantedIn', { name: bed.name })}
              </div>
              <div style={{ fontSize: '9px', color: '#9CA3AF' }}>
                {bed.lengthM}x{bed.widthM}m - {RAISED_BED_SOIL_LABELS[bed.soilType]}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Progress bar */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{t('growthProgress')}</span>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: isHarvest ? '#FFD700' : '#4ADE80' }}>
            {Math.round(progress * 100)}% - {t('day', { current: daysPlanted, total: plant.harvestDays })}
          </span>
        </div>
        <div style={{
          background: '#1F2937', borderRadius: '6px', height: '8px', overflow: 'hidden',
        }}>
          <div style={{
            background: isHarvest
              ? 'linear-gradient(90deg, #FFD700, #FFA500)'
              : 'linear-gradient(90deg, #4ADE80, #22C55E)',
            height: '100%',
            width: `${Math.min(progress * 100, 100)}%`,
            borderRadius: '6px',
            transition: 'width 0.3s',
          }} />
        </div>
      </div>

      {/* Spacing info - prominent section */}
      <div style={{
        marginBottom: '14px', padding: '12px', borderRadius: '12px',
        background: 'rgba(168, 85, 247, 0.08)',
        border: '1px solid rgba(168, 85, 247, 0.25)',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#C084FC', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {'\uD83D\uDCCF'} {t('spacingReqs')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div style={{
            padding: '8px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.1)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#C084FC' }}>{plant.spacingCm} cm</div>
            <div style={{ fontSize: '9px', color: '#9CA3AF' }}>{t('betweenPlants')}</div>
          </div>
          <div style={{
            padding: '8px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.1)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#A78BFA' }}>{rowSpacing} cm</div>
            <div style={{ fontSize: '9px', color: '#9CA3AF' }}>{t('betweenRows')}</div>
          </div>
        </div>
        <div style={{ marginTop: '6px', fontSize: '10px', color: '#9CA3AF', textAlign: 'center' }}>
          {t('plantDepth', { depth: plant.depthCm, height: plant.heightCm })}
        </div>
      </div>

      {/* Sun & Water needs */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
        marginBottom: '14px',
      }}>
        <div style={{
          padding: '10px', borderRadius: '10px',
          background: 'rgba(251, 191, 36, 0.08)',
          border: '1px solid rgba(251, 191, 36, 0.15)',
        }}>
          <div style={{ fontSize: '18px', marginBottom: '4px' }}>
            {SUN_ICONS[plant.sunExposure[0]] || '\u2600\uFE0F'}
          </div>
          <div style={{ fontSize: '9px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('sunNeeds')}</div>
          <div style={{ fontSize: '11px', color: '#FBBF24', fontWeight: 'bold' }}>
            {plant.sunExposure.map(s => {
              const keyMap: Record<string, string> = { 'full-sun': 'fullSun', 'partial-shade': 'partialShade', 'full-shade': 'fullShade' };
              const key = keyMap[s];
              return key ? t(key as Parameters<typeof t>[0]) : s.replace(/-/g, ' ');
            }).join(', ')}
          </div>
        </div>
        <div style={{
          padding: '10px', borderRadius: '10px',
          background: 'rgba(96, 165, 250, 0.08)',
          border: '1px solid rgba(96, 165, 250, 0.15)',
        }}>
          <div style={{ fontSize: '18px', marginBottom: '4px' }}>{'\uD83D\uDCA7'}</div>
          <div style={{ fontSize: '9px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('waterNeeds')}</div>
          <div style={{ fontSize: '11px', color: '#60A5FA', fontWeight: 'bold' }}>
            {(() => {
              const keyMap: Record<string, string> = { 'daily': 'daily', 'every-2-days': 'every2days', 'twice-weekly': 'twiceWeekly', 'weekly': 'weekly' };
              const key = keyMap[plant.wateringFrequency];
              return key ? t(key as Parameters<typeof t>[0]) : plant.wateringFrequency.replace(/-/g, ' ');
            })()}
          </div>
        </div>
      </div>

      {/* Nearby plant analysis */}
      {nearbyAnalysis && nearbyAnalysis.length > 0 && (
        <div style={{
          marginBottom: '14px', padding: '10px', borderRadius: '10px',
          background: 'rgba(0,0,0,0.15)',
          border: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {'\uD83D\uDC40'} {t('nearbyPlants')}
          </div>
          {nearbyAnalysis.map((n, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '4px 8px', borderRadius: '6px', marginBottom: '3px',
              background: n.isEnemy ? 'rgba(239, 68, 68, 0.1)' : n.isCompanion ? 'rgba(74, 222, 128, 0.1)' : 'transparent',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px' }}>
                  {n.isEnemy ? '\u26A0\uFE0F' : n.isCompanion ? '\uD83E\uDD1D' : '\uD83C\uDF31'}
                </span>
                <span style={{
                  fontSize: '11px',
                  color: n.isEnemy ? '#FCA5A5' : n.isCompanion ? '#86EFAC' : '#D1D5DB',
                }}>
                  {n.name}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {n.tooClose && (
                  <span style={{ fontSize: '9px', color: '#F87171', fontWeight: 'bold' }}>{t('tooClose')}</span>
                )}
                <span style={{ fontSize: '10px', color: '#6B7280' }}>{n.distance}cm</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Planting months */}
      <div style={{
        marginBottom: '14px', padding: '10px', borderRadius: '10px',
        background: 'rgba(74, 222, 128, 0.08)',
        border: '1px solid rgba(74, 222, 128, 0.15)',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {'\uD83D\uDCC5'} {t('bestPlantingMonths')}
        </div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {MONTH_KEYS.map((mk, i) => {
            const isActive = plant.plantingMonths.includes(i + 1);
            const isCurrentMonth = new Date().getMonth() === i;
            return (
              <span key={mk} style={{
                padding: '2px 6px', borderRadius: '4px', fontSize: '10px',
                background: isActive ? 'rgba(74, 222, 128, 0.3)' : 'rgba(0,0,0,0.2)',
                color: isActive ? '#86EFAC' : '#6B7280',
                fontWeight: isActive ? 'bold' : 'normal',
                border: isCurrentMonth ? '1px solid rgba(251, 191, 36, 0.5)' : '1px solid transparent',
              }}>
                {tMonths(mk)}
              </span>
            );
          })}
        </div>
      </div>

      {/* Soil types */}
      <div style={{
        marginBottom: '14px', padding: '10px', borderRadius: '10px',
        background: 'rgba(139, 105, 20, 0.1)',
        border: '1px solid rgba(139, 105, 20, 0.2)',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {'\uD83E\uDEA8'} {t('preferredSoils')}
        </div>
        <div style={{ fontSize: '12px', color: '#D4A06C' }}>
          {plant.soilTypes.map(s => t.has(`soils.${s}` as Parameters<typeof t>[0]) ? t(`soils.${s}` as Parameters<typeof t>[0]) : s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}
        </div>
      </div>

      {/* Companion plants */}
      {companionNames.length > 0 && (
        <div style={{
          marginBottom: '10px', padding: '10px', borderRadius: '10px',
          background: 'rgba(34, 197, 94, 0.08)',
          border: '1px solid rgba(34, 197, 94, 0.15)',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {'\uD83E\uDD1D'} {t('companionPlants')}
          </div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {companionNames.map((name) => (
              <span key={name} style={{
                padding: '2px 8px', borderRadius: '6px', fontSize: '11px',
                background: 'rgba(74, 222, 128, 0.2)',
                color: '#86EFAC',
              }}>
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Enemy plants */}
      {enemyNames.length > 0 && (
        <div style={{
          marginBottom: '10px', padding: '10px', borderRadius: '10px',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.15)',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {'\u26A0\uFE0F'} {t('keepAwayFrom')}
          </div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {enemyNames.map((name) => (
              <span key={name} style={{
                padding: '2px 8px', borderRadius: '6px', fontSize: '11px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#FCA5A5',
              }}>
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      {plant.tips.length > 0 && (
        <div style={{
          padding: '10px', borderRadius: '10px',
          background: 'rgba(251, 191, 36, 0.06)',
          border: '1px solid rgba(251, 191, 36, 0.15)',
          marginBottom: onRemove ? '14px' : '0',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {'\uD83D\uDCA1'} {t('growingTips')}
          </div>
          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#FBBF24', lineHeight: '1.6' }}>
            {plant.tips.map((tip, i) => (
              <li key={i}>{getLocalizedTip(tip, locale)}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Remove button */}
      {onRemove && (
        <button
          onClick={onRemove}
          style={{
            width: '100%', padding: '8px', borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#FCA5A5', cursor: 'pointer', fontSize: '12px',
            fontFamily: '"Nunito", system-ui, sans-serif',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            transition: 'all 0.15s',
          }}
        >
          {'\uD83D\uDDD1\uFE0F'} {t('removePlant')}
        </button>
      )}
    </>
  );

  return (
    <>
      {/* Mobile: semi-transparent backdrop */}
      <div
        className="plant-info-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Mobile: bottom sheet / Desktop: floating panel */}
      <div className="plant-info-panel" style={{ fontFamily: '"Nunito", system-ui, sans-serif', color: 'white' }}>
        {panelContent}
      </div>
    </>
  );
}
