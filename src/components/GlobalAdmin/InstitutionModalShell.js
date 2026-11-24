'use client';

import React, { createContext, forwardRef, useContext } from 'react';
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  IconButton,
  Paper,
  Slide,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

export function StatCard({ icon: Icon, label, value }) {
  const theme = useTheme();
  const purple = theme.palette.primary;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        height: '100%',
        borderRadius: 3,
        border: '1px solid',
        borderColor: alpha(purple.main, 0.22),
        background: `linear-gradient(145deg, ${alpha(purple.main, 0.16)} 0%, ${alpha(purple.main, 0.06)} 55%, ${alpha(purple.light, 0.04)} 100%)`,
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(purple.main, 0.2),
            color: purple.main,
            boxShadow: `0 6px 16px ${alpha(purple.main, 0.16)}`,
          }}
        >
          <Icon fontSize="small" />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.1, color: purple.dark }}>
            {value}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.25, color: alpha(purple.dark, 0.72) }}>
            {label}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

export const institutionDialogPaperSx = {
  borderRadius: 3,
  overflow: 'hidden',
  boxShadow: '0 24px 48px rgba(15, 23, 42, 0.18)',
};

/**
 * How InstitutionModal opens below a provider: 'modal' (centred, the default) or 'panel'
 * (slides in from the right, full height). Pages that want side panels wrap their content in
 * <InstitutionModalVariant.Provider value="panel">. Small confirmations (maxWidth="xs")
 * stay centred unless they ask for variant="panel" themselves.
 */
export const InstitutionModalVariant = createContext('modal');

const PANEL_WIDTH = { xs: 420, sm: 540, md: 760, lg: 960, xl: 1100 };

const SlideLeft = forwardRef(function SlideLeft(props, ref) {
  return <Slide direction="left" ref={ref} {...props} />;
});

export function InstitutionModal({
  open,
  onClose,
  maxWidth = 'sm',
  fullWidth = true,
  disableClose = false,
  variant,
  children,
}) {
  const inherited = useContext(InstitutionModalVariant);
  const panel = variant ? variant === 'panel' : inherited === 'panel' && maxWidth !== 'xs';
  const handleClose = (event, reason) => {
    // Never close on outside (backdrop) clicks; Escape and explicit buttons still work.
    if (reason === 'backdropClick' || disableClose) return;
    onClose?.(event, reason);
  };

  if (panel) {
    return (
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth={false}
        disableScrollLock
        slots={{ transition: SlideLeft }}
        sx={{ '& .MuiDialog-container': { justifyContent: 'flex-end', alignItems: 'stretch' } }}
        PaperProps={{
          sx: {
            m: 0,
            height: '100%',
            maxHeight: '100%',
            width: { xs: '100%', sm: `min(${PANEL_WIDTH[maxWidth] || PANEL_WIDTH.sm}px, 100vw)` },
            maxWidth: '100vw',
            borderRadius: { xs: 0, sm: '16px 0 0 16px' },
            overflow: 'hidden',
            boxShadow: '-16px 0 40px rgba(15, 23, 42, 0.18)',
          },
        }}
      >
        {children}
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      disableScrollLock
      PaperProps={{ sx: institutionDialogPaperSx }}
    >
      {children}
    </Dialog>
  );
}

export function InstitutionModalHeader({
  icon: Icon,
  title,
  subtitle,
  tone = 'primary',
  onClose,
  disableClose = false,
  dense = false,
}) {
  const theme = useTheme();
  const palette = tone === 'danger' ? theme.palette.error : theme.palette.primary;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
        px: dense ? 2.5 : 3,
        pt: dense ? 2 : 2.5,
        pb: dense ? 1.5 : 2,
        background: `linear-gradient(135deg, ${alpha(palette.main, 0.14)} 0%, ${alpha(palette.main, 0.03)} 100%)`,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: alpha(palette.main, 0.16),
          color: palette.main,
          flexShrink: 0,
          boxShadow: `0 8px 20px ${alpha(palette.main, 0.18)}`,
        }}
      >
        <Icon />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0, pt: 0.25 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {onClose && (
        <IconButton
          aria-label="Close"
          onClick={onClose}
          disabled={disableClose}
          size="small"
          sx={{ mt: -0.5, mr: -0.5, color: 'text.secondary' }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
}

export function InstitutionModalBody({ children, dense = false }) {
  return (
    <DialogContent
      sx={{
        px: dense ? 2.5 : 3,
        py: dense ? 2 : 3,
        display: 'flex',
        flexDirection: 'column',
        gap: dense ? 1.5 : 2.5,
      }}
    >
      {children}
    </DialogContent>
  );
}

export function InstitutionModalFooter({ children }) {
  return (
    <>
      <Divider />
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          gap: 1,
          bgcolor: (theme) => alpha(theme.palette.divider, 0.05),
        }}
      >
        {children}
      </DialogActions>
    </>
  );
}

export function InstitutionModalSection({ title, children }) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.025),
      }}
    >
      {title && (
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
          {title}
        </Typography>
      )}
      {children}
    </Box>
  );
}
