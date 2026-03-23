import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PlantDetail } from '@/components/plants/plant-detail';
import { getPlantById, getAllPlants } from '@/lib/garden-utils';
import { getLocale } from 'next-intl/server';

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
  return {
    title: `${locale === 'fr' ? plant.name.fr : plant.name.en} - Growing Guide`,
    description: locale === 'fr' ? plant.description.fr : plant.description.en,
  };
}

export default async function PlantPage({ params }: Props) {
  const { id } = await params;
  const plant = getPlantById(id);
  if (!plant) notFound();
  return <PlantDetail plant={plant} />;
}
