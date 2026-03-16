import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/user/locale
 * Update the authenticated user's locale preference.
 * Body: { locale: "en" | "fr" }
 */
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { locale } = body;

    if (!['en', 'fr'].includes(locale)) {
      return NextResponse.json(
        { error: 'Invalid locale. Must be "en" or "fr".' },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { locale },
    });

    // Also set the locale cookie so next-intl picks it up
    const response = NextResponse.json({
      success: true,
      locale,
    });
    response.cookies.set('locale', locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Error updating user locale:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
