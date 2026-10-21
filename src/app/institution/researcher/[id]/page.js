'use client';

/**
 * Institution view of a researcher's profile. Same layout as /researcher/profile, read-only,
 * plus a "Research output" tab with platform work by role (lead / co-author, manuscript
 * collaborator, PI / co-investigator). Data: GET /api/institution/researchers/[id].
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Alert,
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Link as MuiLink,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Article as ArticleIcon,
  Assignment as ProposalIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  Description as ManuscriptIcon,
  Email as EmailIcon,
  Groups as CollabIcon,
  Language as LanguageIcon,
  LinkedIn as LinkedInIcon,
  LocationOn as LocationIcon,
  MenuBook as PublicationIcon,
  OpenInNew as OpenIcon,
  School as SchoolIcon,
  Twitter as TwitterIcon,
  Work as WorkIcon,
} from '@mui/icons-material';
import {
  CitedByCard,
  PublicAccessCard,
  CoauthorsCard,
  PublicationsTable,
} from '@/components/Researcher/ScholarMetrics';
import { ResearcherIdLinks } from '@/components/Researcher/ResearcherIds';
import ResearchExpertiseCard from '@/components/Researcher/ResearchExpertiseCard';

const PURPLE = '#8b6cbc';
const PURPLE_DARK = '#7a5caa';
const COLLAB = '#0284c7';
const INK = '#0f172a';
const BODY = '#334155';
const MUTED = '#64748b';
const LINE = '#e2e8f0';
const SURFACE = '#f6f7fb';
const cardSx = { borderRadius: 2.5, border: `1px solid ${LINE}`, boxShadow: '0 1px 2px rgba(15,23,42,0.04)', bgcolor: 'white' };

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'output', label: 'Research output' },
  { key: 'experience', label: 'Experience & Education' },
  { key: 'ids', label: 'Researcher IDs' },
];

const fmtNumber = (n) => (typeof n === 'number' ? n.toLocaleString() : '—');
const yearOf = (d) => d?.year?.value || null;
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
const titleCase = (v) => String(v || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const STATUS_TONE = {
  PUBLISHED: ['#15803d', '#dcfce7'],
  APPROVED: ['#15803d', '#dcfce7'],
  IN_REVIEW: ['#b45309', '#fef3c7'],
  UNDER_REVIEW: ['#6d5499', alpha(PURPLE, 0.12)],
  SUBMITTED: ['#1d4ed8', '#dbeafe'],
  UNDER_REVISION: ['#c2410c', '#ffedd5'],
  REVISION_REQUESTED: ['#c2410c', '#ffedd5'],
  REJECTED: ['#b91c1c', '#fee2e2'],
  DRAFT: ['#475569', '#f1f5f9'],
  ARCHIVED: ['#475569', '#f1f5f9'],
};

function StatusChip({ status }) {
  const [color, bg] = STATUS_TONE[status] || ['#475569', '#f1f5f9'];
  return <Chip size="small" label={titleCase(status)} sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, color, bgcolor: bg }} />;
}

function RoleChip({ lead, label }) {
  return (
    <Chip
      size="small"
      label={label}
      sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, color: lead ? PURPLE_DARK : COLLAB, bgcolor: lead ? alpha(PURPLE, 0.1) : alpha(COLLAB, 0.1) }}
    />
  );
}

function SectionHeading({ icon: Icon, title, subtitle, action }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        {Icon && (
          <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: 'rgba(139,108,188,0.1)', color: PURPLE_DARK, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon sx={{ fontSize: 18 }} />
          </Box>
        )}
        <Box>
          <Typography sx={{ fontWeight: 700, color: INK, fontSize: '0.98rem', lineHeight: 1.4 }}>{title}</Typography>
          {subtitle && <Typography variant="caption" sx={{ color: MUTED }}>{subtitle}</Typography>}
        </Box>
      </Box>
      {action}
    </Box>
  );
}

function FromOrcidChip() {
  return <Chip label="From ORCID" size="small" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, bgcolor: 'rgba(166,206,57,0.16)', color: '#4d6b0f' }} />;
}

function Stat({ label, value, hint, sub }) {
  return (
    <Tooltip title={hint || ''} disableHoverListener={!hint}>
      <Box sx={{ px: { xs: 1.5, md: 2.5 }, py: 1, textAlign: 'center', minWidth: 88 }}>
        <Typography sx={{ fontWeight: 800, color: INK, fontSize: { xs: '1.2rem', md: '1.45rem' }, lineHeight: 1.2 }}>{value}</Typography>
        <Typography variant="caption" sx={{ color: MUTED, fontWeight: 600, letterSpacing: '0.02em', display: 'block' }}>{label}</Typography>
        {sub ? <Typography variant="caption" sx={{ color: COLLAB, fontWeight: 600, fontSize: '0.68rem' }}>{sub}</Typography> : null}
      </Box>
    </Tooltip>
  );
}

function InfoRow({ icon: Icon, children }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: MUTED, minWidth: 0 }}>
      <Icon sx={{ fontSize: 16, color: '#94a3b8', flexShrink: 0 }} />
      <Typography variant="body2" noWrap sx={{ color: MUTED, fontSize: '0.84rem' }}>{children}</Typography>
    </Box>
  );
}

function Timeline({ items, titleKey, emptyIcon: EmptyIcon, emptyText }) {
  if (!items?.length) {
    return (
      <Box sx={{ textAlign: 'center', py: 4, border: `1px dashed ${LINE}`, borderRadius: 2 }}>
        <EmptyIcon sx={{ fontSize: 36, color: '#cbd5e0', mb: 1 }} />
        <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.84rem' }}>{emptyText}</Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ position: 'relative', pl: 3 }}>
      <Box sx={{ position: 'absolute', left: 6, top: 8, bottom: 8, width: 2, bgcolor: '#ede9f6', borderRadius: 1 }} />
      {items.map((item, index) => {
        const start = yearOf(item.startDate);
        const end = yearOf(item.endDate);
        return (
          <Box key={`${item.organization}-${index}`} sx={{ position: 'relative', pb: index < items.length - 1 ? 3 : 0 }}>
            <Box sx={{ position: 'absolute', left: -23, top: 5, width: 12, height: 12, borderRadius: '50%', bgcolor: end ? 'white' : PURPLE, border: `2px solid ${PURPLE}` }} />
            <Typography sx={{ fontWeight: 600, color: INK, fontSize: '0.93rem' }}>{item[titleKey]}</Typography>
            <Typography sx={{ color: PURPLE_DARK, fontSize: '0.86rem', fontWeight: 500 }}>
              {item.organization}{item.department ? ` · ${item.department}` : ''}
            </Typography>
            <Typography variant="caption" sx={{ color: MUTED }}>
              {[start || end ? `${start || '—'} – ${end || 'Present'}` : null, item.location].filter(Boolean).join(' · ')}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

function ContactItem({ icon: Icon, label, value, href, external }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 1.5, border: `1px solid ${LINE}`, minWidth: 0 }}>
      <Icon sx={{ fontSize: 18, color: value ? PURPLE : '#cbd5e1' }} />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" sx={{ color: MUTED, display: 'block', lineHeight: 1.2 }}>{label}</Typography>
        {value ? (
          href ? (
            <MuiLink href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} underline="hover" noWrap sx={{ display: 'block', color: INK, fontSize: '0.86rem' }}>
              {value.replace(/^https?:\/\/(www\.)?/, '')}
            </MuiLink>
          ) : <Typography noWrap sx={{ color: INK, fontSize: '0.86rem' }}>{value}</Typography>
        ) : <Typography sx={{ color: '#cbd5e1', fontSize: '0.86rem' }}>Not added</Typography>}
      </Box>
    </Box>
  );
}

function OutputList({ items, empty, renderItem }) {
  if (!items.length) {
    return (
      <Box sx={{ textAlign: 'center', py: 4, border: `1px dashed ${LINE}`, borderRadius: 2 }}>
        <Typography variant="body2" sx={{ color: '#94a3b8' }}>{empty}</Typography>
      </Box>
    );
  }
  return <Stack spacing={1}>{items.map(renderItem)}</Stack>;
}

function ProfileSkeleton() {
  return (
    <Box sx={{ bgcolor: SURFACE, minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        <Skeleton variant="rounded" height={260} sx={{ borderRadius: 3, mb: 3 }} />
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="rounded" height={320} sx={{ borderRadius: 3, mb: 3 }} />
            <Skeleton variant="rounded" height={420} sx={{ borderRadius: 3 }} />
          </Box>
          <Box sx={{ width: { xs: '100%', lg: 340 } }}>
            <Skeleton variant="rounded" height={160} sx={{ borderRadius: 3, mb: 3 }} />
            <Skeleton variant="rounded" height={360} sx={{ borderRadius: 3 }} />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default function InstitutionResearcherProfile() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [outputType, setOutputType] = useState('publications');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    if (!params.id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`/api/institution/researchers/${params.id}`, { credentials: 'include' });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load researcher');
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load researcher');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [params.id]);

  const profile = data?.profile;
  const rp = profile?.researchProfile || {};
  const orcidData = data?.orcidData;
  const works = data?.works || {};
  const publications = works.works || [];
  const metrics = works.metrics;
  const out = data?.output;

  const outputItems = useMemo(() => {
    if (!out) return [];
    const list = out.items[outputType] || [];
    if (roleFilter === 'all') return list;
    const leadRoles = { publications: 'lead', manuscripts: 'lead', proposals: 'pi' };
    return list.filter((i) => (roleFilter === 'lead' ? i.role === leadRoles[outputType] : i.role !== leadRoles[outputType]));
  }, [out, outputType, roleFilter]);

  if (loading) return <ProfileSkeleton />;
  if (error || !profile) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>{error || 'Researcher not found'}</Alert>
        <Button startIcon={<BackIcon />} onClick={() => router.push('/institution/researchers')} sx={{ textTransform: 'none', color: PURPLE_DARK }}>Back to directory</Button>
      </Container>
    );
  }

  const initials = `${profile.givenName?.[0] || ''}${profile.familyName?.[0] || ''}`.toUpperCase() || 'R';
  const fullName = [rp.academicTitle, profile.givenName, profile.familyName].filter(Boolean).join(' ') || profile.email;
  const currentEmployment = orcidData?.employments?.find((e) => !e.endDate) || orcidData?.employments?.[0];
  const headline = currentEmployment?.role && currentEmployment.role !== 'Role not specified' ? currentEmployment.role : null;
  const biography = orcidData?.biography || rp.biography;

  const OUTPUT_TYPES = [
    { key: 'publications', label: 'Publications', icon: <PublicationIcon sx={{ fontSize: 16 }} />, total: out?.publications.total || 0, collab: out?.publications.coauthor || 0 },
    { key: 'manuscripts', label: 'Manuscripts', icon: <ManuscriptIcon sx={{ fontSize: 16 }} />, total: out?.manuscripts.total || 0, collab: out?.manuscripts.collaborator || 0 },
    { key: 'proposals', label: 'Proposals', icon: <ProposalIcon sx={{ fontSize: 16 }} />, total: out?.proposals.total || 0, collab: out?.proposals.coInvestigator || 0 },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: SURFACE, pb: 6 }}>
      <Container maxWidth="xl" sx={{ pt: { xs: 2, md: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Breadcrumbs sx={{ fontSize: '0.85rem' }}>
            <MuiLink component="button" underline="hover" onClick={() => router.push('/institution')} sx={{ color: MUTED }}>Institution</MuiLink>
            <MuiLink component="button" underline="hover" onClick={() => router.push('/institution/researchers')} sx={{ color: MUTED }}>Researchers</MuiLink>
            <Typography sx={{ color: INK, fontSize: '0.85rem', fontWeight: 600 }}>{fullName}</Typography>
          </Breadcrumbs>
          <Button size="small" startIcon={<BackIcon />} onClick={() => router.push('/institution/researchers')} sx={{ textTransform: 'none', color: PURPLE_DARK, fontWeight: 600 }}>
            Directory
          </Button>
        </Stack>

        {/* HERO */}
        <Card sx={{ ...cardSx, overflow: 'hidden', mb: 3 }}>
          <Box
            sx={{
              height: { xs: 72, md: 96 },
              background: `linear-gradient(120deg, ${PURPLE_DARK} 0%, ${PURPLE} 55%, #b9a3db 100%)`,
              position: 'relative',
              '&::after': { content: '""', position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '18px 18px' },
            }}
          />
          <Box sx={{ px: { xs: 2.5, md: 4 }, pb: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 1.5, md: 3 } }}>
              <Box sx={{ position: 'relative', zIndex: 1, mt: { xs: -6, md: -7 }, flexShrink: 0 }}>
                <Avatar src={profile.avatarUrl || undefined} sx={{ width: 112, height: 112, fontSize: '2.2rem', fontWeight: 800, bgcolor: alpha(PURPLE, 0.2), color: PURPLE_DARK, border: '4px solid white', boxShadow: '0 2px 8px rgba(15,23,42,0.12)' }}>
                  {initials}
                </Avatar>
              </Box>
              <Box sx={{ flex: 1, minWidth: 0, pt: { xs: 0, md: 2 } }}>
                <Typography component="h1" sx={{ fontWeight: 800, color: INK, fontSize: { xs: '1.45rem', md: '1.75rem' }, lineHeight: 1.25 }}>{fullName}</Typography>
                <Typography sx={{ color: BODY, fontSize: '0.95rem', mt: 0.25 }}>{[headline, rp.department].filter(Boolean).join(' · ') || 'Researcher'}</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 2.5, rowGap: 0.75, mt: 1 }}>
                  {profile.primaryInstitution && <InfoRow icon={BusinessIcon}>{profile.primaryInstitution}</InfoRow>}
                  {currentEmployment?.location && <InfoRow icon={LocationIcon}>{currentEmployment.location}</InfoRow>}
                  {profile.createdAt && <InfoRow icon={CalendarIcon}>Member since {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</InfoRow>}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignSelf: { xs: 'stretch', md: 'flex-start' }, pt: { md: 2.5 } }}>
                {profile.email ? (
                  <Button variant="contained" startIcon={<EmailIcon />} component="a" href={`mailto:${profile.email}`} sx={{ bgcolor: PURPLE, '&:hover': { bgcolor: PURPLE_DARK }, textTransform: 'none', fontWeight: 600 }}>
                    Email
                  </Button>
                ) : null}
              </Box>
            </Box>

            {(profile.orcidId || rp.researcherIds?.length > 0) && (
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.75, mt: 2 }}>
                {profile.orcidId && (
                  <Chip
                    component="a"
                    href={`https://orcid.org/${profile.orcidId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    clickable
                    size="small"
                    label={`ORCID ${profile.orcidId}`}
                    sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, bgcolor: 'rgba(166,206,57,0.16)', color: '#4d6b0f', border: '1px solid rgba(166,206,57,0.35)' }}
                  />
                )}
                <ResearcherIdLinks ids={rp.researcherIds || []} />
              </Box>
            )}

            <Divider sx={{ my: 2.5 }} />

            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: { xs: 'space-between', md: 'flex-start' }, mx: { xs: -1.5, md: -2.5 } }}>
              <Stat label="Publications" value={fmtNumber(publications.length)} hint="ORCID works plus work published in Hospitium" />
              <Stat label="Citations" value={fmtNumber(metrics?.citedBy?.citations?.all ?? rp.citationCount ?? undefined)} hint={`Source: ${works.metricsSource || 'OpenAlex'}`} />
              <Stat label="h-index" value={fmtNumber(metrics?.citedBy?.hIndex?.all ?? rp.hIndex ?? undefined)} />
              <Stat label="Manuscripts" value={fmtNumber(out?.manuscripts.total)} sub={out?.manuscripts.collaborator ? `${out.manuscripts.collaborator} as collaborator` : null} hint="Manuscripts on Hospitium, led or collaborated on" />
              <Stat label="Proposals" value={fmtNumber(out?.proposals.total)} sub={out?.proposals.coInvestigator ? `${out.proposals.coInvestigator} as co-investigator` : null} hint="Project proposals as PI or co-investigator" />
              <Stat label="Co-authors" value={fmtNumber(metrics?.coauthors?.length)} hint="Top collaborators found in OpenAlex" />
            </Box>
          </Box>
        </Card>

        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' }, alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1, minWidth: 0, width: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Card sx={cardSx}>
              <Box sx={{ borderBottom: `1px solid ${LINE}`, px: { xs: 1, md: 2 } }}>
                <Tabs
                  value={activeTab}
                  onChange={(_, v) => setActiveTab(v)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    minHeight: 52,
                    '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.9rem', color: MUTED, minHeight: 52, px: 2 },
                    '& .Mui-selected': { color: `${PURPLE_DARK} !important` },
                    '& .MuiTabs-indicator': { backgroundColor: PURPLE, height: 3, borderRadius: '3px 3px 0 0' },
                  }}
                >
                  {TABS.map((t) => (
                    <Tab
                      key={t.key}
                      value={t.key}
                      label={t.key === 'output' && out ? `${t.label} (${out.totals.all})` : t.label}
                    />
                  ))}
                </Tabs>
              </Box>

              <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
                {activeTab === 'overview' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {rp.researchInterests && (
                      <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: 'rgba(139,108,188,0.06)', borderLeft: `4px solid ${PURPLE}` }}>
                        <Typography variant="overline" sx={{ color: PURPLE_DARK, fontWeight: 700, letterSpacing: '0.08em', lineHeight: 1 }}>Current focus</Typography>
                        <Typography sx={{ color: INK, lineHeight: 1.7, mt: 1, fontSize: '0.95rem' }}>{rp.researchInterests}</Typography>
                      </Box>
                    )}
                    <Box>
                      <SectionHeading icon={ArticleIcon} title="Biography" action={orcidData?.biography ? <FromOrcidChip /> : null} />
                      {biography ? (
                        <Typography sx={{ color: BODY, lineHeight: 1.85, fontSize: '0.95rem', whiteSpace: 'pre-line' }}>{biography}</Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>No biography added yet.</Typography>
                      )}
                    </Box>
                    {out ? (
                      <Box>
                        <SectionHeading icon={CollabIcon} title="Output at a glance" subtitle="Work on Hospitium, by role" action={<Button size="small" onClick={() => setActiveTab('output')} sx={{ textTransform: 'none', color: PURPLE_DARK, fontWeight: 600 }}>See all</Button>} />
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5 }}>
                          {[
                            ['Publications', out.publications.lead, out.publications.coauthor, 'Lead', 'Co-author', 'publications'],
                            ['Manuscripts', out.manuscripts.lead, out.manuscripts.collaborator, 'Lead', 'Collaborator', 'manuscripts'],
                            ['Proposals', out.proposals.pi, out.proposals.coInvestigator, 'PI', 'Co-investigator', 'proposals'],
                          ].map(([label, lead, collab, leadLabel, collabLabel, key]) => (
                            <Box
                              key={label}
                              onClick={() => { setOutputType(key); setRoleFilter('all'); setActiveTab('output'); }}
                              sx={{ p: 2, borderRadius: 2, border: `1px solid ${LINE}`, cursor: 'pointer', '&:hover': { borderColor: alpha(PURPLE, 0.6) } }}
                            >
                              <Typography variant="caption" sx={{ color: MUTED, fontWeight: 700 }}>{label}</Typography>
                              <Typography sx={{ fontWeight: 800, color: INK, fontSize: '1.4rem' }}>{lead + collab}</Typography>
                              <Stack direction="row" spacing={1.5}>
                                <Typography variant="caption" sx={{ color: PURPLE_DARK, fontWeight: 600 }}>{lead} {leadLabel}</Typography>
                                <Typography variant="caption" sx={{ color: COLLAB, fontWeight: 600 }}>{collab} {collabLabel}</Typography>
                              </Stack>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    ) : null}
                    <Box>
                      <SectionHeading icon={EmailIcon} title="Contact" />
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                        <ContactItem icon={EmailIcon} label="Email" value={profile.email} href={profile.email ? `mailto:${profile.email}` : null} />
                        <ContactItem icon={LanguageIcon} label="Website" value={rp.website} href={rp.website} external />
                        <ContactItem icon={LinkedInIcon} label="LinkedIn" value={rp.linkedin} href={rp.linkedin} external />
                        <ContactItem
                          icon={TwitterIcon}
                          label="X / Twitter"
                          value={rp.twitter}
                          href={rp.twitter ? (rp.twitter.startsWith('http') ? rp.twitter : `https://x.com/${rp.twitter.replace(/^@/, '')}`) : null}
                          external
                        />
                      </Box>
                    </Box>
                  </Box>
                )}

                {activeTab === 'output' && out && (
                  <Box>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between" sx={{ mb: 2.5 }}>
                      <ToggleButtonGroup
                        size="small"
                        exclusive
                        value={outputType}
                        onChange={(_, v) => v && setOutputType(v)}
                        sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 600, gap: 0.75 }, '& .Mui-selected': { bgcolor: `${alpha(PURPLE, 0.14)} !important`, color: `${PURPLE_DARK} !important` } }}
                      >
                        {OUTPUT_TYPES.map((t) => (
                          <ToggleButton key={t.key} value={t.key}>{t.icon}{t.label} ({t.total})</ToggleButton>
                        ))}
                      </ToggleButtonGroup>
                      <ToggleButtonGroup size="small" exclusive value={roleFilter} onChange={(_, v) => v && setRoleFilter(v)} sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 600 } }}>
                        <ToggleButton value="all">All roles</ToggleButton>
                        <ToggleButton value="lead">{outputType === 'proposals' ? 'PI' : 'Lead'}</ToggleButton>
                        <ToggleButton value="collab">{outputType === 'publications' ? 'Co-author' : outputType === 'manuscripts' ? 'Collaborator' : 'Co-investigator'}</ToggleButton>
                      </ToggleButtonGroup>
                    </Stack>

                    {outputType === 'publications' && (
                      <OutputList
                        items={outputItems}
                        empty="No publications linked to this researcher on Hospitium for this role."
                        renderItem={(p) => {
                          const href = p.doi ? `https://doi.org/${String(p.doi).replace(/^https?:\/\/(dx\.)?doi\.org\//, '')}` : p.url;
                          return (
                            <Box key={p.id} sx={{ p: 1.75, borderRadius: 1.5, border: `1px solid ${LINE}` }}>
                              <Stack direction="row" justifyContent="space-between" spacing={2} alignItems="flex-start">
                                <Box sx={{ minWidth: 0 }}>
                                  {href ? (
                                    <MuiLink href={href} target="_blank" rel="noopener noreferrer" underline="hover" sx={{ color: PURPLE_DARK, fontWeight: 600, fontSize: '0.9rem' }}>
                                      {p.title} <OpenIcon sx={{ fontSize: 12, verticalAlign: 'middle' }} />
                                    </MuiLink>
                                  ) : <Typography sx={{ fontWeight: 600, color: INK, fontSize: '0.9rem' }}>{p.title}</Typography>}
                                  <Typography variant="caption" sx={{ color: MUTED, display: 'block' }}>
                                    {[p.journal, p.year, p.type].filter(Boolean).join(' · ')}
                                  </Typography>
                                </Box>
                                <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                                  <RoleChip lead={p.role === 'lead'} label={p.role === 'lead' ? 'Lead author' : `Co-author${p.authorPosition ? ` (#${p.authorPosition})` : ''}`} />
                                  {p.isCorresponding ? <Chip size="small" label="Corresponding" sx={{ height: 20, fontSize: '0.68rem' }} /> : null}
                                </Stack>
                              </Stack>
                            </Box>
                          );
                        }}
                      />
                    )}

                    {outputType === 'manuscripts' && (
                      <OutputList
                        items={outputItems}
                        empty="No manuscripts for this role."
                        renderItem={(m) => (
                          <Box key={m.id} sx={{ p: 1.75, borderRadius: 1.5, border: `1px solid ${LINE}` }}>
                            <Stack direction="row" justifyContent="space-between" spacing={2} alignItems="flex-start">
                              <Box sx={{ minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 600, color: INK, fontSize: '0.9rem' }}>{m.title || 'Untitled manuscript'}</Typography>
                                <Typography variant="caption" sx={{ color: MUTED, display: 'block' }}>
                                  {[titleCase(m.type), m.field, `${m.collaboratorCount} collaborator${m.collaboratorCount === 1 ? '' : 's'}`, `updated ${fmtDate(m.updatedAt)}`].filter(Boolean).join(' · ')}
                                </Typography>
                              </Box>
                              <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                                <RoleChip lead={m.role === 'lead'} label={m.role === 'lead' ? 'Lead' : titleCase(m.collaboratorRole || 'Collaborator')} />
                                <StatusChip status={m.status} />
                              </Stack>
                            </Stack>
                          </Box>
                        )}
                      />
                    )}

                    {outputType === 'proposals' && (
                      <OutputList
                        items={outputItems}
                        empty="No proposals for this role."
                        renderItem={(p) => (
                          <Box
                            key={p.id}
                            onClick={() => router.push(`/institution/proposals/review/${p.id}`)}
                            sx={{ p: 1.75, borderRadius: 1.5, border: `1px solid ${LINE}`, cursor: 'pointer', '&:hover': { borderColor: alpha(PURPLE, 0.6), bgcolor: alpha(PURPLE, 0.02) } }}
                          >
                            <Stack direction="row" justifyContent="space-between" spacing={2} alignItems="flex-start">
                              <Box sx={{ minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 600, color: INK, fontSize: '0.9rem' }}>{p.title}</Typography>
                                <Typography variant="caption" sx={{ color: MUTED, display: 'block' }}>
                                  {[p.role === 'pi' ? null : `PI: ${p.principalInvestigator || '—'}`, p.departments?.[0], p.startDate ? `${fmtDate(p.startDate)} – ${fmtDate(p.endDate)}` : null, p.budget ? new Intl.NumberFormat('en-US', { style: 'currency', currency: p.currency || 'USD', maximumFractionDigits: 0 }).format(p.budget) : null].filter(Boolean).join(' · ')}
                                </Typography>
                              </Box>
                              <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                                <RoleChip lead={p.role === 'pi'} label={p.role === 'pi' ? 'Principal investigator' : 'Co-investigator'} />
                                <StatusChip status={p.status} />
                              </Stack>
                            </Stack>
                          </Box>
                        )}
                      />
                    )}
                  </Box>
                )}

                {activeTab === 'experience' && (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
                    <Box>
                      <SectionHeading icon={WorkIcon} title="Employment" action={orcidData?.employments?.length ? <FromOrcidChip /> : null} />
                      <Timeline items={orcidData?.employments} titleKey="role" emptyIcon={WorkIcon} emptyText={profile.orcidId ? 'No employment on this ORCID record.' : 'No ORCID iD linked.'} />
                    </Box>
                    <Box>
                      <SectionHeading icon={SchoolIcon} title="Education" action={orcidData?.educations?.length ? <FromOrcidChip /> : null} />
                      <Timeline items={orcidData?.educations} titleKey="degree" emptyIcon={SchoolIcon} emptyText={profile.orcidId ? 'No education on this ORCID record.' : 'No ORCID iD linked.'} />
                    </Box>
                  </Box>
                )}

                {activeTab === 'ids' && (
                  <Box>
                    <SectionHeading icon={ArticleIcon} title="Researcher identifiers" subtitle="Persistent identifiers this researcher has added" />
                    {profile.orcidId || rp.researcherIds?.length ? (
                      <Stack spacing={1.5}>
                        {profile.orcidId ? (
                          <ContactItem icon={ArticleIcon} label="ORCID iD" value={`https://orcid.org/${profile.orcidId}`} href={`https://orcid.org/${profile.orcidId}`} external />
                        ) : null}
                        <ResearcherIdLinks ids={rp.researcherIds || []} />
                      </Stack>
                    ) : <Typography variant="body2" sx={{ color: '#94a3b8' }}>No researcher identifiers added.</Typography>}
                  </Box>
                )}
              </CardContent>
            </Card>

            <Card sx={cardSx}>
              <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
                <SectionHeading
                  icon={ArticleIcon}
                  title="Publications"
                  subtitle={works.hasOrcid ? 'From their ORCID record, plus work published in Hospitium. Citation counts from OpenAlex.' : 'Work published in Hospitium. This researcher has not linked ORCID.'}
                  action={publications.length > 0 ? <Typography variant="caption" sx={{ color: MUTED, whiteSpace: 'nowrap', fontWeight: 600 }}>{publications.length} works</Typography> : null}
                />
                {works.orcidError && <Alert severity="info" sx={{ mb: 2, borderRadius: 2, py: 0 }}>{works.orcidError}</Alert>}
                <PublicationsTable works={publications} pageSize={10} emptyMessage={works.hasOrcid ? 'No works found on ORCID or in Hospitium' : 'No published works yet.'} />
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ width: { xs: '100%', lg: 340 }, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <ResearchExpertiseCard keywords={rp.keywords || []} editable={false} />
            <CitedByCard metrics={metrics} error={works.hasOrcid ? works.metricsError || 'No citation data found for this ORCID iD yet.' : 'No ORCID iD linked, so citation metrics are unavailable.'} source={works.metricsSource || 'OpenAlex'} />
            <PublicAccessCard metrics={metrics} />
            <CoauthorsCard metrics={metrics} profileBasePath="/institution/researcher" />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
