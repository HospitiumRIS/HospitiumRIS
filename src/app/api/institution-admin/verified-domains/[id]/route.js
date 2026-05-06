import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';

export async function PUT(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (user.accountType !== 'INSTITUTION_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Institution Admin access required' },
        { status: 403 }
      );
    }

    const institution = await prisma.institution.findUnique({
      where: { userId: user.id }
    });

    if (!institution) {
      return NextResponse.json(
        { error: 'No institution found for this admin' },
        { status: 404 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { 
      status, 
      autoApproveUsers, 
      allowedAccountTypes,
      verificationMethod,
      notes 
    } = body;

    const existingDomain = await prisma.verifiedDomain.findFirst({
      where: {
        id,
        institutionId: institution.id
      }
    });

    if (!existingDomain) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      );
    }

    const updateData = {
      autoApproveUsers: autoApproveUsers !== undefined ? autoApproveUsers : existingDomain.autoApproveUsers,
      allowedAccountTypes: allowedAccountTypes || existingDomain.allowedAccountTypes,
      verificationMethod: verificationMethod || existingDomain.verificationMethod,
      notes: notes !== undefined ? notes : existingDomain.notes
    };

    if (status && status !== existingDomain.status) {
      updateData.status = status;
      
      if (status === 'VERIFIED' && existingDomain.status !== 'VERIFIED') {
        updateData.verifiedAt = new Date();
        updateData.verifiedBy = user.id;
      } else if (status === 'SUSPENDED') {
        updateData.suspendedAt = new Date();
        updateData.suspendedBy = user.id;
      }
    }

    const updatedDomain = await prisma.verifiedDomain.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      domain: updatedDomain
    });

  } catch (error) {
    console.error('Error updating verified domain:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (user.accountType !== 'INSTITUTION_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Institution Admin access required' },
        { status: 403 }
      );
    }

    const institution = await prisma.institution.findUnique({
      where: { userId: user.id }
    });

    if (!institution) {
      return NextResponse.json(
        { error: 'No institution found for this admin' },
        { status: 404 }
      );
    }

    const { id } = params;

    const existingDomain = await prisma.verifiedDomain.findFirst({
      where: {
        id,
        institutionId: institution.id
      }
    });

    if (!existingDomain) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      );
    }

    await prisma.verifiedDomain.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Domain deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting verified domain:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
