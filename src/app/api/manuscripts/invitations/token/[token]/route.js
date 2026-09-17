import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Public lookup for a collaboration invitation by token.
 * Used to prefill registration when a co-author does not yet have an account.
 * GET /api/manuscripts/invitations/token/[token]
 */
export async function GET(request, { params }) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      );
    }

    const invitation = await prisma.manuscriptInvitation.findUnique({
      where: { token },
      include: {
        manuscript: {
          select: { title: true, type: true }
        },
        inviter: {
          select: { givenName: true, familyName: true }
        }
      }
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    const expired = invitation.status !== 'PENDING' || invitation.expiresAt < new Date();
    const inviterName =
      `${invitation.inviter?.givenName || ''} ${invitation.inviter?.familyName || ''}`.trim() ||
      'A colleague';

    return NextResponse.json({
      success: true,
      data: {
        email: invitation.email,
        givenName: invitation.givenName,
        familyName: invitation.familyName,
        manuscriptTitle: invitation.manuscript?.title,
        inviterName,
        role: invitation.role,
        status: invitation.status,
        expired
      }
    });
  } catch (error) {
    console.error('Error fetching invitation by token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
