import { NextResponse } from 'next/server';
import { getOwnedInstitution } from '@/lib/institution-admin';
import { TRAINING_ADMIN_TYPES, trainingBelongsToInstitution } from '@/lib/training-admin';
import prisma from '@/lib/prisma';
import { canViewTraining, isOwningTrainingAdmin, trainingUserInstitutionId } from '@/lib/training-scope';

export async function resolveTrainingInstitution(user) {
  const institution = await getOwnedInstitution(user);
  return institution ? { id: institution.id } : null;
}

/**
 * Institution context used by training scoping (src/lib/training-scope.js).
 * Admins resolve to the institution they own or administer; everyone else to their
 * verified institution link.
 */
export async function resolveTrainingScopeContext(user) {
  if (!user) return { institutionId: null };
  if (TRAINING_ADMIN_TYPES.includes(user.accountType)) {
    const institution = await resolveTrainingInstitution(user);
    return { institutionId: institution?.id || trainingUserInstitutionId(user) };
  }
  return { institutionId: trainingUserInstitutionId(user) };
}

export function isTrainingAdmin(user) {
  return TRAINING_ADMIN_TYPES.includes(user?.accountType);
}

export async function userHasTrainingInstitutionAccess(user, trainingInstitutionId) {
  if (!user || !trainingInstitutionId) return false;
  if (trainingInstitutionId === user.secondaryInstitutionId) return true;
  const institution = await resolveTrainingInstitution(user);
  return trainingBelongsToInstitution({ institutionId: trainingInstitutionId }, institution?.id);
}

export async function requireTrainingAdminAccess(user, training) {
  if (!isTrainingAdmin(user)) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      ),
    };
  }

  const institution = await resolveTrainingInstitution(user);
  if (!trainingBelongsToInstitution(training, institution?.id)) {
    return {
      error: NextResponse.json({ error: 'Access denied' }, { status: 403 }),
    };
  }

  return { institution };
}
/**
 * Everything a route needs to decide what this user may see of one training (#89):
 * scope context, own registration, whether they administer it, whether they can view it.
 */
export async function resolveTrainingViewer(user, training) {
  const scopeCtx = await resolveTrainingScopeContext(user);
  const registration = user && training
    ? await prisma.trainingRegistration.findUnique({
        where: { trainingId_userId: { trainingId: training.id, userId: user.id } },
      })
    : null;
  const isAdmin = isOwningTrainingAdmin(user, training, scopeCtx);
  const canView = isAdmin || canViewTraining(user, training, { ...scopeCtx, hasRegistration: Boolean(registration) });
  return { scopeCtx, registration, isAdmin, canView };
}
