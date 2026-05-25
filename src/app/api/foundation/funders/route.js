import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const donations = await prisma.donation.findMany({
      include: {
        campaign: {
          include: { category: true }
        }
      },
      orderBy: { donationDate: 'desc' }
    });

    const donorMap = new Map();

    for (const donation of donations) {
      const key = donation.donorEmail
        ? donation.donorEmail.toLowerCase().trim()
        : `__name__${donation.donorName.toLowerCase().trim()}`;

      if (!donorMap.has(key)) {
        donorMap.set(key, {
          id: key,
          donorName: donation.donorName,
          donorEmail: donation.donorEmail,
          donorPhone: donation.donorPhone,
          donorType: donation.donorType || 'Individual',
          isAnonymous: donation.isAnonymous,
          totalGiven: 0,
          donationCount: 0,
          campaignSet: new Set(),
          categoryMap: new Map(),
          donations: [],
          firstGiftDate: donation.donationDate,
          lastGiftDate: donation.donationDate,
          lastGiftAmount: 0,
        });
      }

      const donor = donorMap.get(key);
      const amount = Number(donation.amount);
      const isCompleted = !donation.status || donation.status === 'COMPLETED' || donation.status === 'Completed';

      if (isCompleted) {
        donor.totalGiven += amount;
        donor.donationCount++;
      }

      const dDate = new Date(donation.donationDate);
      if (dDate < new Date(donor.firstGiftDate)) donor.firstGiftDate = donation.donationDate;
      if (dDate >= new Date(donor.lastGiftDate)) {
        donor.lastGiftDate = donation.donationDate;
        donor.lastGiftAmount = amount;
      }

      if (donation.campaign) {
        donor.campaignSet.add(donation.campaign.name);
        if (donation.campaign.category) {
          donor.categoryMap.set(donation.campaign.category.id, {
            id: donation.campaign.category.id,
            name: donation.campaign.category.name,
            color: donation.campaign.category.color || '#8b6cbc',
          });
        }
      }

      donor.donations.push({
        id: donation.id,
        amount,
        date: donation.donationDate,
        campaignName: donation.campaign?.name || 'Unallocated',
        categoryName: donation.campaign?.category?.name || null,
        categoryColor: donation.campaign?.category?.color || null,
        paymentMethod: donation.paymentMethod,
        status: donation.status,
        transactionId: donation.transactionId,
        message: donation.message,
        isAnonymous: donation.isAnonymous,
      });
    }

    const now = Date.now();
    const DAY = 86400000;

    const funders = Array.from(donorMap.values()).map(d => {
      const daysSinceLast = (now - new Date(d.lastGiftDate)) / DAY;

      const status =
        d.donationCount === 0 ? 'inactive' :
        d.donationCount === 1 && daysSinceLast <= 90 ? 'new' :
        daysSinceLast > 365 ? 'lapsed' : 'active';

      const tier =
        d.totalGiven >= 5000 ? 'major' :
        d.totalGiven >= 1000 ? 'mid' : 'general';

      return {
        id: d.id,
        donorName: d.donorName,
        donorEmail: d.donorEmail,
        donorPhone: d.donorPhone,
        donorType: d.donorType,
        isAnonymous: d.isAnonymous,
        totalGiven: d.totalGiven,
        donationCount: d.donationCount,
        averageGift: d.donationCount > 0 ? d.totalGiven / d.donationCount : 0,
        campaignCount: d.campaignSet.size,
        campaigns: Array.from(d.campaignSet),
        categories: Array.from(d.categoryMap.values()),
        firstGiftDate: d.firstGiftDate,
        lastGiftDate: d.lastGiftDate,
        lastGiftAmount: d.lastGiftAmount,
        donations: d.donations.sort((a, b) => new Date(b.date) - new Date(a.date)),
        status,
        tier,
      };
    });

    const stats = {
      totalFunders: funders.length,
      totalRaised: funders.reduce((s, f) => s + f.totalGiven, 0),
      avgGiftSize: funders.length > 0
        ? funders.reduce((s, f) => s + f.averageGift, 0) / funders.length
        : 0,
      repeatFunders: funders.filter(f => f.donationCount > 1).length,
      activeFunders: funders.filter(f => f.status === 'active').length,
      newFunders: funders.filter(f => f.status === 'new').length,
      lapsedFunders: funders.filter(f => f.status === 'lapsed').length,
      majorDonors: funders.filter(f => f.tier === 'major').length,
    };

    return NextResponse.json({ success: true, funders, stats });
  } catch (error) {
    console.error('Funders CRM error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load funders' }, { status: 500 });
  }
}
