'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Assignment as ProposalIcon,
  AssignmentTurnedIn as DeliverableIcon,
  CalendarToday as CalendarIcon,
  Edit as EditIcon,
  Flag as MilestoneIcon,
  FolderOpen as FilesIcon,
  History as HistoryIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  PlayCircleOutline as StartIcon,
  Science as ScienceIcon,
  Security as EthicsIcon,
  StopCircle as EndIcon,
  Timeline as TimelineIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import ProposalReviewStatus from '@/components/Proposals/ProposalReviewStatus';

const PURPLE = '#8b6cbc';
const sectionCardSx = {
  p: 2.5,
  borderRadius: 2,
  border: '1px solid',
  borderColor: 'divider',
  background: 'white',
  boxShadow: 'none',
  width: '100%',
};
const htmlSx = {
  color: '#334155',
  lineHeight: 1.7,
  fontSize: '0.95rem',
  '& p': { m: 0, mb: 1.25 },
  '& p:last-child': { mb: 0 },
  '& ul, & ol': { m: 0, pl: 2.5, mb: 1.25 },
  '& li': { mb: 0.5 },
  '& strong': { fontWeight: 700, color: '#1e293b' },
  '& em': { fontStyle: 'italic' },
};

const isProposalEditable = (status) => status === 'DRAFT' || status === 'REVISION_REQUESTED';

const isEmptyHtml = (value) => {
  if (!value) return true;
  return String(value).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').trim() === '';
};

const looksLikeHtml = (value) => typeof value === 'string' && /<\/?[a-z][\s\S]*>/i.test(value);

function HtmlContent({ value, empty = 'Not provided' }) {
  if (isEmptyHtml(value)) {
    return (
      <Typography variant="body2" color="text.secondary">
        {empty}
      </Typography>
    );
  }
  if (!looksLikeHtml(value)) {
    return (
      <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
        {value}
      </Typography>
    );
  }
  return <Box sx={htmlSx} dangerouslySetInnerHTML={{ __html: value }} />;
}

function FieldLabel({ children }) {
  return (
    <Typography
      variant="caption"
      sx={{
        display: 'block',
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'text.secondary',
        mb: 0.75,
      }}
    >
      {children}
    </Typography>
  );
}

function SectionTitle({ children }) {
  return (
    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.05rem', mb: 2 }}>
      {children}
    </Typography>
  );
}

const formatDate = (value) => {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatCurrency = (amount, currency = 'USD') => {
  if (amount === null || amount === undefined || amount === '') return 'Not set';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch {
    return `${currency || 'USD'} ${amount}`;
  }
};

const formatBytes = (size) => {
  const bytes = Number(size);
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const statusChip = (status) => {
  const label = String(status || 'DRAFT').replaceAll('_', ' ');
  const colors = {
    DRAFT: { bg: '#64748b', color: 'white' },
    SUBMITTED: { bg: '#0284c7', color: 'white' },
    UNDER_REVIEW: { bg: PURPLE, color: 'white' },
    APPROVED: { bg: '#16a34a', color: 'white' },
    REJECTED: { bg: '#dc2626', color: 'white' },
    REVISION_REQUESTED: { bg: '#d97706', color: 'white' },
  };
  const tone = colors[status] || { bg: PURPLE, color: 'white' };
  return (
    <Chip
      label={label}
      size="small"
      sx={{ bgcolor: tone.bg, color: tone.color, fontWeight: 700, textTransform: 'capitalize' }}
    />
  );
};

const fileName = (file) => file?.originalName || file?.fileName || file?.name || 'Document';
const fileHref = (file, ethicsId) => {
  if (file?.url) return file.url;
  if (file?.fileId) return `/api/files/${file.fileId}`;
  const storedName = file?.fileName || file?.originalName || file?.name;
  const applicationId = file?.ethicsApplicationId || ethicsId;
  if (applicationId && storedName) {
    return `/api/ethics/applications/${applicationId}/file?name=${encodeURIComponent(storedName)}`;
  }
  return null;
};

export default function ProposalViewPage() {
  const router = useRouter();
  const params = useParams();
  const [proposal, setProposal] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (!params.id) return undefined;
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const [proposalRes, trackingRes] = await Promise.all([
          fetch(`/api/proposals/${params.id}`),
          fetch(`/api/proposals/${params.id}/review-status`),
        ]);
        const proposalData = await proposalRes.json();
        if (!proposalRes.ok || !proposalData.success) {
          throw new Error(proposalData.error || 'Failed to load proposal');
        }
        if (!cancelled) setProposal(proposalData.proposal);

        if (trackingRes.ok) {
          const trackingData = await trackingRes.json();
          if (!cancelled) setTracking(trackingData.tracking || null);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load proposal');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const linkedEthics = proposal?.ethicsLinks?.[0]?.ethicsApplication || null;

  const documents = useMemo(() => {
    if (!proposal) return [];
    const collected = [
      ...(Array.isArray(proposal.documents) ? proposal.documents : []),
      ...(proposal.ethicsDocuments || []).map((file) => ({ ...file, category: file.category || 'Ethics Documents' })),
      ...(proposal.dataManagementPlan || []).map((file) => ({ ...file, category: file.category || 'Data Management Plan' })),
      ...(proposal.budgetDocuments || []).map((file) => ({ ...file, category: file.category || 'Budget Documents' })),
      ...(proposal.otherRelatedFiles || []).map((file) => ({ ...file, category: file.category || 'Supporting Files' })),
      ...(proposal.linkedEthicsDocuments || []).map((file) => ({
        ...file,
        category: file.category || file.type || 'Ethics Documents',
        ethicsApplicationId: file.ethicsApplicationId || linkedEthics?.id,
      })),
    ];
    const seen = new Set();
    return collected.filter((file) => {
      const key = fileHref(file, linkedEthics?.id) || fileName(file);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [proposal, linkedEthics]);

  const ethicsDocuments = useMemo(
    () => documents.filter((file) => {
      const category = `${file.category || ''} ${file.type || ''}`.toLowerCase();
      return category.includes('ethics') || category.includes('certificate') || Boolean(file.ethicsApplicationId);
    }),
    [documents]
  );

  const projectTimeline = useMemo(() => {
    if (!proposal) return [];
    const items = [];
    if (proposal.startDate) {
      items.push({
        kind: 'start',
        id: 'project-start',
        title: 'Project start',
        date: proposal.startDate,
      });
    }
    (proposal.milestones || []).forEach((milestone, index) => {
      items.push({
        kind: 'milestone',
        id: milestone.id || `ms-${index}`,
        title: milestone.title || `Milestone ${index + 1}`,
        date: milestone.targetDate,
        description: milestone.description,
      });
    });
    (proposal.deliverables || []).forEach((deliverable, index) => {
      const linked = (proposal.milestones || []).find((item) => item.id && item.id === deliverable.milestoneId);
      items.push({
        kind: 'deliverable',
        id: deliverable.id || `dl-${index}`,
        title: deliverable.title || `Deliverable ${index + 1}`,
        date: deliverable.dueDate,
        description: deliverable.description,
        type: deliverable.type,
        milestoneTitle: linked?.title || null,
      });
    });
    if (proposal.endDate) {
      items.push({
        kind: 'end',
        id: 'project-end',
        title: 'Project end',
        date: proposal.endDate,
      });
    }
    const rank = { start: 0, milestone: 1, deliverable: 2, end: 3 };
    return items.sort((a, b) => {
      const aDate = a.date ? new Date(a.date).getTime() : Number.MAX_SAFE_INTEGER;
      const bDate = b.date ? new Date(b.date).getTime() : Number.MAX_SAFE_INTEGER;
      if (aDate !== bDate) return aDate - bDate;
      return (rank[a.kind] || 0) - (rank[b.kind] || 0);
    });
  }, [proposal]);

  const canEdit = isProposalEditable(proposal?.status);

  const openFile = (file) => {
    const href = fileHref(file, linkedEthics?.id);
    if (href) window.open(href, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: PURPLE }} />
        </Box>
    );
  }

  if (error || !proposal) {
    return (
      <Container maxWidth={false} sx={{ py: 4, maxWidth: '1600px', mx: 'auto' }}>
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error || 'Proposal not found'}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/researcher/projects/proposals/list')} sx={{ color: PURPLE, textTransform: 'none', fontWeight: 700 }}>
          Back to proposals
        </Button>
      </Container>
    );
  }

    return (
    <>
      <PageHeader
        title={proposal.title}
        description={`${proposal.principalInvestigator || 'Principal investigator not set'} · ${proposal.departments?.join(', ') || 'No department listed'}`}
        icon={<ProposalIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/researcher' },
          { label: 'Proposals', path: '/researcher/projects/proposals/list' },
          { label: 'Proposal details' },
        ]}
        actionButton={
          <Stack direction="row" spacing={1.25} alignItems="center">
            {statusChip(proposal.status)}
        <Button
              variant="contained"
          startIcon={<ArrowBackIcon />}
              onClick={() => router.push('/researcher/projects/proposals/list')}
              sx={{ bgcolor: 'white', color: PURPLE, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#f5f5f5' } }}
            >
              Back to list
            </Button>
            <Tooltip title={canEdit ? 'Edit proposal' : 'Submitted proposals cannot be edited'}>
              <span>
            <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  disabled={!canEdit}
                  onClick={() => router.push(`/researcher/projects/proposals/edit/${params.id}`)}
              sx={{
                    borderColor: 'white',
                color: 'white',
                textTransform: 'none',
                    fontWeight: 700,
                    '&.Mui-disabled': { borderColor: 'rgba(255,255,255,0.35)', color: 'rgba(255,255,255,0.55)' },
                  }}
                >
                  Edit
            </Button>
              </span>
            </Tooltip>
          </Stack>
        }
      />

      <Container maxWidth={false} sx={{ py: 3, maxWidth: '1600px', mx: 'auto' }}>
        <Paper elevation={0} sx={{ ...sectionCardSx, mb: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} divider={<Box sx={{ width: { md: '1px' }, height: { xs: '1px', md: 'auto' }, bgcolor: 'divider' }} />} spacing={0}>
            {[
              ['Status', statusChip(proposal.status)],
              ['Timeline', `${formatDate(proposal.startDate)} - ${formatDate(proposal.endDate)}`],
              ['Proposed budget', formatCurrency(proposal.totalBudgetAmount, proposal.budgetCurrency)],
              ['Submitted', formatDate(proposal.updatedAt || proposal.createdAt)],
            ].map(([label, value]) => (
              <Box key={label} sx={{ flex: 1, px: { md: 2.5 }, py: 1.25 }}>
                <FieldLabel>{label}</FieldLabel>
                {typeof value === 'string' ? (
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                    {value}
              </Typography>
                ) : (
                  value
                )}
            </Box>
            ))}
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ ...sectionCardSx, mb: 2, p: 0, overflow: 'hidden' }}>
          <Tabs 
            value={activeTab} 
            onChange={(_, value) => setActiveTab(value)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              px: 1,
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, minHeight: 52, color: '#64748b' },
              '& .Mui-selected': { color: `${PURPLE} !important` },
              '& .MuiTabs-indicator': { backgroundColor: PURPLE, height: 3 },
            }}
          >
            <Tab icon={<PersonIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Overview" />
            <Tab icon={<ScienceIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Research" />
            <Tab icon={<TimelineIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Project management" />
            <Tab icon={<CalendarIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Funding" />
            <Tab icon={<EthicsIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Ethics" />
            <Tab icon={<FilesIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Files" />
            <Tab icon={<HistoryIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Review" />
          </Tabs>
        </Paper>

        {activeTab === 0 && (
          <Stack spacing={2}>
            <Paper sx={sectionCardSx}>
              <SectionTitle>Investigators</SectionTitle>
              <Stack spacing={2}>
              <Box>
                  <FieldLabel>Principal investigator</FieldLabel>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                    {proposal.principalInvestigator || 'Not set'}
                        </Typography>
                  {proposal.principalInvestigatorOrcid ? (
                    <Typography variant="caption" color="text.secondary">
                      ORCID {proposal.principalInvestigatorOrcid}
                          </Typography>
                  ) : null}
                        </Box>
                        <Box>
                  <FieldLabel>Departments</FieldLabel>
                  {(proposal.departments || []).length ? (
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {proposal.departments.map((department) => (
                        <Chip key={department} label={department} size="small" sx={{ bgcolor: alpha(PURPLE, 0.1), color: PURPLE, fontWeight: 700 }} />
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">None listed</Typography>
                  )}
                          </Box>
                        <Box>
                  <FieldLabel>Co-investigators</FieldLabel>
                  {(proposal.coInvestigators || []).length ? (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Institution</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>ORCID</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {proposal.coInvestigators.map((person, index) => (
                          <TableRow key={`${person.orcidId || person.email || index}`}>
                            <TableCell>{person.name || 'Not set'}</TableCell>
                            <TableCell>{person.role || 'Not set'}</TableCell>
                            <TableCell>{person.institution || 'Not set'}</TableCell>
                            <TableCell>{person.orcidId || 'Not set'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <Typography variant="body2" color="text.secondary">None added</Typography>
                  )}
                        </Box>
              </Stack>
            </Paper>
          </Stack>
        )}

        {activeTab === 1 && (
          <Stack spacing={2}>
            <Paper sx={sectionCardSx}>
              <SectionTitle>Research areas</SectionTitle>
              {(proposal.researchAreas || []).length ? (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {proposal.researchAreas.map((area) => (
                    <Chip key={area} label={area} size="small" sx={{ bgcolor: alpha(PURPLE, 0.1), color: PURPLE, fontWeight: 700 }} />
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">None listed</Typography>
              )}
            </Paper>
            <Paper sx={sectionCardSx}>
              <SectionTitle>Abstract</SectionTitle>
              <HtmlContent value={proposal.abstract} empty="No abstract provided" />
            </Paper>
            <Paper sx={sectionCardSx}>
              <SectionTitle>Research objectives</SectionTitle>
              <HtmlContent value={proposal.researchObjectives} empty="No objectives provided" />
            </Paper>
            <Paper sx={sectionCardSx}>
              <SectionTitle>Methodology</SectionTitle>
              <HtmlContent value={proposal.methodology} empty="No methodology provided" />
            </Paper>
          </Stack>
        )}

        {activeTab === 2 && (
          <Paper sx={sectionCardSx}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
              <SectionTitle>Project timeline</SectionTitle>
              <Typography variant="caption" sx={{ fontWeight: 700, color: PURPLE }}>
                {[(proposal.milestones || []).length ? `${proposal.milestones.length} milestone${proposal.milestones.length === 1 ? '' : 's'}` : null,
                  (proposal.deliverables || []).length ? `${proposal.deliverables.length} deliverable${proposal.deliverables.length === 1 ? '' : 's'}` : null]
                  .filter(Boolean)
                  .join(' · ') || 'No items'}
                          </Typography>
            </Stack>
            {projectTimeline.length ? (
                        <Box>
                {projectTimeline.map((item, index) => {
                  const isLast = index === projectTimeline.length - 1;
                  const tone = {
                    start: { color: '#64748b', bg: '#f1f5f9', icon: <StartIcon sx={{ fontSize: 16 }} /> },
                    end: { color: '#64748b', bg: '#f1f5f9', icon: <EndIcon sx={{ fontSize: 16 }} /> },
                    milestone: { color: PURPLE, bg: alpha(PURPLE, 0.1), icon: <MilestoneIcon sx={{ fontSize: 15 }} /> },
                    deliverable: { color: '#0f766e', bg: '#ccfbf1', icon: <DeliverableIcon sx={{ fontSize: 15 }} /> },
                  }[item.kind] || { color: PURPLE, bg: alpha(PURPLE, 0.1), icon: <TimelineIcon sx={{ fontSize: 15 }} /> };
                  return (
                    <Box key={item.id} sx={{ display: 'flex', gap: 2 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, flexShrink: 0 }}>
                        <Box
                              sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            bgcolor: tone.bg,
                            color: tone.color,
                            border: `2px solid ${tone.color}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1,
                          }}
                        >
                          {tone.icon}
                          </Box>
                        {!isLast ? (
                          <Box sx={{ width: 2, flex: 1, minHeight: 28, bgcolor: alpha(PURPLE, 0.18), my: 0.5 }} />
                        ) : null}
                        </Box>
                      <Box
                        sx={{
                          flex: 1,
                          mb: isLast ? 0 : 2,
                          p: 1.75,
                          borderRadius: 1.5,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: item.kind === 'start' || item.kind === 'end' ? '#f8fafc' : 'white',
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} flexWrap="wrap" useFlexGap>
                        <Box>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                                {item.title}
                          </Typography>
                        <Chip 
                                label={item.kind === 'start' || item.kind === 'end' ? 'Project' : item.kind === 'milestone' ? 'Milestone' : 'Deliverable'}
                          size="small"
                                sx={{ height: 20, fontWeight: 700, fontSize: '0.68rem', bgcolor: tone.bg, color: tone.color }}
                              />
                            </Stack>
                            {item.kind === 'deliverable' ? (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                {[item.type, item.milestoneTitle ? `Output of ${item.milestoneTitle}` : null].filter(Boolean).join(' · ') || 'Deliverable'}
                        </Typography>
                            ) : null}
                      </Box>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: tone.color, whiteSpace: 'nowrap' }}>
                            {formatDate(item.date)}
                            </Typography>
                        </Stack>
                        {item.description ? (
                          <Box sx={{ mt: 1 }}>
                            <HtmlContent value={item.description} empty="" />
                      </Box>
                        ) : null}
                    </Box>
              </Box>
                  );
                })}
                    </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No timeline items yet. Add a project start date, milestones, or deliverables.
                    </Typography>
            )}
          </Paper>
        )}

        {activeTab === 3 && (
          <Paper sx={sectionCardSx}>
            <SectionTitle>Proposed budget</SectionTitle>
            <Stack spacing={2}>
              <Box>
                <FieldLabel>Funding source</FieldLabel>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  {proposal.fundingSource || 'Not set'}
                        </Typography>
                      </Box>
              <Box>
                <FieldLabel>Proposed amount</FieldLabel>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  {formatCurrency(proposal.totalBudgetAmount, proposal.budgetCurrency)}
                      </Typography>
                    </Box>
              <Box>
                <FieldLabel>Currency</FieldLabel>
                <Typography variant="body2" sx={{ color: '#1e293b' }}>
                  {proposal.budgetCurrency || 'USD'}
                        </Typography>
                      </Box>
            </Stack>
          </Paper>
        )}

        {activeTab === 4 && (
          <Paper sx={sectionCardSx}>
            <SectionTitle>Ethics approval</SectionTitle>
                    <Stack spacing={2}>
              <Box>
                <FieldLabel>Status</FieldLabel>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  {proposal.ethicsApprovalStatus || 'Not set'}
                                </Typography>
                              </Box>
              <Box>
                <FieldLabel>Reference</FieldLabel>
                <Typography variant="body2" sx={{ color: '#1e293b' }}>
                  {proposal.ethicsApprovalReference || 'Not set'}
                              </Typography>
                            </Box>
              <Box>
                <FieldLabel>Committee</FieldLabel>
                <Typography variant="body2" sx={{ color: '#1e293b' }}>
                  {proposal.ethicsCommittee || linkedEthics?.committeeName || 'Not set'}
                                </Typography>
                              </Box>
              <Box>
                <FieldLabel>Approval date</FieldLabel>
                <Typography variant="body2" sx={{ color: '#1e293b' }}>
                  {formatDate(proposal.approvalDate || linkedEthics?.approvalDate)}
                              </Typography>
                            </Box>
              {linkedEthics ? (
                <Box>
                  <FieldLabel>Linked record</FieldLabel>
                            <Button
                    onClick={() => router.push(`/researcher/ethics/applications/view/${linkedEthics.id}`)}
                    sx={{ p: 0, minWidth: 0, textTransform: 'none', fontWeight: 700, color: PURPLE, justifyContent: 'flex-start' }}
                  >
                    {linkedEthics.title}
                            </Button>
                          </Box>
              ) : null}
              <Box>
                <FieldLabel>Documents</FieldLabel>
                {ethicsDocuments.length ? (
                  <Stack spacing={1}>
                    {ethicsDocuments.map((file, index) => (
                      <Stack
                        key={`${file.fileName || file.fileId || file.originalName || index}`}
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={2}
                        sx={{ px: 1.5, py: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }} noWrap>
                            {fileName(file)}
                                </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {[file.category || file.type || 'Ethics document', formatBytes(file.size)].filter(Boolean).join(' · ')}
                              </Typography>
                            </Box>
                            <Button
                          size="small"
                              startIcon={<ViewIcon />}
                          onClick={() => openFile(file)}
                          disabled={!fileHref(file, linkedEthics?.id)}
                          sx={{ color: PURPLE, textTransform: 'none', fontWeight: 700 }}
                        >
                          Open
                            </Button>
                      </Stack>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No ethics documents linked yet.
                          </Typography>
                      )}
              </Box>
            </Stack>
          </Paper>
        )}

        {activeTab === 5 && (
          <Paper sx={sectionCardSx}>
            <SectionTitle>Supporting files</SectionTitle>
            {proposal.publicationRelevance ? (
              <Box sx={{ mb: 2 }}>
                <FieldLabel>Relevance</FieldLabel>
                <Typography variant="body2" sx={{ color: '#334155', whiteSpace: 'pre-wrap' }}>
                  {proposal.publicationRelevance}
                      </Typography>
                    </Box>
            ) : null}
            {documents.length ? (
              <Stack spacing={1}>
                {documents.map((file, index) => (
                  <Stack
                    key={`${file.fileName || file.fileId || file.originalName || index}`}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={2}
                    sx={{ px: 1.5, py: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                      <Avatar sx={{ bgcolor: alpha(PURPLE, 0.12), color: PURPLE, width: 36, height: 36 }}>
                        <FilesIcon fontSize="small" />
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }} noWrap>
                          {fileName(file)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {[file.category, formatBytes(file.size)].filter(Boolean).join(' · ')}
                                </Typography>
                              </Box>
                            </Stack>
                    <Button
                      size="small"
                      startIcon={<ViewIcon />}
                      onClick={() => openFile(file)}
                      disabled={!fileHref(file, linkedEthics?.id)}
                      sx={{ color: PURPLE, textTransform: 'none', fontWeight: 700 }}
                    >
                      Open
                    </Button>
                  </Stack>
                        ))}
                      </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">No supporting files uploaded</Typography>
            )}
          </Paper>
        )}

        {activeTab === 6 && (
          <Stack spacing={2}>
            <Paper sx={sectionCardSx}>
              <SectionTitle>Review pipeline</SectionTitle>
              {tracking ? (
                <ProposalReviewStatus tracking={tracking} />
              ) : (
                          <Typography variant="body2" color="text.secondary">
                  {proposal.status === 'DRAFT' ? 'This proposal has not been submitted for review.' : 'No review pipeline assigned yet.'}
                          </Typography>
              )}
            </Paper>
            <Paper sx={sectionCardSx}>
              <SectionTitle>Review history</SectionTitle>
              {(proposal.reviewHistory || []).length ? (
                <Stack spacing={1.25}>
                  {proposal.reviewHistory.map((entry, index) => (
                    <Box key={index} sx={{ p: 1.75, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                      <Stack direction="row" justifyContent="space-between" spacing={2}>
                        {statusChip(entry.status)}
                        <Typography variant="caption" color="text.secondary">{formatDate(entry.date)}</Typography>
                      </Stack>
                      {entry.reviewer ? (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                          Reviewed by {entry.reviewer}
                          </Typography>
                      ) : null}
                      {entry.comment ? (
                        <Typography variant="body2" sx={{ mt: 1, color: '#334155' }}>
                          {entry.comment}
                              </Typography>
                      ) : null}
                        </Box>
              ))}
            </Stack>
          ) : (
              <Typography variant="body2" color="text.secondary">
                  Review comments will appear here after reviewers take action.
              </Typography>
              )}
            </Paper>
          </Stack>
        )}
      </Container>
    </>
  );
}
