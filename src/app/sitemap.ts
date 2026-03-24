import { MetadataRoute } from 'next';
import { getAllPlants } from '@/lib/garden-utils';

const BASE_URL = 'https://gardensaas.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/pricing`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/plants`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/auth/login`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/auth/register`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/garden/setup`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/garden/planner`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/garden/3d`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/garden/advisor`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/garden/dashboard`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/garden/tips`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  // Add all individual plant pages (300+ unique growing guides)
  const plants = getAllPlants();
  const plantRoutes: MetadataRoute.Sitemap = plants.map((plant) => ({
    url: `${BASE_URL}/plants/${plant.id}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...plantRoutes];
}
