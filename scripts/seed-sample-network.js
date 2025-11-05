/**
 * Sample data seeding script for testing the research network visualization
 * This will create sample publications and collaborations for testing purposes
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const sampleUsers = [
  {
    givenName: 'John',
    familyName: 'Doe',
    email: 'john.doe@example.com',
    accountType: 'RESEARCHER',
    status: 'ACTIVE',
    emailVerified: true,
    researchProfile: {
      specialization: ['Oncology', 'Genomics'],
      keywords: ['cancer research', 'genomics', 'biomarkers'],
      academicTitle: 'Dr.',
      department: 'Medical Research'
    },
    institution: {
      name: 'University of Nairobi',
      type: 'University',
      country: 'Kenya'
    }
  },
  {
    givenName: 'Jane',
    familyName: 'Smith',
    email: 'jane.smith@example.com',
    accountType: 'RESEARCHER',
    status: 'ACTIVE',
    emailVerified: true,
    researchProfile: {
      specialization: ['Cardiology', 'Epidemiology'],
      keywords: ['heart disease', 'public health', 'epidemiology'],
      academicTitle: 'Prof.',
      department: 'Cardiology'
    },
    institution: {
      name: 'Moi University',
      type: 'University',
      country: 'Kenya'
    }
  },
  {
    givenName: 'Ahmed',
    familyName: 'Hassan',
    email: 'ahmed.hassan@example.com',
    accountType: 'RESEARCHER',
    status: 'ACTIVE',
    emailVerified: true,
    researchProfile: {
      specialization: ['Neurology', 'Medical Imaging'],
      keywords: ['neurology', 'brain imaging', 'MRI'],
      academicTitle: 'Dr.',
      department: 'Neurology'
    },
    institution: {
      name: 'Kenyatta University',
      type: 'University',
      country: 'Kenya'
    }
  }
];

const samplePublications = [
  {
    title: 'Novel Genomic Markers for Early Cancer Detection in African Populations',
    journal: 'Journal of African Medical Research',
    year: 2023,
    abstract: 'This study identified unique genomic markers that show promise for early detection of colorectal and breast cancers in African populations, with implications for developing targeted screening programs.',
    publicationType: 'Article',
    keywords: ['genomics', 'cancer detection', 'biomarkers', 'African populations'],
    authors: [0, 1] // John and Jane
  },
  {
    title: 'Neurological Manifestations of Tropical Diseases: A Comprehensive Review',
    journal: 'African Journal of Neurological Sciences',
    year: 2023,
    abstract: 'A systematic review of neurological manifestations in tropical diseases endemic to East Africa, providing clinical guidelines for diagnosis and management.',
    publicationType: 'Review',
    keywords: ['neurology', 'tropical diseases', 'East Africa'],
    authors: [0, 2] // John and Ahmed
  },
  {
    title: 'Cardiovascular Risk Factors in Urban vs Rural Kenyan Populations',
    journal: 'International Journal of Cardiology',
    year: 2022,
    abstract: 'Comparative study examining cardiovascular risk factors between urban and rural populations in Kenya, revealing significant lifestyle and genetic differences.',
    publicationType: 'Article',
    keywords: ['cardiology', 'risk factors', 'Kenya', 'epidemiology'],
    authors: [1, 2] // Jane and Ahmed
  },
  {
    title: 'Collaborative Approaches to Medical Research in East Africa',
    journal: 'Nature Medicine Africa',
    year: 2024,
    abstract: 'This collaborative review discusses the importance of regional cooperation in medical research and outlines successful models for international collaboration.',
    publicationType: 'Review',
    keywords: ['collaboration', 'medical research', 'East Africa'],
    authors: [0, 1, 2] // All three
  }
];

async function seedSampleData() {
  console.log('🌱 Starting sample data seeding...');

  try {
    // Hash password for all users
    const hashedPassword = await bcrypt.hash('password123', 12);

    // Create users with institutions and research profiles
    const createdUsers = [];
    
    for (const userData of sampleUsers) {
      console.log(`Creating user: ${userData.givenName} ${userData.familyName}`);
      
      const user = await prisma.user.create({
        data: {
          givenName: userData.givenName,
          familyName: userData.familyName,
          email: userData.email,
          passwordHash: hashedPassword,
          accountType: userData.accountType,
          status: userData.status,
          emailVerified: userData.emailVerified,
          institution: {
            create: userData.institution
          },
          researchProfile: {
            create: userData.researchProfile
          }
        },
        include: {
          institution: true,
          researchProfile: true
        }
      });
      
      createdUsers.push(user);
      console.log(`✅ Created user: ${user.givenName} ${user.familyName} (${user.id})`);
    }

    // Create publications with authors
    for (let i = 0; i < samplePublications.length; i++) {
      const pubData = samplePublications[i];
      console.log(`Creating publication: ${pubData.title}`);
      
      const publication = await prisma.publication.create({
        data: {
          title: pubData.title,
          journal: pubData.journal,
          year: pubData.year,
          abstract: pubData.abstract,
          publicationType: pubData.publicationType,
          keywords: pubData.keywords,
          authors: {
            create: pubData.authors.map((userIndex, order) => ({
              userId: createdUsers[userIndex].id,
              authorOrder: order + 1,
              isCorresponding: order === 0 // First author is corresponding
            }))
          }
        },
        include: {
          authors: {
            include: {
              user: true
            }
          }
        }
      });
      
      console.log(`✅ Created publication: ${publication.title} (${publication.id})`);
      console.log(`   Authors: ${publication.authors.map(a => `${a.user.givenName} ${a.user.familyName}`).join(', ')}`);
    }

    console.log('\n🎉 Sample data seeding completed successfully!');
    console.log('\nSample users created:');
    createdUsers.forEach(user => {
      console.log(`  - ${user.givenName} ${user.familyName} (${user.email})`);
      console.log(`    Institution: ${user.institution.name}`);
      console.log(`    Specialization: ${user.researchProfile.specialization.join(', ')}`);
    });

    console.log('\nYou can now log in with any of these users using password: "password123"');

  } catch (error) {
    console.error('❌ Error seeding sample data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
if (require.main === module) {
  seedSampleData()
    .catch((error) => {
      console.error('Fatal error during seeding:', error);
      process.exit(1);
    });
}

module.exports = seedSampleData;
