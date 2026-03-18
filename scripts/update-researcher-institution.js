const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateResearcherInstitution() {
  try {
    console.log('\n=== UPDATING RESEARCHER INSTITUTION ===\n');
    
    // Update the researcher to be in the same institution as the admin
    const result = await prisma.user.update({
      where: {
        email: 'steveggaita@gmail.com'
      },
      data: {
        primaryInstitution: 'Moi University'
      }
    });
    
    console.log('✅ Updated researcher institution:');
    console.log(`  Email: ${result.email}`);
    console.log(`  New Institution: ${result.primaryInstitution}`);
    console.log('\nThe researcher should now see trainings from Moi University!\n');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateResearcherInstitution();
