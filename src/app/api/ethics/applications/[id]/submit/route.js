import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { canModifyEthicsApplication } from '@/lib/ethics-access';
import { sessionUser } from '@/lib/review-access-server';

// POST - Submit ethics application for review
export async function POST(request, { params }) {
  try {
    const auth = await sessionUser(request);
    if (auth.error) return auth.error;
    const { id } = await params;

    const application = await prisma.ethicsApplication.findUnique({
      where: { id }
    });

    // Only the applicant submits; other people's applications are not revealed (#6).
    if (!application || !(await canModifyEthicsApplication(prisma, auth.user, application))) {
      return NextResponse.json(
        { success: false, error: 'Ethics application not found' },
        { status: 404 }
      );
    }

    if (application.status !== 'DRAFT' && application.status !== 'REVISION_REQUESTED') {
      return NextResponse.json(
        { success: false, error: 'Application can only be submitted from DRAFT or REVISION_REQUESTED status' },
        { status: 400 }
      );
    }

    // Generate reference number if not exists
    let referenceNumber = application.referenceNumber;
    if (!referenceNumber) {
      const year = new Date().getFullYear();
      const count = await prisma.ethicsApplication.count({
        where: {
          submittedDate: {
            gte: new Date(`${year}-01-01`)
          }
        }
      });
      referenceNumber = `ETH-${year}-${String(count + 1).padStart(4, '0')}`;
    }

    const updatedApplication = await prisma.ethicsApplication.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        submittedDate: new Date(),
        referenceNumber
      }
    });

    return NextResponse.json({
      success: true,
      application: updatedApplication,
      message: 'Ethics application submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting ethics application:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit ethics application' },
      { status: 500 }
    );
  }
}
