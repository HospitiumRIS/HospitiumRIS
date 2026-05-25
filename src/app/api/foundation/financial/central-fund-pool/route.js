import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    console.log('Central Fund Pool API called');
    
    // Check authentication
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('hospitium_session');
    
    if (!sessionCookie?.value) {
      console.log('No session cookie found');
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // Verify user exists and is active
    const currentUser = await prisma.user.findUnique({
      where: { id: sessionCookie.value },
    });

    if (!currentUser || currentUser.status !== 'ACTIVE' || !currentUser.emailVerified) {
      console.log('Invalid user or inactive account');
      return NextResponse.json({ success: false, error: 'Invalid authentication' }, { status: 401 });
    }

    console.log('User authenticated:', currentUser.email, 'Type:', currentUser.accountType);

    // Only allow foundation admins to access this endpoint
    if (currentUser.accountType !== 'FOUNDATION_ADMIN') {
      console.log('Access denied - not a foundation admin');
      return NextResponse.json({ success: false, error: 'Access denied. Foundation Admin access required.' }, { status: 403 });
    }

    console.log('Fetching campaigns from database...');
    
    // Fetch all campaigns with their categories
    const campaigns = await prisma.campaign.findMany({
      include: {
        category: true,
        donations: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`Found ${campaigns.length} campaigns`);

    // Calculate actual raised amount from donations for each campaign
    const campaignsWithCalculatedAmounts = campaigns.map(campaign => {
      const actualRaised = campaign.donations.reduce((sum, donation) => 
        sum + Number(donation.amount), 0
      );
      return {
        ...campaign,
        calculatedRaisedAmount: actualRaised
      };
    });

    // Calculate fund pool data using actual donation amounts
    const totalRaised = campaignsWithCalculatedAmounts.reduce((sum, campaign) => 
      sum + campaign.calculatedRaisedAmount, 0
    );

    console.log('Total raised from donations:', totalRaised);

    const activeCampaigns = campaignsWithCalculatedAmounts.filter(c => c.status === 'Active');
    const completedCampaigns = campaignsWithCalculatedAmounts.filter(c => c.status === 'Completed');

    // Group by category
    const fundraisingFunds = campaignsWithCalculatedAmounts
      .filter(c => c.category.name !== 'Research Grants' && c.category.name !== 'Grant')
      .reduce((sum, campaign) => sum + campaign.calculatedRaisedAmount, 0);

    const grantFunds = campaignsWithCalculatedAmounts
      .filter(c => c.category.name === 'Research Grants' || c.category.name === 'Grant')
      .reduce((sum, campaign) => sum + campaign.calculatedRaisedAmount, 0);

    // Create fund sources from campaigns with calculated amounts
    const fundSources = campaignsWithCalculatedAmounts.map(campaign => {
      const actualRaised = campaign.calculatedRaisedAmount;
      return {
        id: campaign.id,
        name: campaign.name,
        type: campaign.category.name,
        amount: actualRaised,
        targetAmount: campaign.targetAmount ? Number(campaign.targetAmount) : null,
        available: actualRaised, // Assuming all raised is available for now
        reserved: 0,
        allocated: 0,
        status: campaign.targetAmount && actualRaised >= Number(campaign.targetAmount) 
          ? 'unrestricted' 
          : 'restricted',
        category: campaign.category.name.includes('Grant') ? 'Grants' : 'Fundraising',
        dateReceived: campaign.createdAt,
        source: campaign.category.name,
        restrictions: campaign.targetAmount 
          ? `Target: ${Number(campaign.targetAmount).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}` 
          : 'None - Unrestricted funds',
        purpose: campaign.description || 'General operational support and program funding',
        expiryDate: campaign.endDate,
        notes: `${campaign.donations.length} donations totaling ${actualRaised.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`,
        donorCount: campaign.donorCount,
        donationCount: campaign.donations.length,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        campaignStatus: campaign.status
      };
    });

    // Get recent donations as transactions
    const recentDonations = await prisma.donation.findMany({
      include: {
        campaign: {
          include: {
            category: true
          }
        }
      },
      orderBy: {
        donationDate: 'desc'
      },
      take: 50
    });

    const transactions = recentDonations.map(donation => ({
      id: donation.id,
      date: donation.donationDate,
      type: 'Inflow',
      source: donation.campaign ? donation.campaign.name : 'Direct Donation',
      amount: Number(donation.amount),
      category: donation.campaign?.category?.name || 'General',
      status: 'Completed',
      reference: donation.transactionId || `DON-${donation.id.slice(0, 8)}`,
      donorName: donation.donorName,
      donorType: donation.donorType,
      paymentMethod: donation.paymentMethod
    }));

    // Calculate monthly inflow (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const monthlyDonations = await prisma.donation.findMany({
      where: {
        donationDate: {
          gte: thirtyDaysAgo
        }
      }
    });

    const monthlyInflow = monthlyDonations.reduce((sum, donation) => 
      sum + Number(donation.amount), 0
    );

    const responseData = {
      success: true,
      data: {
        fundData: {
          totalPool: totalRaised,
          available: totalRaised, // Assuming all is available for now
          allocated: 0,
          reserved: 0,
          monthlyInflow: monthlyInflow,
          monthlyOutflow: 0, // Would need expense tracking
          fundraisingFunds: {
            total: fundraisingFunds,
            available: fundraisingFunds,
            reserved: 0,
            allocated: 0
          },
          grantFunds: {
            total: grantFunds,
            available: grantFunds,
            reserved: 0,
            allocated: 0
          }
        },
        fundSources: fundSources,
        transactions: transactions,
        statistics: {
          totalCampaigns: campaigns.length,
          activeCampaigns: activeCampaigns.length,
          completedCampaigns: completedCampaigns.length,
          totalDonors: campaigns.reduce((sum, c) => sum + c.donorCount, 0),
          totalDonations: campaigns.reduce((sum, c) => sum + c.donationCount, 0)
        }
      }
    };

    console.log('Returning data:', {
      totalPool: totalRaised,
      campaignCount: campaigns.length,
      fundSourcesCount: fundSources.length,
      transactionsCount: transactions.length
    });

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error fetching central fund pool data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch fund pool data', details: error.message },
      { status: 500 }
    );
  }
}
