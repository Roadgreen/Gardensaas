/**
 * Centralized plant image URLs from Unsplash.
 * Used across all views (2D planner, 3D view, semis, modals, cards).
 */

const PLANT_IMAGES: Record<string, string> = {
  // Légumes
  tomato: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=80&h=80&fit=crop',
  zucchini: 'https://images.unsplash.com/photo-1563252722-6434563a2154?w=80&h=80&fit=crop',
  carrot: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=80&h=80&fit=crop',
  lettuce: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=80&h=80&fit=crop',
  pepper: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=80&h=80&fit=crop',
  eggplant: 'https://images.unsplash.com/photo-1615484477778-ca3b77940c25?w=80&h=80&fit=crop',
  cucumber: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=80&h=80&fit=crop',
  bean: 'https://images.unsplash.com/photo-1567375698348-5d9d5ae3eab4?w=80&h=80&fit=crop',
  pea: 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=80&h=80&fit=crop',
  radish: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=80&h=80&fit=crop',
  cabbage: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=80&h=80&fit=crop',
  parsley: 'https://images.unsplash.com/photo-1536161547-3e2b7f766241?w=80&h=80&fit=crop',
  basil: 'https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=80&h=80&fit=crop',
  mint: 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=80&h=80&fit=crop',
  chive: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=80&h=80&fit=crop',
  garlic: 'https://images.unsplash.com/photo-1501420193726-1e3f8978a68a?w=80&h=80&fit=crop',
  onion: 'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=80&h=80&fit=crop',
  leek: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=80&h=80&fit=crop',
  beet: 'https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?w=80&h=80&fit=crop',
  spinach: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=80&h=80&fit=crop',
  // Fruits
  strawberry: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=80&h=80&fit=crop',
  corn: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=80&h=80&fit=crop',
  potato: 'https://images.unsplash.com/photo-1518977676601-b53f82ber29?w=80&h=80&fit=crop',
  broccoli: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=80&h=80&fit=crop',
  pumpkin: 'https://images.unsplash.com/photo-1570586437263-ab629fccc818?w=80&h=80&fit=crop',
  squash: 'https://images.unsplash.com/photo-1570586437263-ab629fccc818?w=80&h=80&fit=crop',
  melon: 'https://images.unsplash.com/photo-1571575173700-afb9492e6a50?w=80&h=80&fit=crop',
  watermelon: 'https://images.unsplash.com/photo-1563114773-84221bd62daa?w=80&h=80&fit=crop',
  // Herbes
  rosemary: 'https://images.unsplash.com/photo-1515586000433-45406d8e6662?w=80&h=80&fit=crop',
  thyme: 'https://images.unsplash.com/photo-1509223197845-458d87a6bfcc?w=80&h=80&fit=crop',
  sage: 'https://images.unsplash.com/photo-1600411833196-7c1f6b1a8b90?w=80&h=80&fit=crop',
  oregano: 'https://images.unsplash.com/photo-1606178398039-99aab4ad6d83?w=80&h=80&fit=crop',
  coriander: 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=80&h=80&fit=crop',
  dill: 'https://images.unsplash.com/photo-1599409636295-e3cf3538f212?w=80&h=80&fit=crop',
  // Fruits d'arbres
  apple: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=80&h=80&fit=crop',
  pear: 'https://images.unsplash.com/photo-1514756331096-242fdeb70d4a?w=80&h=80&fit=crop',
  cherry: 'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=80&h=80&fit=crop',
  grape: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=80&h=80&fit=crop',
  lemon: 'https://images.unsplash.com/photo-1590502593747-42a996133562?w=80&h=80&fit=crop',
  // Autres
  sunflower: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=80&h=80&fit=crop',
  turnip: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=80&h=80&fit=crop',
  cauliflower: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=80&h=80&fit=crop',
  artichoke: 'https://images.unsplash.com/photo-1580294672675-91afc3c92784?w=80&h=80&fit=crop',
  asparagus: 'https://images.unsplash.com/photo-1515471209610-dae1c92d8777?w=80&h=80&fit=crop',
  celery: 'https://images.unsplash.com/photo-1580391564590-aeca65c5e2d3?w=80&h=80&fit=crop',
  fennel: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=80&h=80&fit=crop',
  lavender: 'https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=80&h=80&fit=crop',
};

/**
 * Get an Unsplash image URL for a plant by its ID.
 * Falls back to a generic vegetable image if no match found.
 */
export function getPlantImageUrl(plantId: string): string | null {
  // Direct match
  if (PLANT_IMAGES[plantId]) return PLANT_IMAGES[plantId];
  // Partial match (e.g. "cherry-tomato" matches "tomato")
  for (const [key, url] of Object.entries(PLANT_IMAGES)) {
    if (plantId.includes(key)) return url;
  }
  return null;
}

/**
 * Get an Unsplash image URL at a specific size.
 */
export function getPlantImageUrlSized(plantId: string, size: number): string | null {
  const url = getPlantImageUrl(plantId);
  if (!url) return null;
  return url.replace(/w=\d+&h=\d+/, `w=${size}&h=${size}`);
}
