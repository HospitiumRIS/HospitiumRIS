'use client';

import React from 'react';
import Link from 'next/link';
import { Box, Button, IconButton, LinearProgress, Paper, Tooltip, Typography } from '@mui/material';
import {
  CheckCircle as DoneIcon,
  RadioButtonUnchecked as TodoIcon,
  Close as CloseIcon,
  ChevronRight as ChevronRightIcon,
  AccountCircle as ProfileIcon,
} from '@mui/icons-material';

const PURPLE = '#8b6cbc';
const PURPLE_DARK = '#7a5caa';
const INK = '#0f172a';
const MUTED = '#64748b';

function itemHref(item) {
  const params = new URLSearchParams();
  if (item.tab && item.tab !== 'overview') params.set('tab', item.tab);
  if (item.edit) params.set('edit', '1');
  const qs = params.toString();
  return `/researcher/profile${qs ? `?${qs}` : ''}`;
}

/**
 * "Complete your profile" card for the researcher dashboard.
 * completeness: { percent, doneCount, total, items: [{ key, label, done, tab, edit }] }
 */
export default function ProfileChecklistCard({ completeness, onDismiss }) {
  if (!completeness) return null;
  const { percent, doneCount, total, items } = completeness;
  const todo = items.filter((i) => !i.done);
  const done = items.filter((i) => i.done);

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 3,
        borderRadius: 3,
        border: '1px solid rgba(139,108,188,0.25)',
        background: 'linear-gradient(135deg, rgba(139,108,188,0.07) 0%, rgba(255,255,255,1) 55%)',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 4 }, p: { xs: 2.5, md: 3 } }}>
        {/* left: summary */}
        <Box sx={{ flex: '0 0 auto', width: { md: 300 } }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: 'rgba(139,108,188,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ProfileIcon sx={{ color: PURPLE_DARK }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, color: INK, fontSize: '1.02rem', lineHeight: 1.3 }}>Complete your profile</Typography>
                <Typography variant="caption" sx={{ color: MUTED }}>
                  {doneCount} of {total} steps done
                </Typography>
              </Box>
            </Box>
            <Tooltip title="Hide for now">
              <IconButton size="small" onClick={onDismiss} sx={{ display: { xs: 'inline-flex', md: 'none' }, color: MUTED }} aria-label="Hide profile checklist">
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 2 }}>
            <LinearProgress
              variant="determinate"
              value={percent}
              sx={{ flex: 1, height: 8, borderRadius: 4, bgcolor: 'rgba(139,108,188,0.15)', '& .MuiLinearProgress-bar': { bgcolor: PURPLE, borderRadius: 4 } }}
            />
            <Typography sx={{ fontWeight: 800, color: PURPLE_DARK, fontSize: '0.95rem', minWidth: 40, textAlign: 'right' }}>{percent}%</Typography>
          </Box>
          <Typography variant="body2" sx={{ color: MUTED, mt: 1.5, fontSize: '0.84rem', lineHeight: 1.6 }}>
            A complete profile pulls in your publications and citations, and helps collaborators and administrators find you.
          </Typography>
          <Button
            component={Link}
            href={itemHref(todo[0] || { tab: 'overview' })}
            variant="contained"
            size="small"
            sx={{ mt: 2, bgcolor: PURPLE, '&:hover': { bgcolor: PURPLE_DARK }, textTransform: 'none', fontWeight: 700 }}
          >
            Continue setup
          </Button>
        </Box>

        {/* right: steps */}
        <Box sx={{ flex: 1, minWidth: 0, position: 'relative' }}>
          <Tooltip title="Hide for now">
            <IconButton
              size="small"
              onClick={onDismiss}
              sx={{ position: 'absolute', top: -8, right: -8, display: { xs: 'none', md: 'inline-flex' }, color: MUTED }}
              aria-label="Hide profile checklist"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1, pr: { md: 4 } }}>
            {[...todo, ...done].map((item) => (
              <Box
                key={item.key}
                component={item.done ? 'div' : Link}
                href={item.done ? undefined : itemHref(item)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  px: 1.5,
                  py: 1.25,
                  borderRadius: 2,
                  textDecoration: 'none',
                  bgcolor: item.done ? 'transparent' : 'white',
                  border: `1px solid ${item.done ? 'transparent' : '#e2e8f0'}`,
                  transition: 'border-color .15s, box-shadow .15s',
                  '&:hover': item.done ? {} : { borderColor: PURPLE, boxShadow: '0 1px 4px rgba(139,108,188,0.18)' },
                }}
              >
                {item.done ? <DoneIcon sx={{ fontSize: 20, color: '#15803d' }} /> : <TodoIcon sx={{ fontSize: 20, color: '#cbd5e1' }} />}
                <Typography
                  sx={{
                    flex: 1,
                    fontSize: '0.86rem',
                    color: item.done ? '#94a3b8' : INK,
                    textDecoration: item.done ? 'line-through' : 'none',
                    fontWeight: item.done ? 400 : 500,
                  }}
                >
                  {item.label}
                </Typography>
                {!item.done && <ChevronRightIcon sx={{ fontSize: 18, color: '#94a3b8' }} />}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
