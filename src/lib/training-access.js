import prisma from './prisma.js';
import { resolveTenantId } from './tenant.js';

async function userHasTrainingAccess(user, training) {
  if (!user || !training) return false;

  const userTenant = resolveTenantId(user);
  if (user.accountType === 'GLOBAL_ADMIN') return true;

  if (userTenant && training.institutionId === userTenant) return true;

  if (user.accountType === 'RESEARCH_ADMIN' || user.accountType === 'INSTITUTION_ADMIN') {
    const owned = await prisma.institution.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    return training.institutionId === owned?.id;
  }

  return userTenant === training.institutionId;
}

/**
 * Mirror listing rules from GET /api/training/[id]/materials.
 */
export async function canReadTrainingMaterial(user, material) {
  if (!user || !material?.training) return false;
  if (!(await userHasTrainingAccess(user, material.training))) return false;

  if (user.accountType === 'RESEARCH_ADMIN') return true;
  if (material.accessLevel === 'PUBLIC') return true;

  if (material.accessLevel === 'REGISTERED_ONLY') {
    const registration = await prisma.trainingRegistration.findUnique({
      where: {
        trainingId_userId: {
          trainingId: material.trainingId,
          userId: user.id,
        },
      },
    });
    return Boolean(registration);
  }

  return false;
}

export async function canReadTrainingCertificate(user, certificate) {
  if (!user || !certificate?.training) return false;
  if (certificate.userId === user.id) return true;
  if (!(await userHasTrainingAccess(user, certificate.training))) return false;
  return ['RESEARCH_ADMIN', 'INSTITUTION_ADMIN', 'GLOBAL_ADMIN'].includes(user.accountType);
}

export async function canAccessTrainingStoredFile(user, row) {
  if (!user || !row) return false;

  if (row.module === 'TRAINING_MATERIAL') {
    const material = await prisma.trainingMaterial.findUnique({
      where: { id: row.entityId },
      include: { training: true },
    });
    return canReadTrainingMaterial(user, material);
  }

  if (row.module === 'TRAINING_CERTIFICATE') {
    const certificate = await prisma.trainingCertificate.findUnique({
      where: { id: row.entityId },
      include: { training: true },
    });
    return canReadTrainingCertificate(user, certificate);
  }

  return true;
}
