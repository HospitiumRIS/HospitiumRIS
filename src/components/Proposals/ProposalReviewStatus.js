'use client';

import { Box, Typography, Stepper, Step, StepLabel, Chip, Tooltip, CircularProgress } from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  HourglassEmpty as HourglassIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

const getStatusIcon = (status) => {
  switch (status) {
    case 'APPROVED':
      return <CheckCircleIcon sx={{ color: '#4caf50' }} />;
    case 'APPROVED_WITH_CONTINGENCIES':
      return <WarningIcon sx={{ color: '#ff9800' }} />;
    case 'DISAPPROVED':
      return <CancelIcon sx={{ color: '#f44336' }} />;
    case 'DEFERRED':
      return <ScheduleIcon sx={{ color: '#ff9800' }} />;
    case 'IN_PROGRESS':
      return <HourglassIcon sx={{ color: '#2196f3' }} />;
    case 'SKIPPED':
      return <CheckCircleIcon sx={{ color: '#9e9e9e' }} />;
    default:
      return <HourglassIcon sx={{ color: '#9e9e9e' }} />;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'APPROVED':
      return '#4caf50';
    case 'APPROVED_WITH_CONTINGENCIES':
      return '#ff9800';
    case 'DISAPPROVED':
      return '#f44336';
    case 'DEFERRED':
      return '#ff9800';
    case 'IN_PROGRESS':
      return '#2196f3';
    case 'SKIPPED':
      return '#9e9e9e';
    default:
      return '#9e9e9e';
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'APPROVED':
      return 'Approved';
    case 'APPROVED_WITH_CONTINGENCIES':
      return 'Approved with Conditions';
    case 'DISAPPROVED':
      return 'Disapproved';
    case 'DEFERRED':
      return 'Deferred';
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'NOT_STARTED':
      return 'Not Started';
    case 'SKIPPED':
      return 'Skipped';
    default:
      return status;
  }
};

export default function ProposalReviewStatus({ tracking, compact = false }) {
  if (!tracking || !tracking.pipeline) {
    return null;
  }

  const { pipeline, stageProgress, currentStageOrder, overallStatus } = tracking;
  const stages = pipeline.stages || [];

  // Create a map of stage progress
  const progressMap = {};
  (stageProgress || []).forEach((progress) => {
    progressMap[progress.stageId] = progress;
  });

  if (compact) {
    // Compact view for list pages
    const currentStage = stages.find(s => s.order === currentStageOrder);
    const currentProgress = currentStage ? progressMap[currentStage.id] : null;

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          label={overallStatus === 'COMPLETED' ? 'Review Complete' : currentStage?.name || 'Not Started'}
          size="small"
          sx={{
            backgroundColor: overallStatus === 'COMPLETED' ? '#4caf50' : '#2196f3',
            color: 'white',
            fontWeight: 600,
          }}
        />
        {currentProgress && (
          <Chip
            icon={getStatusIcon(currentProgress.status)}
            label={getStatusLabel(currentProgress.status)}
            size="small"
            variant="outlined"
            sx={{
              borderColor: getStatusColor(currentProgress.status),
              color: getStatusColor(currentProgress.status),
            }}
          />
        )}
        <Typography variant="caption" sx={{ color: '#666' }}>
          Stage {currentStageOrder} of {stages.length}
        </Typography>
      </Box>
    );
  }

  // Full view for detail pages
  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Review Progress
        </Typography>
        <Chip
          label={overallStatus === 'COMPLETED' ? 'All Stages Complete' : `Stage ${currentStageOrder} of ${stages.length}`}
          color={overallStatus === 'COMPLETED' ? 'success' : 'primary'}
        />
      </Box>

      <Stepper activeStep={currentStageOrder - 1} orientation="vertical">
        {stages.map((stage, index) => {
          const progress = progressMap[stage.id];
          const isActive = stage.order === currentStageOrder;
          const isCompleted = progress && ['APPROVED', 'APPROVED_WITH_CONTINGENCIES', 'SKIPPED'].includes(progress.status);
          const isFailed = progress && ['DISAPPROVED', 'DEFERRED'].includes(progress.status);

          return (
            <Step key={stage.id} completed={isCompleted} active={isActive}>
              <StepLabel
                error={isFailed}
                icon={
                  progress ? (
                    getStatusIcon(progress.status)
                  ) : (
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        border: '2px solid #ccc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        color: '#666',
                      }}
                    >
                      {index + 1}
                    </Box>
                  )
                }
              >
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {stage.name}
                  </Typography>
                  {stage.description && (
                    <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
                      {stage.description}
                    </Typography>
                  )}
                  {progress && (
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={getStatusLabel(progress.status)}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(progress.status),
                          color: 'white',
                          fontSize: '0.7rem',
                          height: 20,
                        }}
                      />
                      {progress.startedAt && (
                        <Typography variant="caption" sx={{ color: '#666', ml: 1 }}>
                          Started: {new Date(progress.startedAt).toLocaleDateString()}
                        </Typography>
                      )}
                      {progress.completedAt && (
                        <Typography variant="caption" sx={{ color: '#666', ml: 1 }}>
                          Completed: {new Date(progress.completedAt).toLocaleDateString()}
                        </Typography>
                      )}
                      {progress.conditions && (
                        <Tooltip title={progress.conditions}>
                          <Typography variant="caption" sx={{ color: '#ff9800', display: 'block', mt: 0.5 }}>
                            Conditions apply - hover for details
                          </Typography>
                        </Tooltip>
                      )}
                      {progress.rejectionReason && (
                        <Typography variant="caption" sx={{ color: '#f44336', display: 'block', mt: 0.5 }}>
                          Reason: {progress.rejectionReason}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>
    </Box>
  );
}
