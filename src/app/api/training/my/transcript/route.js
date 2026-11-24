import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { buildTranscript, cpdByYearAndBody, transcriptTotals, transcriptYears } from '@/lib/training-transcript';
import { renderTranscriptPdf } from '@/lib/training-transcript-pdf';

/**
 * GET /api/training/my/transcript[?year=2026][&format=pdf]
 * The caller's own training transcript (#108): every training with status, dates,
 * attended hours, CPD and certificate numbers; CPD per year and accreditation body.
 */
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const params = new URL(request.url).searchParams;
    const yearParam = params.get('year');
    const year = yearParam && /^\d{4}$/.test(yearParam) ? Number(yearParam) : null;

    const registrations = await prisma.trainingRegistration.findMany({
      where: { userId: user.id, status: { in: ['COMPLETED', 'NOT_COMPLETED', 'REGISTERED'] } },
      select: {
        id: true,
        status: true,
        completedAt: true,
        attendance: { select: { sessionId: true, status: true } },
        certificate: { select: { certificateNumber: true, status: true, expiresAt: true } },
        training: {
          select: {
            id: true, title: true, code: true, startDate: true, endDate: true,
            cpdHours: true, cpdPoints: true, accreditationBody: true, accreditationNumber: true,
            sessions: { select: { id: true, status: true, startsAt: true, endsAt: true } },
          },
        },
      },
    });
    const all = buildTranscript(registrations);
    const rows = year ? all.filter((r) => r.year === year) : all;
    const totals = transcriptTotals(rows);
    const cpd = cpdByYearAndBody(rows);

    if (params.get('format') === 'pdf') {
      const institution = user.secondaryInstitutionId
        ? await prisma.institution.findUnique({ where: { id: user.secondaryInstitutionId }, select: { name: true } })
        : null;
      const pdf = renderTranscriptPdf({
        person: { name: `${user.givenName || ''} ${user.familyName || ''}`.trim() || user.email, email: user.email, institution: institution?.name },
        rows,
        totals,
        cpd,
        yearLabel: year ? String(year) : 'All years',
      });
      return new NextResponse(pdf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="training-transcript${year ? `-${year}` : ''}.pdf"`,
          'Cache-Control': 'private, no-store',
        },
      });
    }

    return NextResponse.json({ success: true, years: transcriptYears(all), year, rows, totals, cpd });
  } catch (error) {
    console.error('Loading transcript failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
