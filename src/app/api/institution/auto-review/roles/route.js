import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { autoReviewAccess, canManageReviewerRoles } from '@/lib/auto-review-access';

/** GET: reviewer roles (shared by all institutions). Portal users only (#9). */
export async function GET(request) {
  try {
    const ctx = await autoReviewAccess();
    if (ctx.error) return ctx.error;
    const roles = await prisma.reviewerRole.findMany({
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      success: true,
      roles
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

/** POST: create a reviewer role. Roles are shared by all institutions, so global admins only (#9). */
export async function POST(request) {
  try {
    const ctx = await autoReviewAccess();
    if (ctx.error) return ctx.error;
    if (!canManageReviewerRoles(ctx.user)) {
      return NextResponse.json({ success: false, error: 'Reviewer roles are shared by all institutions and can only be changed by a platform administrator' }, { status: 403 });
    }
    const body = await request.json().catch(() => ({}));
    const {
      name,
      type,
      description,
      canApprove = true,
      canReject = true,
      canRequestChange = true,
      canComment = true,
      canOverride = false
    } = body;

    if (!name || !type) {
      return NextResponse.json(
        { success: false, error: 'Name and type are required' },
        { status: 400 }
      );
    }

    const role = await prisma.reviewerRole.create({
      data: {
        name,
        type,
        description,
        canApprove,
        canReject,
        canRequestChange,
        canComment,
        canOverride
      }
    });

    return NextResponse.json({
      success: true,
      role
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create role' },
      { status: 500 }
    );
  }
}
