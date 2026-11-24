'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Assignment as ProjectIcon,
  AttachFile as AttachIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Description as FileIcon,
  Edit as EditIcon,
  Gavel as EthicsIcon,
  Home as HomeIcon,
  Print as PrintIcon,
  RateReview as ReviewIcon,
  UploadFile as UploadedIcon,
  Visibility as PreviewIcon,
  WarningAmber as WarningIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import SafeHtml from '@/components/common/SafeHtml';
import StatusPill, { humanizeStatus } from '@/components/common/StatusPill';
import InlineDocumentPreview from '@/components/common/InlineDocumentPreview';
import ProposalDocumentPreviewModal from '@/components/Proposals/ProposalDocumentPreviewModal';

const PURPLE = '#8b6cbc';
const INK = '#1e293b';
const cardSx = { p: { xs: 2, md: 2.5 }, borderRadius: 2.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none' };
const whiteBtn = { bgcolor: 'white', color: PURPLE, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#f5f5f5' } };
const ghostBtn = { color: 'white', borderColor: 'rgba(255,255,255,0.6)', textTransform: 'none', fontWeight: 700, '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } };
const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null);
const STATUS_TONE = { DRAFT: 'neutral', SUBMITTED: 'info', UNDER_REVIEW: 'progress', APPROVED: 'success', CONDITIONAL_APPROVAL: 'success', REJECTED: 'danger', REVISION_REQUESTED: 'warning', WITHDRAWN: 'neutral', EXPIRED: 'danger' };
const RISK_TONE = { MINIMAL: 'success', LOW: 'success', MODERATE: 'warning', HIGH: 'danger' };
const docName = (d, i = 0) => d?.originalName || d?.name || d?.fileName || `Document ${i + 1}`;
const docUrl = (d, appId) => {
  if (d?.url) return d.url;
  if (d?.fileId) return `/api/files/${d.fileId}`;
  const stored = d?.fileName || d?.originalName || d?.name;
  return stored ? `/api/ethics/applications/${appId}/file?name=${encodeURIComponent(stored)}` : null;
};
const isCertificate = (app) => app?.source === 'EXTERNAL_CERTIFICATE' || (app?.documents || []).some((d) => d?.type === 'Ethics Clearance Certificate' || d?.source === 'EXTERNAL_CERTIFICATE');

function clearance(app, now = new Date()) {
  const expiry = app.expiryDate ? new Date(app.expiryDate) : null;
  const days = expiry ? Math.ceil((expiry - now) / 86400000) : null;
  const s = app.status;
  if (s === 'EXPIRED' || (days !== null && days < 0 && (s === 'APPROVED' || s === 'CONDITIONAL_APPROVAL'))) return { look: 'bad', title: 'Approval expired', text: `Expired on ${fmt(expiry)}. Work with participants must pause until it is renewed.` };
  if (s === 'APPROVED' || s === 'CONDITIONAL_APPROVAL') {
    const label = s === 'CONDITIONAL_APPROVAL' ? 'Conditionally approved' : 'Approved';
    if (days !== null && days <= 60) return { look: 'warn', title: `${label} · expires in ${days} day${days === 1 ? '' : 's'}`, text: `Valid until ${fmt(expiry)}. Ask the researcher to start the renewal.` };
    return { look: 'ok', title: label, text: expiry ? `Valid until ${fmt(expiry)}${days !== null ? ` (${Math.round(days / 30)} months left)` : ''}.` : 'No expiry date recorded.' };
  }
  if (s === 'REJECTED') return { look: 'bad', title: 'Not approved', text: 'The ethics committee did not approve this study.' };
  if (s === 'REVISION_REQUESTED') return { look: 'warn', title: 'Revision requested', text: 'Waiting for the researcher to revise and resubmit.' };
  if (s === 'SUBMITTED' || s === 'UNDER_REVIEW') return { look: 'info', title: s === 'SUBMITTED' ? 'Submitted, waiting for review' : 'Under review', text: 'No decision yet.' };
  return { look: 'none', title: humanizeStatus(s), text: '' };
}
const LOOK = {
  ok: { color: '#15803d', bg: '#f0fdf4', border: '#86efac', icon: <CheckIcon /> },
  warn: { color: '#b45309', bg: '#fffbeb', border: '#fcd34d', icon: <WarningIcon /> },
  bad: { color: '#b91c1c', bg: '#fef2f2', border: '#fca5a5', icon: <CloseIcon /> },
  info: { color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd', icon: <ReviewIcon /> },
  none: { color: '#475569', bg: '#f8fafc', border: '#cbd5e1', icon: <EthicsIcon /> },
};

function Fact({ label, value, mono }) {
  if (!value) return null;
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.66rem' }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 700, color: INK, fontFamily: mono ? 'monospace' : undefined, wordBreak: 'break-word' }}>{value}</Typography>
    </Box>
  );
}

function Section({ title, value, children }) {
  if (!children && !value) return null;
  return (
    <Box sx={{ py: 1.75, '&:not(:last-of-type)': { borderBottom: '1px solid', borderColor: 'divider' } }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: INK, mb: 0.75 }}>{title}</Typography>
      {children || <SafeHtml value={value} collapsedHeight={220} />}
    </Box>
  );
}

const YesNo = ({ value, goodWhenYes = true }) => <StatusPill label={value ? 'Yes' : 'No'} tone={value === goodWhenYes ? 'success' : value ? 'warning' : 'neutral'} dot={false} />;

/**
 * Ethics record: clearance status up front, the certificate itself (uploaded
 * clearances) or the application in readable sections, documents with preview,
 * reviews and linked projects. Shared by the research office
 * (/institution/ethics/review/[id]) and researchers (/researcher/ethics/applications/view/[id]).
 */
export default function EthicsRecordView({ audience = 'institution' }) {
  const router = useRouter();
  const params = useParams();
  const researcher = audience === 'researcher';
  const listPath = researcher ? '/researcher/ethics/applications' : '/institution/ethics/applications';
  const projectPath = (id) => (researcher ? `/researcher/projects/proposals/view/${id}` : `/institution/projects/${id}`);
  const [app, setApp] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('study');
  const [preview, setPreview] = useState(null);

  const load = useCallback(async () => {
    try {
      setError('');
      const res = await fetch(`/api/ethics/applications/${params.id}`, { credentials: 'include' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Ethics record not found');
      setApp(json.application);
    } catch (err) {
      setError(err.message);
    }
  }, [params.id]);
  useEffect(() => { if (params.id) load(); }, [params.id, load]);

  const docs = useMemo(() => (app?.documents || []).map((d, i) => ({ ...d, displayName: docName(d, i), href: docUrl(d, app.id) })), [app]);
  const crumbs = researcher
    ? [{ label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/researcher' }, { label: 'My ethics applications', path: listPath }]
    : [{ label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/institution' }, { label: 'Ethics register', path: listPath }];

  if (!app) {
    return (
      <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
        <PageHeader compact title="Ethics record" icon={<EthicsIcon sx={{ fontSize: 28 }} />} breadcrumbs={crumbs} />
        <Container maxWidth={false} sx={{ py: 4, maxWidth: '1600px', mx: 'auto' }}>
          {error ? (
            <Stack spacing={2} alignItems="flex-start">
              <Alert severity="error" action={<Button size="small" onClick={load}>Retry</Button>}>{error}</Alert>
              <Button startIcon={<BackIcon />} onClick={() => router.push(listPath)} sx={{ textTransform: 'none', fontWeight: 700, color: PURPLE }}>Back to the ethics register</Button>
            </Stack>
          ) : <Box sx={{ py: 10, textAlign: 'center' }}><CircularProgress sx={{ color: PURPLE }} /></Box>}
        </Container>
      </Box>
    );
  }

  const cert = isCertificate(app);
  const certDoc = docs.find((d) => d.type === 'Ethics Clearance Certificate' || d.source === 'EXTERNAL_CERTIFICATE') || (cert ? docs[0] : null);
  const state = clearance(app);
  const look = LOOK[state.look];
  const canReview = !researcher && !cert && (app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW');
  const canEdit = researcher && !cert && (app.status === 'DRAFT' || app.status === 'REVISION_REQUESTED');
  const projects = (app.linkedProposals || []).filter((l) => l.proposal);
  const headerChip = { height: 24, fontWeight: 600, bgcolor: 'rgba(255,255,255,0.18)', color: 'white', border: '1px solid rgba(255,255,255,0.28)', '& .MuiChip-icon': { color: 'white', fontSize: 15 } };

  const tabs = [
    { id: 'study', label: 'Study' },
    { id: 'participants', label: 'Participants' },
    { id: 'risk', label: 'Risks & benefits' },
    { id: 'consent', label: 'Consent' },
    { id: 'data', label: 'Data protection' },
  ];

  const sidebar = (
    <Stack spacing={2.5} sx={{ minWidth: 0 }}>
      <Paper sx={cardSx}>
        <Typography sx={{ fontWeight: 800, color: INK, mb: 1.5 }}>Linked projects</Typography>
        {projects.length ? (
          <Stack spacing={1}>
            {projects.map((l) => (
              <Stack key={l.proposal.id} direction="row" spacing={1.25} alignItems="center" onClick={() => router.push(projectPath(l.proposal.id))} sx={{ p: 1.25, borderRadius: 1.5, border: '1px solid', borderColor: 'divider', cursor: 'pointer', '&:hover': { borderColor: PURPLE, bgcolor: alpha(PURPLE, 0.03) } }}>
                <ProjectIcon sx={{ color: PURPLE, fontSize: 20 }} />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: INK, display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' }}>{l.proposal.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{humanizeStatus(l.proposal.status)}{l.proposal.endDate ? ` · ends ${fmt(l.proposal.endDate)}` : ''}</Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        ) : <Typography variant="body2" color="text.secondary">Not linked to a project yet.</Typography>}
      </Paper>

      {docs.length && !(cert && docs.length === 1) ? (
        <Paper sx={cardSx}>
          <Typography sx={{ fontWeight: 800, color: INK, mb: 1.5 }}>Documents ({docs.length})</Typography>
          <Stack spacing={0.75}>
            {docs.map((d, i) => (
              <Stack key={`${d.displayName}-${i}`} direction="row" spacing={1} alignItems="center" sx={{ p: 1, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                <FileIcon sx={{ color: PURPLE, fontSize: 20 }} />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap title={d.displayName}>{d.displayName}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap component="div">{[d.type, d.uploadedAt ? fmt(d.uploadedAt) : null].filter(Boolean).join(' · ')}</Typography>
                </Box>
                <Tooltip title="Preview"><span><Button size="small" disabled={!d.href} onClick={() => setPreview({ ...d, url: d.href, name: d.displayName })} sx={{ minWidth: 0, color: PURPLE }}><PreviewIcon fontSize="small" /></Button></span></Tooltip>
              </Stack>
            ))}
          </Stack>
        </Paper>
      ) : null}

      {!cert ? (
        <Paper sx={cardSx}>
          <Typography sx={{ fontWeight: 800, color: INK, mb: 1.5 }}>Reviews ({(app.reviews || []).length})</Typography>
          {(app.reviews || []).length ? (
            <Stack spacing={1.25}>
              {app.reviews.map((r, i) => (
                <Box key={r.id || i} sx={{ p: 1.5, borderRadius: 1.5, bgcolor: '#f8fafc', border: '1px solid', borderColor: 'divider' }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Avatar sx={{ width: 26, height: 26, fontSize: '0.7rem', bgcolor: PURPLE }}>{String(r.reviewerName || '?').slice(0, 1).toUpperCase()}</Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>{r.reviewerName || 'Reviewer'}</Typography>
                      <Typography variant="caption" color="text.secondary">{[r.reviewerRole, fmt(r.reviewDate || r.createdAt)].filter(Boolean).join(' · ')}</Typography>
                    </Box>
                    {r.decision ? <StatusPill label={humanizeStatus(r.decision)} tone={STATUS_TONE[r.decision] || 'progress'} /> : null}
                  </Stack>
                  {r.overallComments ? <Typography variant="body2" sx={{ color: '#334155', mt: 0.75 }}>{r.overallComments}</Typography> : null}
                  {r.recommendations ? <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>Recommendations: {r.recommendations}</Typography> : null}
                </Box>
              ))}
            </Stack>
          ) : <Typography variant="body2" color="text.secondary">{canReview ? 'No reviews yet. Use “Review application” to record one.' : researcher && (app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW') ? 'The committee has not recorded a review yet.' : 'No reviews recorded.'}</Typography>}
        </Paper>
      ) : null}
    </Stack>
  );

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', '@media print': { bgcolor: 'white' } }}>
      <PageHeader
        compact
        clampTitle
        title={app.title}
        crumbLabel="Ethics record"
        description={`PI: ${app.principalInvestigator || 'not set'}${app.department ? ` · ${app.department}` : ''}`}
        meta={(
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            <StatusPill label={humanizeStatus(app.status)} tone={STATUS_TONE[app.status] || 'neutral'} />
            <Chip size="small" icon={cert ? <UploadedIcon /> : <EthicsIcon />} label={cert ? 'Uploaded clearance certificate' : 'Full application in Hospitium'} sx={headerChip} />
            {app.referenceNumber ? <Chip size="small" label={app.referenceNumber} sx={{ ...headerChip, fontFamily: 'monospace' }} /> : null}
          </Stack>
        )}
        icon={<EthicsIcon sx={{ fontSize: 28 }} />}
        breadcrumbs={crumbs}
        actionButton={(
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button variant="contained" startIcon={<BackIcon />} onClick={() => router.back()} sx={whiteBtn}>Back</Button>
            {canEdit ? <Button variant="outlined" startIcon={<EditIcon />} onClick={() => router.push(`/researcher/ethics/applications/edit/${app.id}`)} sx={ghostBtn}>Edit application</Button> : null}
            {canReview ? <Button variant="outlined" startIcon={<ReviewIcon />} onClick={() => router.push(`/institution/ethics/review/${app.id}/review`)} sx={ghostBtn}>Review application</Button> : null}
            <Tooltip title="Print"><Button variant="outlined" onClick={() => window.print()} sx={{ ...ghostBtn, minWidth: 0, px: 1.25 }}><PrintIcon fontSize="small" /></Button></Tooltip>
          </Stack>
        )}
      />

      <Container maxWidth={false} sx={{ py: 3, maxWidth: '1600px', mx: 'auto' }}>
        <Stack spacing={2.5}>
          {/* Clearance at a glance */}
          <Paper sx={{ ...cardSx, bgcolor: look.bg, borderColor: look.border, borderLeft: `5px solid ${look.color}` }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} alignItems={{ md: 'center' }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 260 }}>
                <Avatar sx={{ bgcolor: look.color, width: 44, height: 44 }}>{look.icon}</Avatar>
                <Box>
                  <Typography sx={{ fontWeight: 800, color: look.color, lineHeight: 1.25 }}>{state.title}</Typography>
                  {state.text ? <Typography variant="body2" sx={{ color: '#334155' }}>{state.text}</Typography> : null}
                </Box>
              </Stack>
              <Box sx={{ flex: 1, display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, minmax(0,1fr))', lg: 'repeat(5, minmax(0,1fr))' } }}>
                <Fact label="Committee" value={app.committeeName} />
                <Fact label="Reference" value={app.referenceNumber} mono />
                <Fact label="Approved" value={fmt(app.approvalDate)} />
                <Fact label="Valid until" value={fmt(app.expiryDate)} />
                <Fact label={cert ? 'Uploaded' : 'Submitted'} value={fmt(cert ? certDoc?.uploadedAt || app.createdAt : app.submittedDate)} />
              </Box>
            </Stack>
            {app.approvalConditions ? (
              <Alert severity="warning" icon={<WarningIcon />} sx={{ mt: 2, bgcolor: 'white' }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>Approval conditions{app.conditionsMet ? ' (met)' : ''}</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{app.approvalConditions}</Typography>
              </Alert>
            ) : null}
          </Paper>

          <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 360px' }, alignItems: 'start' }}>
            {cert ? (
              <Paper sx={cardSx}>
                <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
                  <UploadedIcon sx={{ color: PURPLE }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 800, color: INK }}>Clearance certificate</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Issued by {app.committeeName || 'an external ethics committee'} and uploaded {researcher ? 'by you' : 'by the researcher'}. The review happened outside Hospitium, so there is no application form or internal review.
                    </Typography>
                  </Box>
                </Stack>
                {certDoc ? <InlineDocumentPreview url={certDoc.href} name={certDoc.displayName} mimeType={certDoc.mimeType} height={760} /> : <Alert severity="warning">The certificate file is missing from this record.</Alert>}
              </Paper>
            ) : (
              <Paper sx={{ ...cardSx, p: 0, overflow: 'hidden' }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ px: 1.5, borderBottom: '1px solid', borderColor: 'divider', '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, minHeight: 50 }, '& .Mui-selected': { color: `${PURPLE} !important` }, '& .MuiTabs-indicator': { bgcolor: PURPLE, height: 3 } }}>
                  {tabs.map((t) => <Tab key={t.id} value={t.id} label={t.label} />)}
                </Tabs>
                <Box sx={{ px: { xs: 2, md: 3 }, py: 1 }}>
                  {tab === 'study' ? (
                    <>
                      <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap sx={{ py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Fact label="Research type" value={app.researchType} />
                        <Fact label="Study duration" value={app.studyDuration} />
                        <Fact label="Department" value={app.department} />
                      </Stack>
                      <Section title="Summary" value={app.researchSummary} />
                      <Section title="Objectives" value={app.researchObjectives} />
                      <Section title="Methodology" value={app.methodology} />
                    </>
                  ) : null}
                  {tab === 'participants' ? (
                    <>
                      <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap sx={{ py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Fact label="Sample size" value={app.participantCount ? String(app.participantCount) : null} />
                        <Fact label="Age range" value={app.ageRange} />
                        <Box><Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.66rem' }}>Vulnerable groups</Typography><YesNo value={app.vulnerablePopulations} goodWhenYes={false} /></Box>
                      </Stack>
                      <Section title="Population" value={app.participantPopulation} />
                      <Section title="Inclusion criteria" value={app.inclusionCriteria} />
                      <Section title="Exclusion criteria" value={app.exclusionCriteria} />
                      <Section title="Recruitment" value={app.recruitmentMethod} />
                      {app.vulnerablePopulations ? <Section title="Vulnerable groups and safeguards" value={app.vulnerablePopulationDesc} /> : null}
                    </>
                  ) : null}
                  {tab === 'risk' ? (
                    <>
                      <Box sx={{ py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.66rem', mb: 0.5 }}>Risk level</Typography>
                        <StatusPill label={humanizeStatus(app.riskLevel)} tone={RISK_TONE[app.riskLevel] || 'neutral'} />
                      </Box>
                      <Section title="Potential risks" value={app.potentialRisks} />
                      <Section title="Mitigation" value={app.riskMitigation} />
                      <Section title="Potential benefits" value={app.potentialBenefits} />
                      <Section title="Risk–benefit assessment" value={app.riskBenefitRatio} />
                    </>
                  ) : null}
                  {tab === 'consent' ? (
                    <>
                      <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap sx={{ py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
                        {[['Consent form attached', app.consentFormAttached, true], ['Information sheet attached', app.informationSheetAttached, true], ['Consent waiver requested', app.consentWaiverRequested, false]].map(([k, v, g]) => (
                          <Box key={k}><Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.66rem', mb: 0.25 }}>{k}</Typography><YesNo value={v} goodWhenYes={g} /></Box>
                        ))}
                      </Stack>
                      <Section title="Consent process" value={app.consentProcess} />
                      {app.consentWaiverRequested ? <Section title="Waiver justification" value={app.consentWaiverJustification} /> : null}
                    </>
                  ) : null}
                  {tab === 'data' ? (
                    <>
                      <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap sx={{ py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Fact label="Retention period" value={app.dataRetentionPeriod} />
                        <Box><Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.66rem', mb: 0.25 }}>Anonymised</Typography><YesNo value={app.dataAnonymization} /></Box>
                      </Stack>
                      <Section title="Data collection" value={app.dataCollectionMethods} />
                      <Section title="Storage" value={app.dataStorageMethods} />
                      <Section title="Security measures" value={app.dataSecurityMeasures} />
                      <Section title="Data sharing" value={app.dataSharingPlans} />
                    </>
                  ) : null}
                </Box>
                {!docs.length ? (
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 3, py: 1.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: '#fafafa' }}>
                    <AttachIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                    <Typography variant="caption" color="text.secondary">No supporting documents uploaded.</Typography>
                  </Stack>
                ) : null}
              </Paper>
            )}
            {sidebar}
          </Box>
        </Stack>
      </Container>

      <ProposalDocumentPreviewModal open={Boolean(preview)} file={preview} onClose={() => setPreview(null)} title={preview?.name || 'Document preview'} />
    </Box>
  );
}
