import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { isTrainingAdmin, resolveTrainingInstitution } from '@/lib/training-admin-server';

/** Training admin with an institution (#98). @returns {{ user, institution } | { error }} */
export async function requireTemplateAdmin(request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (!isTrainingAdmin(user)) {
    return { error: NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 }) };
  }
  const institution = await resolveTrainingInstitution(user);
  if (!institution) {
    return { error: NextResponse.json({ error: 'No institution found for this admin account' }, { status: 400 }) };
  }
  const full = await prisma.institution.findUnique({ where: { id: institution.id }, select: { id: true, name: true } });
  return { user, institution: full || institution };
}

/** A template of this institution, or null (out-of-scope ids look missing). */
export async function findInstitutionTemplate(id, institutionId) {
  if (!id) return null;
  const template = await prisma.trainingCertificateTemplate.findUnique({ where: { id } });
  return template && template.institutionId === institutionId ? template : null;
}

/** Template for a training: its own, else the institution default, else null (built-in). */
export async function templateForTraining(training) {
  if (training?.certificateTemplateId) {
    const own = await findInstitutionTemplate(training.certificateTemplateId, training.institutionId);
    if (own) return own;
  }
  return prisma.trainingCertificateTemplate.findFirst({
    where: { institutionId: training.institutionId, isDefault: true },
    orderBy: { updatedAt: 'desc' },
  });
}

export function templateSummary(t) {
  return {
    id: t.id,
    name: t.name,
    orientation: t.orientation,
    primaryColor: t.primaryColor,
    isDefault: t.isDefault,
    hasLogo: Boolean(t.logoDataUrl),
    signatories: (t.signatories || []).length,
    updatedAt: t.updatedAt,
  };
}
