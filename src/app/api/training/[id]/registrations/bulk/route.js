import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireSessionAdmin } from '@/lib/training-sessions-server';
import { promotionTarget } from '@/lib/training-enrolment';
import { applyRegistrationStatus } from '@/lib/training-registration-server';

const ACTIONS = {
  approve: () => 'REGISTERED',
  reject: () => 'REJECTED',
  promote: (training) => promotionTarget(training),
  cancel: () => 'CANCELLED',
};

/**
 * POST /api/training/[id]/registrations/bulk
 * Body: { action: 'approve' | 'reject' | 'promote' | 'cancel', registrationIds: string[], reason? }
 * Approve requests, reject them (reason recommended), move people up from the waiting
 * list, or cancel, for many participants at once (#102). Training admin only. Each one
 * goes through the same checks as a single change; failures are reported per person.
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireSessionAdmin(request, id);
    if (access.error) return access.error;

    const body = await request.json().catch(() => ({}));
    const toStatus = ACTIONS[body?.action];
    if (!toStatus) return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    const ids = Array.isArray(body?.registrationIds) ? [...new Set(body.registrationIds.filter((x) => typeof x === 'string'))].slice(0, 500) : [];
    if (!ids.length) return NextResponse.json({ error: 'Select at least one participant' }, { status: 400 });

    const registrations = await prisma.trainingRegistration.findMany({
      where: { id: { in: ids }, trainingId: id },
      include: { training: true },
      orderBy: { registeredAt: 'asc' }, // waiting-list order when promoting
    });

    let changed = 0;
    const failed = [];
    for (const registration of registrations) {
      const status = toStatus(registration.training);
      const result = await applyRegistrationStatus(registration, status, { actor: access.user, reason: body?.reason || null });
      if (result.ok) changed += result.changed ? 1 : 0;
      else failed.push({ registrationId: registration.id, error: result.error });
    }
    return NextResponse.json({ success: true, changed, failed });
  } catch (error) {
    console.error('Bulk registration action failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
