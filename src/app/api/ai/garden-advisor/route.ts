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
