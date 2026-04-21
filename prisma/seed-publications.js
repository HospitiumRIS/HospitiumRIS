const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding manuscripts and proposals...');

  // Get existing users to assign as creators
  const users = await prisma.user.findMany({ take: 5 });
  
  if (users.length === 0) {
    console.log('⚠️  No users found. Please run the main seed first.');
    return;
  }

  const user1 = users[0];
  const user2 = users[1] || users[0];
  const user3 = users[2] || users[0];

  // Seed Manuscripts
  const manuscripts = [
    {
      title: 'AI-Driven Diagnostic Tools for Early Cancer Detection',
      type: 'Article',
      field: 'Oncology',
      description: 'A comprehensive study on using machine learning algorithms for early-stage cancer detection',
      status: 'DRAFT',
      wordCount: 4250,
      createdBy: user1.id,
      content: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Introduction to AI diagnostics...' }] }] })
    },
    {
      title: 'Novel Approaches to Cardiovascular Disease Prevention',
      type: 'Review',
      field: 'Cardiology',
      description: 'Systematic review of recent preventive strategies in cardiovascular medicine',
      status: 'IN_REVIEW',
      wordCount: 7800,
      createdBy: user2.id,
      content: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Abstract: This review examines...' }] }] })
    },
    {
      title: 'Impact of Telemedicine on Rural Healthcare Access',
      type: 'Article',
      field: 'Public Health',
      description: 'Evaluating telemedicine effectiveness in underserved rural communities',
      status: 'UNDER_REVISION',
      wordCount: 5600,
      createdBy: user1.id,
      content: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Background and methodology...' }] }] })
    },
    {
      title: 'Genomic Sequencing in Personalized Medicine',
      type: 'Article',
      field: 'Genetics',
      description: 'Exploring the role of whole-genome sequencing in treatment customization',
      status: 'PUBLISHED',
      wordCount: 9200,
      createdBy: user3.id,
      content: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Published findings on genomic applications...' }] }] })
    },
    {
      title: 'Mental Health Interventions in Post-Pandemic Era',
      type: 'Article',
      field: 'Psychiatry',
      description: 'Analysis of effective mental health support strategies following COVID-19',
      status: 'DRAFT',
      wordCount: 3100,
      createdBy: user2.id,
      content: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Introduction to post-pandemic mental health...' }] }] })
    },
    {
      title: 'Antibiotic Resistance: Global Surveillance and Mitigation',
      type: 'Review',
      field: 'Infectious Disease',
      description: 'Comprehensive review of antimicrobial resistance patterns worldwide',
      status: 'IN_REVIEW',
      wordCount: 11500,
      createdBy: user1.id,
      content: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Global AMR surveillance data...' }] }] })
    },
    {
      title: 'Pediatric Vaccine Hesitancy: Behavioral Insights',
      type: 'Article',
      field: 'Pediatrics',
      description: 'Understanding parental decision-making around childhood vaccinations',
      status: 'ARCHIVED',
      wordCount: 6700,
      createdBy: user3.id,
      content: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Study methodology and findings...' }] }] })
    }
  ];

  for (const manuscript of manuscripts) {
    try {
      const created = await prisma.manuscript.create({ data: manuscript });
      console.log(`✅ Created manuscript: ${created.title} (${created.status})`);
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`⚠️  Manuscript "${manuscript.title}" already exists, skipping...`);
      } else {
        console.error(`❌ Error creating manuscript "${manuscript.title}":`, error.message);
      }
    }
  }

  // Seed Proposals
  const proposals = [
    {
      title: 'AI-Enhanced Diagnostic Accuracy in Rural Clinics',
      principalInvestigator: 'Dr. Sarah Mitchell',
      principalInvestigatorOrcid: '0000-0001-2345-6789',
      coInvestigators: [
        { name: 'Dr. James Chen', affiliation: 'Stanford Medical Center', role: 'Co-PI' },
        { name: 'Dr. Maria Rodriguez', affiliation: 'MIT Health Lab', role: 'Co-Investigator' }
      ],
      departments: ['Medical Informatics', 'Public Health'],
      researchAreas: ['Artificial Intelligence', 'Healthcare Access', 'Diagnostics'],
      researchObjectives: 'Develop and validate AI-powered diagnostic tools for resource-limited settings',
      methodology: 'Mixed-methods approach combining machine learning model development with field trials',
      abstract: 'This proposal aims to bridge the healthcare gap in rural areas by deploying AI diagnostic systems.',
      fundingSource: 'National Institutes of Health',
      grantNumber: 'NIH-R01-2024-12345',
      fundingInstitution: 'NIH',
      totalBudgetAmount: 850000,
      milestones: [
        { title: 'Literature Review & Model Design', targetDate: new Date('2024-06-30'), completed: true },
        { title: 'Prototype Development', targetDate: new Date('2024-12-31'), completed: false },
        { title: 'Field Testing Phase 1', targetDate: new Date('2025-06-30'), completed: false }
      ],
      deliverables: [
        { title: 'AI Diagnostic Platform', description: 'Fully functional prototype' },
        { title: 'Clinical Validation Report', description: 'Peer-reviewed findings' }
      ],
      status: 'DRAFT',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2026-12-31')
    },
    {
      title: 'Cardiovascular Risk Prediction Using Wearable Sensors',
      principalInvestigator: 'Prof. David Thompson',
      principalInvestigatorOrcid: '0000-0002-3456-7890',
      coInvestigators: [
        { name: 'Dr. Emily Watson', affiliation: 'Johns Hopkins', role: 'Co-PI' }
      ],
      departments: ['Cardiology', 'Biomedical Engineering'],
      researchAreas: ['Cardiovascular Disease', 'Wearable Technology', 'Predictive Analytics'],
      researchObjectives: 'Create real-time cardiovascular risk assessment using consumer wearables',
      methodology: 'Longitudinal cohort study with continuous monitoring and machine learning analysis',
      abstract: 'Leveraging wearable sensor data to predict cardiovascular events before they occur.',
      fundingSource: 'American Heart Association',
      grantNumber: 'AHA-2024-67890',
      fundingInstitution: 'AHA',
      totalBudgetAmount: 620000,
      milestones: [
        { title: 'Participant Recruitment', targetDate: new Date('2024-03-31'), completed: true },
        { title: 'Data Collection Phase', targetDate: new Date('2025-03-31'), completed: false }
      ],
      deliverables: [
        { title: 'Risk Prediction Algorithm', description: 'Validated ML model' }
      ],
      status: 'SUBMITTED',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2026-01-31')
    },
    {
      title: 'Telemedicine Platform for Chronic Disease Management',
      principalInvestigator: 'Dr. Lisa Chang',
      principalInvestigatorOrcid: '0000-0003-4567-8901',
      coInvestigators: [
        { name: 'Dr. Robert Kim', affiliation: 'UCLA Health', role: 'Co-Investigator' },
        { name: 'Dr. Amanda Foster', affiliation: 'UCSF', role: 'Co-Investigator' },
        { name: 'Dr. Michael Brown', affiliation: 'Mayo Clinic', role: 'Consultant' }
      ],
      departments: ['Internal Medicine', 'Health Informatics'],
      researchAreas: ['Telemedicine', 'Chronic Disease', 'Patient Engagement'],
      researchObjectives: 'Develop integrated telemedicine solution for diabetes and hypertension management',
      methodology: 'Randomized controlled trial comparing telemedicine vs. standard care outcomes',
      abstract: 'A comprehensive telemedicine intervention to improve chronic disease outcomes.',
      fundingSource: 'Patient-Centered Outcomes Research Institute',
      grantNumber: 'PCORI-2024-11223',
      fundingInstitution: 'PCORI',
      totalBudgetAmount: 1200000,
      milestones: [
        { title: 'Platform Development', targetDate: new Date('2024-08-31'), completed: true },
        { title: 'Pilot Study', targetDate: new Date('2025-02-28'), completed: true },
        { title: 'Full RCT Launch', targetDate: new Date('2025-09-30'), completed: false }
      ],
      deliverables: [
        { title: 'Telemedicine Platform', description: 'HIPAA-compliant web/mobile app' },
        { title: 'Clinical Trial Results', description: 'Published outcomes study' }
      ],
      status: 'UNDER_REVIEW',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2027-12-31')
    },
    {
      title: 'Genomic Biomarkers for Cancer Immunotherapy Response',
      principalInvestigator: 'Prof. Jennifer Lee',
      principalInvestigatorOrcid: '0000-0004-5678-9012',
      coInvestigators: [
        { name: 'Dr. Thomas Anderson', affiliation: 'MD Anderson', role: 'Co-PI' }
      ],
      departments: ['Oncology', 'Molecular Biology'],
      researchAreas: ['Cancer Genomics', 'Immunotherapy', 'Precision Medicine'],
      researchObjectives: 'Identify genomic signatures predicting immunotherapy treatment response',
      methodology: 'Multi-center genomic sequencing study with clinical outcome correlation',
      abstract: 'Discovering predictive biomarkers to personalize cancer immunotherapy selection.',
      fundingSource: 'National Cancer Institute',
      grantNumber: 'NCI-R01-2024-54321',
      fundingInstitution: 'NCI',
      totalBudgetAmount: 1450000,
      milestones: [
        { title: 'Sample Collection', targetDate: new Date('2024-12-31'), completed: true },
        { title: 'Genomic Analysis', targetDate: new Date('2025-12-31'), completed: false },
        { title: 'Clinical Correlation', targetDate: new Date('2026-12-31'), completed: false }
      ],
      deliverables: [
        { title: 'Biomarker Panel', description: 'Validated genomic signature' },
        { title: 'Clinical Decision Tool', description: 'Treatment selection algorithm' }
      ],
      status: 'APPROVED',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2028-12-31')
    },
    {
      title: 'Mental Health App for Adolescent Depression',
      principalInvestigator: 'Dr. Rachel Green',
      principalInvestigatorOrcid: '0000-0005-6789-0123',
      coInvestigators: [],
      departments: ['Psychiatry', 'Adolescent Medicine'],
      researchAreas: ['Mental Health', 'Digital Health', 'Adolescent Psychology'],
      researchObjectives: 'Develop evidence-based mobile intervention for teen depression',
      methodology: 'App development followed by pilot RCT with adolescent participants',
      abstract: 'A smartphone-based cognitive behavioral therapy intervention for depressed teens.',
      fundingSource: 'Robert Wood Johnson Foundation',
      grantNumber: 'RWJF-2024-98765',
      fundingInstitution: 'RWJF',
      totalBudgetAmount: 380000,
      milestones: [
        { title: 'App Design & Development', targetDate: new Date('2024-09-30'), completed: false }
      ],
      deliverables: [
        { title: 'Mobile Application', description: 'iOS/Android CBT app' }
      ],
      status: 'REVISION_REQUESTED',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2026-05-31')
    },
    {
      title: 'Antibiotic Stewardship in Community Hospitals',
      principalInvestigator: 'Dr. Mark Wilson',
      principalInvestigatorOrcid: '0000-0006-7890-1234',
      coInvestigators: [
        { name: 'Dr. Susan Taylor', affiliation: 'CDC', role: 'Co-Investigator' }
      ],
      departments: ['Infectious Disease', 'Hospital Medicine'],
      researchAreas: ['Antimicrobial Resistance', 'Hospital Quality', 'Public Health'],
      researchObjectives: 'Implement and evaluate antibiotic stewardship programs in small hospitals',
      methodology: 'Cluster randomized trial across 30 community hospitals',
      abstract: 'Reducing inappropriate antibiotic use through targeted stewardship interventions.',
      fundingSource: 'Centers for Disease Control',
      grantNumber: 'CDC-2024-33445',
      fundingInstitution: 'CDC',
      totalBudgetAmount: 720000,
      milestones: [],
      deliverables: [
        { title: 'Stewardship Toolkit', description: 'Implementation guide for hospitals' }
      ],
      status: 'REJECTED',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2026-02-28')
    }
  ];

  for (const proposal of proposals) {
    try {
      const created = await prisma.proposal.create({ data: proposal });
      console.log(`✅ Created proposal: ${created.title} (${created.status})`);
    } catch (error) {
      if (error.code === 'P2002') {
        console.log(`⚠️  Proposal "${proposal.title}" already exists, skipping...`);
      } else {
        console.error(`❌ Error creating proposal "${proposal.title}":`, error.message);
      }
    }
  }

  console.log('🎉 Publications seeding completed!');
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
