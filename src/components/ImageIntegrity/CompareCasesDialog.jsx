'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Chip,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Box,
  Radio,
} from '@mui/material';
import { CompareArrows as CompareIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const MAX_COMPARE = 10;

function orderedIds(cases, anchorId) {
  const ids = cases.map((item) => item.id);
  if (!anchorId || !ids.includes(anchorId)) return ids;
  return [anchorId, ...ids.filter((id) => id !== anchorId)];
}

/**
 * Confirm and start an ImaChek cross-case comparison (max 10 cases).
 * The chosen anchor is sent first so results are written back to that case.
 */
export default function CompareCasesDialog({
  open,
  onClose,
  cases = [],
  onConfirm,
  submitting = false,
  error = '',
}) {
  const { t } = useTranslation();
  const [compareGlobal, setCompareGlobal] = useState(true);
  const [anchorId, setAnchorId] = useState('');
  const eligible = cases.slice(0, MAX_COMPARE);

  useEffect(() => {
    if (!open) return;
    const ids = cases.slice(0, MAX_COMPARE).map((item) => item.id);
    setAnchorId((current) => (ids.includes(current) ? current : ids[0] || ''));
  }, [open, cases]);

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {t('researcher.integrity_compare_title', 'Compare cases')}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            {t(
              'researcher.integrity_compare_help',
              'ImaChek will look for reused or duplicated images across these papers. Choose the anchor — that is the case where results are saved when the comparison finishes.'
            )}
          </Typography>

          {error && <Alert severity="error">{error}</Alert>}

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              {t('researcher.integrity_compare_selected', '{{count}} selected (max {{max}})', {
                count: eligible.length,
                max: MAX_COMPARE,
              })}
            </Typography>
            <Stack spacing={0.75}>
              {eligible.map((item) => {
                const isAnchor = item.id === anchorId;
                return (
                  <Box
                    key={item.id}
                    onClick={() => !submitting && setAnchorId(item.id)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 1.25,
                      py: 0.85,
                      borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: isAnchor ? '#8b6cbc' : 'divider',
                      bgcolor: isAnchor ? 'rgba(139,108,188,0.06)' : 'background.paper',
                      cursor: submitting ? 'default' : 'pointer',
                      width: '100%',
                      '&:hover': submitting ? undefined : { borderColor: '#8b6cbc' },
                    }}
                  >
                    <Radio
                      size="small"
                      checked={isAnchor}
                      onChange={() => setAnchorId(item.id)}
                      sx={{ p: 0.25, color: '#8b6cbc', '&.Mui-checked': { color: '#8b6cbc' } }}
                    />
                    {isAnchor && (
                      <Chip
                        size="small"
                        label={t('researcher.integrity_compare_anchor', 'Anchor')}
                        sx={{ height: 20, fontWeight: 700, bgcolor: '#8b6cbc', color: 'white' }}
                      />
                    )}
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                        {item.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {item.fileName}
                        {item.submittedBy
                          ? ` · ${`${item.submittedBy.givenName || ''} ${item.submittedBy.familyName || ''}`.trim()}`
                          : ''}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={compareGlobal}
                onChange={(e) => setCompareGlobal(e.target.checked)}
                size="small"
              />
            }
            label={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {t('researcher.integrity_compare_short', 'Compare to global repository')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t(
                    'researcher.integrity_compare_hint',
                    'Also checks against ImaChek’s published image library'
                  )}
                </Typography>
              </Box>
            }
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={submitting} sx={{ textTransform: 'none' }}>
          {t('common.cancel', 'Cancel')}
        </Button>
        <Button
          variant="contained"
          disabled={submitting || eligible.length < 2 || !anchorId}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <CompareIcon />}
          onClick={() =>
            onConfirm({
              compareGlobal,
              caseIds: orderedIds(eligible, anchorId),
              anchorId,
            })
          }
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            bgcolor: '#8b6cbc',
            '&:hover': { bgcolor: '#7a5aad' },
          }}
        >
          {t('researcher.integrity_compare_start', 'Start comparison')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
