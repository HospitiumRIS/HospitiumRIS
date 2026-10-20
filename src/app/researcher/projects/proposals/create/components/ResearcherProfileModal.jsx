'use client';

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Link,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  CheckBox as CheckedIcon,
  CheckBoxOutlineBlank as UncheckedIcon,
  Close as CloseIcon,
  Email as EmailIcon,
  OpenInNew as OpenInNewIcon,
  PersonAdd as PersonAddIcon,
  Business as InstitutionIcon,
} from '@mui/icons-material';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
} from '../../../../../../components/GlobalAdmin/InstitutionModalShell';
import { researcherIdDisplay } from '../../../../../../lib/researcher-ids';
import {
  PURPLE,
  ResearcherAvatar,
  displayName,
  outlinedButtonSx,
  primaryButtonSx,
} from './researcherDisplay';

const BIO_PREVIEW_CHARS = 420;
const MAX_TAGS = 12;

function SectionTitle({ children }) {
  return (
    <Typography
      variant="overline"
      sx={{ fontWeight: 800, color: '#64748b', letterSpacing: 0.6, lineHeight: 1.6, display: 'block', mb: 0.75 }}
    >
      {children}
    </Typography>
  );
}

function Metric({ label, value }) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        p: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: alpha(PURPLE, 0.2),
        bgcolor: alpha(PURPLE, 0.04),
        textAlign: 'center',
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 800, color: PURPLE, lineHeight: 1.1 }}>
        {value ?? '—'}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}

function TagList({ items }) {
  const list = (items || []).filter(Boolean);
  if (!list.length) return null;
  const extra = list.length - MAX_TAGS;
  return (
    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
      {list.slice(0, MAX_TAGS).map((item) => (
        <Chip key={item} size="small" label={item} sx={{ fontWeight: 600, bgcolor: alpha(PURPLE, 0.08), color: '#4c3a73' }} />
      ))}
      {extra > 0 ? <Chip size="small" label={`+${extra} more`} variant="outlined" /> : null}
    </Stack>
  );
}

function LoadingState() {
  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Skeleton variant="rounded" width={64} height={64} />
        <Box sx={{ flex: 1 }}>
          <Skeleton width="45%" height={28} />
          <Skeleton width="65%" />
        </Box>
      </Stack>
      <Stack direction="row" spacing={1.5}>
        {[0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={64} sx={{ flex: 1 }} />)}
      </Stack>
      <Skeleton variant="rounded" height={90} />
      <Skeleton variant="rounded" height={120} />
    </Stack>
  );
}

/**
 * Summary of a colleague's Hospitium research profile, with Add / Dismiss actions.
 */
export default function ResearcherProfileModal({
  open,
  userId,
  onClose,
  onAdd,
  roleLabel = 'investigator',
  isTaken = () => false,
  selectable = false,
  isSelectable = () => false,
  isSelected = () => false,
  onToggle = () => {},
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFullBio, setShowFullBio] = useState(false);

  useEffect(() => {
    if (!open || !userId) return undefined;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setData(null);
    setShowFullBio(false);

    fetch(`/api/researcher/institution-directory/${encodeURIComponent(userId)}`, { signal: controller.signal })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json.error || 'Failed to load profile.');
        setData(json);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err.message || 'Failed to load profile.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [open, userId]);

  const researcher = data?.researcher;
  const profile = data?.profile;
  const taken = researcher ? isTaken(researcher) : false;
  const selected = researcher ? isSelected(researcher) : false;
  const canSelect = Boolean(selectable && researcher && (selected || isSelectable(researcher)));
  const bio = profile?.biography || '';
  const bioTruncated = bio.length > BIO_PREVIEW_CHARS && !showFullBio;

  return (
    <InstitutionModal open={open} onClose={onClose} maxWidth="md">
      <Box
        sx={{
          px: 3,
          pt: 2.5,
          pb: 2,
          display: 'flex',
          gap: 2,
          alignItems: 'flex-start',
          background: `linear-gradient(135deg, ${alpha(PURPLE, 0.16)} 0%, ${alpha(PURPLE, 0.03)} 100%)`,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        {researcher ? (
          <ResearcherAvatar researcher={researcher} size={64} />
        ) : (
          <Skeleton variant="rounded" width={64} height={64} animation={loading ? 'pulse' : false} />
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.25, color: '#1e293b' }}>
            {researcher ? displayName(researcher) : loading ? <Skeleton width={220} /> : 'Researcher profile'}
          </Typography>
          {profile ? (
            <Typography variant="body2" color="text.secondary">
              {[profile.academicTitle, profile.department].filter(Boolean).join(' · ') || 'Researcher'}
            </Typography>
          ) : null}
          {researcher ? (
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
              <Chip
                size="small"
                icon={<InstitutionIcon sx={{ fontSize: '15px !important' }} />}
                label={researcher.institution}
                sx={{ height: 24, fontWeight: 600 }}
              />
              <Chip
                size="small"
                icon={<EmailIcon sx={{ fontSize: '15px !important' }} />}
                label={researcher.email}
                component="a"
                href={`mailto:${researcher.email}`}
                clickable
                sx={{ height: 24, fontWeight: 600, maxWidth: 280 }}
              />
              {researcher.orcidId ? (
                <Chip
                  size="small"
                  label={`ORCID ${researcher.orcidId}`}
                  component="a"
                  href={`https://orcid.org/${researcher.orcidId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  clickable
                  sx={{ height: 24, fontWeight: 700, bgcolor: alpha('#a6ce39', 0.18), color: '#4d6b0c' }}
                />
              ) : null}
            </Stack>
          ) : null}
        </Box>
        <IconButton aria-label="Close" size="small" onClick={onClose} sx={{ mt: -0.5, mr: -0.5, color: 'text.secondary' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <InstitutionModalBody>
        {error ? <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert> : null}
        {loading && !data ? <LoadingState /> : null}

        {profile ? (
          <>
            <Stack direction="row" spacing={1.5}>
              <Metric label="Publications" value={profile.publicationCount} />
              <Metric label="h-index" value={profile.hIndex} />
              <Metric label="Citations" value={profile.citationCount?.toLocaleString?.() ?? profile.citationCount} />
            </Stack>

            {profile.researchInterests ? (
              <Box>
                <SectionTitle>Research interests</SectionTitle>
                <Typography variant="body2" sx={{ color: '#334155', whiteSpace: 'pre-line' }}>
                  {profile.researchInterests}
                </Typography>
              </Box>
            ) : null}

            {profile.specialization?.length || profile.keywords?.length ? (
              <Box>
                <SectionTitle>Expertise</SectionTitle>
                <Stack spacing={1}>
                  <TagList items={profile.specialization} />
                  <TagList items={profile.keywords} />
                </Stack>
              </Box>
            ) : null}

            {bio ? (
              <Box>
                <SectionTitle>Biography</SectionTitle>
                <Typography variant="body2" sx={{ color: '#334155', whiteSpace: 'pre-line' }}>
                  {bioTruncated ? `${bio.slice(0, BIO_PREVIEW_CHARS).trim()}…` : bio}
                </Typography>
                {bio.length > BIO_PREVIEW_CHARS ? (
                  <Button
                    size="small"
                    onClick={() => setShowFullBio((v) => !v)}
                    sx={{ textTransform: 'none', color: PURPLE, fontWeight: 700, px: 0, mt: 0.5 }}
                  >
                    {showFullBio ? 'Show less' : 'Read more'}
                  </Button>
                ) : null}
              </Box>
            ) : null}

            <Box>
              <SectionTitle>Recent publications</SectionTitle>
              {profile.recentPublications?.length ? (
                <Stack divider={<Divider flexItem />} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                  {profile.recentPublications.map((pub) => (
                    <Box key={pub.id} sx={{ px: 1.75, py: 1.25, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                          {pub.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {[pub.journal, pub.year, pub.type].filter(Boolean).join(' · ')}
                          {pub.isCorresponding ? ' · Corresponding author' : ''}
                        </Typography>
                      </Box>
                      {pub.doi ? (
                        <Tooltip title="Open DOI">
                          <IconButton
                            size="small"
                            component="a"
                            href={`https://doi.org/${pub.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ color: PURPLE }}
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : null}
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No publications linked to this profile yet.
                </Typography>
              )}
            </Box>

            {profile.researcherIds?.length || profile.website || profile.linkedin ? (
              <Box>
                <SectionTitle>Profiles</SectionTitle>
                <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                  {profile.researcherIds.map((entry) => {
                    const info = researcherIdDisplay(entry);
                    return (
                      <Link key={`${entry.type}-${entry.value}`} href={info.url} target="_blank" rel="noopener noreferrer" variant="body2" sx={{ color: PURPLE, fontWeight: 600 }}>
                        {info.label}
                      </Link>
                    );
                  })}
                  {profile.website ? (
                    <Link href={profile.website} target="_blank" rel="noopener noreferrer" variant="body2" sx={{ color: PURPLE, fontWeight: 600 }}>
                      Website
                    </Link>
                  ) : null}
                  {profile.linkedin ? (
                    <Link href={profile.linkedin} target="_blank" rel="noopener noreferrer" variant="body2" sx={{ color: PURPLE, fontWeight: 600 }}>
                      LinkedIn
                    </Link>
                  ) : null}
                </Stack>
              </Box>
            ) : null}
          </>
        ) : null}
      </InstitutionModalBody>

      <InstitutionModalFooter>
        <Button onClick={onClose} sx={{ textTransform: 'none', color: '#64748b', mr: 'auto' }}>
          Dismiss
        </Button>
        {canSelect ? (
          <Button
            variant="outlined"
            startIcon={selected ? <CheckedIcon /> : <UncheckedIcon />}
            onClick={() => { onToggle(researcher); onClose(); }}
            sx={outlinedButtonSx}
          >
            {selected ? 'Remove from selection' : 'Add to selection'}
          </Button>
        ) : null}
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          disabled={!researcher || taken}
          onClick={() => researcher && onAdd(researcher)}
          sx={primaryButtonSx}
        >
          {taken ? 'Already added' : `Add as ${roleLabel}`}
        </Button>
      </InstitutionModalFooter>
    </InstitutionModal>
  );
}
