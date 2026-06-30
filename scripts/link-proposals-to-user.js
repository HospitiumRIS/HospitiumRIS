const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔗 Linking proposals to user...');

  const orcidId = '0009-0009-4810-6393';

  // Find the user with this ORCID
  const user = await prisma.user.findFirst({
    where: { orcidId: orcidId }
  });

  if (!user) {
    console.error(`❌ User with ORCID ${orcidId} not found`);
    console.log('Creating a test user with this ORCID...');
    
    const newUser = await prisma.user.create({
      data: {
        email: 'researcher@hospitiumris.org',
        orcidId: orcidId,
        givenName: 'Research',
        familyName: 'User',
        accountType: 'RESEARCHER',
        emailVerified: true,
        isActive: true
      }
    });
    
    console.log(`✅ Created user: ${newUser.email} (ID: ${newUser.id})`);
    
    // Update all proposals to link to this user
    const result = await prisma.proposal.updateMany({
      data: {
        // Note: We can't add userId field without a migration
        // For now, we'll update the principalInvestigatorOrcid
        principalInvestigatorOrcid: orcidId
      }
    });
    
    console.log(`✅ Updated ${result.count} proposals with ORCID ${orcidId}`);
  } else {
    console.log(`✅ Found user: ${user.email} (ID: ${user.id}, ORCID: ${user.orcidId})`);
    
    // Update all proposals to link to this user via ORCID
    const result = await prisma.proposal.updateMany({
      data: {
        principalInvestigatorOrcid: orcidId
      }
    });
    
    console.log(`✅ Updated ${result.count} proposals with ORCID ${orcidId}`);
  }

  // Show all proposals
  const proposals = await prisma.proposal.findMany({
    select: {
      id: true,
      title: true,
      principalInvestigator: true,
      principalInvestigatorOrcid: true,
      status: true
    }
  });

  console.log('\n📋 All proposals:');
  proposals.forEach(p => {
    console.log(`  - ${p.title}`);
    console.log(`    PI: ${p.principalInvestigator} (ORCID: ${p.principalInvestigatorOrcid || 'N/A'})`);
    console.log(`    Status: ${p.status}`);
  });

  console.log('\n🎉 Done!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
