import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';

const MAX_KEYWORDS = 25;
const MAX_LENGTH = 60;

// PUT /api/researcher/profile/expertise   body: { keywords: string[] }
// Updates only the Research Expertise keywords (does not touch other profile fields).
export async function PUT(request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    if (!Array.isArray(body?.keywords)) {
      return NextResponse.json({ success: false, message: 'keywords must be a list' }, { status: 400 });
    }

    const seen = new Set();
    const keywords = [];
    for (const raw of body.keywords) {
      const k = String(raw ?? '').replace(/\s+/g, ' ').trim();
      if (!k) continue;
      if (k.length > MAX_LENGTH) {
        return NextResponse.json(
          { success: false, message: `"${k.slice(0, 20)}…" is too long (max ${MAX_LENGTH} characters)` },
          { status: 400 }
        );
      }
      const key = k.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      keywords.push(k);
    }
    if (keywords.length > MAX_KEYWORDS) {
      return NextResponse.json(
        { success: false, message: `You can add up to ${MAX_KEYWORDS} areas of expertise` },
        { status: 400 }
      );
    }

    await prisma.researchProfile.upsert({
      where: { userId: user.id },
      update: { keywords },
      create: { userId: user.id, keywords, specialization: [] },
    });

    return NextResponse.json({ success: true, keywords });
  } catch (err) {
    console.error('Error saving research expertise:', err);
    return NextResponse.json({ success: false, message: 'Failed to save research expertise' }, { status: 500 });
  }
}
