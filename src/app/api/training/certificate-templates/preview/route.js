import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { SAMPLE_VALUES, buildCertificateValues, validateTemplateInput } from '@/lib/certificate-template';
import { buildCertificatePdf } from '@/lib/certificate-pdf';
import { findInstitutionTemplate, requireTemplateAdmin, templateForTraining } from '@/lib/certificate-templates-server';

/**
 * POST /api/training/certificate-templates/preview
 * Body: { template | templateId | useTrainingTemplate, trainingId? } -> PDF with a PREVIEW watermark (#98).
 * The template doesn't have to be saved, so the editor can show changes live.
 * With trainingId (of this institution) the training's title, dates, CPD and
 * accreditation are used; otherwise sample values.
 */
export async function POST(request) {
  try {
    const access = await requireTemplateAdmin(request);
    if (access.error) return access.error;
    const body = await request.json().catch(() => null);
    // Template source: the body (unsaved edits), a saved template id, or what the
    // training would use ({ trainingId, useTrainingTemplate: true }).
    let source = body?.template || {};
    if (body?.templateId) {
      const saved = await findInstitutionTemplate(body.templateId, access.institution.id);
      if (!saved) return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      source = saved;
    } else if (body?.useTrainingTemplate && body?.trainingId) {
      const training = await prisma.training.findUnique({ where: { id: body.trainingId } });
      if (training && training.institutionId === access.institution.id) {
        source = (await templateForTraining(training)) || {};
      }
    }
    const validation = validateTemplateInput({ ...source, name: 'Preview' });
    if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

    let values = { ...SAMPLE_VALUES, institutionName: access.institution.name || SAMPLE_VALUES.institutionName };
    let accreditationLogoDataUrl = null;
    if (body?.trainingId) {
      const training = await prisma.training.findUnique({ where: { id: body.trainingId } });
      if (training && training.institutionId === access.institution.id) {
        values = {
          ...buildCertificateValues({
            participant: { givenName: 'Jane Wanjiku', familyName: 'Achieng' },
            training,
            institution: access.institution,
            completedAt: training.endDate,
            certificateNumber: `${training.certificatePrefix || 'HRIS'}-${new Date().getFullYear()}-000123`,
          }),
        };
        accreditationLogoDataUrl = training.accreditationLogoDataUrl;
      }
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const pdf = await buildCertificatePdf({
      template: validation.data,
      values,
      verifyUrl: `${origin.replace(/\/$/, '')}/verify/certificate/SAMPLE`,
      accreditationLogoDataUrl,
      watermark: 'PREVIEW',
    });
    return new NextResponse(pdf, {
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'inline; filename="certificate-preview.pdf"', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Error rendering certificate preview:', error);
    return NextResponse.json({ error: 'Could not render the preview' }, { status: 500 });
  }
}
