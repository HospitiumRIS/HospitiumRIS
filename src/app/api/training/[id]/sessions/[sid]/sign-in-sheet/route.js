import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ACTIVE_REGISTRATION_STATUSES } from '@/lib/training-scope';
import { effectiveSessionDelivery } from '@/lib/training-sessions';
import { requireSessionStaff } from '@/lib/training-sessions-server';
import { buildSignInSheetPdf } from '@/lib/training-signin-sheet';
import { sanitizeFileName } from '@/lib/sanitize-file-name';

/**
 * GET /api/training/[id]/sessions/[sid]/sign-in-sheet?tz=
 * Printable sign-in sheet (PDF) for one session (#95). Training admin only.
 */
export async function GET(request, { params }) {
  try {
    const { id, sid } = await params;
    const access = await requireSessionStaff(request, id, sid);
    if (access.error) return access.error;
    const { training } = access;

    const session = await prisma.trainingSession.findUnique({ where: { id: sid } });
    if (!session || session.trainingId !== id) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    let timeZone = new URL(request.url).searchParams.get('tz') || 'Africa/Nairobi';
    try {
      new Intl.DateTimeFormat('en', { timeZone });
    } catch {
      timeZone = 'Africa/Nairobi';
    }

    const participants = await prisma.trainingRegistration.findMany({
      where: { trainingId: id, status: { in: ACTIVE_REGISTRATION_STATUSES } },
      select: { user: { select: { givenName: true, familyName: true, email: true } } },
    });

    const { venue } = effectiveSessionDelivery(session, training);
    const pdf = buildSignInSheetPdf({
      training,
      session: { ...session, venue },
      participants,
      timeZone,
    });

    const fileName = sanitizeFileName(`${training.title}-${session.title}-sign-in.pdf`) || 'sign-in-sheet.pdf';
    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error building sign-in sheet:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
