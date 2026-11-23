import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireSessionAdmin } from '@/lib/training-sessions-server';
import { ACTIVE_REGISTRATION_STATUSES } from '@/lib/training-scope';
import { certificateState, classifyCertificates, verifyUrl } from '@/lib/certificate-issuance';
import { appBaseUrl } from '@/lib/training-certificates-server';

/**
 * GET /api/training/[id]/certificates
 * The admin's certificate lists (#99): ready to issue, issued, revoked, not yet eligible.
 * Training admin only.
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireSessionAdmin(request, id);
    if (access.error) return access.error;

    const registrations = await prisma.trainingRegistration.findMany({
      where: { trainingId: id, status: { in: ACTIVE_REGISTRATION_STATUSES } },
      orderBy: { registeredAt: 'asc' },
      select: {
        id: true,
        status: true,
        completedAt: true,
        user: { select: { id: true, givenName: true, familyName: true, email: true } },
        certificate: {
          select: {
            id: true,
            certificateNumber: true,
            verificationCode: true,
            certificateUrl: true,
            source: true,
            status: true,
            version: true,
            issuedAt: true,
            expiresAt: true,
            emailedAt: true,
            revokedAt: true,
            revokedReason: true,
          },
        },
      },
    });

    const base = appBaseUrl();
    const shaped = registrations.map((r) => ({
      ...r,
      certificate: r.certificate
        ? {
            ...r.certificate,
            state: certificateState(r.certificate),
            verifyUrl: r.certificate.verificationCode ? verifyUrl(base, r.certificate.verificationCode) : null,
          }
        : null,
    }));
    const lists = classifyCertificates(shaped);

    return NextResponse.json({
      success: true,
      mode: access.training.certificateMode,
      ready: lists.ready,
      issued: lists.issued,
      revoked: lists.revoked,
      notYet: lists.notYet.length,
    });
  } catch (error) {
    console.error('Error listing certificates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
