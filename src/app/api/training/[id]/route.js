import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../lib/auth-server';
import {
  normalizeTargetGroups,
  trainingBelongsToInstitution,
  TRAINING_ADMIN_TYPES,
} from '@/lib/training-admin';
import { resolveTrainingInstitution, resolveTrainingScopeContext } from '@/lib/training-admin-server';
import { canViewTraining, isOwningTrainingAdmin, shapeTrainingForViewer } from '@/lib/training-scope';
import { resolveTrainingDeliveryUpdate, sessionsOutsideTraining } from '@/lib/training-sessions';
import { auditTraining } from '@/lib/training-audit';
import { serializeSession } from '@/lib/training-sessions-server';

/**
 * GET /api/training/[id]
 * Get a single training with full details
 */
export async function GET(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const training = await prisma.training.findUnique({
      where: { id },
      include: {
        modules: {
          where: { status: 'ACTIVE' },
          orderBy: { order: 'asc' },
        },
        materials: {
          orderBy: { createdAt: 'desc' },
        },
        sessions: {
          orderBy: [{ startsAt: 'asc' }, { order: 'asc' }],
          include: { module: { select: { id: true, title: true } } },
        },
        registrations: {
          include: {
            user: {
              select: {
                id: true,
                givenName: true,
                familyName: true,
                email: true,
                researchProfile: {
                  select: {
                    department: true,
                  },
                },
              },
            },
            moduleProgress: {
              include: {
                module: true,
              },
            },
            certificate: true,
          },
        },
        _count: {
          select: {
            registrations: true,
            modules: true,
            materials: true,
          },
        },
      },
    });

    if (!training) {
      return NextResponse.json(
        { error: 'Training not found' },
        { status: 404 }
      );
    }

    // Tenant scoping (#88): out-of-scope trainings look like they don't exist.
    const scopeCtx = await resolveTrainingScopeContext(user);
    const hasRegistration = training.registrations.some((r) => r.userId === user.id);
    if (!canViewTraining(user, training, { ...scopeCtx, hasRegistration })) {
      return NextResponse.json(
        { error: 'Training not found' },
        { status: 404 }
      );
    }

    // Role-shaped response (#89): only the owning institution's training admins get
    // the participant roster and all materials. Everyone else gets counts plus their
    // own registration, and registered-only materials need an active registration.
    const isAdmin = isOwningTrainingAdmin(user, training, scopeCtx);

    const shaped = shapeTrainingForViewer(training, user, { isAdmin });
    // Sessions (#91): non-admins only see scheduled ones; meeting links only go to
    // admins and active registrants.
    const canSeeLink = isAdmin || shaped.isRegistered;
    shaped.sessions = training.sessions
      .filter((session) => isAdmin || session.status === 'SCHEDULED')
      .map((session) => serializeSession(session, training, { canSeeLink }));

    return NextResponse.json({
      success: true,
      training: shaped,
    });
  } catch (error) {
    console.error('Error fetching training:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/training/[id]
 * Update a training (Admin only)
 */
export async function PUT(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user || !TRAINING_ADMIN_TYPES.includes(user.accountType)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const existingTraining = await prisma.training.findUnique({
      where: { id },
    });

    if (!existingTraining) {
      return NextResponse.json(
        { error: 'Training not found' },
        { status: 404 }
      );
    }

    const ownInstitution = await resolveTrainingInstitution(user);

    if (!trainingBelongsToInstitution(existingTraining, ownInstitution?.id)) {
      return NextResponse.json(
        { error: 'Access denied - Training belongs to different institution' },
        { status: 403 }
      );
    }

    const {
      title,
      description,
      department,
      targetGroup,
      location,
      startDate,
      endDate,
      maxParticipants,
      status,
      openToOtherInstitutions,
    } = body;

    // Build update data
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (department !== undefined) updateData.department = department;
    if (targetGroup !== undefined) {
      const normalized = normalizeTargetGroups(targetGroup);
      if (normalized.length === 0) {
        return NextResponse.json(
          { error: 'At least one target group is required' },
          { status: 400 }
        );
      }
      updateData.targetGroup = normalized;
    }
    const delivery = resolveTrainingDeliveryUpdate(body, existingTraining);
    if (delivery.error) {
      return NextResponse.json({ error: delivery.error }, { status: 400 });
    }
    Object.assign(updateData, delivery);
    if (location !== undefined && delivery.location === undefined) updateData.location = location;
    if (body.code !== undefined) updateData.code = typeof body.code === 'string' ? body.code.trim() || null : null;
    if (body.category !== undefined) updateData.category = typeof body.category === 'string' ? body.category.trim() || null : null;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (maxParticipants !== undefined) updateData.maxParticipants = parseInt(maxParticipants);
    if (status !== undefined) updateData.status = status;
    if (openToOtherInstitutions !== undefined) updateData.openToOtherInstitutions = openToOtherInstitutions === true;

    const training = await prisma.training.update({
      where: { id },
      data: updateData,
      include: {
        modules: {
          where: { status: 'ACTIVE' },
          orderBy: { order: 'asc' },
        },
        sessions: { select: { id: true, startsAt: true, endsAt: true } },
        _count: {
          select: {
            registrations: true,
            modules: true,
          },
        },
      },
    });

    await auditTraining({
      trainingId: id,
      actorId: user.id,
      action: 'TRAINING_UPDATED',
      entityType: 'Training',
      entityId: id,
      before: { status: existingTraining.status, startDate: existingTraining.startDate, endDate: existingTraining.endDate },
      after: { status: training.status, startDate: training.startDate, endDate: training.endDate, fields: Object.keys(updateData) },
    });

    // Sessions are not moved automatically when the dates change; tell the admin
    // which ones now fall outside the training (#91).
    const sessionsOutside = sessionsOutsideTraining(training.sessions || [], training).length;

    return NextResponse.json({
      success: true,
      training,
      sessionsOutside,
    });
  } catch (error) {
    console.error('Error updating training:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/training/[id]
 * Delete a training (Admin only)
 */
export async function DELETE(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user || !TRAINING_ADMIN_TYPES.includes(user.accountType)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const existingTraining = await prisma.training.findUnique({
      where: { id },
      include: {
        registrations: true,
      },
    });

    if (!existingTraining) {
      return NextResponse.json(
        { error: 'Training not found' },
        { status: 404 }
      );
    }

    const ownInstitution = await resolveTrainingInstitution(user);

    if (!trainingBelongsToInstitution(existingTraining, ownInstitution?.id)) {
      return NextResponse.json(
        { error: 'Access denied - Training belongs to different institution' },
        { status: 403 }
      );
    }

    // Check if there are active registrations
    const activeRegistrations = existingTraining.registrations.filter(
      r => r.status === 'REGISTERED' || r.status === 'COMPLETED'
    );

    if (activeRegistrations.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete training with active registrations' },
        { status: 400 }
      );
    }

    await prisma.training.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Training deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting training:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
