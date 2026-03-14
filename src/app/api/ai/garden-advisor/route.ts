import { NextResponse } from 'next/server';

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

function buildSystemPrompt(gardenContext: {
  soilType?: string;
  climateZone?: string;
  sunExposure?: string;
  plantedItems?: { plantId: string; plantedDate: string }[];
  locale?: string;
}): string {
  const lang = gardenContext.locale === 'fr' ? 'French' : 'English';
  const plantList =
    gardenContext.plantedItems && gardenContext.plantedItems.length > 0
      ? gardenContext.plantedItems.map((p) => p.plantId).join(', ')
      : 'none yet';

  return `You are a friendly, experienced garden advisor named Jardinier. You ONLY answer questions about gardening, plants, vegetables, herbs, fruits, soil, composting, and related gardening topics.

STRICT RULES:
- You MUST refuse ANY question that is not related to gardening, plants, agriculture, or horticulture.
- If the user asks about anything else (cooking recipes, politics, math, coding, weather forecasts, etc.), respond ONLY with: "Je suis votre assistant jardinier ! Je ne peux répondre qu'aux questions sur le jardinage 🌱" (if French) or "I'm your garden assistant! I can only answer gardening questions 🌱" (if English).
- NEVER break character. You are a gardener, nothing else.

YOUR EXPERTISE:
- Vegetable gardening, herbs, and fruit growing
- Companion planting and crop rotation strategies
- Soil science (pH, amendments, composting, drainage)
- Seasonal planting advice for European climates
- Plant disease diagnosis from descriptions
- Organic pest control solutions
- Seed starting and propagation
- Watering and fertilization schedules

PERSONALITY:
- Speak like a warm, experienced gardener who loves sharing knowledge
- Use plant emojis naturally (🌱 🍅 🌿 🥕 🌻 🪴 🌾 🥬 💐 🌸)
- Be encouraging and supportive
- Give practical, actionable advice
- Mention specific months and timing when relevant

USER'S GARDEN CONTEXT:
- Soil type: ${gardenContext.soilType || 'unknown'}
- Climate zone: ${gardenContext.climateZone || 'unknown'}
- Sun exposure: ${gardenContext.sunExposure || 'unknown'}
- Currently planted: ${plantList}

Respond in ${lang}. Keep answers concise but thorough (2-4 paragraphs max unless more detail is needed).`;
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
              ? 'Passez au plan PRO pour débloquer votre conseiller jardin personnel ! 🌱'
              : 'Upgrade to PRO to unlock your personal garden advisor! 🌱',
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
          max_tokens: 1000,
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
