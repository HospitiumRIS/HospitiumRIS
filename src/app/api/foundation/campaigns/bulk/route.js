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
    const records = body.campaigns || body.records || [];

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: 'No records provided' }, { status: 400 });
    }
    if (records.length > 500) {
      return NextResponse.json({ error: 'Maximum 500 campaigns per import' }, { status: 400 });
    }

    const succeeded = [];
    const failed = [];

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      const rowIndex = i + 1;
      try {
        const { name, description, startDate, endDate, targetAmount, status, categoryName } = rec;

        const nameStr = name != null ? String(name).trim() : '';
        if (!nameStr) throw new Error('Campaign name is required');

        // Resolve category by name (required for campaign creation)
        let resolvedCategoryId = null;
        const catStr = categoryName != null ? String(categoryName).trim() : '';
        if (catStr) {
          const found = await prisma.campaignCategory.findFirst({
            where: { name: { equals: catStr, mode: 'insensitive' } },
          });
          resolvedCategoryId = found?.id || null;
        }

        // If no category resolved, use the first available category as fallback
        if (!resolvedCategoryId) {
          const firstCat = await prisma.campaignCategory.findFirst({ orderBy: { name: 'asc' } });
          resolvedCategoryId = firstCat?.id || null;
        }

        if (!resolvedCategoryId) {
          throw new Error('No category found — create at least one category first');
        }

        // Check for duplicate name in this category
        const existing = await prisma.campaign.findFirst({
          where: { categoryId: resolvedCategoryId, name: { equals: nameStr, mode: 'insensitive' } },
        });
        if (existing) throw new Error(`Campaign "${nameStr}" already exists`);

        // Parse amounts and dates safely
        const targetAmt = targetAmount ? parseFloat(String(targetAmount).replace(/[,$ ]/g, '')) : null;
        const parsedStart = startDate ? new Date(startDate) : null;
        const parsedEnd = endDate ? new Date(endDate) : null;

        if (parsedStart && parsedEnd && parsedStart >= parsedEnd) {
          throw new Error('Start date must be before end date');
        }

        const newCampaign = await prisma.campaign.create({
          data: {
            categoryId: resolvedCategoryId,
            name: nameStr,
            description: description?.trim() || null,
            targetAmount: targetAmt && !isNaN(targetAmt) && targetAmt > 0 ? targetAmt : null,
            startDate: parsedStart && !isNaN(parsedStart.getTime()) ? parsedStart : null,
            endDate: parsedEnd && !isNaN(parsedEnd.getTime()) ? parsedEnd : null,
            status: status?.trim() || 'Planning',
          },
        });

        succeeded.push({ rowIndex, id: newCampaign.id, name: newCampaign.name });
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
    console.error('Bulk campaign import error:', error);
    return NextResponse.json({ success: false, error: 'Bulk import failed' }, { status: 500 });
  }
}
