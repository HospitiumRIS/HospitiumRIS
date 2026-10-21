'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  Link as MuiLink,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Analytics as AnalyticsIcon,
  Business as BusinessIcon,
  FormatQuote as CitationIcon,
  Groups as CollabIcon,
  Hub as NetworkIcon,
  LockOpen as OpenAccessIcon,
  MenuBook as WorksIcon,
  OpenInNew as OpenIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon,
  ShowChart as TrendIcon,
  TrendingUp as ImpactIcon,
  WorkspacePremium as HIndexIcon,
  LibraryBooks as VenueIcon,
  Apartment as PlatformIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import {
  EmptyState,
  INK,
  KpiTile,
  MUTED,
  PURPLE,
  SectionCard,
  SectionNav,
  StatusPill,
  chartTooltip,
} from '@/components/Analytics/AnalyticsUI';
import ReportInsights from '@/components/Analytics/ReportInsights';

const COLORS = ['#8b6cbc', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#0891b2', '#ec4899', '#84cc16'];
const COLLAB = '#0284c7';
const fmt = (n) => (n === null || n === undefined ? '—' : typeof n === 'number' ? n.toLocaleString() : n);
const initials = (name) => String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

export default function ResearchImpactReport() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [active, setActive] = useState('trend');
  const [worksSort, setWorksSort] = useState('cited');
  const [showAllWorks, setShowAllWorks] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/researcher/analytics/impact', { credentials: 'include' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to load impact report');
      setData(json);
    } catch (err) {
      setError(err.message || 'Failed to load impact report');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const goTo = (id) => { setActive(id); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  const works = useMemo(() => {
    const list = [...(data?.topPublications || [])];
    if (worksSort === 'recent') list.sort((a, b) => (b.year || 0) - (a.year || 0));
    if (worksSort === 'rate') list.sort((a, b) => (b.citationsPerYear || 0) - (a.citationsPerYear || 0));
    return showAllWorks ? list : list.slice(0, 10);
  }, [data, worksSort, showAllWorks]);

  const o = data?.overview;
  const ds = data?.dataSources;
  const yrs = data?.recentWindowYears || 5;
  const oaData = data?.openAccess ? [
    { name: 'Open access', value: data.openAccess.available, color: '#22c55e' },
    { name: 'Not open access', value: data.openAccess.notAvailable, color: '#cbd5e1' },
  ].filter((d) => d.value > 0) : [];

  const sections = [
    { id: 'trend', label: 'Output & citations', icon: <TrendIcon /> },
    { id: 'works', label: 'Most influential works', icon: <WorksIcon /> },
    { id: 'venues', label: 'Venues & access', icon: <VenueIcon /> },
    { id: 'collaboration', label: 'Collaboration', icon: <CollabIcon /> },
    { id: 'platform', label: 'Work on Hospitium', icon: <PlatformIcon /> },
  ];

  return (
    <Box sx={{ bgcolor: '#f6f7fb', minHeight: '100vh', pb: 6, '@media print': { bgcolor: 'white' } }}>
      <PageHeader
        title="Research Impact Report"
        description="Your publication record, citation performance and collaboration network"
        icon={<ImpactIcon />}
        breadcrumbs={[
          { label: 'Dashboard', path: '/researcher', icon: <BusinessIcon /> },
          { label: 'Analytics', path: '/researcher/analytics', icon: <AnalyticsIcon /> },
          { label: 'Research Impact' },
        ]}
        actionButton={(
          <Stack direction="row" spacing={1} className="no-print">
            <Tooltip title="Refresh"><span><IconButton onClick={load} disabled={loading} sx={{ color: 'white' }}><RefreshIcon /></IconButton></span></Tooltip>
            <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()} disabled={!data} sx={{ bgcolor: 'white', color: '#6d5499', textTransform: 'none', fontWeight: 700, boxShadow: 'none', '&:hover': { bgcolor: '#f5f5f5', boxShadow: 'none' } }}>
              Print / save PDF
            </Button>
          </Stack>
        )}
      />

      <Container maxWidth="xl" sx={{ py: 3 }}>
        {error ? <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} action={<Button color="inherit" size="small" onClick={load}>Retry</Button>}>{error}</Alert> : null}

        {ds ? (
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 2.5 }} alignItems={{ md: 'center' }}>
            <Typography variant="caption" sx={{ color: MUTED, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Data sources</Typography>
            <StatusPill label={ds.hasOrcid ? (ds.orcidError ? 'ORCID unavailable' : `ORCID · ${ds.counts?.orcid ?? 0} works`) : 'ORCID not linked'} tone={ds.hasOrcid && !ds.orcidError ? 'good' : 'warn'} />
            <StatusPill label={ds.metricsError ? 'OpenAlex unavailable' : ds.hasOrcid ? 'OpenAlex citations' : 'Citations need ORCID'} tone={ds.metricsError || !ds.hasOrcid ? 'warn' : 'good'} />
            <StatusPill label={`Hospitium · ${data.platform?.totals?.all ?? 0} items`} tone="brand" />
            {!ds.hasOrcid ? (
              <Button size="small" onClick={() => router.push('/researcher/profile?tab=ids')} sx={{ textTransform: 'none', fontWeight: 700, color: '#6d5499' }}>Link ORCID to complete this report</Button>
            ) : null}
          </Stack>
        ) : null}

        {loading && !data ? (
          <Stack spacing={2}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' }, gap: 2 }}>
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} variant="rounded" height={118} />)}
            </Box>
            <Skeleton variant="rounded" height={140} />
            <Skeleton variant="rounded" height={320} />
          </Stack>
        ) : data ? (
          <Stack spacing={3}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' }, gap: 2 }}>
              <KpiTile label="Publications" value={fmt(o.totalPublications)} sub={`${o.recentPublications} in last ${yrs} yrs`} icon={<WorksIcon />} hint="Works on your ORCID record plus work published in Hospitium." />
              <KpiTile label="Citations" value={fmt(o.totalCitations)} sub={o.citationsRecent !== null ? `${fmt(o.citationsRecent)} in last ${yrs} yrs` : 'source unavailable'} delta={o.citationGrowth} icon={<CitationIcon />} hint="Change compares citations received last year with the year before." />
              <KpiTile label="h-index" value={fmt(o.hIndex)} sub={o.hIndexRecent !== null ? `${o.hIndexRecent} for last ${yrs} yrs` : ''} icon={<HIndexIcon />} hint="h papers each cited at least h times." />
              <KpiTile label="i10-index" value={fmt(o.i10Index)} sub={o.i10IndexRecent !== null ? `${o.i10IndexRecent} for last ${yrs} yrs` : ''} icon={<HIndexIcon />} hint="Works with at least 10 citations." />
              <KpiTile label="Open access" value={o.openAccessRate === null ? '—' : `${o.openAccessRate}%`} sub="of works with access data" icon={<OpenAccessIcon />} tone={o.openAccessRate === null ? 'neutral' : o.openAccessRate >= 60 ? 'good' : 'warn'} />
              <KpiTile label="Co-authors" value={fmt(o.collaborators)} sub={o.avgCitationsPerWork !== null ? `${o.avgCitationsPerWork} citations per work` : ''} icon={<NetworkIcon />} tone="info" />
            </Box>

            <ReportInsights endpoint="/api/researcher/analytics/impact/insights" />

            <SectionNav sections={sections} active={active} onSelect={goTo} />

            <SectionCard id="trend" icon={<TrendIcon />} title="Output and citations over time" subtitle="Bars: works published each year. Line: citations received each year (OpenAlex, recent years).">
              {data.trajectory.length ? (
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={data.trajectory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <RTooltip {...chartTooltip} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="publications" name="Works published" fill={alpha(PURPLE, 0.55)} radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="citations" name="Citations received" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 3 }} connectNulls={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : <EmptyState>No dated works yet. Link ORCID or publish through Hospitium to build this view.</EmptyState>}
              {o.citedWorksRate !== null ? (
                <Typography variant="body2" sx={{ color: MUTED, mt: 1.5 }}>
                  {o.citedWorksRate}% of your works with citation data have been cited at least once.
                </Typography>
              ) : null}
            </SectionCard>

            <SectionCard
              id="works"
              icon={<WorksIcon />}
              title="Most influential works"
              subtitle="Ranked by citations. Citations per year adjusts for how long a work has been available."
              action={(
                <ToggleButtonGroup size="small" exclusive value={worksSort} onChange={(_, v) => v && setWorksSort(v)} sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 600 } }}>
                  <ToggleButton value="cited">Most cited</ToggleButton>
                  <ToggleButton value="rate">Citations / year</ToggleButton>
                  <ToggleButton value="recent">Most recent</ToggleButton>
                </ToggleButtonGroup>
              )}
            >
              {works.length ? (
                <>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {['#', 'Work', 'Year', 'Citations', 'Per year', 'Access'].map((h, i) => (
                            <TableCell key={h} align={i >= 2 ? 'right' : 'left'} sx={{ fontWeight: 700, color: MUTED, fontSize: '0.75rem' }}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {works.map((w, i) => {
                          const href = w.doi ? `https://doi.org/${w.doi}` : w.url;
                          return (
                            <TableRow key={w.id} hover>
                              <TableCell sx={{ color: MUTED, width: 32 }}>{i + 1}</TableCell>
                              <TableCell sx={{ maxWidth: 560 }}>
                                {href ? (
                                  <MuiLink href={href} target="_blank" rel="noopener noreferrer" underline="hover" sx={{ color: '#6d5499', fontWeight: 600, fontSize: '0.88rem' }}>
                                    {w.title} <OpenIcon sx={{ fontSize: 12, verticalAlign: 'middle' }} />
                                  </MuiLink>
                                ) : <Typography sx={{ fontWeight: 600, color: INK, fontSize: '0.88rem' }}>{w.title}</Typography>}
                                <Typography variant="caption" sx={{ color: MUTED, display: 'block' }} noWrap>
                                  {[w.journal, w.type, w.authors?.length ? `${w.authors.slice(0, 3).join(', ')}${w.authors.length > 3 ? ' et al.' : ''}` : null].filter(Boolean).join(' · ')}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">{w.year || '—'}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 800, color: INK }}>{fmt(w.citations)}</TableCell>
                              <TableCell align="right">{fmt(w.citationsPerYear)}</TableCell>
                              <TableCell align="right">
                                {w.isOpenAccess === null ? <Typography variant="caption" sx={{ color: '#cbd5e1' }}>—</Typography> : <StatusPill label={w.isOpenAccess ? 'Open' : 'Closed'} tone={w.isOpenAccess ? 'good' : 'neutral'} />}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {(data.topPublications || []).length > 10 ? (
                    <Button size="small" onClick={() => setShowAllWorks((v) => !v)} sx={{ mt: 1, textTransform: 'none', fontWeight: 700, color: '#6d5499' }} className="no-print">
                      {showAllWorks ? 'Show top 10' : `Show top ${data.topPublications.length}`}
                    </Button>
                  ) : null}
                </>
              ) : <EmptyState>No works found yet.</EmptyState>}
            </SectionCard>

            <SectionCard id="venues" icon={<VenueIcon />} title="Where you publish" subtitle="Most frequent venues, output by type, and open-access share.">
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.4fr 1fr 1fr' }, gap: 3 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Top venues</Typography>
                  {data.topVenues.length ? (
                    <ResponsiveContainer width="100%" height={Math.max(180, data.topVenues.length * 34)}>
                      <BarChart data={data.topVenues} layout="vertical" margin={{ left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                        <YAxis type="category" dataKey="venue" width={170} tick={{ fontSize: 10 }} />
                        <RTooltip {...chartTooltip} />
                        <Bar dataKey="works" name="Works" fill={PURPLE} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <EmptyState height={180}>No venue information yet.</EmptyState>}
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Output by type</Typography>
                  {data.workTypes.length ? (
                    <Stack spacing={1}>
                      {data.workTypes.slice(0, 7).map((t, i) => (
                        <Stack key={t.type} direction="row" alignItems="center" spacing={1}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: COLORS[i % COLORS.length] }} />
                          <Typography variant="body2" sx={{ flex: 1 }}>{t.type}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{t.count}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                  ) : <EmptyState height={180}>No works yet.</EmptyState>}
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Open access</Typography>
                  {oaData.length ? (
                    <>
                      <ResponsiveContainer width="100%" height={170}>
                        <PieChart>
                          <Pie data={oaData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2}>
                            {oaData.map((d) => <Cell key={d.name} fill={d.color} />)}
                          </Pie>
                          <RTooltip {...chartTooltip} />
                        </PieChart>
                      </ResponsiveContainer>
                      <Typography variant="body2" sx={{ color: MUTED, textAlign: 'center' }}>
                        {data.openAccess.available} of {data.openAccess.available + data.openAccess.notAvailable} works freely available
                      </Typography>
                    </>
                  ) : <EmptyState height={170}>Access data comes from OpenAlex once ORCID is linked.</EmptyState>}
                </Box>
              </Box>
            </SectionCard>

            <SectionCard id="collaboration" icon={<CollabIcon />} title="Collaboration network" subtitle="Your most frequent co-authors and their institutions (OpenAlex). Co-authors on Hospitium link to their profile.">
              {data.collaborationNetwork.length ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.3fr 1fr' }, gap: 3 }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
                    {data.collaborationNetwork.map((c) => {
                      const href = c.hospitiumUserId ? `/researcher/profile/${c.hospitiumUserId}` : c.orcid ? `https://orcid.org/${c.orcid}` : null;
                      return (
                        <Box
                          key={`${c.name}-${c.openAlexId}`}
                          component={href ? 'a' : 'div'}
                          href={href || undefined}
                          target={href && !c.hospitiumUserId ? '_blank' : undefined}
                          rel="noopener noreferrer"
                          sx={{ display: 'flex', gap: 1.25, alignItems: 'center', p: 1.25, borderRadius: 1.5, border: '1px solid #e2e8f0', textDecoration: 'none', color: 'inherit', '&:hover': href ? { borderColor: alpha(PURPLE, 0.6) } : {} }}
                        >
                          <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', fontWeight: 700, bgcolor: alpha(PURPLE, 0.14), color: '#6d5499' }}>{initials(c.name)}</Avatar>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: INK }} noWrap>{c.name}</Typography>
                            <Typography variant="caption" sx={{ color: MUTED }} noWrap>{c.institution || 'Institution unknown'}</Typography>
                          </Box>
                          <Stack alignItems="flex-end">
                            <Typography variant="body2" sx={{ fontWeight: 800, color: INK }}>{c.sharedWorks}</Typography>
                            <Typography variant="caption" sx={{ color: MUTED, fontSize: '0.65rem' }}>shared</Typography>
                          </Stack>
                          {c.hospitiumUserId ? <Chip size="small" label="On Hospitium" sx={{ height: 18, fontSize: '0.6rem', bgcolor: alpha(PURPLE, 0.1), color: '#6d5499' }} /> : null}
                        </Box>
                      );
                    })}
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Collaborating institutions</Typography>
                    {data.collaboratingInstitutions.length ? (
                      <ResponsiveContainer width="100%" height={Math.max(180, data.collaboratingInstitutions.length * 34)}>
                        <BarChart data={data.collaboratingInstitutions} layout="vertical" margin={{ left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                          <YAxis type="category" dataKey="institution" width={170} tick={{ fontSize: 10 }} />
                          <RTooltip {...chartTooltip} formatter={(v) => [v, 'Shared works']} />
                          <Bar dataKey="sharedWorks" fill={COLLAB} radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <EmptyState height={180}>No institution data for co-authors.</EmptyState>}
                  </Box>
                </Box>
              ) : <EmptyState>Co-author data comes from OpenAlex once your ORCID iD is linked.</EmptyState>}
            </SectionCard>

            <SectionCard id="platform" icon={<PlatformIcon />} title="Your work on Hospitium" subtitle="Items you lead and items you contribute to as co-author, collaborator or co-investigator.">
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
                {[
                  ['Publications', data.platform.publications.lead, data.platform.publications.coauthor, 'Lead', 'Co-author', '/researcher/publications/manage'],
                  ['Manuscripts', data.platform.manuscripts.lead, data.platform.manuscripts.collaborator, 'Lead', 'Collaborator', '/researcher/publications/collaborate'],
                  ['Proposals', data.platform.proposals.pi, data.platform.proposals.coInvestigator, 'PI', 'Co-investigator', '/researcher/projects/proposals/list'],
                ].map(([label, lead, collab, leadLabel, collabLabel, href]) => (
                  <Box key={label} onClick={() => router.push(href)} sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0', cursor: 'pointer', '&:hover': { borderColor: alpha(PURPLE, 0.6) } }}>
                    <Typography variant="caption" sx={{ color: MUTED, fontWeight: 700 }}>{label}</Typography>
                    <Typography sx={{ fontWeight: 800, color: INK, fontSize: '1.5rem' }}>{lead + collab}</Typography>
                    <Box sx={{ height: 6, borderRadius: 3, bgcolor: '#f1f5f9', overflow: 'hidden', display: 'flex', my: 0.75 }}>
                      <Box sx={{ flex: lead || 0, bgcolor: PURPLE }} />
                      <Box sx={{ flex: collab || 0, bgcolor: COLLAB }} />
                    </Box>
                    <Stack direction="row" spacing={1.5}>
                      <Typography variant="caption" sx={{ color: '#6d5499', fontWeight: 600 }}>{lead} {leadLabel}</Typography>
                      <Typography variant="caption" sx={{ color: COLLAB, fontWeight: 600 }}>{collab} {collabLabel}</Typography>
                    </Stack>
                  </Box>
                ))}
              </Box>
            </SectionCard>

            <Typography variant="caption" sx={{ color: MUTED }}>
              Report generated {new Date(data.meta.generatedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}. Citation figures from {ds?.metricsSource || 'OpenAlex'} may differ from Google Scholar or Scopus.
            </Typography>
          </Stack>
        ) : null}
      </Container>
    </Box>
  );
}
