/**
 * Tenant scoping for trainings (pure; no database access).
 *
 * Rules (decision D4, issue #88):
 * - A training belongs to the institution that created it (`Training.institutionId`).
 * - Members of that institution can see it (researchers only once it is PUBLISHED).
 * - Other institutions' members only see it when it is PUBLISHED and
 *   `openToOtherInstitutions` is true (the shared catalogue).
 * - Training admins manage only their own institution's trainings.
 * - Global admins see everything.
 */

import { TRAINING_ADMIN_TYPES } from './training-admin.js';

export const NO_TRAININGS_WHERE = { id: { equals: '__none__' } };

export function isGlobalAdmin(user) {
  return user?.accountType === 'GLOBAL_ADMIN';
}

export function isTrainingAdminUser(user) {
  return TRAINING_ADMIN_TYPES.includes(user?.accountType);
}

/** Institution a user belongs to (verified link, else the institution they own). */
export function trainingUserInstitutionId(user) {
  if (!user) return null;
  return user.secondaryInstitutionId || user.institution?.id || null;
}

const SHARED_CATALOGUE_WHERE = { status: 'PUBLISHED', openToOtherInstitutions: true };

/**
 * Prisma `where` for trainings a user may see in catalogue/detail views.
 * @param {object} user
 * @param {{ institutionId?: string|null }} [ctx] resolved institution (admins: owned institution)
 */
export function trainingVisibilityWhere(user, ctx = {}) {
  if (!user) return NO_TRAININGS_WHERE;
  if (isGlobalAdmin(user)) return {};

  const institutionId = ctx.institutionId ?? trainingUserInstitutionId(user);
  if (!institutionId) return SHARED_CATALOGUE_WHERE;

  const own = isTrainingAdminUser(user)
    ? { institutionId }
    : { institutionId, status: 'PUBLISHED' };

  return { OR: [own, SHARED_CATALOGUE_WHERE] };
}

/** Prisma `where` for the admin management list (own institution only). */
export function trainingAdminListWhere(user, ctx = {}) {
  if (!user) return NO_TRAININGS_WHERE;
  if (isGlobalAdmin(user)) return {};
  const institutionId = ctx.institutionId ?? null;
  if (!isTrainingAdminUser(user) || !institutionId) return NO_TRAININGS_WHERE;
  return { institutionId };
}

/**
 * Can this user see this training? Mirrors trainingVisibilityWhere for one row.
 * `ctx.hasRegistration`: the user has their own registration for this training, so
 * they keep access to it after it stops being listed (e.g. COMPLETED, or the
 * shared-catalogue flag was turned off).
 */
export function canViewTraining(user, training, ctx = {}) {
  if (!user || !training) return false;
  if (isGlobalAdmin(user)) return true;
  if (ctx.hasRegistration && training.status !== 'DRAFT') return true;

  const institutionId = ctx.institutionId ?? trainingUserInstitutionId(user);
  const isOwn = Boolean(institutionId) && training.institutionId === institutionId;

  if (isOwn) {
    return isTrainingAdminUser(user) || training.status === 'PUBLISHED';
  }
  return training.status === 'PUBLISHED' && training.openToOtherInstitutions === true;
}

/** Can this user register for this training (visibility only; capacity etc. checked elsewhere)? */
export function canRegisterForTraining(user, training, ctx = {}) {
  if (!training || training.status !== 'PUBLISHED') return false;
  return canViewTraining(user, training, { ...ctx, hasRegistration: false });
}

/** Is the user an admin of the institution that owns this training? */
export function isOwningTrainingAdmin(user, training, ctx = {}) {
  if (!user || !training) return false;
  if (isGlobalAdmin(user)) return true;
  if (!isTrainingAdminUser(user)) return false;
  const institutionId = ctx.institutionId ?? null;
  return Boolean(institutionId) && training.institutionId === institutionId;
}

/** Registration statuses that grant access to registered-only content (#89). */
export const ACTIVE_REGISTRATION_STATUSES = ['REGISTERED', 'COMPLETED'];

export function isActiveRegistration(registration) {
  return Boolean(registration) && ACTIVE_REGISTRATION_STATUSES.includes(registration.status);
}

/**
 * Can this viewer read this material?
 * @param {object} material  needs accessLevel
 * @param {{ isAdmin: boolean, registration: object|null }} viewer
 *   isAdmin: owning institution's training admin (or global admin)
 */
export function canSeeMaterial(material, viewer) {
  if (!material) return false;
  if (viewer?.isAdmin) return true;
  if (material.accessLevel === 'PUBLIC') return true;
  if (material.accessLevel === 'REGISTERED_ONLY') return isActiveRegistration(viewer?.registration);
  return false;
}

/**
 * Shape a training (loaded with registrations) for the viewer. Only the owning
 * institution's admins get the roster; everyone else gets counts and their own
 * registration (#89).
 */
export function shapeTrainingForViewer(training, user, { isAdmin }) {
  const registrations = training.registrations || [];
  const userRegistration = registrations.find((r) => r.userId === user?.id) || null;
  const activeCount = registrations.filter(isActiveRegistration).length;
  const materials = (training.materials || []).filter((material) =>
    canSeeMaterial(material, { isAdmin, registration: userRegistration })
  );

  const shaped = {
    ...training,
    materials,
    registrationCount: activeCount,
    remainingSlots: training.maxParticipants - activeCount,
    isRegistered: isActiveRegistration(userRegistration),
    userRegistration,
  };

  if (!isAdmin) {
    delete shaped.registrations;
    if (shaped._count) shaped._count = { ...shaped._count, registrations: activeCount };
  }
  return shaped;
}
