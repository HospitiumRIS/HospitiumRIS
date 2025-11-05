const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test users for each account type
  const testUsers = [
    {
      accountType: 'RESEARCHER',
      givenName: 'Dr. Jane',
      familyName: 'Smith',
      email: 'jane.smith@university.edu',
      password: 'TestPassword123!',
      orcidId: '0000-0000-0000-0001',
      orcidGivenNames: 'Jane',
      orcidFamilyName: 'Smith',
      primaryInstitution: 'Stanford University',
      startMonth: '01',
      startYear: '2020',
    },
    {
      accountType: 'RESEARCH_ADMIN',
      givenName: 'John',
      familyName: 'Doe',
      email: 'john.doe@research-institute.org',
      password: 'AdminPassword123!',
      primaryInstitution: 'MIT Research Institute',
      startMonth: '06',
      startYear: '2019',
      // Institution details
      institutionData: {
        name: 'MIT Research Institute',
        type: 'Research Institute',
        country: 'United States',
        website: 'https://mit.edu',
      }
    },
    {
      accountType: 'FOUNDATION_ADMIN',
      givenName: 'Sarah',
      familyName: 'Johnson',
      email: 'sarah.johnson@foundation.org',
      password: 'FoundationPass123!',
      primaryInstitution: 'Health Research Foundation',
      startMonth: '03',
      startYear: '2021',
      // Foundation details
      foundationData: {
        institutionName: 'Harvard Medical School',
        foundationName: 'Health Research Foundation',
        type: 'Private Foundation',
        country: 'United States',
        website: 'https://healthresearch.org',
        focusArea: 'Medical Research',
        description: 'A foundation dedicated to advancing medical research and improving public health outcomes through innovative research initiatives.'
      }
    }
  ];

  for (const userData of testUsers) {
    console.log(`Creating user: ${userData.email}`);
    
    // Hash password
    const passwordHash = await bcrypt.hash(userData.password, 12);
    
    // Extract user data
    const { institutionData, foundationData, password, ...userFields } = userData;
    
    try {
      await prisma.$transaction(async (tx) => {
        // Create user
        const user = await tx.user.create({
          data: {
            ...userFields,
            passwordHash,
            status: 'ACTIVE', // Set test users as active
          }
        });

        // Create related records based on account type
        if (userData.accountType === 'RESEARCH_ADMIN' && institutionData) {
          await tx.institution.create({
            data: {
              userId: user.id,
              ...institutionData,
            }
          });
        }

        if (userData.accountType === 'FOUNDATION_ADMIN' && foundationData) {
          await tx.foundation.create({
            data: {
              userId: user.id,
              ...foundationData,
            }
          });
        }

        console.log(`✅ Created ${userData.accountType} user: ${userData.email}`);
      });
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`⚠️  User ${userData.email} already exists, skipping...`);
      } else {
        throw error;
      }
    }
  }

  console.log('🎉 Seeding completed!');
  console.log('\n📊 Test Users Created:');
  console.log('- Researcher: jane.smith@university.edu (TestPassword123!)');
  console.log('- Research Admin: john.doe@research-institute.org (AdminPassword123!)');
  console.log('- Foundation Admin: sarah.johnson@foundation.org (FoundationPass123!)');
  console.log('\n🔐 All passwords follow the same pattern: [Type]Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
