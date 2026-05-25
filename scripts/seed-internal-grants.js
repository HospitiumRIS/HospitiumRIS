/**
 * Seed script — Internal Grant Requests
 * Run: node scripts/seed-internal-grants.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const daysAgo = (n) => new Date(Date.now() - n * 86_400_000);
const daysFromNow = (n) => new Date(Date.now() + n * 86_400_000);

const SAMPLES = [
  // ── 1. Approved ─────────────────────────────────────────────────────────────
  {
    request: {
      applicantName: 'Dr. Sarah Al-Mansouri',
      applicantEmail: 's.almansouri@hospitium.org',
      applicantTitle: 'Principal Researcher',
      department: 'Clinical Research',
      title: 'AI-Assisted Diagnostic Imaging Study',
      purpose: 'Research',
      description:
        'This project aims to develop and validate an AI-assisted diagnostic imaging pipeline that improves early detection of rare pulmonary conditions. Funding will support GPU compute resources, software licences, and a part-time data engineer for 12 months. Expected outcome is a peer-reviewed publication and a deployable prototype ready for clinical trials.',
      requestedAmount: 85000,
      approvedAmount: 80000,
      projectStartDate: daysAgo(60),
      projectEndDate: daysFromNow(305),
      status: 'approved',
      stage: 'final_decision',
      submittedAt: daysAgo(90),
      decisionDate: daysAgo(30),
      decisionNotes: 'Approved at $80,000 — reduced from requested amount due to software licensing already covered under existing institutional agreements. Project timeline and objectives are well-defined.',
      reportingRequired: true,
      reportDueDate: daysFromNow(335),
      reportSubmitted: false,
    },
    reviews: [
      {
        reviewerName: 'Dr. Khalid Hamdan',
        reviewerEmail: 'k.hamdan@hospitium.org',
        stage: 'intake',
        decision: 'forward',
        comments: 'Application is complete and well-structured. The research objectives are clearly articulated and aligned with institutional priorities. Forwarding to Initial Review.',
        reviewDate: daysAgo(85),
      },
      {
        reviewerName: 'Prof. Lena Voss',
        reviewerEmail: 'l.voss@hospitium.org',
        stage: 'initial_review',
        decision: 'forward',
        comments: 'Strong scientific merit and feasibility. The budget breakdown is reasonable. Recommend committee review for final approval.',
        reviewDate: daysAgo(70),
      },
      {
        reviewerName: 'Grant Committee',
        reviewerEmail: 'committee@hospitium.org',
        stage: 'committee_review',
        decision: 'forward',
        comments: 'Committee reviewed the proposal and agrees on its merit. Minor budget adjustment recommended — software licensing is already covered. Moving to final decision.',
        reviewDate: daysAgo(45),
      },
      {
        reviewerName: 'Dr. Omar Rashid',
        reviewerEmail: 'o.rashid@hospitium.org',
        stage: 'final_decision',
        decision: 'approved',
        comments: 'Approved at $80,000 with the recommended budget adjustment. Reporting required at project close.',
        reviewDate: daysAgo(30),
      },
    ],
  },

  // ── 2. Under Review — Committee Stage ───────────────────────────────────────
  {
    request: {
      applicantName: 'Ms. Fatima Al-Zahrawi',
      applicantEmail: 'f.alzahrawi@hospitium.org',
      applicantTitle: 'Lab Manager',
      department: 'Pathology',
      title: 'Next-Generation Sequencing Equipment Upgrade',
      purpose: 'Equipment',
      description:
        'The Pathology department\'s current sequencing equipment is end-of-life and insufficient for the volume of genomic samples required for ongoing research projects. This request covers procurement of a Illumina NovaSeq X Plus system and associated reagents for the first 6 months of operation. The upgrade will increase throughput by 4× and reduce per-sample cost by 40%.',
      requestedAmount: 220000,
      projectStartDate: daysFromNow(30),
      projectEndDate: daysFromNow(395),
      status: 'under_review',
      stage: 'committee_review',
      submittedAt: daysAgo(45),
    },
    reviews: [
      {
        reviewerName: 'Dr. Khalid Hamdan',
        reviewerEmail: 'k.hamdan@hospitium.org',
        stage: 'intake',
        decision: 'forward',
        comments: 'Request is complete and technically sound. Equipment justification is well-documented with cost-benefit analysis. Forwarding for initial review.',
        reviewDate: daysAgo(40),
      },
      {
        reviewerName: 'Prof. Lena Voss',
        reviewerEmail: 'l.voss@hospitium.org',
        stage: 'initial_review',
        decision: 'forward',
        comments: 'Reviewed the technical specifications and vendor quotes. The requested system is appropriate for the stated workload. Budget is competitive. Moving to committee review.',
        reviewDate: daysAgo(25),
      },
    ],
  },

  // ── 3. Submitted — Intake Stage ─────────────────────────────────────────────
  {
    request: {
      applicantName: 'Dr. James Okonkwo',
      applicantEmail: 'j.okonkwo@hospitium.org',
      applicantTitle: 'Senior Lecturer',
      department: 'Medical Education',
      title: 'Simulation-Based Clinical Skills Training Programme',
      purpose: 'Training & Development',
      description:
        'This programme will establish a structured simulation-based training curriculum for junior clinical staff. Funds will be used to purchase high-fidelity patient simulators, develop scenario libraries, and train 4 simulation facilitators. The programme targets 120 trainees in Year 1 with a measurable improvement in clinical assessment scores.',
      requestedAmount: 45000,
      projectStartDate: daysFromNow(60),
      projectEndDate: daysFromNow(425),
      status: 'submitted',
      stage: 'intake',
      submittedAt: daysAgo(3),
    },
    reviews: [],
  },

  // ── 4. Revision Requested ────────────────────────────────────────────────────
  {
    request: {
      applicantName: 'Dr. Rania Mostafa',
      applicantEmail: 'r.mostafa@hospitium.org',
      applicantTitle: 'Research Fellow',
      department: 'Epidemiology & Public Health',
      title: 'Community Diabetes Prevention Outreach — Phase 2',
      purpose: 'Community Outreach',
      description:
        'Phase 2 of the community diabetes prevention programme, expanding coverage to 3 additional districts. This phase focuses on mobile screening units, community health worker training, and integration with primary care referral pathways.',
      requestedAmount: 62000,
      projectStartDate: daysFromNow(45),
      projectEndDate: daysFromNow(410),
      status: 'revision_requested',
      stage: 'initial_review',
      submittedAt: daysAgo(28),
      decisionDate: daysAgo(14),
      revisionNotes:
        'Please provide a detailed breakdown of mobile unit operating costs (fuel, maintenance, insurance) and clarify the community health worker training hours. Also include Phase 1 outcomes data to support the Phase 2 scope justification.',
    },
    reviews: [
      {
        reviewerName: 'Dr. Khalid Hamdan',
        reviewerEmail: 'k.hamdan@hospitium.org',
        stage: 'intake',
        decision: 'forward',
        comments: 'Application passes intake checks. Programme is well-aligned with community health strategy. Forwarding to initial review.',
        reviewDate: daysAgo(22),
      },
      {
        reviewerName: 'Prof. Lena Voss',
        reviewerEmail: 'l.voss@hospitium.org',
        stage: 'initial_review',
        decision: 'revision_requested',
        comments: 'The proposal shows promise but the budget lacks sufficient detail for mobile unit operations, and Phase 1 outcome data is absent. Requesting revision before proceeding.',
        reviewDate: daysAgo(14),
      },
    ],
  },

  // ── 5. Rejected ──────────────────────────────────────────────────────────────
  {
    request: {
      applicantName: 'Mr. Hassan Al-Banna',
      applicantEmail: 'h.albanna@hospitium.org',
      applicantTitle: 'Research Coordinator',
      department: 'Cardiology',
      title: 'International Cardiology Conference Travel Grant',
      purpose: 'Travel',
      description:
        'Request for travel funding to attend the World Congress of Cardiology in Vienna, Austria, to present findings from the ongoing Coronary Artery Risk Stratification study. Includes return flights, accommodation for 5 nights, and conference registration.',
      requestedAmount: 8500,
      projectStartDate: daysAgo(10),
      projectEndDate: daysAgo(5),
      status: 'rejected',
      stage: 'final_decision',
      submittedAt: daysAgo(55),
      decisionDate: daysAgo(20),
      decisionNotes:
        'Rejected. The department\'s travel budget allocation for this fiscal year has been exhausted following two prior approvals. Applicant is encouraged to reapply in Q1 of the next fiscal year or seek co-sponsorship from the Cardiology Research Fund.',
    },
    reviews: [
      {
        reviewerName: 'Dr. Khalid Hamdan',
        reviewerEmail: 'k.hamdan@hospitium.org',
        stage: 'intake',
        decision: 'forward',
        comments: 'Travel request is complete with supporting documentation. Forwarding to review.',
        reviewDate: daysAgo(50),
      },
      {
        reviewerName: 'Prof. Lena Voss',
        reviewerEmail: 'l.voss@hospitium.org',
        stage: 'initial_review',
        decision: 'forward',
        comments: 'Presentation is relevant and the conference is well-regarded. However, departmental budget constraints need to be assessed at committee level.',
        reviewDate: daysAgo(38),
      },
      {
        reviewerName: 'Grant Committee',
        reviewerEmail: 'committee@hospitium.org',
        stage: 'committee_review',
        decision: 'forward',
        comments: 'Committee notes the budget concern but believes the merit warrants final decision review.',
        reviewDate: daysAgo(30),
      },
      {
        reviewerName: 'Dr. Omar Rashid',
        reviewerEmail: 'o.rashid@hospitium.org',
        stage: 'final_decision',
        decision: 'rejected',
        comments: 'Departmental travel budget exhausted for this fiscal year. Unable to approve at this time.',
        reviewDate: daysAgo(20),
      },
    ],
  },

  // ── 6. Draft ─────────────────────────────────────────────────────────────────
  {
    request: {
      applicantName: 'Dr. Amira Khoury',
      applicantEmail: 'a.khoury@hospitium.org',
      applicantTitle: 'Infrastructure Lead',
      department: 'Information Technology',
      title: 'Secure Research Data Infrastructure Upgrade',
      purpose: 'Infrastructure',
      description:
        'Upgrade of the secure research data enclave to support increasing data volumes from multi-site clinical studies. This includes additional NAS storage (200 TB), a 10 Gb fibre backbone extension to the clinical research wing, and a dedicated backup and disaster recovery system compliant with HIPAA and local data protection regulations.',
      requestedAmount: 175000,
      projectStartDate: daysFromNow(90),
      projectEndDate: daysFromNow(455),
      status: 'draft',
      stage: 'intake',
    },
    reviews: [],
  },
];

async function main() {
  console.log('🌱 Seeding internal grant requests...\n');

  for (const sample of SAMPLES) {
    const { request, reviews } = sample;

    const created = await prisma.internalGrantRequest.create({
      data: {
        ...request,
        attachments: [],
        reviews: reviews.length
          ? { create: reviews }
          : undefined,
      },
    });

    console.log(`  ✅  [${created.status.padEnd(20)}]  ${created.title}`);
  }

  console.log(`\n✔  Seeded ${SAMPLES.length} internal grant requests.`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
