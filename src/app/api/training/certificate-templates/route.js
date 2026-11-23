import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateTemplateInput } from '@/lib/certificate-template';
import { requireTemplateAdmin, templateSummary } from '@/lib/certificate-templates-server';

/**
 * GET /api/training/certificate-templates
 * The institution's certificate templates (summaries). Training admin only (#98).
 */
export async function GET(request) {
  try {
    const access = await requireTemplateAdmin(request);
    if (access.error) return access.error;
    const templates = await prisma.trainingCertificateTemplate.findMany({
      where: { institutionId: access.institution.id },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });
    return NextResponse.json({ success: true, templates: templates.map(templateSummary) });
  } catch (error) {
    console.error('Error listing certificate templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/training/certificate-templates
 * Create a template. The first one becomes the institution default.
 */
export async function POST(request) {
  try {
    const access = await requireTemplateAdmin(request);
    if (access.error) return access.error;
    const body = await request.json().catch(() => null);
    const validation = validateTemplateInput(body);
    if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

    const institutionId = access.institution.id;
    const count = await prisma.trainingCertificateTemplate.count({ where: { institutionId } });
    const isDefault = validation.data.isDefault || count === 0;
    const template = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.trainingCertificateTemplate.updateMany({ where: { institutionId, isDefault: true }, data: { isDefault: false } });
      }
      return tx.trainingCertificateTemplate.create({
        data: { ...validation.data, isDefault, institutionId, createdBy: access.user.id },
      });
    });
    return NextResponse.json({ success: true, template }, { status: 201 });
  } catch (error) {
    console.error('Error creating certificate template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
