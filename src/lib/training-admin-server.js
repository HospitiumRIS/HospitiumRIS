import { NextResponse } from 'next/server';
import { getOwnedInstitution } from '@/lib/institution-admin';
import { TRAINING_ADMIN_TYPES, trainingBelongsToInstitution } from '@/lib/training-admin';
import { trainingUserInstitutionId } from '@/lib/training-scope';

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