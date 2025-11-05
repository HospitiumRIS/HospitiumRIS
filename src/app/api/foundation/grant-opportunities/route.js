import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/foundation/grant-opportunities - Get all grant opportunities
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const grantorId = searchParams.get('grantorId');
    const status = searchParams.get('status') || 'all';

    // Build where clause for filtering
    let whereClause = {};
    
    if (search) {
      whereClause = {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } },
          { category: { hasSome: [search] } },
          { eligibility: { hasSome: [search] } }
        ]
      };
    }

    if (grantorId) {
      whereClause.grantorId = grantorId;
    }

    if (status !== 'all') {
      whereClause.status = status;
    }

    const opportunities = await prisma.grantOpportunity.findMany({
      where: whereClause,
      include: {
        grantor: {
          select: {
            id: true,
            name: true,
            type: true,
            country: true
          }
        }
      },
      orderBy: [
        { deadline: 'asc' }
      ]
    });

    return NextResponse.json({
      success: true,
      opportunities: opportunities || []
    });

  } catch (error) {
    console.error('Error fetching grant opportunities:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch grant opportunities' },
      { status: 500 }
    );
  }
}

// POST /api/foundation/grant-opportunities - Create a new grant opportunity
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      title,
      amount,
      deadline,
      category,
      eligibility,
      notes,
      grantorId
    } = body;

    // Validate required fields
    if (!title || !amount || !deadline || !grantorId) {
      return NextResponse.json(
        { success: false, error: 'Title, amount, deadline, and grantor are required fields' },
        { status: 400 }
      );
    }

    // Validate that the grantor exists
    const grantor = await prisma.grantor.findUnique({
      where: { id: grantorId }
    });

    if (!grantor) {
      return NextResponse.json(
        { success: false, error: 'Invalid grantor selected' },
        { status: 400 }
      );
    }

    // Parse amount as number
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    // Validate deadline format
    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid deadline format' },
        { status: 400 }
      );
    }

    // Create the grant opportunity
    const opportunity = await prisma.grantOpportunity.create({
      data: {
        title: title.trim(),
        amount: parsedAmount,
        deadline: deadlineDate,
        category: category || [],
        eligibility: eligibility || [],
        notes: notes?.trim() || '',
        status: 'open', // Default status
        grantorId
      },
      include: {
        grantor: {
          select: {
            id: true,
            name: true,
            type: true,
            country: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      opportunity,
      message: 'Grant opportunity created successfully'
    });

  } catch (error) {
    console.error('Error creating grant opportunity:', error);
    
    // Handle foreign key constraint violations
    if (error.code === 'P2003') {
      return NextResponse.json(
        { success: false, error: 'Invalid grantor selected' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create grant opportunity' },
      { status: 500 }
    );
  }
}

// PUT /api/foundation/grant-opportunities - Update an existing grant opportunity
export async function PUT(request) {
  try {
    const body = await request.json();
    const {
      id,
      title,
      amount,
      deadline,
      category,
      eligibility,
      notes,
      status,
      grantorId
    } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Opportunity ID is required' },
        { status: 400 }
      );
    }

    if (!title || !amount || !deadline || !grantorId) {
      return NextResponse.json(
        { success: false, error: 'Title, amount, deadline, and grantor are required fields' },
        { status: 400 }
      );
    }

    // Parse amount as number
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    // Validate deadline format
    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid deadline format' },
        { status: 400 }
      );
    }

    // Update the grant opportunity
    const opportunity = await prisma.grantOpportunity.update({
      where: { id },
      data: {
        title: title.trim(),
        amount: parsedAmount,
        deadline: deadlineDate,
        category: category || [],
        eligibility: eligibility || [],
        notes: notes?.trim() || '',
        status: status || 'open',
        grantorId
      },
      include: {
        grantor: {
          select: {
            id: true,
            name: true,
            type: true,
            country: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      opportunity,
      message: 'Grant opportunity updated successfully'
    });

  } catch (error) {
    console.error('Error updating grant opportunity:', error);
    
    // Handle not found
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Grant opportunity not found' },
        { status: 404 }
      );
    }

    // Handle foreign key constraint violations
    if (error.code === 'P2003') {
      return NextResponse.json(
        { success: false, error: 'Invalid grantor selected' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update grant opportunity' },
      { status: 500 }
    );
  }
}

// DELETE /api/foundation/grant-opportunities - Delete a grant opportunity
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Opportunity ID is required' },
        { status: 400 }
      );
    }

    // Delete the grant opportunity
    await prisma.grantOpportunity.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Grant opportunity deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting grant opportunity:', error);
    
    // Handle not found
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Grant opportunity not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete grant opportunity' },
      { status: 500 }
    );
  }
}
