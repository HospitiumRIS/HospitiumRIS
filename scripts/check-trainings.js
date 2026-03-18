const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTrainings() {
  try {
    console.log('\n=== CHECKING TRAININGS ===\n');
    
    // Get all trainings
    const trainings = await prisma.training.findMany({
      include: {
        _count: {
          select: { registrations: true }
        }
      }
    });
    
    console.log(`Total trainings in database: ${trainings.length}\n`);
    
    trainings.forEach((training, index) => {
      console.log(`Training ${index + 1}:`);
      console.log(`  ID: ${training.id}`);
      console.log(`  Title: ${training.title}`);
      console.log(`  Status: ${training.status}`);
      console.log(`  Institution ID: ${training.institutionId}`);
      console.log(`  Target Groups: ${JSON.stringify(training.targetGroup)}`);
      console.log(`  Registrations: ${training._count.registrations}`);
      console.log('');
    });
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        accountType: true,
        primaryInstitution: true,
        status: true
      }
    });
    
    console.log('\n=== CHECKING USERS ===\n');
    console.log(`Total users: ${users.length}\n`);
    
    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Account Type: ${user.accountType}`);
      console.log(`  Institution: ${user.primaryInstitution}`);
      console.log(`  Status: ${user.status}`);
      console.log('');
    });
    
    // Check for institution mismatches
    console.log('\n=== INSTITUTION ANALYSIS ===\n');
    const researchers = users.filter(u => u.accountType === 'RESEARCHER');
    const admins = users.filter(u => u.accountType === 'RESEARCH_ADMIN');
    
    console.log(`Researchers: ${researchers.length}`);
    console.log(`Research Admins: ${admins.length}`);
    
    if (researchers.length > 0 && trainings.length > 0) {
      console.log('\nMatching trainings to researchers:');
      researchers.forEach(researcher => {
        const matchingTrainings = trainings.filter(t => 
          t.institutionId === researcher.primaryInstitution && 
          t.status === 'PUBLISHED'
        );
        console.log(`  ${researcher.email}: ${matchingTrainings.length} matching trainings`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTrainings();
