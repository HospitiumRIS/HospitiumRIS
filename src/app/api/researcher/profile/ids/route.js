import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { normalizeResearcherIdList } from '@/lib/researcher-ids';

// PUT /api/researcher/profile/ids   body: { researcherIds: [{ type, value, label? }] }
// Replaces the researcher's external identifiers. Only touches identifier fields.
export async function PUT(request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { ids, error } = normalizeResearcherIdList(body?.researcherIds);
    if (error) {
      return NextResponse.json({ success: false, message: error }, { status: 400 });
    }

    const scholar = ids.find((e) => e.type === 'GOOGLE_SCHOLAR');
    const data = {
      researcherIds: ids,
      // keep the legacy column in sync for older screens/exports
      googleScholar: scholar ? `https://scholar.google.com/citations?user=${scholar.value}` : null,
    };

    await prisma.researchProfile.upsert({
      where: { userId: user.id },
      update: data,
      create: { userId: user.id, specialization: [], keywords: [], ...data },
    });

    return NextResponse.json({ success: true, researcherIds: ids });
  } catch (err) {
    console.error('Error saving researcher identifiers:', err);
    return NextResponse.json({ success: false, message: 'Failed to save identifiers' }, { status: 500 });
  }
}
