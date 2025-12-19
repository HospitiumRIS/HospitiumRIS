import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const [
      campaigns,
      donations,
      grantOpportunities,
      categories,
      totalDonations,
      totalCampaigns
    ] = await Promise.all([
      prisma.campaign.findMany({
        include: {
          category: true,
          donations: true,
          _count: {
            select: {
              donations: true
            }
          }
        },
        orderBy: {
          raisedAmount: 'desc'
        }
      }),

      prisma.donation.findMany({
        include: {
          campaign: {
            select: {
              name: true,
              category: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          donationDate: 'desc'
        }
      }),

      prisma.grantOpportunity.findMany({
        where: {
          status: 'open',
          deadline: {
            gte: new Date()
          }
        },
        include: {
          grantor: {
            select: {
              name: true,
              type: true
            }
          }
        }
      }),

      prisma.campaignCategory.findMany({
        include: {
          _count: {
            select: {
              campaigns: true
            }
          }
        }
      }),

      prisma.donation.count({
        where: dateFilter
      }),

      prisma.campaign.count({
        where: dateFilter
      })
    ]);

    const totalRaisedFromDonations = donations.reduce((sum, d) => {
      return sum + (parseFloat(d.amount) || 0);
    }, 0);

    const totalRaisedFromCampaigns = campaigns.reduce((sum, c) => {
      return sum + (parseFloat(c.raisedAmount) || 0);
    }, 0);

    const totalGrantOpportunityAmount = grantOpportunities.reduce((sum, g) => {
      return sum + (parseFloat(g.amount) || 0);
    }, 0);

    const uniqueDonors = new Set(donations.map(d => d.donorEmail || d.donorName)).size;

    const averageDonation = totalDonations > 0 
      ? totalRaisedFromDonations / totalDonations 
      : 0;

    const activeCampaigns = campaigns.filter(c => c.status === 'Active').length;
    const completedCampaigns = campaigns.filter(c => c.status === 'Completed').length;

    const activeGrants = grantOpportunities.length;

    const grantSuccessRate = campaigns.length > 0
      ? (completedCampaigns / campaigns.length * 100)
      : 0;

    const avgGrantAmount = activeGrants > 0
      ? totalGrantOpportunityAmount / activeGrants
      : 0;

    const donorRetentionData = donations.reduce((acc, d) => {
      const donor = d.donorEmail || d.donorName;
      if (!acc[donor]) {
        acc[donor] = { count: 0, firstDate: d.donationDate, lastDate: d.donationDate };
      }
      acc[donor].count += 1;
      if (new Date(d.donationDate) < new Date(acc[donor].firstDate)) {
        acc[donor].firstDate = d.donationDate;
      }
      if (new Date(d.donationDate) > new Date(acc[donor].lastDate)) {
        acc[donor].lastDate = d.donationDate;
      }
      return acc;
    }, {});

    const repeatDonors = Object.values(donorRetentionData).filter(d => d.count > 1).length;
    const retentionRate = uniqueDonors > 0 ? (repeatDonors / uniqueDonors * 100) : 0;

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentDonations = donations.filter(d => new Date(d.donationDate) >= sixMonthsAgo);

    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      
      const monthDonations = recentDonations.filter(d => {
        const dDate = new Date(d.donationDate);
        return dDate.getMonth() === date.getMonth() && dDate.getFullYear() === date.getFullYear();
      });

      const donationAmount = monthDonations.reduce((sum, d) => sum + parseFloat(d.amount), 0);

      monthlyTrends.push({
        month: monthStr,
        donations: donationAmount,
        grants: 0,
        total: donationAmount
      });
    }

    const categoryDistribution = categories.map(cat => {
      const catCampaigns = campaigns.filter(c => c.categoryId === cat.id);
      const catAmount = catCampaigns.reduce((sum, c) => sum + parseFloat(c.raisedAmount), 0);
      const totalAmount = totalRaisedFromCampaigns + totalGrantOpportunityAmount;
      
      return {
        category: cat.name,
        amount: catAmount,
        percentage: totalAmount > 0 ? ((catAmount / totalAmount) * 100).toFixed(1) : 0,
        color: '#8b6cbc'
      };
    }).sort((a, b) => b.amount - a.amount);

    const donorsByAmount = donations.reduce((acc, d) => {
      const donor = d.donorEmail || d.donorName;
      if (!acc[donor]) {
        acc[donor] = {
          name: d.donorName,
          email: d.donorEmail,
          type: d.donorType || 'Individual',
          totalDonated: 0,
          donations: 0,
          firstGift: d.donationDate,
          recentGift: d.donationDate
        };
      }
      acc[donor].totalDonated += parseFloat(d.amount);
      acc[donor].donations += 1;
      if (new Date(d.donationDate) < new Date(acc[donor].firstGift)) {
        acc[donor].firstGift = d.donationDate;
      }
      if (new Date(d.donationDate) > new Date(acc[donor].recentGift)) {
        acc[donor].recentGift = d.donationDate;
      }
      return acc;
    }, {});

    const topDonors = Object.values(donorsByAmount)
      .map(donor => ({
        ...donor,
        avgAmount: donor.totalDonated / donor.donations
      }))
      .sort((a, b) => b.totalDonated - a.totalDonated)
      .slice(0, 10);

    const campaignPerformance = campaigns.map(c => ({
      id: c.id,
      name: c.name,
      category: c.category.name,
      target: parseFloat(c.targetAmount) || 0,
      raised: parseFloat(c.raisedAmount) || 0,
      donors: c.donorCount,
      progress: c.targetAmount ? (parseFloat(c.raisedAmount) / parseFloat(c.targetAmount) * 100) : 0,
      status: c.status,
      type: 'campaign'
    })).sort((a, b) => b.raised - a.raised);

    const analyticsData = {
      overview: {
        totalRaised: totalRaisedFromDonations,
        totalDonations: totalDonations,
        uniqueDonors: uniqueDonors,
        averageDonation: averageDonation,
        activeCampaigns: activeCampaigns,
        retentionRate: parseFloat(retentionRate.toFixed(1)),
        totalGrants: totalGrantOpportunityAmount,
        activeGrants: activeGrants,
        grantSuccess: parseFloat(grantSuccessRate.toFixed(1)),
        avgGrantAmount: avgGrantAmount
      },
      monthlyTrends,
      campaignPerformance,
      categoryDistribution,
      topDonors: topDonors.map(d => ({
        id: d.email || d.name,
        name: d.name,
        totalDonated: d.totalDonated,
        donations: d.donations,
        avgAmount: d.avgAmount,
        firstGift: d.firstGift,
        recentGift: d.recentGift,
        type: d.type
      })),
      recentDonations: donations.slice(0, 20).map(d => ({
        id: d.id,
        donorName: d.donorName,
        amount: parseFloat(d.amount),
        donationDate: d.donationDate,
        campaign: d.campaign?.name || 'General Fund',
        category: d.campaign?.category?.name || 'General',
        status: d.status,
        paymentMethod: d.paymentMethod
      })),
      campaigns: campaigns.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        category: c.category.name,
        targetAmount: parseFloat(c.targetAmount) || 0,
        raisedAmount: parseFloat(c.raisedAmount) || 0,
        status: c.status,
        donorCount: c.donorCount,
        donationCount: c._count.donations,
        startDate: c.startDate,
        endDate: c.endDate,
        progress: c.targetAmount ? (parseFloat(c.raisedAmount) / parseFloat(c.targetAmount) * 100) : 0
      })),
      grantOpportunities: grantOpportunities.map(g => ({
        id: g.id,
        title: g.title,
        amount: parseFloat(g.amount),
        deadline: g.deadline,
        grantor: g.grantor.name,
        grantorType: g.grantor.type,
        category: g.category,
        status: g.status
      }))
    };

    return NextResponse.json(analyticsData);

  } catch (error) {
    console.error('Error fetching foundation analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch foundation analytics' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
