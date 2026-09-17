'use client';

import { Box, Tooltip } from '@mui/material';
import { MANUSCRIPT_STAGE_ORDER, MANUSCRIPT_STAGES } from '../../lib/manuscript-workflow';

/**
 * Compact five-step indicator for the manuscript lifecycle.
 */
export default function StagePipeline({ currentStatus, size = 22 }) {
  const currentOrder = MANUSCRIPT_STAGES[currentStatus]?.order || 0;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {MANUSCRIPT_STAGE_ORDER.map((stage, i) => {
        const cfg = MANUSCRIPT_STAGES[stage];
        const isActive = stage === currentStatus;
        const isPast = currentOrder > cfg.order;
        const isLast = i === MANUSCRIPT_STAGE_ORDER.length - 1;

        return (
          <Box key={stage} sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title={cfg.label}>
              <Box sx={{
                width: size, height: size, borderRadius: '50%',
                bgcolor: isActive ? cfg.color : isPast ? '#10b981' : '#e5e7eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: isActive ? `2px solid ${cfg.color}` : isPast ? '2px solid #10b981' : '2px solid #d1d5db',
                boxShadow: isActive ? `0 0 0 3px ${cfg.bg}` : 'none',
                transition: 'all 0.2s',
                color: isActive || isPast ? 'white' : '#9ca3af',
                fontSize: 11,
              }}>
                {isPast ? '✓' : (i + 1)}
              </Box>
            </Tooltip>
            {!isLast && (
              <Box sx={{ width: 14, height: 2, bgcolor: isPast ? '#10b981' : '#e5e7eb' }} />
            )}
          </Box>
        );
      })}
    </Box>
  );
}
