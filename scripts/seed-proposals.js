const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding proposals...');

  // Proposal 1: AI-Driven Cardiovascular Risk Assessment Platform (UNDER_REVIEW)
  const proposal1 = await prisma.proposal.upsert({
    where: { id: 'proposal-cardiovascular-ai' },
    update: {},
    create: {
      id: 'proposal-cardiovascular-ai',
      title: 'AI-Driven Cardiovascular Risk Assessment Platform',
      principalInvestigator: 'Stephen Gaita',
      principalInvestigatorOrcid: '0000-0002-1234-5678',
      coInvestigators: [
        {
          name: 'Dr. Maria Chen',
          orcid: '0000-0003-2345-6789',
          role: 'Co-Investigator',
          department: 'Cardiology'
        },
        {
          name: 'Dr. James Wilson',
          orcid: '0000-0004-3456-7890',
          role: 'Data Scientist',
          department: 'Computer Science'
        }
      ],
      departments: ['Cardiology', 'Computer Science', 'Biomedical Engineering'],
      startDate: new Date('2026-07-01'),
      endDate: new Date('2029-06-30'),
      researchAreas: ['Artificial Intelligence', 'Cardiovascular Medicine', 'Predictive Analytics', 'Machine Learning'],
      researchObjectives: `This research aims to develop and validate an AI-driven platform for early cardiovascular risk assessment using multimodal patient data. The primary objectives are:

1. Develop a deep learning model that integrates clinical, imaging, and genomic data for cardiovascular risk prediction
2. Validate the model across diverse patient populations in East Africa
3. Create a user-friendly clinical decision support system for healthcare providers
4. Assess the cost-effectiveness and clinical impact of AI-assisted risk stratification
5. Establish ethical guidelines for AI deployment in cardiovascular care`,
      methodology: `The study will employ a mixed-methods approach combining machine learning development with clinical validation:

Phase 1 (Months 1-12): Data Collection and Preprocessing
- Retrospective data collection from 5 major hospitals in Kenya
- Integration of EHR data, cardiac imaging (ECG, echocardiography), and genetic markers
- Data anonymization and quality assurance protocols

Phase 2 (Months 13-24): Model Development
- Development of ensemble deep learning models (CNN, LSTM, Transformer architectures)
- Feature engineering and selection using clinical expertise
- Cross-validation and hyperparameter optimization
- Explainable AI techniques for model interpretability

Phase 3 (Months 25-36): Clinical Validation and Implementation
- Prospective validation study with 2,000 patients
- Randomized controlled trial comparing AI-assisted vs. standard risk assessment
- User experience studies with clinicians
- Health economics analysis`,
      abstract: `Cardiovascular disease remains the leading cause of mortality in sub-Saharan Africa, with limited access to specialized diagnostic tools in many regions. This proposal presents an innovative AI-driven platform that leverages machine learning to assess cardiovascular risk using readily available clinical data, medical imaging, and genomic markers. By integrating multiple data modalities, our platform aims to provide accurate, early risk stratification that can guide preventive interventions and improve patient outcomes. The research will be conducted across five major hospitals in Kenya, ensuring diverse patient representation and real-world validation. Our interdisciplinary team brings together expertise in cardiology, computer science, biomedical engineering, and health economics to develop a clinically validated, ethically sound, and cost-effective solution for cardiovascular risk assessment in resource-limited settings.`,
      milestones: [
        {
          title: 'Data Collection Complete',
          description: 'Complete retrospective data collection from all 5 partner hospitals',
          targetDate: '2027-06-30',
          status: 'pending'
        },
        {
          title: 'Model Development',
          description: 'Complete development and internal validation of AI models',
          targetDate: '2028-01-31',
          status: 'pending'
        },
        {
          title: 'Clinical Validation',
          description: 'Complete prospective validation study with 2,000 patients',
          targetDate: '2028-12-31',
          status: 'pending'
        },
        {
          title: 'Platform Deployment',
          description: 'Deploy platform in pilot hospitals and complete user training',
          targetDate: '2029-06-30',
          status: 'pending'
        }
      ],
      deliverables: [
        {
          title: 'AI Risk Assessment Platform',
          description: 'Fully functional web-based platform with API integration',
          type: 'Software'
        },
        {
          title: 'Clinical Validation Report',
          description: 'Comprehensive report on model performance and clinical outcomes',
          type: 'Report'
        },
        {
          title: 'Peer-Reviewed Publications',
          description: 'Minimum 3 publications in high-impact journals',
          type: 'Publication'
        },
        {
          title: 'Training Materials',
          description: 'User manuals and training modules for healthcare providers',
          type: 'Documentation'
        }
      ],
      fundingSource: 'National Institutes of Health (NIH)',
      grantNumber: 'R01HL-2026-CV-AI',
      fundingInstitution: 'NIH - National Heart, Lung, and Blood Institute',
      grantStartDate: new Date('2026-07-01'),
      grantEndDate: new Date('2029-06-30'),
      totalBudgetAmount: 2850000,
      ethicalConsiderationsOverview: `This research involves human subjects data and requires careful ethical oversight:

1. Data Privacy: All patient data will be anonymized using industry-standard protocols
2. Informed Consent: Prospective study participants will provide written informed consent
3. Algorithmic Bias: Regular audits to detect and mitigate bias across demographic groups
4. Clinical Safety: AI recommendations will be advisory only, with final decisions by clinicians
5. Data Security: HIPAA-compliant data storage and transmission protocols`,
      consentProcedures: 'Written informed consent will be obtained from all prospective study participants. For retrospective data, institutional waiver of consent has been approved given the anonymized nature of the data.',
      dataSecurityMeasures: 'All data will be stored on encrypted servers with role-based access control. Data transmission will use TLS 1.3 encryption. Regular security audits will be conducted.',
      ethicsApprovalStatus: 'Pending',
      ethicsCommittee: 'Kenyatta National Hospital Ethics Review Committee',
      publicationRelevance: 'This research will generate multiple high-impact publications on AI in cardiovascular medicine, addressing a critical gap in healthcare delivery in resource-limited settings.',
      impactStatement: 'This platform has the potential to transform cardiovascular risk assessment in East Africa, enabling early intervention and reducing cardiovascular mortality. The AI-driven approach can be scaled across the region and adapted for other disease areas.',
      disseminationPlan: 'Results will be disseminated through peer-reviewed publications, international conferences, policy briefs for ministries of health, and open-source release of the platform code.',
      status: 'UNDER_REVIEW',
      ethicsDocuments: [],
      dataManagementPlan: [],
      otherRelatedFiles: []
    }
  });

  console.log('✅ Created proposal 1:', proposal1.title);

  // Proposal 2: Genomic Epidemiology of Antimicrobial Resistance (APPROVED, no award amount)
  const proposal2 = await prisma.proposal.upsert({
    where: { id: 'proposal-genomic-amr' },
    update: {},
    create: {
      id: 'proposal-genomic-amr',
      title: 'Genomic Epidemiology of Antimicrobial Resistance in East African Healthcare Settings',
      principalInvestigator: 'Dr. Amina Hassan',
      principalInvestigatorOrcid: '0000-0001-9876-5432',
      coInvestigators: [
        {
          name: 'Prof. David Kimani',
          orcid: '0000-0002-8765-4321',
          role: 'Co-Principal Investigator',
          department: 'Microbiology'
        },
        {
          name: 'Dr. Sarah Omondi',
          orcid: '0000-0003-7654-3210',
          role: 'Bioinformatics Lead',
          department: 'Computational Biology'
        }
      ],
      departments: ['Microbiology', 'Infectious Diseases', 'Computational Biology'],
      startDate: new Date('2026-09-01'),
      endDate: new Date('2029-08-31'),
      researchAreas: ['Antimicrobial Resistance', 'Genomics', 'Epidemiology', 'Public Health'],
      researchObjectives: `To characterize the genomic landscape of antimicrobial resistance (AMR) in East Africa and develop evidence-based interventions:

1. Conduct whole-genome sequencing of 5,000 bacterial isolates from healthcare facilities
2. Map the transmission dynamics of resistant pathogens across hospitals
3. Identify novel resistance mechanisms and mobile genetic elements
4. Develop rapid diagnostic tools for AMR detection
5. Create policy recommendations for antimicrobial stewardship programs`,
      methodology: `Multi-center surveillance study with genomic analysis:

Phase 1: Sample Collection (Months 1-18)
- Systematic collection of bacterial isolates from 15 hospitals
- Clinical metadata collection and antimicrobial susceptibility testing
- Quality control and biobanking

Phase 2: Genomic Analysis (Months 12-30)
- Whole-genome sequencing using Illumina and Oxford Nanopore platforms
- Bioinformatics pipeline for resistance gene detection
- Phylogenetic analysis and transmission network reconstruction
- Comparative genomics with global AMR databases

Phase 3: Translation and Implementation (Months 24-36)
- Development of rapid PCR-based diagnostic assays
- Pilot antimicrobial stewardship interventions
- Policy engagement and guideline development`,
      abstract: `Antimicrobial resistance poses a critical threat to global health, with particularly severe impacts in resource-limited settings. This comprehensive genomic epidemiology study will characterize AMR patterns across 15 healthcare facilities in Kenya, Tanzania, and Uganda. Using cutting-edge whole-genome sequencing and bioinformatics approaches, we will map resistance mechanisms, track transmission pathways, and identify intervention targets. The research will generate actionable data to inform antimicrobial stewardship programs and contribute to regional AMR surveillance networks. Our findings will be critical for developing context-appropriate diagnostic tools and treatment guidelines for East Africa.`,
      milestones: [
        {
          title: 'Surveillance Network Established',
          description: 'All 15 hospitals enrolled and sample collection initiated',
          targetDate: '2027-03-31',
          status: 'pending'
        },
        {
          title: 'Sequencing Complete',
          description: 'Whole-genome sequencing of 5,000 isolates completed',
          targetDate: '2028-06-30',
          status: 'pending'
        },
        {
          title: 'Diagnostic Tool Validated',
          description: 'Rapid diagnostic assay validated in clinical settings',
          targetDate: '2029-03-31',
          status: 'pending'
        }
      ],
      deliverables: [
        {
          title: 'AMR Genomic Database',
          description: 'Open-access database of 5,000 sequenced isolates',
          type: 'Database'
        },
        {
          title: 'Rapid Diagnostic Kit',
          description: 'PCR-based diagnostic tool for key resistance genes',
          type: 'Product'
        },
        {
          title: 'Policy Guidelines',
          description: 'Evidence-based antimicrobial stewardship guidelines',
          type: 'Policy Document'
        }
      ],
      fundingSource: 'Wellcome Trust',
      grantNumber: 'WT-AMR-2026-EA',
      fundingInstitution: 'Wellcome Trust',
      grantStartDate: new Date('2026-09-01'),
      grantEndDate: new Date('2029-08-31'),
      totalBudgetAmount: null, // APPROVED but no award amount yet
      ethicalConsiderationsOverview: 'The study involves bacterial isolates from clinical samples. Patient consent will be obtained where required by local ethics committees. All data will be anonymized.',
      consentProcedures: 'Waiver of consent for bacterial isolates; informed consent for linked clinical data where required.',
      dataSecurityMeasures: 'Secure data storage with encryption, restricted access, and compliance with GDPR and local data protection laws.',
      ethicsApprovalStatus: 'Approved',
      ethicsApprovalReference: 'KNH-ERC/A/123/2026',
      ethicsCommittee: 'Kenyatta National Hospital Ethics Review Committee',
      approvalDate: new Date('2026-05-15'),
      publicationRelevance: 'High-impact publications expected in journals such as The Lancet Infectious Diseases, Nature Microbiology, and PLOS Medicine.',
      impactStatement: 'This research will provide critical data to combat AMR in East Africa, inform policy decisions, and contribute to global AMR surveillance efforts.',
      disseminationPlan: 'Open-access publications, data sharing through international repositories, policy briefs, and stakeholder workshops.',
      status: 'APPROVED',
      ethicsDocuments: [],
      dataManagementPlan: [],
      otherRelatedFiles: []
    }
  });

  console.log('✅ Created proposal 2:', proposal2.title);

  // Create a review record for the approved proposal
  await prisma.proposalReview.upsert({
    where: { id: 'review-genomic-amr' },
    update: {},
    create: {
      id: 'review-genomic-amr',
      proposalId: proposal2.id,
      reviewerId: 'system',
      reviewerName: 'Research Review Committee',
      decision: 'APPROVED',
      overallComments: 'Excellent proposal addressing a critical public health challenge. The methodology is rigorous, the team is highly qualified, and the expected impact is significant. Approved for funding pending budget negotiation.',
      sectionReviews: {
        scientificMerit: { rating: 'Excellent', comments: 'Novel approach with strong scientific foundation' },
        methodology: { rating: 'Excellent', comments: 'Comprehensive and well-designed study' },
        feasibility: { rating: 'Good', comments: 'Realistic timeline and strong institutional support' },
        impact: { rating: 'Excellent', comments: 'High potential for regional and global impact' }
      },
      complianceScore: { total: 4, compliant: 4, nonCompliant: 0 },
      reviewDate: new Date('2026-05-20'),
      status: 'COMPLETED'
    }
  });

  console.log('✅ Created review record for approved proposal');
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding proposals:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
