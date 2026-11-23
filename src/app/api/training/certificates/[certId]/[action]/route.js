import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { requireTrainingAdminAccess } from '@/lib/training-admin-server';
import { issueCertificate, resendCertificate, revokeCertificate } from '@/lib/training-certificates-server';

/**
 * POST /api/training/certificates/[certId]/revoke | reissue | resend
 * revoke:  { reason } (required). The certificate shows as revoked when verified.
 * reissue: { reason? } regenerates the PDF with the current template and details;
 *          same number and verification code, version + 1, valid again.
 * resend:  emails the participant again.
 * Admin of the training's institution only; audited (#99).
 */
export async function POST(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { certId, action } = await params;
    if (!['revoke', 'reissue', 'resend'].includes(action)) {
      return NextResponse.json({ error: 'Unknown action' }, { status: 404 });
    }
    const cert = await prisma.trainingCertificate.findUnique({
      where: { id: certId },
      include: { training: true },
    });
    if (!cert) return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    const access = await requireTrainingAdminAccess(user, cert.training);
    if (access.error) return access.error;

    const body = await request.json().catch(() => ({}));
    const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 500) : '';

    let result;
    if (action === 'revoke') {
      if (!reason) return NextResponse.json({ error: 'Give a reason for revoking' }, { status: 400 });
      result = await revokeCertificate(certId, { actor: user, reason });
    } else if (action === 'reissue') {
      result = await issueCertificate(cert.registrationId, { actor: user, reissue: true, reason: reason || null });
    } else {
      result = await resendCertificate(certId, { actor: user });
    }
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, certificate: result.certificate });
  } catch (error) {
    console.error('Certificate action failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
