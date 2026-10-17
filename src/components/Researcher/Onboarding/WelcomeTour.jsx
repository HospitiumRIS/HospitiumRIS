'use client';

import React, { useEffect, useState } from 'react';
import { Box, Button, IconButton, Typography } from '@mui/material';
import {
  AutoAwesome as WelcomeIcon,
  Assignment as ProjectsIcon,
  MenuBook as PublicationsIcon,
  VerifiedUser as ComplianceIcon,
  AccountCircle as ProfileIcon,
  CheckCircle as CheckIcon,
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { InstitutionModal } from '../../GlobalAdmin/InstitutionModalShell';

const PURPLE = '#8b6cbc';
const PURPLE_DARK = '#7a5caa';
const INK = '#0f172a';
const MUTED = '#64748b';

const SLIDES = [
  {
    key: 'welcome',
    icon: WelcomeIcon,
    eyebrow: 'Welcome',
    title: 'Your research, all in one place',
    body: 'HospitiumRIS brings your projects, publications and compliance work together, so you spend less time on admin and more on research.',
    points: ['Plan and track projects end to end', 'Write and publish with collaborators', 'Stay on top of ethics and training'],
  },
  {
    key: 'projects',
    icon: ProjectsIcon,
    eyebrow: 'Projects & proposals',
    title: 'From idea to funded project',
    body: 'Draft proposals with budgets and milestones, submit them for institutional review, and follow every grant you apply for.',
    points: ['Proposal builder with budgets', 'Review status and feedback in one view', 'Grant tracker for deadlines and outcomes'],
  },
  {
    key: 'publications',
    icon: PublicationsIcon,
    eyebrow: 'Publications & collaboration',
    title: 'Write together, publish with confidence',
    body: 'Import your existing work, co-write manuscripts in real time with comments and tracked changes, and manage citations as you go.',
    points: ['Import from ORCID, Mendeley, Zotero and more', 'Collaborative editor with version history', 'Built-in citation library'],
  },
  {
    key: 'compliance',
    icon: ComplianceIcon,
    eyebrow: 'Compliance',
    title: 'Ethics, integrity and training — handled',
    body: 'Submit ethics applications, run image-integrity checks before you publish, and keep your training and certificates up to date.',
    points: ['Ethics applications and approvals', 'Image integrity screening', 'Training courses and certificates'],
  },
  {
    key: 'profile',
    icon: ProfileIcon,
    eyebrow: 'Your profile',
    title: 'Let colleagues find your work',
    body: 'A complete profile pulls in your publications and citation metrics from ORCID and helps collaborators and administrators find you.',
    points: ['Add a photo and your role', 'Connect ORCID and other researcher IDs', 'List your areas of expertise'],
  },
];

/**
 * First-login walkthrough for researchers.
 * onFinish(reason): 'skip' | 'done' | 'setup-profile'
 */
export default function WelcomeTour({ open, userName, onFinish }) {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;
  const Icon = slide.icon;

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  // keyboard navigation
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'ArrowRight' && !isLast) setIndex((i) => i + 1);
      if (e.key === 'ArrowLeft' && index > 0) setIndex((i) => i - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, index, isLast]);

  return (
    <InstitutionModal open={open} onClose={() => onFinish?.('skip')} maxWidth="sm">
      <Box sx={{ position: 'relative' }}>
        {/* illustration band */}
        <Box
          sx={{
            position: 'relative',
            height: { xs: 150, sm: 180 },
            background: `linear-gradient(135deg, ${PURPLE_DARK} 0%, ${PURPLE} 55%, #b9a3db 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.14) 1px, transparent 1px)',
              backgroundSize: '18px 18px',
            },
          }}
        >
          <Box sx={{ position: 'absolute', width: 260, height: 260, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)', top: -90, right: -60 }} />
          <Box sx={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)', bottom: -80, left: -40 }} />
          <Box
            key={slide.key}
            sx={{
              position: 'relative',
              width: 84,
              height: 84,
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.18)',
              border: '1px solid rgba(255,255,255,0.35)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'tourPop .35s ease',
              '@keyframes tourPop': { from: { transform: 'scale(.85)', opacity: 0 }, to: { transform: 'scale(1)', opacity: 1 } },
            }}
          >
            <Icon sx={{ fontSize: 44, color: 'white' }} />
          </Box>

          <Button
            onClick={() => onFinish?.('skip')}
            size="small"
            sx={{ position: 'absolute', top: 12, right: 12, color: 'rgba(255,255,255,0.92)', textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' } }}
            endIcon={<CloseIcon sx={{ fontSize: 16 }} />}
          >
            Skip tour
          </Button>
        </Box>

        {/* content */}
        <Box key={`c-${slide.key}`} sx={{ px: { xs: 3, sm: 4.5 }, pt: 3.5, pb: 2, animation: 'tourFade .3s ease', '@keyframes tourFade': { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'none' } } }}>
          <Typography variant="overline" sx={{ color: PURPLE_DARK, fontWeight: 700, letterSpacing: '0.1em' }}>
            {slide.eyebrow} · {index + 1} of {SLIDES.length}
          </Typography>
          <Typography component="h2" sx={{ fontWeight: 800, color: INK, fontSize: { xs: '1.35rem', sm: '1.55rem' }, lineHeight: 1.25, mt: 0.5 }}>
            {index === 0 && userName ? `Welcome, ${userName}!` : slide.title}
          </Typography>
          {index === 0 && userName && (
            <Typography sx={{ color: INK, fontWeight: 600, mt: 0.5 }}>{slide.title}</Typography>
          )}
          <Typography sx={{ color: MUTED, mt: 1.5, lineHeight: 1.7, fontSize: '0.95rem' }}>{slide.body}</Typography>
          <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, mt: 2.5, display: 'flex', flexDirection: 'column', gap: 1.1 }}>
            {slide.points.map((p) => (
              <Box component="li" key={p} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <CheckIcon sx={{ fontSize: 19, color: PURPLE }} />
                <Typography sx={{ color: INK, fontSize: '0.92rem' }}>{p}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* footer */}
        <Box sx={{ px: { xs: 3, sm: 4.5 }, py: 2.5, display: 'flex', alignItems: 'center', gap: 2, borderTop: '1px solid #eef0f4', mt: 2 }}>
          {/* progress dots */}
          <Box sx={{ display: 'flex', gap: 0.75, flex: 1 }} role="tablist" aria-label="Tour progress">
            {SLIDES.map((s, i) => (
              <Box
                key={s.key}
                component="button"
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                aria-selected={i === index}
                onClick={() => setIndex(i)}
                sx={{
                  width: i === index ? 22 : 8,
                  height: 8,
                  borderRadius: 4,
                  border: 0,
                  p: 0,
                  cursor: 'pointer',
                  bgcolor: i === index ? PURPLE : i < index ? '#c9b8e4' : '#e2e8f0',
                  transition: 'all .2s',
                }}
              />
            ))}
          </Box>

          {index > 0 && (
            <IconButton onClick={() => setIndex((i) => i - 1)} aria-label="Previous" sx={{ border: '1px solid #e2e8f0' }}>
              <BackIcon fontSize="small" />
            </IconButton>
          )}

          {isLast ? (
            <>
              <Button onClick={() => onFinish?.('done')} color="inherit" sx={{ textTransform: 'none', fontWeight: 600, display: { xs: 'none', sm: 'inline-flex' } }}>
                Go to dashboard
              </Button>
              <Button
                variant="contained"
                onClick={() => onFinish?.('setup-profile')}
                sx={{ bgcolor: PURPLE, '&:hover': { bgcolor: PURPLE_DARK }, textTransform: 'none', fontWeight: 700, px: 2.5 }}
              >
                Set up my profile
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              endIcon={<NextIcon />}
              onClick={() => setIndex((i) => i + 1)}
              sx={{ bgcolor: PURPLE, '&:hover': { bgcolor: PURPLE_DARK }, textTransform: 'none', fontWeight: 700, px: 2.5 }}
            >
              {index === 0 ? "Let's go" : 'Next'}
            </Button>
          )}
        </Box>
      </Box>
    </InstitutionModal>
  );
}
