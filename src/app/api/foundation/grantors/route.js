import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/foundation/grantors - Get all grantors with their opportunities
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

    // Build where clause for filtering
    let whereClause = {};
    
    if (search) {
      whereClause = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { type: { contains: search, mode: 'insensitive' } },
          { country: { contains: search, mode: 'insensitive' } },
          { focus: { hasSome: [search] } }
        ]
      };
    }

    if (status !== 'all') {
      whereClause.status = status;
    }

    const grantors = await prisma.grantor.findMany({
      where: whereClause,
      include: {
        opportunities: {
          orderBy: [
            { deadline: 'asc' }
          ]
        }
      },
      orderBy: [
        { name: 'asc' }
      ]
    });

    return NextResponse.json({
      success: true,
      grantors: grantors || []
    });

  } catch (error) {
    console.error('Error fetching grantors:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch grantors' },
      { status: 500 }
    );
  }
}

// POST /api/foundation/grantors - Create a new grantor
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name,
      type,
      focus,
      contactPerson,
      email,
      phone,
      country,
      notes
    } = body;

    // Validate required fields
    if (!name || !type || !country) {
      return NextResponse.json(
        { success: false, error: 'Name, type, and country are required fields' },
        { status: 400 }
      );
    }

    // Create the grantor
    const grantor = await prisma.grantor.create({
      data: {
        name: name.trim(),
        type,
        focus: focus || [],
        contactPerson: contactPerson?.trim() || '',
        email: email?.trim() || '',
        phone: phone?.trim() || '',
        country,
        notes: notes?.trim() || '',
        status: 'active' // Default status
      }
    });

    return NextResponse.json({
      success: true,
      grantor,
      message: 'Grantor created successfully'
    });

  } catch (error) {
    console.error('Error creating grantor:', error);
    
    // Handle unique constraint violations
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'A grantor with this name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create grantor' },
      { status: 500 }
    );
  }
}

// PUT /api/foundation/grantors - Update an existing grantor
export async function PUT(request) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      type,
      focus,
      contactPerson,
      email,
      phone,
      country,
      notes,
      status
    } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Grantor ID is required' },
        { status: 400 }
      );
    }

    if (!name || !type || !country) {
      return NextResponse.json(
        { success: false, error: 'Name, type, and country are required fields' },
        { status: 400 }
      );
    }

    // Update the grantor
    const grantor = await prisma.grantor.update({
      where: { id },
      data: {
        name: name.trim(),
        type,
        focus: focus || [],
        contactPerson: contactPerson?.trim() || '',
        email: email?.trim() || '',
        phone: phone?.trim() || '',
        country,
        notes: notes?.trim() || '',
        status: status || 'active'
      }
    });

    return NextResponse.json({
      success: true,
      grantor,
      message: 'Grantor updated successfully'
    });

  } catch (error) {
    console.error('Error updating grantor:', error);
    
    // Handle not found
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Grantor not found' },
        { status: 404 }
      );
    }

    // Handle unique constraint violations
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'A grantor with this name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update grantor' },
      { status: 500 }
    );
  }
}

// DELETE /api/foundation/grantors - Delete a grantor
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Grantor ID is required' },
        { status: 400 }
      );
    }

    // Check if grantor has opportunities
    const grantorWithOpportunities = await prisma.grantor.findUnique({
      where: { id },
      include: {
        opportunities: true
      }
    });

    if (!grantorWithOpportunities) {
      return NextResponse.json(
        { success: false, error: 'Grantor not found' },
        { status: 404 }
      );
    }

    if (grantorWithOpportunities.opportunities.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete grantor with existing opportunities' },
        { status: 400 }
      );
    }

    // Delete the grantor
    await prisma.grantor.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Grantor deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting grantor:', error);
    
    // Handle not found
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Grantor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete grantor' },
      { status: 500 }
    );
  }
}
