/**
 * One-time backfill for the domain-based institution linking feature.
 *
 * Before this script runs, `Training.institutionId` and any institution
 * access checks compared free-text `User.primaryInstitution` strings
 * against each other, which only "worked" when two different people typed
 * the exact same institution name. This script:
 *
 *   1. For every existing Institution, seeds a VerifiedDomain from its
 *      owning admin's own email (if one doesn't already exist), and links
 *      that admin via the new `secondaryInstitutionId` field.
 *   2. For every RESEARCHER (or any other unlinked user), matches their
 *      email domain against VerifiedDomain rows and links them if found.
 *   3. Remaps every Training row's `institutionId` from the old free-text
 *      value to the real Institution.id, using `createdBy` (the admin who
 *      made it) as the deterministic source of truth - every admin owns
 *      exactly one Institution, so this is always resolvable.
 *
 * Run once, after applying the Prisma migration:
 *   node scripts/backfill-institution-links.js
 *
 * Safe to re-run - every step is idempotent (checks before writing).
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function extractDomain(email) {
  if (!email || !email.includes('@')) return null;
  return email.split('@')[1].toLowerCase().trim();
}

async function seedDomainForInstitution(institutionId, email, verifiedByUserId) {
  const domain = extractDomain(email);
  if (!domain) return null;

  const claimedByOther = await prisma.verifiedDomain.findFirst({
    where: { domain, NOT: { institutionId } },
  });
  if (claimedByOther) {
    console.log(`  ! Skipping domain seed for ${domain} - already claimed by a different institution (${claimedByOther.institutionId})`);
    return null;
  }

  const existing = await prisma.verifiedDomain.findFirst({
    where: { institutionId, domain },
  });
  if (existing) return existing;

  const created = await prisma.verifiedDomain.create({
    data: {
      institutionId,
      domain,
      status: 'VERIFIED',
      verificationMethod: 'MANUAL',
      verifiedBy: verifiedByUserId,
      verifiedAt: new Date(),
      autoApproveUsers: true,
      notes: 'Auto-seeded by backfill-institution-links.js',
    },
  });
  console.log(`  + Seeded verified domain "${domain}" for institution ${institutionId}`);
  return created;
}

async function findInstitutionByEmailDomain(email) {
  const domain = extractDomain(email);
  if (!domain) return null;

  const match =
    (await prisma.verifiedDomain.findFirst({ where: { domain, status: 'VERIFIED' }, include: { institution: true } })) ||
    (await prisma.verifiedDomain.findFirst({ where: { domain, status: 'PENDING' }, include: { institution: true } }));

  return match ? match.institution : null;
}

async function main() {
  console.log('=== Step 1: Seed domains + link institution owners ===\n');

  const institutions = await prisma.institution.findMany({ include: { user: true } });
  for (const institution of institutions) {
    const owner = institution.user;
    if (!owner) {
      console.log(`Institution ${institution.id} (${institution.name}) has no owning user - skipping`);
      continue;
    }

    await seedDomainForInstitution(institution.id, owner.email, owner.id);

    if (!owner.secondaryInstitutionId) {
      await prisma.user.update({
        where: { id: owner.id },
        data: {
          secondaryInstitutionId: institution.id,
          institutionVerifiedAt: new Date(),
          institutionVerificationMethod: 'MANUAL',
        },
      });
      console.log(`  + Linked owner ${owner.email} -> ${institution.name}`);
    } else if (owner.secondaryInstitutionId !== institution.id) {
      console.log(`  ! ${owner.email} already linked to a different institution (${owner.secondaryInstitutionId}) - not overwriting`);
    }
  }

  console.log('\n=== Step 2: Link researchers (and any other unlinked users) by email domain ===\n');

  const unlinkedUsers = await prisma.user.findMany({
    where: { secondaryInstitutionId: null },
  });

  let linkedCount = 0;
  for (const user of unlinkedUsers) {
    const matchedInstitution = await findInstitutionByEmailDomain(user.email);
    if (!matchedInstitution) continue;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        secondaryInstitutionId: matchedInstitution.id,
        institutionVerifiedAt: new Date(),
        institutionVerificationMethod: 'EMAIL_DOMAIN',
        primaryInstitution: user.primaryInstitution || matchedInstitution.name,
      },
    });
    console.log(`  + Linked ${user.email} -> ${matchedInstitution.name}`);
    linkedCount += 1;
  }
  console.log(`\nLinked ${linkedCount} of ${unlinkedUsers.length} previously-unlinked users.`);

  console.log('\n=== Step 3: Remap Training.institutionId to real Institution.id ===\n');

  // Training.createdBy is a plain user-id string (no Prisma relation), so
  // build a userId -> owned-Institution map from the institutions we
  // already fetched, rather than trying to `include` a nonexistent relation.
  const institutionByOwnerId = new Map(
    institutions.map((institution) => [institution.userId, institution])
  );

  const trainings = await prisma.training.findMany();

  let remappedCount = 0;
  for (const training of trainings) {
    const ownedInstitution = institutionByOwnerId.get(training.createdBy);
    if (!ownedInstitution) {
      console.log(`  ! Training "${training.title}" (${training.id}) - creator has no owned institution, skipping`);
      continue;
    }
    if (training.institutionId === ownedInstitution.id) {
      continue; // already correct
    }
    await prisma.training.update({
      where: { id: training.id },
      data: { institutionId: ownedInstitution.id },
    });
    console.log(`  + Training "${training.title}" (${training.id}): "${training.institutionId}" -> ${ownedInstitution.id} (${ownedInstitution.name})`);
    remappedCount += 1;
  }
  console.log(`\nRemapped ${remappedCount} of ${trainings.length} trainings.`);

  console.log('\nDone.');
}

main()
  .catch((error) => {
    console.error('Backfill failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
