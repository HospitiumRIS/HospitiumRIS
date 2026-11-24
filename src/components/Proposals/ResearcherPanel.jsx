'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Avatar, Box, Button, Chip, CircularProgress, Link, Stack, Typography, alpha } from '@mui/material';
import { Email as EmailIcon, OpenInNew as OpenIcon, Person as PersonIcon } from '@mui/icons-material';
import { InstitutionModal, InstitutionModalBody, InstitutionModalFooter, InstitutionModalHeader } from '@/components/GlobalAdmin/InstitutionModalShell';
import { snippet } from '@/lib/safe-html';

const PURPLE = '#8b6cbc';
const initials = (n) => String(n || '?').split(' ').filter(Boolean).map((x) => x[0]).join('').slice(0, 2).toUpperCase();
const bareOrcid = (v) => String(v || '').match(/\d{4}-\d{4}-\d{4}-\d{3}[\dX]/i)?.[0]?.toUpperCase() || null;

function Count({ label, value }) {
  return (
    <Box sx={{ flex: 1, p: 1.25, borderRadius: 1.5, bgcolor: alpha(PURPLE, 0.06), textAlign: 'center' }}>
      <Typography sx={{ fontWeight: 800, color: PURPLE, fontSize: '1.2rem' }}>{value ?? 0}</Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Box>
  );
}

/**
 * Right-side panel with a snippet of a team member's profile (#review-page-v2).
 * `person`: { name, role, userId, orcidId, email, affiliation }. When `summaryUrl(userId)`
 * is given the panel loads the researcher's profile and output counts; people who are
 * not on Hospitium (or outside the institution) show what the proposal records.
 */
export default function ResearcherPanel({ open, person, onClose, summaryUrl, profileHref }) {
  const [data, setData] = useState(null);
  const [state, setState] = useState('idle');
  useEffect(() => {
    if (!open || !person?.userId || !summaryUrl) { setData(null); setState('idle'); return undefined; }
    let cancelled = false;
    setState('loading');
    fetch(summaryUrl(person.userId), { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (!cancelled) { setData(j?.success ? j : null); setState(j?.success ? 'ok' : 'missing'); } })
      .catch(() => { if (!cancelled) setState('missing'); });
    return () => { cancelled = true; };
    // summaryUrl is a function prop recreated on each parent render; refetch per person only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, person]);

  if (!person) return null;
  const p = data?.profile;
  const rp = p?.researchProfile;
  const name = p ? `${p.givenName || ''} ${p.familyName || ''}`.trim() || person.name : person.name;
  const orcid = bareOrcid(p?.orcidId || person.orcidId);
  const email = p?.email || person.email;
  const out = data?.output;
  const href = person.userId && profileHref ? profileHref(person.userId) : null;
  const topics = [...(rp?.specialization || []), ...(rp?.keywords || [])].slice(0, 8);

  return (
    <InstitutionModal open={open} onClose={onClose} variant="panel" maxWidth="sm">
      <InstitutionModalHeader icon={PersonIcon} title={name} subtitle={person.role || 'Research team'} onClose={onClose} />
      <InstitutionModalBody>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar src={p?.avatarUrl || undefined} sx={{ width: 64, height: 64, bgcolor: PURPLE, fontSize: '1.3rem', fontWeight: 700 }}>{initials(name)}</Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#1e293b' }}>{[rp?.academicTitle, name].filter(Boolean).join(' ')}</Typography>
              <Typography variant="body2" color="text.secondary">{[rp?.department, p?.primaryInstitution || person.affiliation].filter(Boolean).join(' · ') || person.affiliation || '—'}</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 0.75 }} flexWrap="wrap" useFlexGap>
                {orcid ? <Chip size="small" component="a" clickable href={`https://orcid.org/${orcid}`} target="_blank" rel="noopener noreferrer" label={`ORCID ${orcid}`} sx={{ height: 22, fontWeight: 600, bgcolor: '#f0fdf4', color: '#166534' }} /> : null}
                {email ? <Chip size="small" icon={<EmailIcon />} component="a" clickable href={`mailto:${email}`} label={email} sx={{ height: 22, fontWeight: 600, maxWidth: 260 }} /> : null}
              </Stack>
            </Box>
          </Stack>

          {state === 'loading' ? <Box sx={{ py: 3, textAlign: 'center' }}><CircularProgress size={28} sx={{ color: PURPLE }} /></Box> : null}
          {!person.userId ? <Alert severity="info">Not registered on Hospitium. Details are as recorded on the proposal.</Alert> : null}
          {person.userId && state === 'missing' && summaryUrl ? <Alert severity="info">This person is not a member of your institution, so only the details on the proposal are shown.</Alert> : null}

          {out ? (
            <Stack direction="row" spacing={1}>
              <Count label="Publications" value={out.publications?.total} />
              <Count label="Manuscripts" value={out.manuscripts?.total} />
              <Count label="Proposals" value={out.proposals?.total} />
            </Stack>
          ) : null}

          {rp?.biography ? (
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>About</Typography>
              <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.7 }}>{snippet(rp.biography, 420)}</Typography>
            </Box>
          ) : null}
          {rp?.researchInterests ? (
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Research interests</Typography>
              <Typography variant="body2" sx={{ color: '#334155' }}>{snippet(rp.researchInterests, 240)}</Typography>
            </Box>
          ) : null}
          {topics.length ? (
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {topics.map((t) => <Chip key={t} size="small" label={t} sx={{ fontWeight: 600, bgcolor: '#eef2ff', color: '#4338ca' }} />)}
            </Stack>
          ) : null}
          {rp?.hIndex || rp?.citationCount ? (
            <Typography variant="body2" color="text.secondary">h-index {rp.hIndex ?? '—'} · {rp.citationCount ?? 0} citations</Typography>
          ) : null}
        </Stack>
      </InstitutionModalBody>
      <InstitutionModalFooter>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Close</Button>
        {href ? (
          <Button variant="contained" component={Link} href={href} endIcon={<OpenIcon />} sx={{ textTransform: 'none', fontWeight: 700, bgcolor: PURPLE, color: 'white', '&:hover': { bgcolor: '#7559a8', color: 'white' } }}>Open full profile</Button>
        ) : orcid ? (
          <Button variant="outlined" href={`https://orcid.org/${orcid}`} target="_blank" rel="noopener noreferrer" endIcon={<OpenIcon />} sx={{ textTransform: 'none', fontWeight: 700, color: PURPLE }}>ORCID record</Button>
        ) : null}
      </InstitutionModalFooter>
    </InstitutionModal>
  );
}
