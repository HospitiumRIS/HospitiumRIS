/**
 * Domain-based institution linking.
 *
 * A user's `secondaryInstitutionId` is the verified, access-controlling link
 * to a real Institution row. It's derived from matching the user's email
 * domain against that institution's VerifiedDomain rows - not from free-text
 * institution names, which can't be trusted to match exactly.
 *
 * These helpers are used by:
 * - registration (auto-link a new user if their domain already matches)
 * - login (self-heal: link a previously-unmatched user if a domain was
 *   added after they registered)
 * - institution creation (seed the creator's own domain so they aren't
 *   stuck unlinked to the institution they just created)
 */

/**
 * Extract and normalize the domain portion of an email address.
 * @param {string} email
 * @returns {string|null}
 */
export function extractDomain(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return null;
  }
  const domain = email.split('@')[1]?.toLowerCase().trim();
  return domain || null;
}

/**
 * Find the Institution whose VerifiedDomain matches this email's domain.
 * PENDING and VERIFIED domains both count as a match (the domain can only
 * ever be added by that institution's own admin, so it's inherently
 * self-attested); SUSPENDED domains never match.
 *
 * @param {import('@prisma/client').PrismaClient | import('@prisma/client').Prisma.TransactionClient} db
 * @param {string} email
 * @returns {Promise<import('@prisma/client').Institution|null>}
 */
export async function findInstitutionByEmailDomain(db, email) {
  const domain = extractDomain(email);
  if (!domain) return null;

  // If more than one institution has (mistakenly) claimed the same domain,
  // prefer a VERIFIED one over a PENDING one.
  const match =
    (await db.verifiedDomain.findFirst({
      where: { domain, status: 'VERIFIED' },
      include: { institution: true },
    })) ||
    (await db.verifiedDomain.findFirst({
      where: { domain, status: 'PENDING' },
      include: { institution: true },
    }));

  return match ? match.institution : null;
}

/**
 * Self-heal: if a user isn't linked to a verified institution yet, re-check
 * their email domain in case a matching VerifiedDomain was added since they
 * registered (e.g. their institution admin added the domain later). Call
 * this on login rather than on every request, since it does a DB lookup.
 *
 * No-ops (and returns null) if the user is already linked.
 *
 * @param {import('@prisma/client').PrismaClient} db
 * @param {{ id: string, email: string, secondaryInstitutionId: string|null }} user
 * @returns {Promise<{ secondaryInstitutionId: string, institutionVerifiedAt: Date, institutionVerificationMethod: string, institutionName: string }|null>}
 */
export async function linkInstitutionIfNeeded(db, user) {
  if (user.secondaryInstitutionId) return null;

  const matchedInstitution = await findInstitutionByEmailDomain(db, user.email);
  if (!matchedInstitution) return null;

  const institutionVerifiedAt = new Date();
  await db.user.update({
    where: { id: user.id },
    data: {
      secondaryInstitutionId: matchedInstitution.id,
      institutionVerifiedAt,
      institutionVerificationMethod: 'EMAIL_DOMAIN',
      // Keep the display field in sync too, since it was previously unlinked
      // free text.
      primaryInstitution: user.primaryInstitution || matchedInstitution.name,
    },
  });

  return {
    secondaryInstitutionId: matchedInstitution.id,
    institutionVerifiedAt,
    institutionVerificationMethod: 'EMAIL_DOMAIN',
    institutionName: matchedInstitution.name,
  };
}

/**
 * Ensure a VerifiedDomain row exists for this institution's own domain,
 * derived from the creating admin's email. Used when an institution is
 * first created so its own admin (and later, matching researchers) can
 * link automatically without a manual verification step.
 *
 * Silently no-ops if the domain is already claimed by a *different*
 * institution, to avoid creating conflicting ownership.
 *
 * @param {import('@prisma/client').PrismaClient | import('@prisma/client').Prisma.TransactionClient} db
 * @param {{ institutionId: string, email: string, verifiedByUserId: string }} params
 */
export async function seedDomainForInstitution(db, { institutionId, email, verifiedByUserId }) {
  const domain = extractDomain(email);
  if (!domain) return null;

  const existingForOther = await db.verifiedDomain.findFirst({
    where: { domain, NOT: { institutionId } },
  });
  if (existingForOther) {
    // This domain is already claimed by a different institution - don't
    // silently reassign it. Leave it for manual admin review.
    return null;
  }

  const existing = await db.verifiedDomain.findFirst({
    where: { institutionId, domain },
  });
  if (existing) return existing;

  return db.verifiedDomain.create({
    data: {
      institutionId,
      domain,
      status: 'VERIFIED',
      verificationMethod: 'EMAIL_DOMAIN',
      verifiedBy: verifiedByUserId,
      verifiedAt: new Date(),
      autoApproveUsers: true,
    },
  });
}
