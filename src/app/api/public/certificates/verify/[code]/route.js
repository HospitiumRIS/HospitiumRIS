import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { rateLimit } from '@/lib/simple-rate-limit';
import { extractVerificationCode, publicCertificateView } from '@/lib/certificate-verify';

const LIMIT = { limit: 30, windowMs: 60 * 1000 };

function clientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  return (forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip'))?.trim() || 'unknown';
}

/**
 * GET /api/public/certificates/verify/[code]
 * Public, no sign-in (#101). Returns what is printed on the certificate plus its status
 * (valid / expired / revoked). Never returns email, ids or the revoke reason. Unknown
 * codes get the same generic answer. Rate-limited per IP.
 */
export async function GET(request, { params }) {
  const limited = rateLimit(`certificate-verify:${clientIp(request)}`, LIMIT);
  if (!limited.allowed) {
    return NextResponse.json(
      { found: false, error: 'Too many lookups. Try again in a minute.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(limited.retryAfterMs / 1000)) } }
    );
  }

  try {
    const { code: raw } = await params;
    const code = extractVerificationCode(decodeURIComponent(raw || ''));
    const notFound = NextResponse.json(
      { found: false, error: 'No certificate matches this code. Check the link or code and try again.' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } }
    );
    if (!code) return notFound;

    const cert = await prisma.trainingCertificate.findUnique({
      where: { verificationCode: code },
      select: {
        certificateNumber: true,
        certificateUrl: true,
        status: true,
        issuedAt: true,
        expiresAt: true,
        revokedAt: true,
        snapshot: true,
        user: { select: { givenName: true, familyName: true } },
        training: {
          select: {
            title: true,
            institutionId: true,
            cpdHours: true,
            cpdPoints: true,
            accreditationBody: true,
            accreditationNumber: true,
          },
        },
      },
    });
    if (!cert || !cert.certificateUrl) return notFound;

    const institution = await prisma.institution.findUnique({
      where: { id: cert.training.institutionId },
      select: { name: true },
    });

    return NextResponse.json(
      { found: true, certificate: publicCertificateView({ ...cert, institution }) },
      { headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } }
    );
  } catch (error) {
    console.error('Certificate verification failed:', error);
    return NextResponse.json({ found: false, error: 'Verification is unavailable right now' }, { status: 500 });
  }
}
