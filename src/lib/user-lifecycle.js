import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { purgeProfilePhotos } from '@/lib/profile-photo';

/**
 * User deletion lifecycle
 * -----------------------
 * 1. Soft delete (institution admin "Delete user")
 *    status -> DELETED, login blocked, all research records stay linked. Restorable.
 * 2. Anonymise (automatic, ANONYMIZE_AFTER_DAYS after soft delete)
 *    Personal data scrubbed (name, email, password, ORCID, profile, settings,
 *    notifications, reviewer name snapshots). Records stay linked to the now-anonymous
 *    account. No longer restorable.
 * 3. Permanent delete (institution admin, only for already-deleted users)
 *    The user row is removed. Shared/institutional records are handed to a collaborator
 *    or to a single "Deleted user" placeholder account so history is never lost.
 */

export const ANONYMIZE_AFTER_DAYS = 30;
export const DELETED_USER_PLACEHOLDER_EMAIL = 'deleted-user@placeholder.invalid';
export const DELETED_USER_LABEL = 'Deleted user';

const TX_OPTIONS = { maxWait: 10_000, timeout: 60_000 };

const COLLABORATOR_ROLE_PRIORITY = ['OWNER', 'ADMIN', 'EDITOR', 'CONTRIBUTOR', 'REVIEWER'];

async function unusablePasswordHash() {
  return hashPassword(crypto.randomBytes(32).toString('hex'));
}

/** Copies of the user's name/email stored as text on review records. */
async function scrubReviewerSnapshots(tx, userId, reassignTo = null) {
  const idData = reassignTo ? { reviewerId: reassignTo } : {};
  await tx.proposalReview.updateMany({
    where: { reviewerId: userId },
    data: { reviewerName: DELETED_USER_LABEL, ...idData },
  });
  await tx.ethicsReview.updateMany({
    where: { reviewerId: userId },
    data: { reviewerName: DELETED_USER_LABEL, ...idData },
  });
  await tx.proposalStageReview.updateMany({
    where: { reviewerId: userId },
    data: { reviewerName: DELETED_USER_LABEL, reviewerEmail: '', ...idData },
  });
}

// ---------------------------------------------------------------------------
// 1. Soft delete / restore
// ---------------------------------------------------------------------------

/**
 * @param target      user row being deleted
 * @param actor       user performing the delete (the target itself for self-service deletion)
 * @param institution institution to pin the account to (optional; keeps it visible to that admin)
 */
export async function softDeleteUser({ target, actor, institution = null }) {
  return prisma.user.update({
    where: { id: target.id },
    data: {
      status: 'DELETED',
      statusBeforeDelete: target.status === 'DELETED' ? target.statusBeforeDelete : target.status,
      deletedAt: new Date(),
      deletedById: actor.id,
      // Pin to the institution so the account stays in this admin's scope even after
      // anonymisation changes the (domain-matched) email address.
      secondaryInstitutionId: target.secondaryInstitutionId || institution?.id || null,
      // Kill any outstanding activation link.
      emailVerifyToken: null,
      emailVerifyExpires: null,
    },
  });
}

export class UserLifecycleError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function restoreUser({ target }) {
  if (target.status !== 'DELETED') {
    throw new UserLifecycleError('User is not deleted', 409);
  }
  if (target.anonymizedAt) {
    throw new UserLifecycleError(
      'This account has been anonymised and can no longer be restored',
      409
    );
  }
  const previous =
    target.statusBeforeDelete && target.statusBeforeDelete !== 'DELETED'
      ? target.statusBeforeDelete
      : 'ACTIVE';

  return prisma.user.update({
    where: { id: target.id },
    data: {
      status: previous,
      statusBeforeDelete: null,
      deletedAt: null,
      deletedById: null,
    },
  });
}

// ---------------------------------------------------------------------------
// 2. Anonymisation
// ---------------------------------------------------------------------------

export async function anonymizeUser(userId) {
  const passwordHash = await unusablePasswordHash();
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user || user.status !== 'DELETED' || user.anonymizedAt) return null;

    await tx.researchProfile.deleteMany({ where: { userId } });
    await tx.notificationPreference.deleteMany({ where: { userId } });
    await tx.userSettings.deleteMany({ where: { userId } });
    await tx.notification.deleteMany({ where: { userId } });
    await scrubReviewerSnapshots(tx, userId);
    await purgeProfilePhotos(tx, userId);

    return tx.user.update({
      where: { id: userId },
      data: {
        givenName: 'Deleted',
        familyName: 'user',
        email: `deleted+${userId}@anonymized.invalid`,
        confirmEmail: null,
        passwordHash,
        emailVerifyToken: null,
        emailVerifyExpires: null,
        orcidId: null,
        orcidGivenNames: null,
        orcidFamilyName: null,
        primaryInstitution: null,
        startMonth: null,
        startYear: null,
        avatarUrl: null,
        anonymizedAt: new Date(),
      },
    });
  }, TX_OPTIONS);
}

/**
 * Anonymise every soft-deleted account past the grace period.
 * Pass `where` (e.g. an institution's memberWhere) to limit the scope.
 */
export async function anonymizeExpiredDeletedUsers({ where, days = ANONYMIZE_AFTER_DAYS } = {}) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const due = await prisma.user.findMany({
    where: {
      AND: [
        where || {},
        { status: 'DELETED', anonymizedAt: null, deletedAt: { lte: cutoff } },
        { email: { not: DELETED_USER_PLACEHOLDER_EMAIL } },
      ],
    },
    select: { id: true },
    take: 200,
  });

  const anonymized = [];
  for (const { id } of due) {
    try {
      if (await anonymizeUser(id)) anonymized.push(id);
    } catch (err) {
      console.error(`Failed to anonymise user ${id}:`, err);
    }
  }
  return anonymized;
}

// ---------------------------------------------------------------------------
// 3. Permanent delete
// ---------------------------------------------------------------------------

async function getOrCreatePlaceholder(tx) {
  const existing = await tx.user.findUnique({ where: { email: DELETED_USER_PLACEHOLDER_EMAIL } });
  if (existing) return existing;
  return tx.user.create({
    data: {
      accountType: 'RESEARCHER',
      status: 'DELETED',
      givenName: 'Deleted',
      familyName: 'user',
      email: DELETED_USER_PLACEHOLDER_EMAIL,
      passwordHash: await unusablePasswordHash(),
      emailVerified: false,
      deletedAt: new Date(),
      anonymizedAt: new Date(),
    },
  });
}

export async function hardDeleteUser({ target }) {
  if (target.status !== 'DELETED') {
    throw new UserLifecycleError('Delete (deactivate) the user before deleting permanently', 409);
  }
  if (target.email === DELETED_USER_PLACEHOLDER_EMAIL) {
    throw new UserLifecycleError('This system account cannot be deleted', 403);
  }

  const userId = target.id;

  return prisma.$transaction(async (tx) => {
    const placeholder = await getOrCreatePlaceholder(tx);
    const P = placeholder.id;
    const summary = { manuscriptsTransferred: 0, manuscriptsKeptForProposals: 0, manuscriptsDeleted: 0 };

    // --- Manuscripts they created: hand to a co-author, keep if linked to a proposal,
    //     otherwise they are personal work and are deleted with the user (cascade).
    const owned = await tx.manuscript.findMany({
      where: { createdBy: userId },
      select: {
        id: true,
        collaborators: {
          where: { userId: { not: userId } },
          select: { id: true, userId: true, role: true, joinedAt: true },
        },
        _count: { select: { proposals: true } },
      },
    });

    for (const m of owned) {
      const heir = [...m.collaborators].sort(
        (a, b) =>
          COLLABORATOR_ROLE_PRIORITY.indexOf(a.role) - COLLABORATOR_ROLE_PRIORITY.indexOf(b.role) ||
          new Date(a.joinedAt) - new Date(b.joinedAt)
      )[0];

      if (heir) {
        await tx.manuscript.update({ where: { id: m.id }, data: { createdBy: heir.userId } });
        await tx.manuscriptCollaborator.update({
          where: { id: heir.id },
          data: { role: 'OWNER', canEdit: true, canInvite: true, canDelete: true },
        });
        summary.manuscriptsTransferred += 1;
      } else if (m._count.proposals > 0) {
        await tx.manuscript.update({ where: { id: m.id }, data: { createdBy: P } });
        summary.manuscriptsKeptForProposals += 1;
      } else {
        summary.manuscriptsDeleted += 1;
      }
    }

    // --- Contributions to shared work: keep, attribute to the placeholder.
    await tx.manuscriptCollaborator.updateMany({ where: { invitedBy: userId }, data: { invitedBy: P } });
    await tx.manuscriptInvitation.updateMany({ where: { invitedBy: userId }, data: { invitedBy: P } });
    await tx.manuscriptComment.updateMany({ where: { authorId: userId }, data: { authorId: P } });
    await tx.trackedChange.updateMany({ where: { authorId: userId }, data: { authorId: P } });
    await tx.manuscriptVersion.updateMany({ where: { createdBy: userId }, data: { createdBy: P } });
    await tx.manuscriptSubmission.updateMany({ where: { createdBy: userId }, data: { createdBy: P } });

    // --- Institutional / compliance records: keep, attribute to the placeholder.
    await tx.imageIntegrityCase.updateMany({ where: { submittedById: userId }, data: { submittedById: P } });
    await scrubReviewerSnapshots(tx, userId, P);
    await tx.ethicsApplication.updateMany({ where: { userId }, data: { userId: P } });
    await tx.ethicsApplication.updateMany({
      where: { principalInvestigatorId: userId },
      data: { principalInvestigatorId: null },
    });
    await tx.proposalEthicsLink.updateMany({ where: { linkedBy: userId }, data: { linkedBy: P } });
    await tx.grantApplication.updateMany({ where: { userId }, data: { userId: P } });
    await tx.training.updateMany({ where: { createdBy: userId }, data: { createdBy: P } });
    await tx.trainingMaterial.updateMany({ where: { uploadedBy: userId }, data: { uploadedBy: P } });
    await tx.trainingCertificate.updateMany({ where: { uploadedBy: userId }, data: { uploadedBy: P } });
    await tx.stageReviewer.updateMany({ where: { userId }, data: { userId: P } });
    await purgeProfilePhotos(tx, userId); // personal — never handed to the placeholder
    await tx.storedFile.updateMany({ where: { ownerUserId: userId }, data: { ownerUserId: P } });

    // --- Audit pointers that are optional: clear.
    await tx.verifiedDomain.updateMany({ where: { verifiedBy: userId }, data: { verifiedBy: null } });
    await tx.verifiedDomain.updateMany({ where: { suspendedBy: userId }, data: { suspendedBy: null } });
    await tx.autoReviewWorkflow.updateMany({ where: { createdBy: userId }, data: { createdBy: null } });
    await tx.user.updateMany({ where: { deletedById: userId }, data: { deletedById: null } });

    // --- Purely personal data.
    await tx.libraryFolder.deleteMany({ where: { userId, parentId: null } }); // children cascade
    await tx.libraryFolder.deleteMany({ where: { userId } });

    // Remaining cascades (profile, settings, notifications, publication author links,
    // training registrations/certificates, preprints, personal collections, solo manuscripts).
    await tx.user.delete({ where: { id: userId } });

    return summary;
  }, TX_OPTIONS);
}
