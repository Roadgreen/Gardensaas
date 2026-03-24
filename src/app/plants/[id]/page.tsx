import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PlantDetail } from '@/components/plants/plant-detail';
import { getPlantById, getAllPlants } from '@/lib/garden-utils';
import { getLocale } from 'next-intl/server';
import type { Plant } from '@/types';

const SITE_URL = 'https://gardensaas.vercel.app';

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_NAMES_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

const WATERING_LABELS: Record<string, { en: string; fr: string }> = {
  'daily': { en: 'daily', fr: 'quotidiennement' },
  'every-2-days': { en: 'every 2 days', fr: 'tous les 2 jours' },
  'twice-weekly': { en: 'twice a week', fr: 'deux fois par semaine' },
  'weekly': { en: 'once a week', fr: 'une fois par semaine' },
};

const DIFFICULTY_FR: Record<string, string> = {
  'easy': 'facile',
  'medium': 'moyen',
  'hard': 'difficile',
};

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const plants = getAllPlants();
  return plants.map((plant) => ({ id: plant.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const plant = getPlantById(id);
  if (!plant) return { title: 'Plant Not Found' };
  const locale = await getLocale();
  const name = locale === 'fr' ? plant.name.fr : plant.name.en;
  const description = locale === 'fr' ? plant.description.fr : plant.description.en;
  const url = `${SITE_URL}/plants/${plant.id}`;
  return {
    title: locale === 'fr'
      ? `${name} — Guide de culture et conseils de jardinage`
      : `${name} — Growing Guide & Garden Tips`,
    description,
    keywords: locale === 'fr'
      ? [`cultiver ${name}`, `plantation ${name}`, `guide ${name}`, 'potager', 'jardinage']
      : [`grow ${name}`, `plant ${name}`, `${name} growing guide`, 'vegetable garden', 'gardening'],
    openGraph: {
      title: locale === 'fr' ? `Comment cultiver ${name}` : `How to Grow ${name}`,
      description,
      url,
      type: 'article',
    },
    alternates: {
      canonical: url,
    },
  };
}

function buildJsonLd(plant: Plant, locale: string) {
  const isFr = locale === 'fr';
  const name = isFr ? plant.name.fr : plant.name.en;
  const description = isFr ? plant.description.fr : plant.description.en;
  const url = `${SITE_URL}/plants/${plant.id}`;
  const monthNames = isFr ? MONTH_NAMES_FR : MONTH_NAMES_EN;
  const plantingMonthStr = plant.plantingMonths.map((m) => monthNames[m - 1]).join(', ');
  const wateringLabel = WATERING_LABELS[plant.wateringFrequency]?.[isFr ? 'fr' : 'en'] ?? plant.wateringFrequency;

  // Build HowTo steps from real plant data
  const steps = [];
  let pos = 1;

  steps.push({
    '@type': 'HowToStep',
    position: pos++,
    name: isFr ? 'Choisir le bon moment' : 'Choose the right time',
    text: isFr
      ? `Plantez ${name} pendant : ${plantingMonthStr}. La récolte prend environ ${plant.harvestDays} jours.`
      : `Plant ${name} during: ${plantingMonthStr}. Harvest takes approximately ${plant.harvestDays} days.`,
  });

  steps.push({
    '@type': 'HowToStep',
    position: pos++,
    name: isFr ? 'Préparer le sol' : 'Prepare the soil',
    text: isFr
      ? `${name} pousse mieux dans un sol ${plant.soilTypes.join(', ')}. Plantez les graines à ${plant.depthCm} cm de profondeur.`
      : `${name} grows best in ${plant.soilTypes.join(', ')} soil. Sow seeds ${plant.depthCm}cm deep.`,
  });

  steps.push({
    '@type': 'HowToStep',
    position: pos++,
    name: isFr ? 'Espacement et exposition' : 'Spacing and sunlight',
    text: isFr
      ? `Espacez les plants de ${plant.spacingCm} cm. ${name} a besoin de ${plant.sunExposure.join(', ')} et peut atteindre ${plant.heightCm} cm de hauteur.`
      : `Space plants ${plant.spacingCm}cm apart. ${name} needs ${plant.sunExposure.join(', ')} and can reach ${plant.heightCm}cm tall.`,
  });

  steps.push({
    '@type': 'HowToStep',
    position: pos++,
    name: isFr ? 'Arrosage' : 'Watering',
    text: isFr
      ? `Arrosez ${wateringLabel}. La difficulté de culture est ${DIFFICULTY_FR[plant.difficulty] ?? plant.difficulty}.`
      : `Water ${wateringLabel}. Growing difficulty is ${plant.difficulty}.`,
  });

  // Add each growing tip as a step
  for (const tip of plant.tips) {
    steps.push({
      '@type': 'HowToStep',
      position: pos++,
      name: isFr ? `Conseil : ${tip.slice(0, 50)}` : `Tip: ${tip.slice(0, 50)}`,
      text: tip,
    });
  }

  const harvestWeeks = Math.round(plant.harvestDays / 7);
  const totalTime = `P${harvestWeeks}W`;

  // Build companion planting FAQ
  const faqEntries = [];

  if (plant.companionPlants.length > 0) {
    const companions = plant.companionPlants.join(', ');
    faqEntries.push({
      '@type': 'Question',
      name: isFr
        ? `Quelles plantes associer avec ${name} ?`
        : `What are good companion plants for ${name}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: isFr
          ? `Les meilleurs compagnons pour ${name} sont : ${companions}. Ces plantes se protègent mutuellement des parasites et améliorent la croissance.`
          : `The best companion plants for ${name} are: ${companions}. These plants help protect each other from pests and improve growth.`,
      },
    });
  }

  if (plant.enemyPlants.length > 0) {
    const enemies = plant.enemyPlants.join(', ');
    faqEntries.push({
      '@type': 'Question',
      name: isFr
        ? `Quelles plantes éviter près de ${name} ?`
        : `What plants should not be grown near ${name}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: isFr
          ? `Évitez de planter ${enemies} près de ${name}. Ces plantes peuvent inhiber la croissance ou attirer des parasites.`
          : `Avoid planting ${enemies} near ${name}. These plants can inhibit growth or attract pests.`,
      },
    });
  }

  faqEntries.push({
    '@type': 'Question',
    name: isFr
      ? `Quand planter ${name} ?`
      : `When should I plant ${name}?`,
    acceptedAnswer: {
      '@type': 'Answer',
      text: isFr
        ? `Le meilleur moment pour planter ${name} est en ${plantingMonthStr}. La récolte se fait environ ${plant.harvestDays} jours après la plantation.`
        : `The best time to plant ${name} is during ${plantingMonthStr}. Harvest is approximately ${plant.harvestDays} days after planting.`,
    },
  });

  faqEntries.push({
    '@type': 'Question',
    name: isFr
      ? `Comment arroser ${name} ?`
      : `How often should I water ${name}?`,
    acceptedAnswer: {
      '@type': 'Answer',
      text: isFr
        ? `${name} doit être arrosé ${wateringLabel}. Adaptez la fréquence selon votre climat et la météo.`
        : `${name} should be watered ${wateringLabel}. Adjust frequency based on your climate and weather conditions.`,
    },
  });

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'GardenSaas',
          item: SITE_URL,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: isFr ? 'Encyclopédie des plantes' : 'Plant Encyclopedia',
          item: `${SITE_URL}/plants`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name,
        },
      ],
    },
    {
      '@type': 'HowTo',
      '@id': `${url}#howto`,
      name: isFr ? `Comment cultiver ${name}` : `How to Grow ${name}`,
      description: isFr
        ? `Guide complet pour cultiver ${name} dans votre potager : plantation, arrosage, récolte et conseils.`
        : `Complete guide to growing ${name} in your garden: planting, watering, harvesting, and expert tips.`,
      totalTime,
      step: steps,
      supply: [
        { '@type': 'HowToSupply', name: isFr ? `Graines de ${name}` : `${name} seeds` },
        { '@type': 'HowToSupply', name: isFr ? `Sol ${plant.soilTypes[0]}` : `${plant.soilTypes[0]} soil` },
      ],
      tool: [
        { '@type': 'HowToTool', name: isFr ? 'Arrosoir' : 'Watering can' },
        { '@type': 'HowToTool', name: isFr ? 'Transplantoir' : 'Trowel' },
      ],
    },
  ];

  if (faqEntries.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      mainEntity: faqEntries,
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

export default async function PlantPage({ params }: Props) {
  const { id } = await params;
  const plant = getPlantById(id);
  if (!plant) notFound();
  const locale = await getLocale();
  const jsonLd = buildJsonLd(plant, locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PlantDetail plant={plant} />
    </>
  );
}
