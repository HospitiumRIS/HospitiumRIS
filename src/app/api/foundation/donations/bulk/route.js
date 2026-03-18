import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    let currentUser = null;

    if (process.env.NODE_ENV === 'development') {
      currentUser = {
        id: 'dev-user',
        accountType: 'FOUNDATION_ADMIN',
        status: 'ACTIVE',
        emailVerified: true,
      };
    } else {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get('hospitium_session');
      if (!sessionCookie?.value) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      currentUser = await prisma.user.findUnique({ where: { id: sessionCookie.value } });
      if (!currentUser || currentUser.status !== 'ACTIVE' || !currentUser.emailVerified) {
        return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
      }
      if (!['FOUNDATION_ADMIN', 'GLOBAL_ADMIN'].includes(currentUser.accountType)) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const body = await request.json();
    const records = body.donations || body.records || [];

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: 'No records provided' }, { status: 400 });
    }
    if (records.length > 1000) {
      return NextResponse.json({ error: 'Maximum 1,000 records per import' }, { status: 400 });
    }

    const normalizeEnum = (val, fallback) => {
      if (!val || String(val).trim() === '') return fallback;
      return String(val).trim().toUpperCase().replace(/[\s-]+/g, '_');
    };

    const succeeded = [];
    const failed = [];

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      const rowIndex = i + 1;
      try {
        const {
          donorName,
          amount,
          donationDate,
          donorEmail,
          donorPhone,
          donorType,
          paymentMethod,
          transactionId,
          campaignName,
          status,
          notes,
        } = rec;

        const nameStr = donorName != null ? String(donorName).trim() : '';
        if (!nameStr) throw new Error('Donor name is required');

        const amtRaw = amount != null ? String(amount).replace(/[,$ ]/g, '') : '';
        const amt = parseFloat(amtRaw);
        if (isNaN(amt) || amt <= 0) throw new Error('Amount must be a positive number');

        // Resolve campaign by name
        let resolvedCampaignId = null;
        const campaignStr = campaignName != null ? String(campaignName).trim() : '';
        if (campaignStr) {
          const found = await prisma.campaign.findFirst({
            where: { name: { equals: campaignStr, mode: 'insensitive' } },
          });
          resolvedCampaignId = found?.id || null;
        }

        const newDonation = await prisma.donation.create({
          data: {
            campaignId: resolvedCampaignId,
            donorName: nameStr,
            donorEmail: donorEmail?.trim() || null,
            donorPhone: donorPhone?.trim() || null,
            donorType: normalizeEnum(donorType, 'INDIVIDUAL'),
            amount: amt,
            donationDate: donationDate ? new Date(donationDate) : new Date(),
            paymentMethod: normalizeEnum(paymentMethod, 'CREDIT_CARD'),
            transactionId: transactionId?.trim() || null,
            status: normalizeEnum(status, 'COMPLETED'),
            message: notes?.trim() || null,
            isAnonymous: false,
            taxDeductible: true,
          },
        });

        succeeded.push({ rowIndex, id: newDonation.id, donorName: newDonation.donorName });
      } catch (err) {
        failed.push({ rowIndex, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: records.length,
        succeeded: succeeded.length,
        failed: failed.length,
      },
      succeeded,
      failed,
    });
  } catch (error) {
    console.error('Bulk donation import error:', error);
    return NextResponse.json({ success: false, error: 'Bulk import failed' }, { status: 500 });
  }
}
