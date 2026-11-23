import prisma from './prisma.js';
import {
  canSeeMaterial,
  canViewTraining,
  isGlobalAdmin,
  isOwningTrainingAdmin,
  isTrainingAdminUser,
  trainingUserInstitutionId,
} from './training-scope.js';

/**
 * Institution context for training rules. Admins resolve to the institution they own
 * (or their verified link); everyone else to their verified link.
 */
async function trainingScopeContext(user) {
  let institutionId = trainingUserInstitutionId(user);
  if (isTrainingAdminUser(user)) {
    const owned = await prisma.institution.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    institutionId = owned?.id || institutionId;
  }
  return { institutionId };
}

async function findOwnRegistration(user, trainingId) {
  return prisma.trainingRegistration.findUnique({
    where: { trainingId_userId: { trainingId, userId: user.id } },
  });
}

/**
 * Same rules as GET /api/training/[id] and its materials list (#88, #89):
 * the training must be visible to the caller; registered-only materials need an
 * active registration unless the caller administers the owning institution.
 */
export async function canReadTrainingMaterial(user, material) {
  if (!user || !material?.training) return false;
  const training = material.training;
  if (isGlobalAdmin(user)) return true;

  const ctx = await trainingScopeContext(user);
  const isAdmin = isOwningTrainingAdmin(user, training, ctx);
  if (isAdmin) return true;

  const needsRegistration = material.accessLevel !== 'PUBLIC' || !canViewTraining(user, training, ctx);
  const registration = needsRegistration ? await findOwnRegistration(user, training.id) : null;

  if (!canViewTraining(user, training, { ...ctx, hasRegistration: Boolean(registration) })) {
    return false;
  }
  return canSeeMaterial(material, { isAdmin: false, registration });
}

/** Own certificate, or an admin of the institution that owns the training. */
export async function canReadTrainingCertificate(user, certificate) {
  if (!user || !certificate?.training) return false;
  if (certificate.userId === user.id) return true;
  if (isGlobalAdmin(user)) return true;
  const ctx = await trainingScopeContext(user);
  return isOwningTrainingAdmin(user, certificate.training, ctx);
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
