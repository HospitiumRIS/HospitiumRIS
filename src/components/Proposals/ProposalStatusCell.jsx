'use client';

import { Box, Typography } from '@mui/material';
import StatusPill, { StageBar, humanizeStatus } from '../common/StatusPill';

export const PROPOSAL_STATUS_TONE = {
  DRAFT: 'neutral',
  SUBMITTED: 'info',
  UNDER_REVIEW: 'progress',
  REVISION_REQUESTED: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
};

/**
 * Proposal status for list tables: soft pill, thin review-stage bar and a
 * caption. `review` is the summary from GET /api/proposals?include=review.
 */
export default function ProposalStatusCell({ status, review }) {
  const tone = PROPOSAL_STATUS_TONE[status] || 'neutral';
  const total = review?.stageCount || 0;
  const decided = status === 'APPROVED' || status === 'REJECTED';
  const filled = decided || review?.overallStatus === 'COMPLETED' ? total : Math.min(total, review?.stageOrder || 0);

  let caption;
  if (status === 'DRAFT') caption = 'Not submitted yet';
  else if (decided) caption = status === 'APPROVED' ? 'Review complete' : 'Not approved';
  else if (status === 'REVISION_REQUESTED') caption = 'Changes requested';
  else if (review && total) caption = `Stage ${review.stageOrder} of ${total}${review.stageName ? ` · ${review.stageName}` : ''}`;
  else caption = 'Not yet in a review pipeline';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, minWidth: 180 }}>
      <StatusPill label={humanizeStatus(status)} tone={tone} />
      {status !== 'DRAFT' && total > 0 && <StageBar filled={filled} total={total} tone={tone} maxWidth={140} />}
      <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.72rem', lineHeight: 1.3 }}>
        {caption}
      </Typography>
    </Box>
  );
}
