import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireFoundationAdmin } from '@/lib/foundation-auth';
import { getRequestMetadata, logActivity, LOG_LEVELS } from '@/utils/activityLogger';

/**
 * POST /api/foundation/donors/reveal   body: { donationId, reason? }
 *
 * Returns the unmasked contact details for one donation's donor.
 * Foundation/global admins only. Every reveal is written to the activity log
 * (who, when, which donation, optional reason). Anonymous donations are never revealed.
 */
export async function POST(request) {
  try {
    const auth = await requireFoundationAdmin();
    if (auth.error) return auth.error;
    const { user } = auth;

    const body = await request.json().catch(() => ({}));
    const donationId = String(body.donationId || '').trim();
    if (!donationId) {
      return NextResponse.json({ success: false, error: 'donationId is required' }, { status: 400 });
    }

    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      select: { id: true, donorName: true, donorEmail: true, donorPhone: true, donorType: true, isAnonymous: true },
    });
    if (!donation) {
      return NextResponse.json({ success: false, error: 'Donation not found' }, { status: 404 });
    }
    if (donation.isAnonymous) {
      return NextResponse.json({ success: false, error: 'This donor asked to remain anonymous' }, { status: 403 });
    }

    const metadata = getRequestMetadata(request);
    await logActivity(LOG_LEVELS.INFO, 'Donor personal details revealed', {
      ...metadata,
      action: 'donor_pii_revealed',
      userId: user.id,
      userEmail: user.email,
      accountType: user.accountType,
      donationId: donation.id,
      reason: body.reason ? String(body.reason).slice(0, 300) : null,
    });

    return NextResponse.json({
      success: true,
      donor: {
        donationId: donation.id,
        donorName: donation.donorName,
        donorEmail: donation.donorEmail,
        donorPhone: donation.donorPhone,
        donorType: donation.donorType,
      },
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Error revealing donor details:', error);
    return NextResponse.json({ success: false, error: 'Failed to load donor details' }, { status: 500 });
  }
}
