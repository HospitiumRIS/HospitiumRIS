import { maybeRunTrainingAutomation } from '@/lib/training-automation-server';
import { eligibilityFor, enrolmentSummary } from '@/lib/training-enrolment-server';
import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { getAuthenticatedUser } from '../../../lib/auth-server';
import { normalizeTargetGroups, TRAINING_ADMIN_TYPES } from '@/lib/training-admin';
import { resolveTrainingInstitution, resolveTrainingScopeContext } from '@/lib/training-admin-server';
import { isActiveRegistration, redactMeetingLink, trainingAdminListWhere, trainingVisibilityWhere } from '@/lib/training-scope';
import { buildDailySessions, resolveTrainingDeliveryUpdate } from '@/lib/training-sessions';
import { auditTraining } from '@/lib/training-audit';

/**
 * GET /api/training
 * List trainings visible to the caller (tenant-scoped, see lib/training-scope.js)
 */
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const includeAll = searchParams.get('includeAll') === 'true'; // For admin to see all statuses

    const isTrainingAdmin = TRAINING_ADMIN_TYPES.includes(user.accountType);
    // Keeps reminders and status changes going without a scheduler (#110): at most
    // every 15 minutes per server, in the background.
    maybeRunTrainingAutomation();
    const scopeCtx = await resolveTrainingScopeContext(user);

    // Tenant scoping (#88): admins managing trainings (includeAll) only see their own
    // institution's trainings, in any status. Everyone else sees their institution's
    // published trainings plus published trainings open to other institutions.
    const scopeWhere = includeAll && isTrainingAdmin
      ? trainingAdminListWhere(user, scopeCtx)
      : trainingVisibilityWhere(user, scopeCtx);

    const where = { AND: [scopeWhere] };
    if (!includeAll || !isTrainingAdmin) {
      where.AND.push({ status: 'PUBLISHED' });
    } else if (status) {
      where.AND.push({ status });
    }

    const trainings = await prisma.training.findMany({
      where,
      include: {
        modules: {
          where: { status: 'ACTIVE' },
          orderBy: { order: 'asc' },
        },
        registrations: {
          select: {
            id: true,
            userId: true,
            status: true,
            registeredAt: true,
          },
        },
        _count: {
          select: {
            registrations: true,
            modules: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    // Eligibility for the caller, in one pass over all listed trainings (#102).
    const eligibility = await eligibilityFor(user, trainings);

    // Transform data to include computed fields
    const transformedTrainings = trainings.map(training => {
      const enrolment = enrolmentSummary(training, training.registrations, user.id);
      const activeRegistrations = training.registrations.filter(
        r => isActiveRegistration(r)
      ).length;

      // Pending approvals hold a place too (#102).
      const remainingSlots = enrolment.remainingSlots;
      const userRegistration = training.registrations.find(r => r.userId === user.id);

      const ownsIt = includeAll && isTrainingAdmin;
      const canSeeLink = ownsIt || isActiveRegistration(userRegistration);
      const linkFields = redactMeetingLink(
        { location: training.location, onlineLink: training.onlineLink, venue: training.venue },
        canSeeLink
      );

      return {
        id: training.id,
        title: training.title,
        description: training.description,
        department: training.department,
        targetGroup: training.targetGroup,
        location: linkFields.location,
        deliveryMode: training.deliveryMode,
        venue: training.venue,
        onlineLink: linkFields.onlineLink,
        hasOnlineLink: linkFields.hasOnlineLink ?? Boolean(training.onlineLink),
        code: training.code,
        category: training.category,
        startDate: training.startDate,
        endDate: training.endDate,
        maxParticipants: training.maxParticipants,
        status: training.status,
        openToOtherInstitutions: training.openToOtherInstitutions,
        institutionId: training.institutionId,
        createdBy: training.createdBy,
        createdAt: training.createdAt,
        updatedAt: training.updatedAt,
        moduleCount: training._count.modules,
        registrationCount: activeRegistrations,
        remainingSlots,
        // A cancelled registration no longer counts as registered (#89).
        isRegistered: isActiveRegistration(userRegistration),
        userRegistrationStatus: userRegistration?.status || null,
        modules: training.modules,
        isMandatory: training.isMandatory,
        // Learning hub catalogue (#107).
        cpdHours: training.cpdHours,
        cpdPoints: training.cpdPoints,
        fromOtherInstitution: Boolean(scopeCtx.institutionId) && training.institutionId !== scopeCtx.institutionId,
        // Enrolment controls (#102).
        waitlistCount: enrolment.waitlistCount,
        myWaitlistPosition: enrolment.myWaitlistPosition,
        requiresApproval: training.requiresApproval,
        waitlistEnabled: training.waitlistEnabled,
        registrationOpensAt: training.registrationOpensAt,
        registrationClosesAt: training.registrationClosesAt,
        cancellationDeadline: training.cancellationDeadline,
        eligibilityMode: training.eligibilityMode,
        eligibility: eligibility.get(training.id),
      };
    });

    return NextResponse.json({
      success: true,
      count: transformedTrainings.length,
      trainings: transformedTrainings,
    });
  } catch (error) {
    console.error('Error fetching trainings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/training
 * Create a new training (Admin only)
 */
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user || !TRAINING_ADMIN_TYPES.includes(user.accountType)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      department,
      targetGroup,
      location,
      startDate,
      endDate,
      maxParticipants,
      status = 'DRAFT',
      openToOtherInstitutions = false,
    } = body;

    // Validation
    if (!title || !department || !targetGroup || !startDate || !endDate || !maxParticipants) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const targetGroupArray = normalizeTargetGroups(targetGroup);
    if (targetGroupArray.length === 0) {
      return NextResponse.json(
        { error: 'At least one target group is required' },
        { status: 400 }
      );
    }

    const delivery = resolveTrainingDeliveryUpdate(body);
    if (delivery.error) {
      return NextResponse.json({ error: delivery.error }, { status: 400 });
    }

    const ownInstitution = await resolveTrainingInstitution(user);

    if (!ownInstitution) {
      return NextResponse.json(
        { error: 'No institution found for this admin account' },
        { status: 400 }
      );
    }

    // Create training
    const training = await prisma.training.create({
      data: {
        title,
        description,
        department,
        targetGroup: targetGroupArray,
        location: delivery.location ?? location ?? null,
        deliveryMode: delivery.deliveryMode || 'IN_PERSON',
        venue: delivery.venue ?? null,
        onlineLink: delivery.onlineLink ?? null,
        code: typeof body.code === 'string' ? body.code.trim() || null : null,
        category: typeof body.category === 'string' ? body.category.trim() || null : null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        maxParticipants: parseInt(maxParticipants),
        status,
        openToOtherInstitutions: openToOtherInstitutions === true,
        institutionId: ownInstitution.id,
        createdBy: user.id,
      },
      include: {
        modules: true,
        _count: {
          select: {
            registrations: true,
            modules: true,
          },
        },
      },
    });

    // Default schedule (#91): one session per day of the training. Admins can edit,
    // add or split sessions afterwards in the Schedule tab.
    const sessions = buildDailySessions(training);
    if (sessions.length) {
      await prisma.trainingSession.createMany({
        data: sessions.map((session) => ({ ...session, trainingId: training.id, createdBy: user.id })),
      });
    }
    await auditTraining({
      trainingId: training.id,
      actorId: user.id,
      action: 'TRAINING_CREATED',
      entityType: 'Training',
      entityId: training.id,
      after: { title: training.title, status: training.status, sessions: sessions.length },
    });

    return NextResponse.json({
      success: true,
      training,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating training:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
