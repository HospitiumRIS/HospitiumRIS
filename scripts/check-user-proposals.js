const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orcidId = '0009-0009-4810-6393';
  
  console.log('🔍 Checking user and proposals...\n');
  
  const user = await prisma.user.findFirst({
    where: { orcidId: orcidId },
    select: { 
      id: true, 
      email: true, 
      orcidId: true, 
      givenName: true, 
      familyName: true 
    }
  });
  
  console.log('User:', JSON.stringify(user, null, 2));
  
  const proposals = await prisma.proposal.findMany({
    where: { 
      principalInvestigatorOrcid: orcidId,
      status: {
        in: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REVISION_REQUESTED']
      }
    },
    select: { 
      id: true, 
      title: true, 
      status: true, 
      principalInvestigator: true, 
      principalInvestigatorOrcid: true 
    }
  });
  
  console.log('\nProposals with ORCID', orcidId, ':', proposals.length);
  proposals.forEach(p => {
    console.log(`  - ${p.title}`);
    console.log(`    Status: ${p.status}`);
    console.log(`    PI: ${p.principalInvestigator}`);
    console.log(`    ORCID: ${p.principalInvestigatorOrcid}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
