export const REPORT_CATALOG = [
  {
    id: 'institute-performance',
    title: 'Institute performance report',
    description: 'Report on where the institute is doing better / worse in research output, and how well it is publishing.',
    raised: '25 Nov',
  },
  {
    id: 'citation-tracking',
    title: 'Citation tracking',
    description: 'Track citations received per researcher and per work.',
    raised: '25 Nov',
  },
  {
    id: 'work-status',
    title: 'Work-status report',
    description: 'Report on the pipeline of work by status: in preprint, in draft, or published.',
    raised: '25 Nov',
  },
  {
    id: 'publications-faculty',
    title: 'Publications by faculty / research area',
    description: 'Break down publication counts and trends by faculty and by research area.',
    raised: '25 Nov',
  },
  {
    id: 'publication-type',
    title: 'Performance by publication type',
    description:
      'Report already-published output segmented by publication type, alongside journal quality/credibility criteria for context.',
    raised: '25 Nov',
  },
];

export const institutePerformanceData = {
  monthlyOutput: [
    { month: 'Jan', publications: 12, manuscripts: 18, proposals: 8, peerAvg: 10 },
    { month: 'Feb', publications: 15, manuscripts: 22, proposals: 11, peerAvg: 11 },
    { month: 'Mar', publications: 14, manuscripts: 20, proposals: 9, peerAvg: 12 },
    { month: 'Apr', publications: 18, manuscripts: 24, proposals: 13, peerAvg: 11 },
    { month: 'May', publications: 21, manuscripts: 26, proposals: 14, peerAvg: 13 },
    { month: 'Jun', publications: 19, manuscripts: 23, proposals: 12, peerAvg: 12 },
    { month: 'Jul', publications: 23, manuscripts: 28, proposals: 15, peerAvg: 13 },
    { month: 'Aug', publications: 20, manuscripts: 25, proposals: 14, peerAvg: 14 },
    { month: 'Sep', publications: 26, manuscripts: 30, proposals: 16, peerAvg: 14 },
    { month: 'Oct', publications: 24, manuscripts: 29, proposals: 17, peerAvg: 15 },
    { month: 'Nov', publications: 28, manuscripts: 32, proposals: 18, peerAvg: 15 },
  ],
  benchmarks: [
    { metric: 'Publications / Researcher', institute: 3.8, peer: 3.2, national: 2.9 },
    { metric: 'Open Access Rate', institute: 68, peer: 55, national: 48 },
    { metric: 'Q1 Journal Share', institute: 42, peer: 38, national: 31 },
    { metric: 'Collaboration Index', institute: 2.4, peer: 2.1, national: 1.8 },
    { metric: 'Grant Success Rate', institute: 34, peer: 29, national: 26 },
  ],
  insights: [
    { area: 'Publication velocity', status: 'better', detail: '+18% above peer institutions over the last 6 months', score: 82 },
    { area: 'Journal quality (Q1 share)', status: 'better', detail: 'Outperforming national average by 11 percentage points', score: 76 },
    { area: 'Proposal conversion', status: 'worse', detail: '3 pts below peer average — review pipeline bottlenecks', score: 58 },
    { area: 'International co-authorship', status: 'better', detail: 'Growing 9% YoY; strong in Public Health & Engineering', score: 71 },
    { area: 'Preprint-to-publish lag', status: 'worse', detail: 'Median 8.2 months vs peer 6.5 months', score: 54 },
  ],
};

export const citationTrackingData = {
  byResearcher: [
    { name: 'Dr. Amara Ochieng', citations: 342, works: 28, hIndex: 18, trend: 12 },
    { name: 'Prof. James Mwangi', citations: 289, works: 31, hIndex: 16, trend: 8 },
    { name: 'Dr. Sarah Chen', citations: 256, works: 22, hIndex: 15, trend: 15 },
    { name: 'Dr. David Okello', citations: 198, works: 19, hIndex: 13, trend: 6 },
    { name: 'Prof. Elena Vasquez', citations: 176, works: 24, hIndex: 14, trend: 9 },
    { name: 'Dr. Peter Njoroge', citations: 154, works: 17, hIndex: 11, trend: 4 },
    { name: 'Dr. Fatima Hassan', citations: 132, works: 15, hIndex: 10, trend: 11 },
    { name: 'Dr. Michael Roberts', citations: 118, works: 14, hIndex: 9, trend: 3 },
  ],
  topWorks: [
    { title: 'Cardiovascular outcomes in T2DM cohort study', citations: 89, year: 2023, researcher: 'Dr. Amara Ochieng' },
    { title: 'AI-assisted diagnostic imaging meta-analysis', citations: 76, year: 2024, researcher: 'Dr. Sarah Chen' },
    { title: 'Malaria resistance patterns in East Africa', citations: 64, year: 2022, researcher: 'Prof. James Mwangi' },
    { title: 'Community health worker impact assessment', citations: 58, year: 2023, researcher: 'Dr. David Okello' },
    { title: 'Antimicrobial stewardship programme review', citations: 51, year: 2024, researcher: 'Prof. Elena Vasquez' },
  ],
  monthlyCitations: [
    { month: 'Jan', citations: 45 }, { month: 'Feb', citations: 52 }, { month: 'Mar', citations: 48 },
    { month: 'Apr', citations: 61 }, { month: 'May', citations: 58 }, { month: 'Jun', citations: 67 },
    { month: 'Jul', citations: 72 }, { month: 'Aug', citations: 69 }, { month: 'Sep', citations: 78 },
    { month: 'Oct', citations: 84 }, { month: 'Nov', citations: 91 },
  ],
};

export const workStatusData = {
  pipeline: [
    { status: 'Draft', count: 47, color: '#94a3b8' },
    { status: 'In Review', count: 23, color: '#f59e0b' },
    { status: 'Preprint', count: 31, color: '#3b82f6' },
    { status: 'Published', count: 156, color: '#22c55e' },
  ],
  monthlyPipeline: [
    { month: 'Jun', draft: 38, preprint: 22, published: 18, inReview: 15 },
    { month: 'Jul', draft: 41, preprint: 24, published: 20, inReview: 17 },
    { month: 'Aug', draft: 39, preprint: 26, published: 22, inReview: 16 },
    { month: 'Sep', draft: 44, preprint: 28, published: 24, inReview: 19 },
    { month: 'Oct', draft: 46, preprint: 29, published: 26, inReview: 21 },
    { month: 'Nov', draft: 47, preprint: 31, published: 28, inReview: 23 },
  ],
  conversionRates: [
    { stage: 'Draft → Review', rate: 72, target: 80 },
    { stage: 'Review → Preprint', rate: 58, target: 65 },
    { stage: 'Preprint → Published', rate: 64, target: 70 },
  ],
};

export const publicationsByFacultyData = {
  faculties: ['All Faculties', 'Medicine', 'Engineering', 'Public Health', 'Sciences', 'Humanities'],
  byFaculty: [
    { faculty: 'Medicine', publications: 68, trend: 14, researchers: 42, areas: 8 },
    { faculty: 'Engineering', publications: 45, trend: 22, researchers: 28, areas: 6 },
    { faculty: 'Public Health', publications: 52, trend: 18, researchers: 31, areas: 7 },
    { faculty: 'Sciences', publications: 38, trend: 9, researchers: 24, areas: 5 },
    { faculty: 'Humanities', publications: 21, trend: 5, researchers: 18, areas: 4 },
  ],
  byResearchArea: [
    { area: 'Oncology', count: 34, faculty: 'Medicine', yoy: 12 },
    { area: 'AI & Machine Learning', count: 29, faculty: 'Engineering', yoy: 28 },
    { area: 'Infectious Disease', count: 27, faculty: 'Public Health', yoy: 15 },
    { area: 'Cardiovascular', count: 24, faculty: 'Medicine', yoy: 8 },
    { area: 'Environmental Science', count: 22, faculty: 'Sciences', yoy: 11 },
    { area: 'Health Policy', count: 19, faculty: 'Public Health', yoy: 6 },
    { area: 'Biomedical Engineering', count: 18, faculty: 'Engineering', yoy: 19 },
    { area: 'Neuroscience', count: 16, faculty: 'Medicine', yoy: 10 },
    { area: 'Data Science', count: 15, faculty: 'Engineering', yoy: 24 },
    { area: 'Epidemiology', count: 14, faculty: 'Public Health', yoy: 7 },
  ],
  quarterlyTrend: [
    { quarter: 'Q1 24', medicine: 14, engineering: 9, publicHealth: 11, sciences: 8, humanities: 4 },
    { quarter: 'Q2 24', medicine: 16, engineering: 11, publicHealth: 13, sciences: 9, humanities: 5 },
    { quarter: 'Q3 24', medicine: 18, engineering: 12, publicHealth: 14, sciences: 10, humanities: 6 },
    { quarter: 'Q4 24', medicine: 20, engineering: 13, publicHealth: 14, sciences: 11, humanities: 6 },
  ],
};

export const publicationTypeData = {
  byType: [
    { type: 'Journal Article', count: 142, share: 58, avgIF: 4.2, q1Share: 62, credibility: 'High' },
    { type: 'Conference Paper', count: 38, share: 16, avgIF: null, q1Share: null, credibility: 'Medium' },
    { type: 'Book Chapter', count: 22, share: 9, avgIF: null, q1Share: null, credibility: 'Medium' },
    { type: 'Preprint', count: 31, share: 13, avgIF: null, q1Share: null, credibility: 'Emerging' },
    { type: 'Review Article', count: 10, share: 4, avgIF: 6.8, q1Share: 80, credibility: 'High' },
  ],
  journalQualityCriteria: [
    { criterion: 'Impact Factor (2-yr)', weight: '30%', threshold: 'IF ≥ 3.0 for strategic journals' },
    { criterion: 'Quartile Ranking (Scimago/JCR)', weight: '25%', threshold: 'Q1–Q2 preferred for tenure-track' },
    { criterion: 'Open Access Compliance', weight: '15%', threshold: '≥ 60% OA for funder mandates' },
    { criterion: 'Peer Review Transparency', weight: '10%', threshold: 'Registered reports & open review encouraged' },
    { criterion: 'Predatory Journal Exclusion', weight: '20%', threshold: 'Beall/CORE deny-list screening required' },
  ],
  impactDistribution: [
    { range: 'IF 0–1', count: 18 }, { range: 'IF 1–2', count: 32 }, { range: 'IF 2–4', count: 48 },
    { range: 'IF 4–6', count: 28 }, { range: 'IF 6+', count: 16 },
  ],
};
