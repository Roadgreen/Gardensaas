import { NextResponse } from 'next/server';
import bioIntensive from '@/data/bio-intensive.json';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const RATE_LIMIT_MAP = new Map<string, { count: number; resetAt: number }>();

const PRO_DAILY_LIMIT = 10;

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = RATE_LIMIT_MAP.get(userId);

  if (!entry || now > entry.resetAt) {
    RATE_LIMIT_MAP.set(userId, {
      count: 1,
      resetAt: now + 24 * 60 * 60 * 1000,
    });
    return { allowed: true, remaining: PRO_DAILY_LIMIT - 1 };
  }

  if (entry.count >= PRO_DAILY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: PRO_DAILY_LIMIT - entry.count };
}

function getCurrentSeason(): { en: string; fr: string } {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return { en: 'spring', fr: 'printemps' };
  if (month >= 6 && month <= 8) return { en: 'summer', fr: 'ete' };
  if (month >= 9 && month <= 11) return { en: 'autumn', fr: 'automne' };
  return { en: 'winter', fr: 'hiver' };
}

function getMonthlyTips(locale: string): string {
  const month = String(new Date().getMonth() + 1) as keyof typeof bioIntensive.tips.monthly;
  const tips = bioIntensive.tips.monthly[month];
  if (!tips) return '';
  const lang = locale === 'fr' ? 'fr' : 'en';
  return tips.map((t) => `- ${(t as Record<string, string>)[lang]}`).join('\n');
}

function getSeasonalTips(locale: string): string {
  const season = getCurrentSeason();
  const key = season.en as keyof typeof bioIntensive.tips.seasonal;
  const tips = bioIntensive.tips.seasonal[key];
  if (!tips) return '';
  const lang = locale === 'fr' ? 'fr' : 'en';
  return tips.map((t) => `- ${(t as Record<string, string>)[lang]}`).join('\n');
}

function getCompanionPlantingContext(locale: string): string {
  const lang = locale === 'fr' ? 'fr' : 'en';
  const guilds = bioIntensive.companionPlanting.guilds
    .map((g) => {
      const name = (g.name as Record<string, string>)[lang];
      const companions = g.companions
        .map((c) => `${c.plant}: ${(c.role as Record<string, string>)[lang]}`)
        .join('; ');
      return `${name}: ${companions}`;
    })
    .join('\n');
  return guilds;
}

function getPestControlContext(locale: string): string {
  const lang = locale === 'fr' ? 'fr' : 'en';
  const sprays = bioIntensive.pestControl.naturalSprays
    .map((s) => {
      const name = (s.name as Record<string, string>)[lang];
      const uses = (s.uses as Record<string, string>)[lang];
      return `${name}: ${uses}`;
    })
    .join('\n');
  return sprays;
}

function getCropRotationContext(locale: string): string {
  const lang = locale === 'fr' ? 'fr' : 'en';
  return bioIntensive.cropRotation.rotationPlan4Year
    .map((y) => {
      const name = (y.name as Record<string, string>)[lang];
      const action = (y.action as Record<string, string>)[lang];
      return `Year ${y.year} - ${name}: ${action}`;
    })
    .join('\n');
}

// Compact vegetable quick-reference for the system prompt
// Provides specific variety recommendations, spacing, and timing data
function getVegetableReference(locale: string): string {
  const isFr = locale === 'fr';
  const header = isFr
    ? 'RÉFÉRENCE RAPIDE LÉGUMES (variétés, espacement, calendrier)'
    : 'VEGETABLE QUICK REFERENCE (varieties, spacing, calendar)';

  // Format: Name | Top Varieties | Spacing | Sow Indoors | Transplant/Direct Sow | Days to Harvest | Key Tips
  const vegetables = isFr
    ? [
        'Tomate | Roma, Coeur de Boeuf, San Marzano, Cerise Sweet 100, Brandywine | 60cm | Fév-Mars intérieur | Mi-Mai après gelées | 60-85j | Tuteur obligatoire, supprimer gourmands, arrosage au pied',
        'Courgette | Black Beauty, Ronde de Nice, Gold Rush | 90cm | Avril intérieur | Mai-Juin | 45-55j | 2-3 plants suffisent par famille, récolter jeunes',
        'Laitue | Batavia, Feuille de Chêne, Romaine, Mesclun | 25cm | Mars-Août | Mars-Sept direct | 30-60j | Semer toutes les 2-3 semaines, ombre partielle en été',
        'Carotte | Nantaise, Touchon, Chantenay, Marché de Paris (ronde) | 5cm | — | Mars-Juillet direct | 70-80j | Sol meuble sans cailloux, ne pas repiquer, éclaircir à 5cm',
        'Haricot | Contender (nain), Blue Lake (grimpant), Coco de Paimpol | 15-20cm | — | Mai-Juillet direct (sol>12°C) | 55-65j | Ne pas tremper les graines, inoculant rhizobium bénéfique',
        'Poivron/Piment | Corno di Toro, Lamuyo, Padron, Espelette | 45cm | Fév-Mars intérieur | Mi-Mai | 70-90j | Chaleur indispensable, pailler abondamment',
        'Concombre | Marketmore, Long anglais, Lemon, Cornichon vert petit de Paris | 60cm | Avril intérieur | Mai-Juin | 50-65j | Treillis recommandé, récolter souvent',
        'Radis | Cherry Belle, Rond écarlate, Flamboyant, Noir d\'hiver | 3cm | — | Mars-Sept direct | 20-30j | Le plus rapide du potager, intercaler entre cultures lentes',
        'Basilic | Grand Vert, Genovese, Pourpre, Citron, Thaï | 25cm | Mars-Avril intérieur | Mai-Juin | 30-45j | Pincer les fleurs, associer aux tomates',
        'Épinard | Géant d\'hiver, Bloomsdale, Matador | 15cm | — | Mars-Mai, Août-Oct direct | 35-45j | Préfère le frais, bolte vite en chaleur, culture d\'automne idéale',
        'Oignon | Stuttgarter, Jaune Paille des Vertus, Rouge de Florence | 10cm | Fév intérieur ou bulbilles | Mars-Avril | 90-120j | Arrêter arrosage quand feuilles jaunissent',
        'Pois | Petit Provençal, Kelvedon Wonder, Mangetout Oregon | 5cm | — | Fév-Avril direct (sol>5°C) | 60-70j | Grillage/tuteur nécessaire, fixe l\'azote',
        'Chou | Cabus, Milan de Pontoise, Brocoli Calabrese, Kale Nero di Toscana | 50cm | Fév-Juil intérieur | Mars-Août | 60-120j selon type | Filet anti-piéride, riche en calcium',
        'Ail | Messidrome (blanc), Germidour (violet), Rose de Lautrec | 15cm | — | Oct-Nov ou Fév-Mars direct | 150-240j | Planter pointe en haut à 3cm, ne pas arroser fin de culture',
        'Fraise | Gariguette, Mara des Bois, Charlotte (remontante) | 30cm | — | Mars-Avril plants | 60j + remontant | Pailler, renouveler tous les 3 ans, stolons = nouveaux plants',
      ]
    : [
        'Tomato | Roma, Beefsteak, San Marzano, Cherry Sweet 100, Brandywine | 24in | Feb-Mar indoors | Mid-May after frost | 60-85d | Stake/cage required, prune suckers, water at base',
        'Zucchini | Black Beauty, Costata Romanesco, Gold Rush | 36in | April indoors | May-June | 45-55d | 2-3 plants feed a family, harvest young at 6-8in',
        'Lettuce | Butterhead, Red Oak Leaf, Romaine, Mesclun mix | 10in | Mar-Aug | Mar-Sept direct | 30-60d | Succession sow every 2-3 weeks, partial shade in summer',
        'Carrot | Nantes, Danvers, Chantenay, Paris Market (round) | 2in | — | Mar-Jul direct | 70-80d | Loose stone-free soil, don\'t transplant, thin to 2in',
        'Bean | Contender (bush), Blue Lake (pole), Scarlet Runner | 6-8in | — | May-Jul direct (soil>55°F) | 55-65d | Don\'t soak seeds, rhizobium inoculant beneficial',
        'Pepper | Corno di Toro, California Wonder, Padron, Jalapeño | 18in | Feb-Mar indoors | Mid-May | 70-90d | Needs warmth, mulch heavily, stake when fruiting',
        'Cucumber | Marketmore, English Long, Lemon, Boston Pickling | 24in | April indoors | May-June | 50-65d | Trellis recommended, harvest often to keep producing',
        'Radish | Cherry Belle, French Breakfast, Watermelon, Black Spanish | 1in | — | Mar-Sept direct | 20-30d | Fastest garden crop, interplant between slow growers',
        'Basil | Genovese, Sweet, Purple, Lemon, Thai | 10in | Mar-Apr indoors | May-June | 30-45d | Pinch flowers, companion to tomatoes',
        'Spinach | Bloomsdale, Giant Winter, Space | 6in | — | Mar-May, Aug-Oct direct | 35-45d | Prefers cool weather, bolts in heat, ideal fall crop',
        'Onion | Stuttgarter, Yellow Sweet Spanish, Red Burgundy | 4in | Feb indoors or sets | Mar-Apr | 90-120d | Stop watering when tops yellow, cure 2 weeks before storage',
        'Pea | Little Marvel, Kelvedon Wonder, Oregon Sugar Pod | 2in | — | Feb-Apr direct (soil>40°F) | 60-70d | Needs trellis/netting, fixes nitrogen in soil',
        'Cabbage family | Early Jersey Wakefield, Broccoli Calabrese, Kale Nero di Toscana | 20in | Feb-Jul indoors | Mar-Aug | 60-120d by type | Row cover for cabbage moth, calcium-rich feeder',
        'Garlic | Softneck California Early, Hardneck Music, Purple Stripe | 6in | — | Oct-Nov or Feb-Mar direct | 150-240d | Plant cloves point-up 2in deep, stop water before harvest',
        'Strawberry | Earliglow, Seascape (everbearing), Mara des Bois | 12in | — | Mar-Apr plants | 60d + everbearing | Mulch with straw, renew beds every 3 years, runners = new plants',
      ];

  return `${header}:\n${vegetables.join('\n')}`;
}

function buildSystemPrompt(gardenContext: {
  soilType?: string;
  climateZone?: string;
  sunExposure?: string;
  plantedItems?: { plantId: string; plantedDate: string }[];
  locale?: string;
}): string {
  const locale = gardenContext.locale || 'en';
  const isFr = locale === 'fr';
  const lang = isFr ? 'French' : 'English';
  const season = getCurrentSeason();
  const currentMonth = new Date().getMonth() + 1;
  const currentMonthName = isFr
    ? ['Janvier','Fevrier','Mars','Avril','Mai','Juin','Juillet','Aout','Septembre','Octobre','Novembre','Decembre'][currentMonth - 1]
    : ['January','February','March','April','May','June','July','August','September','October','November','December'][currentMonth - 1];

  const plantList =
    gardenContext.plantedItems && gardenContext.plantedItems.length > 0
      ? gardenContext.plantedItems
          .map((p) => `${p.plantId} (planted: ${p.plantedDate})`)
          .join(', ')
      : isFr ? 'aucune plante pour le moment' : 'none yet';

  const monthlyTips = getMonthlyTips(locale);
  const seasonalTips = getSeasonalTips(locale);
  const companionInfo = getCompanionPlantingContext(locale);
  const pestInfo = getPestControlContext(locale);
  const rotationInfo = getCropRotationContext(locale);
  const vegetableRef = getVegetableReference(locale);

  return `${isFr
    ? `Tu es Sprout, un expert passionné en jardinage bio-intensif et permaculture. Tu ne réponds QU'AUX questions liées au jardinage, aux plantes, au sol, à la permaculture, à l'agriculture biologique, au compostage, aux semences, à l'irrigation et à la lutte biologique contre les ravageurs.

RÈGLES STRICTES :
- Tu DOIS refuser TOUTE question qui n'est PAS liée au jardinage, aux plantes, à l'agriculture ou à l'horticulture.
- Si l'utilisateur pose une question hors sujet (recettes de cuisine, politique, maths, code, météo générale, etc.), réponds UNIQUEMENT : "Je suis Sprout, votre conseiller jardin ! 🌱 Je ne peux répondre qu'aux questions sur le jardinage, les plantes et la permaculture. Posez-moi une question sur votre potager !"
- Ne brise JAMAIS ton personnage. Tu es un jardinier expert, rien d'autre.
- Tu donnes des conseils pratiques, saisonniers et adaptés au jardin de l'utilisateur.`
    : `You are Sprout, a passionate expert in bio-intensive gardening and permaculture. You ONLY answer questions related to gardening, plants, soil, permaculture, organic farming, composting, seeds, irrigation, and biological pest control.

STRICT RULES:
- You MUST refuse ANY question that is NOT related to gardening, plants, agriculture, or horticulture.
- If the user asks about anything else (cooking recipes, politics, math, coding, general weather, etc.), respond ONLY with: "I'm Sprout, your garden advisor! 🌱 I can only answer questions about gardening, plants, and permaculture. Ask me something about your garden!"
- NEVER break character. You are an expert gardener, nothing else.
- Give practical, seasonal advice adapted to the user's garden.`}

${isFr ? 'TON EXPERTISE BIO-INTENSIVE' : 'YOUR BIO-INTENSIVE EXPERTISE'}:
- ${isFr ? 'Double bêchage et préparation du sol en profondeur' : 'Double digging and deep soil preparation'}
- ${isFr ? 'Compostage (chaud, lombricompostage, bokashi)' : 'Composting (hot, vermicomposting, bokashi)'}
- ${isFr ? 'Paillage et couverture du sol' : 'Mulching and soil coverage'}
- ${isFr ? 'Associations de plantes et guildes' : 'Companion planting and guilds'}
- ${isFr ? 'Rotation des cultures sur 4 ans' : '4-year crop rotation'}
- ${isFr ? 'Lutte biologique contre les ravageurs' : 'Biological pest control'}
- ${isFr ? 'Purins et décoctions naturels (ortie, consoude, prêle)' : 'Natural fertilizer teas and sprays (nettle, comfrey, horsetail)'}
- ${isFr ? 'Conservation des semences' : 'Seed saving'}
- ${isFr ? 'Irrigation économe (goutte-à-goutte, ollas, récupération d\'eau de pluie)' : 'Water-efficient irrigation (drip, ollas, rainwater harvesting)'}
- ${isFr ? 'Engrais verts et cultures de couverture' : 'Green manures and cover crops'}

${isFr ? 'PERSONNALITÉ' : 'PERSONALITY'}:
- ${isFr ? 'Parle comme un jardinier chaleureux et expérimenté qui adore partager ses connaissances' : 'Speak like a warm, experienced gardener who loves sharing knowledge'}
- ${isFr ? 'Utilise des emojis de plantes naturellement' : 'Use plant emojis naturally'} (🌱 🍅 🌿 🥕 🌻 🪴 🌾 🥬 💐 🌸 🐛 🐝 💧 🪱)
- ${isFr ? 'Sois encourageant et bienveillant' : 'Be encouraging and supportive'}
- ${isFr ? 'Donne des conseils pratiques et actionnables' : 'Give practical, actionable advice'}
- ${isFr ? 'Mentionne les mois et le calendrier quand c\'est pertinent' : 'Mention specific months and timing when relevant'}
- ${isFr ? 'Privilégie toujours les solutions biologiques et naturelles' : 'Always favor organic and natural solutions'}

${isFr ? 'CONTEXTE DU JARDIN DE L\'UTILISATEUR' : 'USER\'S GARDEN CONTEXT'}:
- ${isFr ? 'Type de sol' : 'Soil type'}: ${gardenContext.soilType || (isFr ? 'inconnu' : 'unknown')}
- ${isFr ? 'Zone climatique' : 'Climate zone'}: ${gardenContext.climateZone || (isFr ? 'inconnue' : 'unknown')}
- ${isFr ? 'Exposition au soleil' : 'Sun exposure'}: ${gardenContext.sunExposure || (isFr ? 'inconnue' : 'unknown')}
- ${isFr ? 'Plantes actuelles' : 'Currently planted'}: ${plantList}

${isFr ? 'CONTEXTE SAISONNIER' : 'SEASONAL CONTEXT'}:
- ${isFr ? 'Mois actuel' : 'Current month'}: ${currentMonthName}
- ${isFr ? 'Saison' : 'Season'}: ${isFr ? season.fr : season.en}

${isFr ? 'CONSEILS DU MOIS' : 'THIS MONTH\'S TIPS'}:
${monthlyTips}

${isFr ? 'TÂCHES SAISONNIÈRES' : 'SEASONAL TASKS'}:
${seasonalTips}

${isFr ? 'ASSOCIATIONS DE PLANTES (guildes)' : 'COMPANION PLANTING (guilds)'}:
${companionInfo}

${isFr ? 'LUTTE NATURELLE CONTRE LES RAVAGEURS' : 'NATURAL PEST CONTROL'}:
${pestInfo}

${isFr ? 'ROTATION DES CULTURES (plan sur 4 ans)' : 'CROP ROTATION (4-year plan)'}:
${rotationInfo}

${vegetableRef}

${isFr ? 'CONSEILS DE RÉPONSE' : 'RESPONSE GUIDELINES'}:
- ${isFr ? 'Quand on te demande un légume spécifique, donne : variétés recommandées, espacement, calendrier de semis, et astuces de culture' : 'When asked about a specific vegetable, provide: recommended varieties, spacing, sowing calendar, and growing tips'}
- ${isFr ? 'Adapte les dates de semis à la zone climatique de l\'utilisateur si connue' : 'Adjust sowing dates to the user\'s climate zone when known'}
- ${isFr ? 'Mentionne les associations bénéfiques et les plantes à éviter à proximité' : 'Mention beneficial companions and plants to avoid nearby'}
- ${isFr ? 'Inclus des techniques bio-intensives pertinentes (paillage, compost, engrais verts)' : 'Include relevant bio-intensive techniques (mulching, compost, cover crops)'}
- ${isFr ? 'Pour les problèmes de ravageurs, propose toujours des solutions naturelles d\'abord' : 'For pest problems, always suggest natural solutions first'}

${isFr
  ? 'Réponds en français. Sois concis mais complet (2-4 paragraphes max sauf si plus de détail est nécessaire). Adapte tes conseils à la saison actuelle et au jardin de l\'utilisateur.'
  : `Respond in ${lang}. Keep answers concise but thorough (2-4 paragraphs max unless more detail is needed). Adapt your advice to the current season and the user's garden context.`}`;
}

export async function POST(request: Request) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'AI service not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const {
      message,
      gardenContext,
      userPlan,
      userId,
      conversationHistory,
    } = body as {
      message: string;
      gardenContext?: {
        soilType?: string;
        climateZone?: string;
        sunExposure?: string;
        plantedItems?: { plantId: string; plantedDate: string }[];
        locale?: string;
      };
      userPlan?: 'free' | 'pro';
      userId?: string;
      conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
    };

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // FREE users cannot use the advisor
    if (userPlan !== 'pro') {
      return NextResponse.json(
        {
          error: 'upgrade_required',
          message:
            gardenContext?.locale === 'fr'
              ? 'Passez au plan PRO pour débloquer Sprout, votre conseiller jardin bio-intensif ! 🌱'
              : 'Upgrade to PRO to unlock Sprout, your bio-intensive garden advisor! 🌱',
        },
        { status: 403 }
      );
    }

    // Rate limiting for PRO users
    const effectiveUserId = userId || 'anonymous';
    const rateCheck = checkRateLimit(effectiveUserId);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: 'rate_limited',
          message:
            gardenContext?.locale === 'fr'
              ? 'Vous avez atteint votre limite de 10 questions par jour. Revenez demain ! 🌙'
              : 'You have reached your limit of 10 questions per day. Come back tomorrow! 🌙',
          remaining: 0,
        },
        { status: 429 }
      );
    }

    const systemPrompt = buildSystemPrompt(gardenContext || {});

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...(conversationHistory || []).slice(-10),
      { role: 'user' as const, content: message },
    ];

    const openaiResponse = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          stream: true,
          temperature: 0.7,
          max_tokens: 1500,
        }),
      }
    );

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', errorText);
      return NextResponse.json(
        { error: 'AI service error' },
        { status: 502 }
      );
    }

    // Stream the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = openaiResponse.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data: ')) continue;
              const data = trimmed.slice(6);
              if (data === '[DONE]') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                  );
                }
              } catch {
                // skip malformed chunks
              }
            }
          }
        } catch (err) {
          console.error('Stream error:', err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Remaining-Questions': String(rateCheck.remaining),
      },
    });
  } catch (err) {
    console.error('Garden advisor error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
