import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory cache to avoid hammering Wikipedia
const imageCache = new Map<string, { url: string | null; ts: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24h

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name');
  if (!name) return NextResponse.json({ url: null }, { status: 400 });

  const cached = imageCache.get(name);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json({ url: cached.url });
  }

  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`,
      { headers: { 'User-Agent': 'GardenSaaS/1.0 (garden app; contact@gardensaas.app)' }, next: { revalidate: 86400 } }
    );
    if (!res.ok) {
      imageCache.set(name, { url: null, ts: Date.now() });
      return NextResponse.json({ url: null });
    }
    const data = await res.json();
    const url: string | null = data?.thumbnail?.source ?? null;
    imageCache.set(name, { url, ts: Date.now() });
    return NextResponse.json({ url });
  } catch {
    imageCache.set(name, { url: null, ts: Date.now() });
    return NextResponse.json({ url: null });
  }
}
