const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedAccountTypes() {
  console.log('Seeding account types...');

  const accountTypes = [
    {
      name: 'RESEARCHER',
      displayName: 'Researcher',
      description: 'Individual researchers conducting studies and managing publications',
      permissions: JSON.stringify([
        'view_own_profile',
        'edit_own_profile',
        'create_manuscripts',
        'manage_own_manuscripts',
        'create_proposals',
        'manage_own_proposals',
        'view_publications',
        'collaborate_on_manuscripts'
      ]),
      isSystem: true,
      isActive: true
    },
    {
      name: 'RESEARCH_ADMIN',
      displayName: 'Research Admin',
      description: 'Administrators managing research activities within an institution',
      permissions: JSON.stringify([
        'view_own_profile',
        'edit_own_profile',
        'view_institution_data',
        'manage_institution_researchers',
        'review_proposals',
        'approve_proposals',
        'view_all_manuscripts',
        'generate_reports'
      ]),
      isSystem: true,
      isActive: true
    },
    {
      name: 'FOUNDATION_ADMIN',
      displayName: 'Foundation Admin',
      description: 'Foundation administrators managing grants and funding',
      permissions: JSON.stringify([
        'view_own_profile',
        'edit_own_profile',
        'manage_grants',
        'review_proposals',
        'approve_funding',
        'view_all_proposals',
        'generate_financial_reports'
      ]),
      isSystem: true,
      isActive: true
    },
    {
      name: 'SUPER_ADMIN',
      displayName: 'Super Admin',
      description: 'System administrators with full access to all features',
      permissions: JSON.stringify([
        'full_system_access',
        'manage_users',
        'manage_account_types',
        'manage_institutions',
        'manage_foundations',
        'view_all_data',
        'system_configuration',
        'database_management'
      ]),
      isSystem: true,
      isActive: true
    }
  ];

  for (const accountType of accountTypes) {
    await prisma.accountType.upsert({
      where: { name: accountType.name },
      update: accountType,
      create: accountType
    });
    console.log(`✓ Created/Updated account type: ${accountType.displayName}`);
  }

  console.log('Account types seeded successfully!');
}

seedAccountTypes()
  .catch((e) => {
    console.error('Error seeding account types:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
