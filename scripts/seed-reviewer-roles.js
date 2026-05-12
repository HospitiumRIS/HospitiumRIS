const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const defaultRoles = [
  {
    name: 'Primary Reviewer',
    type: 'PRIMARY_REVIEWER',
    description: 'Main reviewer responsible for comprehensive evaluation',
    canApprove: true,
    canReject: true,
    canRequestChange: true,
    canComment: true,
    canOverride: false
  },
  {
    name: 'Secondary Reviewer',
    type: 'SECONDARY_REVIEWER',
    description: 'Supporting reviewer providing additional perspective',
    canApprove: true,
    canReject: true,
    canRequestChange: true,
    canComment: true,
    canOverride: false
  },
  {
    name: 'Committee Chair',
    type: 'COMMITTEE_CHAIR',
    description: 'Committee chairperson with override authority',
    canApprove: true,
    canReject: true,
    canRequestChange: true,
    canComment: true,
    canOverride: true
  },
  {
    name: 'Technical Reviewer',
    type: 'TECHNICAL_REVIEWER',
    description: 'Specialist reviewing technical aspects',
    canApprove: true,
    canReject: false,
    canRequestChange: true,
    canComment: true,
    canOverride: false
  },
  {
    name: 'Ethics Reviewer',
    type: 'ETHICS_REVIEWER',
    description: 'Ethics committee member',
    canApprove: true,
    canReject: true,
    canRequestChange: true,
    canComment: true,
    canOverride: false
  },
  {
    name: 'Safety Reviewer',
    type: 'SAFETY_REVIEWER',
    description: 'Safety officer reviewing safety protocols',
    canApprove: true,
    canReject: true,
    canRequestChange: true,
    canComment: true,
    canOverride: false
  },
  {
    name: 'Scientific Reviewer',
    type: 'SCIENTIFIC_REVIEWER',
    description: 'Scientific expert evaluating research methodology',
    canApprove: true,
    canReject: true,
    canRequestChange: true,
    canComment: true,
    canOverride: false
  }
];

async function seedReviewerRoles() {
  console.log('🌱 Seeding reviewer roles...');

  try {
    for (const role of defaultRoles) {
      const existing = await prisma.reviewerRole.findUnique({
        where: { name: role.name }
      });

      if (existing) {
        console.log(`✓ Role "${role.name}" already exists, skipping...`);
        continue;
      }

      await prisma.reviewerRole.create({
        data: role
      });

      console.log(`✓ Created role: ${role.name}`);
    }

    console.log('✅ Reviewer roles seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding reviewer roles:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedReviewerRoles()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
