'use client';

import React, { useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  AccountBalanceWallet as BudgetIcon,
  CalendarMonth as CalendarIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Description as FileIcon,
  Flag as MilestoneIcon,
  Gavel as EthicsIcon,
  Groups as TeamIcon,
  Inventory2 as DeliverableIcon,
  OpenInNew as OpenIcon,
  Replay as RevisionIcon,
  UploadFile as UploadedIcon,
  Visibility as PreviewIcon,
  WarningAmber as WarningIcon,
} from '@mui/icons-material';
import SafeHtml from '@/components/common/SafeHtml';
import StatusPill, { humanizeStatus } from '@/components/common/StatusPill';
import ProgressFlow from './ProgressFlow';
import ProposalDocumentPreviewModal from './ProposalDocumentPreviewModal';
import ProposalReviewStatus from './ProposalReviewStatus';
import ResearcherPanel from './ResearcherPanel';
import { PROPOSAL_STATUS_TONE } from './ProposalStatusCell';
import { deliverableFlow, durationMonths, flowSummary, lifecycle, milestoneFlow, timeElapsed } from '@/lib/proposal-progress';
import { isEmptyHtml } from '@/lib/safe-html';

const PURPLE = '#8b6cbc';
const INK = '#1e293b';
const cardSx = { p: { xs: 2, md: 2.5 }, borderRadius: 2.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none' };
const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const money = (v, c = 'USD') => {
  if (v === null || v === undefined || v === '') return null;
  try { return new Intl.NumberFormat('en-GB', { style: 'currency', currency: c || 'USD', maximumFractionDigits: 0 }).format(Number(v)); } catch { return `${c} ${Number(v).toLocaleString()}`; }
};
const initials = (n) => String(n || '?').split(' ').filter(Boolean).map((x) => x[0]).join('').slice(0, 2).toUpperCase();
const fileName = (f) => f?.originalName || f?.fileName || f?.name || 'Document';
const fileHref = (f, ethicsId) => {
  if (f?.url) return f.url;
  if (f?.fileId) return `/api/files/${f.fileId}`;
  const stored = f?.fileName || f?.originalName || f?.name;
  const app = f?.ethicsApplicationId || ethicsId;
  return app && stored ? `/api/ethics/applications/${app}/file?name=${encodeURIComponent(stored)}` : null;
};

function Label({ children }) {
  return <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#64748b', mb: 0.5 }}>{children}</Typography>;
}

function CardTitle({ icon, title, action, subtitle }) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
      {icon ? <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: alpha(PURPLE, 0.1), color: PURPLE, display: 'grid', placeItems: 'center', flexShrink: 0, '& svg': { fontSize: 18 } }}>{icon}</Box> : null}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 800, color: INK, lineHeight: 1.2 }}>{title}</Typography>
        {subtitle ? <Typography variant="caption" color="text.secondary">{subtitle}</Typography> : null}
      </Box>
      {action}
    </Stack>
  );
}

/** Chips for the page header: status, department, funder. */
export function ProposalHeaderMeta({ proposal }) {
  const chip = { height: 24, fontWeight: 600, bgcolor: 'rgba(255,255,255,0.18)', color: 'white', border: '1px solid rgba(255,255,255,0.28)' };
  return (
    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
      <StatusPill label={humanizeStatus(proposal.status)} tone={PROPOSAL_STATUS_TONE[proposal.status] || 'neutral'} />
      {(proposal.departments || []).slice(0, 2).map((d) => <Chip key={d} size="small" label={d} sx={chip} />)}
      {proposal.fundingInstitution || proposal.fundingSource ? <Chip size="small" label={proposal.fundingInstitution || proposal.fundingSource} sx={chip} /> : null}
      {proposal.grantNumber ? <Chip size="small" label={`Grant ${proposal.grantNumber}`} sx={chip} /> : null}
    </Stack>
  );
}

function Lifecycle({ proposal }) {
  const lc = lifecycle(proposal);
  const flag = lc.flag === 'REJECTED' ? { label: 'Not approved', color: '#dc2626', icon: <CloseIcon sx={{ fontSize: 12 }} /> }
    : lc.flag === 'REVISION_REQUESTED' ? { label: 'Revision requested', color: '#d97706', icon: <RevisionIcon sx={{ fontSize: 12 }} /> } : null;
  return (
    <Stack direction="row" alignItems="center" sx={{ flex: 1, minWidth: 280 }} aria-label="Lifecycle">
      {lc.steps.map((s, i) => {
        const current = s.state === 'current';
        const color = current && flag ? flag.color : s.state === 'todo' ? '#cbd5e1' : current ? PURPLE : '#10b981';
        return (
          <React.Fragment key={s.key}>
            <Stack alignItems="center" spacing={0.5} sx={{ minWidth: 56 }}>
              <Box sx={{ width: 20, height: 20, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: s.state === 'todo' ? 'white' : color, border: `2px solid ${color}`, boxShadow: current ? `0 0 0 4px ${alpha(color, 0.18)}` : 'none', color: 'white' }}>
                {s.state === 'done' ? <CheckIcon sx={{ fontSize: 12 }} /> : current && flag ? flag.icon : null}
              </Box>
              <Typography variant="caption" sx={{ fontWeight: current ? 800 : 600, color: s.state === 'todo' ? '#94a3b8' : current ? color : '#334155', whiteSpace: 'nowrap', fontSize: '0.7rem' }}>
                {current && flag ? flag.label : s.label}
              </Typography>
            </Stack>
            {i < lc.steps.length - 1 ? <Box sx={{ flex: 1, height: 2, mb: 2.4, mx: 0.5, borderRadius: 1, bgcolor: lc.steps[i + 1].state === 'todo' ? '#e5e7eb' : '#10b981' }} /> : null}
          </React.Fragment>
        );
      })}
    </Stack>
  );
}

function Stat({ label, value, hint, bar, tone = PURPLE }) {
  return (
    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'white', border: '1px solid', borderColor: 'divider', minWidth: 0 }}>
      <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.66rem' }}>{label}</Typography>
      <Typography sx={{ fontWeight: 800, color: INK, fontSize: '1.05rem', lineHeight: 1.3 }} noWrap>{value}</Typography>
      {bar !== undefined && bar !== null ? (
        <Box sx={{ height: 4, borderRadius: 2, bgcolor: '#eef2f7', mt: 0.75, overflow: 'hidden' }}><Box sx={{ height: '100%', width: `${bar}%`, bgcolor: tone }} /></Box>
      ) : null}
      {hint ? <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', mt: bar !== undefined && bar !== null ? 0.5 : 0.25 }}>{hint}</Typography> : null}
    </Box>
  );
}

const ETHICS_LOOK = {
  ok: { color: '#15803d', bg: '#f0fdf4', border: '#86efac', icon: <CheckIcon /> },
  warn: { color: '#b45309', bg: '#fffbeb', border: '#fcd34d', icon: <WarningIcon /> },
  bad: { color: '#b91c1c', bg: '#fef2f2', border: '#fca5a5', icon: <CloseIcon /> },
  none: { color: '#475569', bg: '#f8fafc', border: '#cbd5e1', icon: <EthicsIcon /> },
};

function ethicsState(app, proposal, now = new Date()) {
  const raw = app?.status || proposal.ethicsApprovalStatus || '';
  const s = String(raw).toUpperCase();
  const expiry = app?.expiryDate ? new Date(app.expiryDate) : null;
  const daysLeft = expiry ? Math.ceil((expiry - now) / 86400000) : null;
  if (!raw) return { look: 'none', label: 'No ethics clearance linked', message: 'Link an ethics approval before the project starts work with participants or their data.' };
  if (s.includes('NOT_REQUIRED') || s.includes('NOT REQUIRED') || s.includes('EXEMPT')) return { look: 'ok', label: 'Ethics review not required', message: 'The study was declared exempt from ethics review.' };
  if (s.includes('REJECT')) return { look: 'bad', label: 'Ethics not approved', message: 'The ethics committee did not approve this study.' };
  if (s === 'EXPIRED' || (daysLeft !== null && daysLeft < 0)) return { look: 'bad', label: 'Ethics approval expired', message: `Expired on ${fmt(expiry)}. Work with participants must pause until it is renewed.` };
  if (s.includes('APPROV')) {
    if (daysLeft !== null && daysLeft <= 60) return { look: 'warn', label: s.includes('CONDITION') ? 'Conditionally approved' : 'Approved', message: `Expires in ${daysLeft} days (${fmt(expiry)}). Plan the renewal now.` };
    return { look: 'ok', label: s.includes('CONDITION') ? 'Conditionally approved' : 'Approved', message: expiry ? `Valid until ${fmt(expiry)}.` : 'Ethics clearance is in place for this study.' };
  }
  return { look: 'warn', label: `Ethics ${humanizeStatus(raw).toLowerCase()}`, message: 'Ethics approval is not in place yet.' };
}

function EthicsClearance({ proposal, ethicsHref, onPreview }) {
  const app = proposal.ethicsLinks?.[0]?.ethicsApplication || null;
  const state = ethicsState(app, proposal);
  const look = ETHICS_LOOK[state.look];
  const uploaded = app?.source === 'EXTERNAL_CERTIFICATE';
  const certs = (proposal.linkedEthicsDocuments || []).map((d) => ({ ...d, ethicsApplicationId: d.ethicsApplicationId || app?.id }));
  const cert = certs[0] || null;
  const facts = [
    ['Committee', app?.committeeName || proposal.ethicsCommittee],
    ['Reference', app?.referenceNumber || proposal.ethicsApprovalReference],
    ['Approved', app?.approvalDate || proposal.approvalDate ? fmt(app?.approvalDate || proposal.approvalDate) : null],
    ['Valid until', app?.expiryDate ? fmt(app.expiryDate) : null],
  ].filter(([, v]) => v);
  return (
    <Paper id="ethics" sx={{ ...cardSx, borderColor: look.border, bgcolor: look.bg, borderLeft: `5px solid ${look.color}` }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ flex: 1, minWidth: 0 }}>
          <Avatar sx={{ bgcolor: look.color, width: 40, height: 40 }}>{look.icon}</Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography sx={{ fontWeight: 800, color: look.color }}>Ethics clearance · {state.label}</Typography>
              {app ? (
                <Chip size="small" icon={uploaded ? <UploadedIcon /> : <EthicsIcon />} label={uploaded ? 'Uploaded certificate' : 'Reviewed in Hospitium'} sx={{ height: 22, fontWeight: 700, bgcolor: 'white', color: '#334155', '& .MuiChip-icon': { fontSize: 15 } }} />
              ) : null}
            </Stack>
            <Typography variant="body2" sx={{ color: '#334155', mt: 0.25 }}>{state.message}</Typography>
            {facts.length ? (
              <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap sx={{ mt: 1.25 }}>
                {facts.map(([k, v]) => (
                  <Box key={k}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.64rem', letterSpacing: '0.05em' }}>{k}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: INK, fontFamily: k === 'Reference' ? 'monospace' : undefined }}>{v}</Typography>
                  </Box>
                ))}
              </Stack>
            ) : null}
          </Box>
        </Stack>
        <Stack direction={{ xs: 'row', md: 'column' }} spacing={1} sx={{ flexShrink: 0 }}>
          {app && ethicsHref ? (
            <Button variant="contained" endIcon={<OpenIcon />} href={ethicsHref(app.id)} sx={{ textTransform: 'none', fontWeight: 700, bgcolor: PURPLE, '&:hover': { bgcolor: '#7559a8' } }}>Open ethics record</Button>
          ) : null}
          {cert && fileHref(cert) ? (
            <Button variant="outlined" startIcon={<PreviewIcon />} onClick={() => onPreview({ ...cert, url: fileHref(cert) })} sx={{ textTransform: 'none', fontWeight: 700, color: PURPLE, borderColor: alpha(PURPLE, 0.5), bgcolor: 'white' }}>
              {uploaded ? 'Preview certificate' : 'Preview approval letter'}
            </Button>
          ) : null}
        </Stack>
      </Stack>
    </Paper>
  );
}

/**
 * The proposal / project page body (#proposal-pages-v2), shared by the research office
 * (/institution/projects/[id]) and researchers (/researcher/projects/proposals/view/[id]).
 */
export default function ProposalOverview({
  proposal,
  tracking = null,
  audience = 'institution',
  ethicsHref,
  budgetHref,
  profileHref,
  profileSummaryUrl,
  canMarkDeliverables = false,
  onDeliverablesChange,
}) {
  const [tab, setTab] = useState('abstract');
  const [preview, setPreview] = useState(null);
  const [personOpen, setPersonOpen] = useState(null);
  const now = useMemo(() => new Date(), []);
  const milestones = useMemo(() => milestoneFlow(proposal.milestones, now), [proposal.milestones, now]);
  const deliverables = useMemo(() => deliverableFlow(proposal.deliverables, proposal.milestones, now), [proposal.deliverables, proposal.milestones, now]);
  const ms = flowSummary(milestones);
  const dl = flowSummary(deliverables);
  const elapsed = timeElapsed(proposal.startDate, proposal.endDate, now);
  const months = durationMonths(proposal.startDate, proposal.endDate);
  const budget = money(proposal.totalBudgetAmount, proposal.budgetCurrency);
  const approved = proposal.status === 'APPROVED';
  const linkedEthicsId = proposal.ethicsLinks?.[0]?.ethicsApplication?.id;

  const sections = [
    { id: 'abstract', label: 'Abstract', value: proposal.abstract },
    { id: 'objectives', label: 'Objectives', value: proposal.researchObjectives },
    { id: 'methodology', label: 'Methodology', value: proposal.methodology },
    { id: 'impact', label: 'Impact', value: proposal.impactStatement },
    { id: 'ethics', label: 'Ethical considerations', value: proposal.ethicalConsiderationsOverview },
    { id: 'publications', label: 'Publication plans', value: proposal.publicationRelevance },
  ].filter((s) => !isEmptyHtml(s.value));
  const activeTab = sections.some((s) => s.id === tab) ? tab : sections[0]?.id;

  const docs = useMemo(() => {
    const seen = new Set();
    const all = [
      ...(proposal.documents || []),
      ...(proposal.ethicsDocuments || []).map((f) => ({ ...f, category: f.category || 'Ethics documents' })),
      ...(proposal.dataManagementPlan || []).map((f) => ({ ...f, category: f.category || 'Data management plan' })),
      ...(proposal.budgetDocuments || []).map((f) => ({ ...f, category: f.category || 'Budget documents' })),
      ...(proposal.otherRelatedFiles || []).map((f) => ({ ...f, category: f.category || 'Supporting files' })),
    ];
    return all.filter((d) => {
      const key = fileHref(d, linkedEthicsId) || fileName(d);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [proposal.documents, proposal.ethicsDocuments, proposal.dataManagementPlan, proposal.budgetDocuments, proposal.otherRelatedFiles, linkedEthicsId]);

  const markDeliverable = async (item, delivered, note) => {
    const res = await fetch(`/api/proposals/${proposal.id}/deliverables`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deliverableId: item.id, index: item.index, delivered, note }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || 'Could not update the deliverable');
    onDeliverablesChange?.(json.deliverables);
  };

  const coInvestigators = Array.isArray(proposal.coInvestigators) ? proposal.coInvestigators : [];
  const person = (p) => (typeof p === 'string' ? { name: p } : {
    name: p?.name || p?.fullName || [p?.givenName, p?.familyName].filter(Boolean).join(' ') || p?.email || 'Unknown',
    role: p?.role || p?.affiliation || p?.institution || '',
    affiliation: p?.affiliation || p?.institution || '',
    userId: p?.userId,
    orcidId: p?.orcidId || p?.orcid,
    email: p?.email,
  });

  return (
    <Stack spacing={2.5}>
      {/* Lifecycle + key figures */}
      <Paper sx={{ ...cardSx, p: { xs: 1.5, md: 2 } }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={{ xs: 2, lg: 3 }} alignItems={{ lg: 'center' }}>
          <Lifecycle proposal={proposal} />
          <Box sx={{ display: 'grid', gap: 1.25, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, minmax(0, 1fr))' }, flex: { lg: '0 0 62%' } }}>
            <Stat label="Budget" value={budget || 'Not set'} hint={proposal.fundingInstitution || proposal.fundingSource || 'No funder recorded'} />
            <Stat label="Timeline" value={months ? `${months} months` : '—'} hint={elapsed !== null ? `${elapsed}% of time elapsed · ends ${fmt(proposal.endDate)}` : `${fmt(proposal.startDate)} – ${fmt(proposal.endDate)}`} bar={elapsed} tone="#3b82f6" />
            <Stat label="Milestones" value={ms.total ? `${ms.done} of ${ms.total}` : 'None'} hint={ms.overdue ? `${ms.overdue} overdue` : ms.next ? `Next: ${fmt(ms.next.due)}` : ''} bar={ms.total ? ms.percent : null} tone={ms.overdue ? '#ef4444' : '#f59e0b'} />
            <Stat label="Deliverables" value={dl.total ? `${dl.done} of ${dl.total}` : 'None'} hint={dl.overdue ? `${dl.overdue} overdue` : dl.next ? `Next: ${fmt(dl.next.due)}` : ''} bar={dl.total ? dl.percent : null} tone={dl.overdue ? '#ef4444' : '#0f766e'} />
          </Box>
        </Stack>
      </Paper>

      {/* Ethics clearance: up front, never missed */}
      <EthicsClearance proposal={proposal} ethicsHref={ethicsHref} onPreview={setPreview} />

      <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 360px' }, alignItems: 'start' }}>
        <Stack spacing={2.5} sx={{ minWidth: 0 }}>
          <Paper sx={cardSx}>
            <CardTitle icon={<FileIcon />} title="About the study" />
            {sections.length ? (
              <>
                <Tabs value={activeTab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ minHeight: 40, mb: 2, borderBottom: '1px solid', borderColor: 'divider', '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, minHeight: 40 }, '& .Mui-selected': { color: `${PURPLE} !important` }, '& .MuiTabs-indicator': { bgcolor: PURPLE } }}>
                  {sections.map((s) => <Tab key={s.id} value={s.id} label={s.label} />)}
                </Tabs>
                <SafeHtml key={activeTab} value={sections.find((s) => s.id === activeTab)?.value} collapsedHeight={260} />
              </>
            ) : <Typography variant="body2" color="text.secondary">No study description yet.</Typography>}
          </Paper>

          <ProgressFlow title="Milestones" icon={<MilestoneIcon fontSize="small" />} kind="milestone" items={milestones} emptyText="No milestones planned." />
          <ProgressFlow
            title="Deliverables"
            icon={<DeliverableIcon fontSize="small" />}
            kind="deliverable"
            items={deliverables}
            canMark={canMarkDeliverables && approved}
            onMark={markDeliverable}
            emptyText="No deliverables planned."
          />
        </Stack>

        <Stack spacing={2.5} sx={{ minWidth: 0 }}>
          {audience === 'researcher' && proposal.status !== 'DRAFT' ? (
            <Paper sx={cardSx}>
              <CardTitle icon={<EthicsIcon />} title="Review progress" />
              {tracking ? <ProposalReviewStatus tracking={tracking} /> : <Typography variant="body2" color="text.secondary">No review pipeline assigned yet.</Typography>}
            </Paper>
          ) : null}

          <Paper sx={cardSx}>
            <CardTitle
              icon={<BudgetIcon />}
              title="Funding"
              action={approved && budgetHref ? <Button size="small" href={budgetHref} endIcon={<OpenIcon sx={{ fontSize: 14 }} />} sx={{ textTransform: 'none', fontWeight: 700, color: PURPLE }}>Budget & expenses</Button> : null}
            />
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', mb: 1.5 }}>
              <Label>Total budget</Label>
              <Typography sx={{ fontWeight: 800, color: '#047857', fontSize: '1.25rem' }}>{budget || 'Not set'}</Typography>
            </Box>
            <Stack spacing={1.25}>
              {[
                ['Funder', proposal.fundingInstitution],
                ['Funding source', proposal.fundingSource],
                ['Grant number', proposal.grantNumber],
                ['Grant period', proposal.grantStartDate || proposal.grantEndDate ? `${fmt(proposal.grantStartDate)} – ${fmt(proposal.grantEndDate)}` : null],
              ].filter(([, v]) => v).map(([k, v]) => (
                <Stack key={k} direction="row" justifyContent="space-between" spacing={2}>
                  <Typography variant="body2" color="text.secondary">{k}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: INK, textAlign: 'right' }}>{v}</Typography>
                </Stack>
              ))}
            </Stack>
          </Paper>

          <Paper sx={cardSx}>
            <CardTitle icon={<TeamIcon />} title="Research team" subtitle={`${1 + coInvestigators.length} ${coInvestigators.length ? 'people' : 'person'} · click a name for their profile`} />
            <Stack spacing={1}>
              {[{ name: proposal.principalInvestigator || 'Not set', role: 'Principal investigator', userId: proposal.principalInvestigatorUserId, orcidId: proposal.principalInvestigatorOrcid, pi: true }, ...coInvestigators.map(person)].map((p, i) => (
                <Stack
                  key={`${p.name}-${i}`}
                  component="button"
                  type="button"
                  direction="row"
                  spacing={1.25}
                  alignItems="center"
                  onClick={() => setPersonOpen({ ...p, role: p.pi ? 'Principal investigator' : p.role || 'Co-investigator' })}
                  sx={{ p: 1, borderRadius: 1.5, border: '1px solid transparent', bgcolor: p.pi ? alpha(PURPLE, 0.06) : '#f8fafc', textAlign: 'left', cursor: 'pointer', font: 'inherit', width: '100%', '&:hover, &:focus-visible': { borderColor: alpha(PURPLE, 0.4), bgcolor: alpha(PURPLE, 0.08), outline: 'none' } }}
                >
                  <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', fontWeight: 700, bgcolor: p.pi ? PURPLE : '#e0e7ff', color: p.pi ? 'white' : '#4338ca' }}>{initials(p.name)}</Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, color: INK, fontSize: '0.85rem' }} noWrap>{p.name}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap component="div">{p.pi ? 'Principal investigator' : p.role || 'Co-investigator'}</Typography>
                  </Box>
                  <OpenIcon sx={{ fontSize: 15, color: '#94a3b8' }} />
                </Stack>
              ))}
            </Stack>
          </Paper>

          <Paper sx={cardSx}>
            <CardTitle icon={<CalendarIcon />} title="Details" />
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={2}>
                <Box sx={{ flex: 1 }}><Label>Start</Label><Typography variant="body2" sx={{ fontWeight: 700 }}>{fmt(proposal.startDate)}</Typography></Box>
                <Box sx={{ flex: 1 }}><Label>End</Label><Typography variant="body2" sx={{ fontWeight: 700 }}>{fmt(proposal.endDate)}</Typography></Box>
              </Stack>
              <Box><Label>Last updated</Label><Typography variant="body2">{fmt(proposal.updatedAt)}</Typography></Box>
              {proposal.departments?.length ? (
                <Box><Label>Departments</Label><Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>{proposal.departments.map((d) => <Chip key={d} size="small" label={d} sx={{ fontWeight: 600, bgcolor: alpha(PURPLE, 0.08), color: PURPLE }} />)}</Stack></Box>
              ) : null}
              {proposal.researchAreas?.length ? (
                <Box><Label>Research areas</Label><Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>{proposal.researchAreas.map((a) => <Chip key={a} size="small" label={a} sx={{ fontWeight: 600, bgcolor: '#eef2ff', color: '#4338ca' }} />)}</Stack></Box>
              ) : null}
            </Stack>
          </Paper>

          <Paper sx={cardSx}>
            <CardTitle icon={<FileIcon />} title="Documents" subtitle={docs.length ? `${docs.length} file${docs.length === 1 ? '' : 's'}` : 'None uploaded'} />
            <Stack spacing={0.75}>
              {docs.map((d, i) => {
                const href = fileHref(d, linkedEthicsId);
                return (
                  <Stack key={`${fileName(d)}-${i}`} direction="row" spacing={1} alignItems="center" sx={{ p: 1, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                    <FileIcon sx={{ color: PURPLE, fontSize: 20 }} />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap title={fileName(d)}>{fileName(d)}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap component="div">{d.category || 'Document'}</Typography>
                    </Box>
                    <Tooltip title="Preview"><span><Button size="small" disabled={!href} onClick={() => setPreview({ ...d, url: href })} sx={{ minWidth: 0, color: PURPLE }}><PreviewIcon fontSize="small" /></Button></span></Tooltip>
                  </Stack>
                );
              })}
            </Stack>
          </Paper>
        </Stack>
      </Box>

      {proposal.status === 'DRAFT' && audience === 'researcher' ? <Alert severity="info">This proposal is a draft. Submit it for review when it is ready.</Alert> : null}

      <ResearcherPanel open={Boolean(personOpen)} person={personOpen} onClose={() => setPersonOpen(null)} summaryUrl={profileSummaryUrl} profileHref={profileHref} />
      <ProposalDocumentPreviewModal open={Boolean(preview)} file={preview} onClose={() => setPreview(null)} title={preview ? fileName(preview) : 'Document preview'} />
    </Stack>
  );
}
