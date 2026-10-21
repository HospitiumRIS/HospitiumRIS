import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireFoundationAdmin } from '@/lib/foundation-auth';
import { maskDonor, resolveIncomingPii, looksMasked } from '@/lib/donor-privacy';
import { getRequestMetadata, logActivity, LOG_LEVELS } from '@/utils/activityLogger';

/**
 * PUT    /api/foundation/donations/[id]  update a donation
 * DELETE /api/foundation/donations/[id]  delete a donation
 * Foundation/global admins only. Masked donor fields sent back from the edit form
 * (e.g. "j***@gmail.com") are ignored so stored details are never overwritten.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COMPLETED = ['Completed', 'COMPLETED'];

async function recomputeCampaign(tx, campaignId) {
  if (!campaignId) return;
  const [stats, donors] = await Promise.all([
    tx.donation.aggregate({ where: { campaignId, status: { in: COMPLETED } }, _sum: { amount: true }, _count: { _all: true } }),
    tx.donation.groupBy({ by: ['donorEmail', 'donorName'], where: { campaignId, status: { in: COMPLETED } }, _count: { _all: true } }),
  ]);
  await tx.campaign.update({
    where: { id: campaignId },
    data: {
      raisedAmount: Number(stats._sum.amount || 0),
      donationCount: stats._count?._all || 0,
      donorCount: donors.length,
    },
  }).catch(() => {});
}

const serialize = (d) => maskDonor({
  ...d,
  amount: Number(d.amount),
  campaignName: d.campaign?.name || null,
  categoryName: d.campaign?.category?.name || null,
  categoryColor: d.campaign?.category?.color || null,
  formattedDate: d.donationDate.toLocaleDateString(),
  formattedAmount: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(d.amount)),
  displayName: d.donorName,
});

export async function PUT(request, { params }) {
  try {
    const auth = await requireFoundationAdmin();
    if (auth.error) return auth.error;
    const { id } = await params;

    const existing = await prisma.donation.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'Donation not found' }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const isAnonymous = body.isAnonymous === undefined ? existing.isAnonymous : Boolean(body.isAnonymous);

    let donorName = resolveIncomingPii(body.donorName, existing.donorName);
    // Switching off "anonymous" with the placeholder name still in the form: keep the stored name.
    if (donorName === 'Anonymous Donor' && existing.donorName && existing.donorName !== 'Anonymous Donor') donorName = existing.donorName;
    const donorEmail = resolveIncomingPii(body.donorEmail, existing.donorEmail);
    const donorPhone = resolveIncomingPii(body.donorPhone, existing.donorPhone);

    if (!donorName) return NextResponse.json({ success: false, error: 'Donor name is required' }, { status: 400 });
    if (donorEmail && !looksMasked(donorEmail) && !EMAIL_RE.test(donorEmail)) {
      return NextResponse.json({ success: false, error: 'Invalid email format' }, { status: 400 });
    }

    let amount = existing.amount;
    if (body.amount !== undefined) {
      const parsed = Number(body.amount);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return NextResponse.json({ success: false, error: 'Amount must be a positive number' }, { status: 400 });
      }
      amount = parsed;
    }

    const campaignId = body.campaignId === undefined ? existing.campaignId : (body.campaignId || null);

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.donation.update({
        where: { id },
        data: {
          campaignId,
          donorName,
          donorEmail,
          donorPhone,
          donorType: body.donorType ?? existing.donorType,
          amount,
          donationDate: body.donationDate ? new Date(body.donationDate) : existing.donationDate,
          paymentMethod: body.paymentMethod ?? existing.paymentMethod,
          transactionId: body.transactionId === undefined ? existing.transactionId : (String(body.transactionId || '').trim() || null),
          status: body.status ?? existing.status,
          message: body.message === undefined ? existing.message : (String(body.message || '').trim() || null),
          isAnonymous,
          taxDeductible: body.taxDeductible === undefined ? existing.taxDeductible : Boolean(body.taxDeductible),
        },
        include: { campaign: { include: { category: true } } },
      });
      await recomputeCampaign(tx, campaignId);
      if (existing.campaignId && existing.campaignId !== campaignId) await recomputeCampaign(tx, existing.campaignId);
      return row;
    });

    return NextResponse.json({ success: true, data: serialize(updated), message: 'Donation updated successfully' });
  } catch (error) {
    console.error('Error updating donation:', error);
    return NextResponse.json({ success: false, error: 'Failed to update donation' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireFoundationAdmin();
    if (auth.error) return auth.error;
    const { id } = await params;

    const existing = await prisma.donation.findUnique({ where: { id }, select: { id: true, campaignId: true, amount: true } });
    if (!existing) return NextResponse.json({ success: false, error: 'Donation not found' }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      await tx.donation.delete({ where: { id } });
      await recomputeCampaign(tx, existing.campaignId);
    });

    await logActivity(LOG_LEVELS.INFO, 'Donation deleted', {
      ...getRequestMetadata(request),
      action: 'donation_deleted',
      userId: auth.user.id,
      donationId: id,
      amount: Number(existing.amount),
    });

    return NextResponse.json({ success: true, message: 'Donation deleted successfully' });
  } catch (error) {
    console.error('Error deleting donation:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete donation' }, { status: 500 });
  }
}
