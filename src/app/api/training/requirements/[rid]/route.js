import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { complianceAdmin } from '@/lib/training-compliance-route';
import { saveRequirement } from '@/lib/training-compliance-server';

/** PUT /api/training/requirements/:rid: update a requirement and its linked cohorts (#140). */
export async function PUT(request, { params }) {
  try {
    const ctx = await complianceAdmin(request);
    if (ctx.error) return ctx.error;
    const { rid } = await params;
    const result = await saveRequirement(ctx.institutionId, ctx.user, rid, await request.json().catch(() => ({})));
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status || 400 });
    return NextResponse.json({ success: true, requirement: result.requirement });
  } catch (error) {
    console.error('Updating requirement failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** DELETE /api/training/requirements/:rid: remove a requirement (cohorts are unlinked, exemptions removed). */
export async function DELETE(request, { params }) {
  try {
    const ctx = await complianceAdmin(request);
    if (ctx.error) return ctx.error;
    const { rid } = await params;
    const found = await prisma.trainingRequirement.findFirst({ where: { id: rid, institutionId: ctx.institutionId }, select: { id: true } });
    if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await prisma.trainingRequirement.delete({ where: { id: rid } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Deleting requirement failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
