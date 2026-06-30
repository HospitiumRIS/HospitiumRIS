const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Updating proposal Principal Investigators...');

  const userId = 'cmou79txa0005wsa0ch54jlqg';
  const orcidId = '0009-0009-4810-6393';

  // Get the user details
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      orcidId: true,
      givenName: true,
      familyName: true
    }
  });

  if (!user) {
    console.error(`❌ User with ID ${userId} not found`);
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.givenName} ${user.familyName} (${user.email})`);
  console.log(`   ORCID: ${user.orcidId}`);

  const piName = `${user.givenName} ${user.familyName}`;

  // Update the two proposals
  const proposal1 = await prisma.proposal.updateMany({
    where: {
      title: 'Genomic Epidemiology of Antimicrobial Resistance in East African Healthcare Settings'
    },
    data: {
      principalInvestigator: piName,
      principalInvestigatorOrcid: orcidId
    }
  });

  console.log(`✅ Updated "Genomic Epidemiology of AMR" proposal (${proposal1.count} record)`);

  const proposal2 = await prisma.proposal.updateMany({
    where: {
      title: 'AI-Driven Cardiovascular Risk Assessment Platform'
    },
    data: {
      principalInvestigator: piName,
      principalInvestigatorOrcid: orcidId
    }
  });

  console.log(`✅ Updated "AI-Driven Cardiovascular Risk Assessment" proposal (${proposal2.count} record)`);

  // Show updated proposals
  const proposals = await prisma.proposal.findMany({
    where: {
      OR: [
        { title: { contains: 'Genomic Epidemiology' } },
        { title: { contains: 'AI-Driven Cardiovascular' } }
      ]
    },
    select: {
      id: true,
      title: true,
      principalInvestigator: true,
      principalInvestigatorOrcid: true,
      status: true
    }
  });

  console.log('\n📋 Updated proposals:');
  proposals.forEach(p => {
    console.log(`\n  Title: ${p.title}`);
    console.log(`  PI: ${p.principalInvestigator}`);
    console.log(`  ORCID: ${p.principalInvestigatorOrcid}`);
    console.log(`  Status: ${p.status}`);
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
