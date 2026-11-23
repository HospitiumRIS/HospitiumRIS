import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateTemplateInput } from '@/lib/certificate-template';
import { findInstitutionTemplate, requireTemplateAdmin } from '@/lib/certificate-templates-server';

/** GET /api/training/certificate-templates/[tid]: full template (with images). */
export async function GET(request, { params }) {
  try {
    const access = await requireTemplateAdmin(request);
    if (access.error) return access.error;
    const { tid } = await params;
    const template = await findInstitutionTemplate(tid, access.institution.id);
    if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    const usedBy = await prisma.training.count({ where: { certificateTemplateId: tid } });
    return NextResponse.json({ success: true, template, usedBy });
  } catch (error) {
    console.error('Error loading certificate template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** PUT /api/training/certificate-templates/[tid]: update (partial body allowed). */
export async function PUT(request, { params }) {
  try {
    const access = await requireTemplateAdmin(request);
    if (access.error) return access.error;
    const { tid } = await params;
    const existing = await findInstitutionTemplate(tid, access.institution.id);
    if (!existing) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

    const body = await request.json().catch(() => null);
    const validation = validateTemplateInput(body, existing);
    if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

    const institutionId = access.institution.id;
    const template = await prisma.$transaction(async (tx) => {
      if (validation.data.isDefault && !existing.isDefault) {
        await tx.trainingCertificateTemplate.updateMany({ where: { institutionId, isDefault: true }, data: { isDefault: false } });
      }
      return tx.trainingCertificateTemplate.update({
        where: { id: tid },
        // Unsetting the default is done by making another template the default.
        data: { ...validation.data, isDefault: validation.data.isDefault || existing.isDefault },
      });
    });
    return NextResponse.json({ success: true, template });
  } catch (error) {
    console.error('Error updating certificate template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** DELETE /api/training/certificate-templates/[tid]: trainings using it fall back to the default. */
export async function DELETE(request, { params }) {
  try {
    const access = await requireTemplateAdmin(request);
    if (access.error) return access.error;
    const { tid } = await params;
    const existing = await findInstitutionTemplate(tid, access.institution.id);
    if (!existing) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      await tx.trainingCertificateTemplate.delete({ where: { id: tid } });
      if (existing.isDefault) {
        const next = await tx.trainingCertificateTemplate.findFirst({
          where: { institutionId: access.institution.id },
          orderBy: { updatedAt: 'desc' },
        });
        if (next) await tx.trainingCertificateTemplate.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting certificate template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
