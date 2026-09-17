/**
 * Shared manuscript lifecycle definitions.
 *
 * Values mirror the Prisma `ManuscriptStatus` enum so the researcher and
 * institution views describe the same pipeline.
 */

export const MANUSCRIPT_STAGE_ORDER = [
  'DRAFT',
  'IN_REVIEW',
  'UNDER_REVISION',
  'PUBLISHED',
  'ARCHIVED',
];

export const MANUSCRIPT_STAGES = {
  DRAFT: { label: 'Draft', color: '#f59e0b', bg: '#fef3c7', order: 1 },
  IN_REVIEW: { label: 'In Review', color: '#3b82f6', bg: '#dbeafe', order: 2 },
  UNDER_REVISION: { label: 'Under Revision', color: '#8b5cf6', bg: '#ede9fe', order: 3 },
  PUBLISHED: { label: 'Published', color: '#10b981', bg: '#d1fae5', order: 4 },
  ARCHIVED: { label: 'Archived', color: '#6b7280', bg: '#f3f4f6', order: 5 },
};

export const MANUSCRIPT_STATUS_VALUES = MANUSCRIPT_STAGE_ORDER;

/**
 * Workflow actions available from each status. Only the manuscript creator or a
 * collaborator with team-management rights may trigger a transition.
 */
export const WORKFLOW_ACTIONS = {
  submit_for_review: {
    label: 'Submit for Peer Review',
    from: ['DRAFT', 'UNDER_REVISION'],
    to: 'IN_REVIEW',
    milestone: true,
  },
  request_revisions: {
    label: 'Record Revisions Requested',
    from: ['IN_REVIEW'],
    to: 'UNDER_REVISION',
    milestone: true,
  },
  resubmit: {
    label: 'Resubmit to Reviewers',
    from: ['UNDER_REVISION'],
    to: 'IN_REVIEW',
    milestone: true,
  },
  mark_published: {
    label: 'Mark as Published',
    from: ['IN_REVIEW', 'UNDER_REVISION'],
    to: 'PUBLISHED',
    milestone: true,
  },
  archive: {
    label: 'Archive Manuscript',
    from: ['PUBLISHED', 'DRAFT'],
    to: 'ARCHIVED',
    milestone: false,
  },
};

export function getStageConfig(status) {
  return MANUSCRIPT_STAGES[status] || MANUSCRIPT_STAGES.DRAFT;
}

export function getStageLabel(status) {
  return MANUSCRIPT_STAGES[status]?.label || status || 'Draft';
}

/**
 * Translation key for a stage label, e.g. `manuscript_workflow.stage_in_review`.
 */
export function getStageTranslationKey(status) {
  const stage = MANUSCRIPT_STAGES[status] ? status : 'DRAFT';
  return `manuscript_workflow.stage_${stage.toLowerCase()}`;
}

export function canTransition(action, currentStatus) {
  const definition = WORKFLOW_ACTIONS[action];
  return Boolean(definition && definition.from.includes(currentStatus));
}

/**
 * Actions the user can trigger next, given the manuscript's current status.
 */
export function getAvailableActions(currentStatus) {
  return Object.entries(WORKFLOW_ACTIONS)
    .filter(([, definition]) => definition.from.includes(currentStatus))
    .map(([action, definition]) => ({ action, ...definition }));
}

/**
 * Which guided phase the manuscript is in: peer review or publication.
 */
export function getWorkflowPhase(status) {
  if (status === 'PUBLISHED' || status === 'ARCHIVED') return 'publication';
  if (status === 'IN_REVIEW' || status === 'UNDER_REVISION') return 'review';
  return 'preparation';
}

export const SUBMISSION_TYPES = [
  { value: 'MANUAL', label: 'Journal / Institutional Repository' },
  { value: 'PREPRINT', label: 'Preprint Server' },
  { value: 'EXTERNAL', label: 'Submitted via HospitiumRIS' },
];

export const SUBMISSION_STATUS_VALUES = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'REVISIONS_REQUESTED',
  'ACCEPTED',
  'REJECTED',
  'WITHDRAWN',
];

/**
 * Readiness checks evaluated before a manuscript leaves the drafting phase.
 * `severity: 'error'` blocks the transition, `'warning'` only informs the user.
 */
export function evaluateSubmissionChecklist(manuscript = {}) {
  const wordCount = manuscript.wordCount || 0;
  const collaboratorCount = manuscript.collaboratorCount ?? manuscript.totalCollaborators ?? 0;
  const unresolvedChanges = manuscript.pendingChangeCount || 0;
  const openComments = manuscript.openCommentCount || 0;

  return [
    {
      id: 'title',
      label: 'Manuscript has a title',
      severity: 'error',
      passed: Boolean(manuscript.title && manuscript.title.trim()),
      hint: 'Add a descriptive title before submitting.',
    },
    {
      id: 'content',
      label: 'Manuscript body is not empty',
      severity: 'error',
      passed: wordCount > 0,
      hint: 'Write and save manuscript content in the editor.',
    },
    {
      id: 'abstract',
      label: 'Abstract or summary provided',
      severity: 'warning',
      passed: Boolean(manuscript.description && manuscript.description.trim()),
      hint: 'Most journals require an abstract at submission.',
    },
    {
      id: 'field',
      label: 'Research field assigned',
      severity: 'warning',
      passed: Boolean(manuscript.field && manuscript.field.trim()),
      hint: 'Helps route the manuscript to the right reviewers.',
    },
    {
      id: 'authors',
      label: 'Co-authors confirmed',
      severity: 'warning',
      passed: collaboratorCount > 0,
      hint: 'Invite co-authors so ORCID metadata is complete.',
    },
    {
      id: 'references',
      label: 'References cited',
      severity: 'warning',
      passed: (manuscript.citationCount || 0) > 0,
      hint: 'Attach citations from your library before submission.',
    },
    {
      id: 'tracked_changes',
      label: 'No unresolved tracked changes',
      severity: 'warning',
      passed: unresolvedChanges === 0,
      hint: 'Accept or reject pending edits in the editor.',
    },
    {
      id: 'comments',
      label: 'No open review comments',
      severity: 'warning',
      passed: openComments === 0,
      hint: 'Resolve outstanding comments with your co-authors.',
    },
  ];
}

/**
 * Final checks before a manuscript is marked published.
 */
export function evaluatePublicationChecklist(manuscript = {}, metadata = {}) {
  return [
    {
      id: 'typeset',
      label: 'Final formatting and typesetting complete',
      severity: 'warning',
      passed: (manuscript.wordCount || 0) > 0,
      hint: 'Export a final proof from the editor before publishing.',
    },
    {
      id: 'doi',
      label: 'Persistent identifier (DOI) recorded',
      severity: 'warning',
      passed: Boolean(metadata.doi && metadata.doi.trim()),
      hint: 'A DOI makes the work citable and discoverable.',
    },
    {
      id: 'journal',
      label: 'Publication venue recorded',
      severity: 'warning',
      passed: Boolean(metadata.journal && metadata.journal.trim()),
      hint: 'Name the journal, repository, or preprint server.',
    },
    {
      id: 'orcid',
      label: 'ORCID metadata for corresponding author',
      severity: 'warning',
      passed: Boolean(metadata.authorId && metadata.authorId.trim()),
      hint: 'ORCID tagging supports long-term attribution.',
    },
  ];
}

export function checklistBlocksTransition(checklist) {
  return checklist.some((item) => item.severity === 'error' && !item.passed);
}
