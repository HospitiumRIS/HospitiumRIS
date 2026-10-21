'use client';

import React, { useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Link as MuiLink,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
} from '@mui/material';
import { ChevronRight as ChevronRightIcon } from '@mui/icons-material';

/**
 * Google-Scholar-style profile widgets for HospitiumRIS.
 * Data comes from GET /api/researcher/profile/works (OpenAlex + ORCID + Hospitium).
 */

const PURPLE = '#8b6cbc';
const PURPLE_DARK = '#7a5caa';
const INK = '#1e293b';
const MUTED = '#64748b';
const LINE = '#e2e8f0';

const cardSx = { borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', bgcolor: 'white' };

const fmt = (n) => (typeof n === 'number' ? n.toLocaleString() : '—');

function SectionTitle({ children, action }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: INK, fontSize: '1rem' }}>
        {children}
      </Typography>
      {action}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Cited by: table + citations-per-year chart
// ---------------------------------------------------------------------------

function CitationsChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  // round the axis to a friendly step (like Scholar's 0/80/160/240/320)
  const step = Math.max(1, Math.ceil(max / 4 / 5) * 5);
  const top = step * 4;
  const ticks = [4, 3, 2, 1, 0].map((i) => i * step);
  const height = 150;

  return (
    <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
      <Box sx={{ flex: 1, position: 'relative', height: height + 22 }}>
        {/* gridlines */}
        {ticks.map((t) => (
          <Box
            key={t}
            sx={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: height - (t / top) * height,
              borderTop: `1px solid ${t === 0 ? '#cbd5e1' : '#f1f5f9'}`,
            }}
          />
        ))}
        {/* bars */}
        <Box sx={{ position: 'absolute', inset: 0, bottom: 22, display: 'flex', alignItems: 'flex-end', gap: 1, px: 0.5 }}>
          {data.map((d) => (
            <Tooltip key={d.year} title={`${d.year}: ${fmt(d.count)} citations`} arrow placement="top">
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                <Box
                  sx={{
                    height: `${(d.count / top) * 100}%`,
                    minHeight: d.count > 0 ? 2 : 0,
                    bgcolor: '#9ca3af',
                    borderRadius: '2px 2px 0 0',
                    transition: 'background-color .15s',
                    '&:hover': { bgcolor: PURPLE },
                  }}
                />
              </Box>
            </Tooltip>
          ))}
        </Box>
        {/* year labels */}
        <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', gap: 1, px: 0.5 }}>
          {data.map((d) => (
            <Typography key={d.year} variant="caption" sx={{ flex: 1, textAlign: 'center', color: MUTED, fontSize: '0.68rem' }}>
              {d.year}
            </Typography>
          ))}
        </Box>
      </Box>
      {/* y axis */}
      <Box sx={{ position: 'relative', width: 32, height: height + 22 }}>
        {ticks.map((t) => (
          <Typography
            key={t}
            variant="caption"
            sx={{ position: 'absolute', right: 0, top: height - (t / top) * height - 8, color: MUTED, fontSize: '0.7rem' }}
          >
            {t}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

export function CitedByCard({ metrics, error, source = 'OpenAlex' }) {
  if (!metrics) {
    return (
      <Card sx={cardSx}>
        <CardContent sx={{ p: 3 }}>
          <SectionTitle>Cited by</SectionTitle>
          <Typography variant="body2" sx={{ color: MUTED, fontSize: '0.813rem' }}>
            {error || 'Add your ORCID iD to your profile to see citation metrics.'}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const { citedBy, sinceYear, citationsPerYear } = metrics;
  const rows = [
    { label: 'Citations', ...citedBy.citations, hint: 'Total times your works have been cited' },
    { label: 'h-index', ...citedBy.hIndex, hint: 'h works each cited at least h times' },
    { label: 'i10-index', ...citedBy.i10Index, hint: 'Works with at least 10 citations' },
  ];

  return (
    <Card sx={cardSx}>
      <CardContent sx={{ p: 3 }}>
        <SectionTitle>Cited by</SectionTitle>
        <Table size="small" sx={{ '& td, & th': { borderColor: LINE, px: 0, py: 0.75 } }}>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell align="right" sx={{ color: MUTED, fontWeight: 500 }}>All</TableCell>
              <TableCell align="right" sx={{ color: MUTED, fontWeight: 500 }}>Since {sinceYear}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.label}>
                <TableCell sx={{ borderBottom: 'none', color: INK }}>
                  <Tooltip title={r.hint} placement="left">
                    <span>{r.label}</span>
                  </Tooltip>
                </TableCell>
                <TableCell align="right" sx={{ borderBottom: 'none', color: INK }}>{fmt(r.all)}</TableCell>
                <TableCell align="right" sx={{ borderBottom: 'none', color: INK }}>{fmt(r.since)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <CitationsChart data={citationsPerYear} />
        <Typography variant="caption" sx={{ display: 'block', color: '#94a3b8', mt: 1.5, fontSize: '0.68rem' }}>
          Source: {source}. Counts may differ from Google Scholar.
        </Typography>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Public access (open access availability)
// ---------------------------------------------------------------------------

export function PublicAccessCard({ metrics }) {
  if (!metrics) return null;
  const { available, notAvailable } = metrics.openAccess;
  const total = available + notAvailable || 1;
  return (
    <Card sx={cardSx}>
      <CardContent sx={{ p: 3 }}>
        <SectionTitle>Public access</SectionTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
          <Typography variant="body2" sx={{ color: MUTED, fontSize: '0.813rem' }}>
            {fmt(notAvailable)} article{notAvailable === 1 ? '' : 's'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#15803d', fontSize: '0.813rem' }}>
            {fmt(available)} article{available === 1 ? '' : 's'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', height: 5, borderRadius: 1, overflow: 'hidden', bgcolor: '#e5e7eb' }}>
          <Box sx={{ width: `${(notAvailable / total) * 100}%`, bgcolor: '#9ca3af' }} />
          <Box sx={{ width: `${(available / total) * 100}%`, bgcolor: '#15803d' }} />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.75 }}>
          <Typography variant="caption" sx={{ color: MUTED }}>not open access</Typography>
          <Typography variant="caption" sx={{ color: '#15803d' }}>open access</Typography>
        </Box>
        <Typography variant="caption" sx={{ display: 'block', color: '#94a3b8', mt: 1.5 }}>
          Based on open-access availability of each work
        </Typography>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Co-authors
// ---------------------------------------------------------------------------

function initials(name) {
  return String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

function coauthorHref(c, profileBasePath = '/researcher/profile') {
  if (c.hospitiumUserId) return { href: `${profileBasePath}/${c.hospitiumUserId}`, external: false };
  if (c.orcid) return { href: `https://orcid.org/${c.orcid}`, external: true };
  if (c.openAlexId) return { href: c.openAlexId.replace('https://openalex.org/', 'https://openalex.org/authors/'), external: true };
  return { href: null, external: false };
}

export function CoauthorsCard({ metrics, initialCount = 8, profileBasePath = '/researcher/profile' }) {
  const [showAll, setShowAll] = useState(false);
  const coauthors = metrics?.coauthors || [];
  if (!coauthors.length) return null;
  const shown = showAll ? coauthors : coauthors.slice(0, initialCount);

  return (
    <Card sx={cardSx}>
      <CardContent sx={{ p: 3 }}>
        <SectionTitle
          action={
            coauthors.length > initialCount && (
              <Button
                size="small"
                onClick={() => setShowAll((v) => !v)}
                sx={{ color: PURPLE, fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', minWidth: 0 }}
              >
                {showAll ? 'Show less' : 'View all'}
              </Button>
            )
          }
        >
          Co-authors
        </SectionTitle>
        <Box sx={{ borderTop: `1px solid ${LINE}` }}>
          {shown.map((c) => {
            const { href, external } = coauthorHref(c, profileBasePath);
            return (
              <Box
                key={c.openAlexId}
                component={href ? 'a' : 'div'}
                href={href || undefined}
                target={external ? '_blank' : undefined}
                rel={external ? 'noopener noreferrer' : undefined}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  py: 1.25,
                  px: 0.5,
                  textDecoration: 'none',
                  borderRadius: 1,
                  '&:hover': href ? { bgcolor: 'rgba(139,108,188,0.06)' } : {},
                }}
              >
                <Avatar sx={{ width: 34, height: 34, fontSize: 13, fontWeight: 700, bgcolor: 'rgba(139,108,188,0.14)', color: PURPLE_DARK }}>
                  {initials(c.name)}
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Typography variant="body2" noWrap sx={{ color: INK, fontWeight: 500 }}>
                      {c.name}
                    </Typography>
                    {c.hospitiumUserId && (
                      <Chip label="Hospitium" size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, bgcolor: 'rgba(139,108,188,0.12)', color: PURPLE_DARK }} />
                    )}
                  </Box>
                  <Typography variant="caption" noWrap sx={{ color: MUTED, display: 'block' }}>
                    {c.institution || `${c.sharedWorks} shared work${c.sharedWorks === 1 ? '' : 's'}`}
                  </Typography>
                </Box>
                <Tooltip title={`${c.sharedWorks} shared work${c.sharedWorks === 1 ? '' : 's'}`}>
                  <ChevronRightIcon sx={{ color: '#94a3b8' }} />
                </Tooltip>
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Publications table (Title / Cited by / Year)
// ---------------------------------------------------------------------------

const SOURCE_CHIP = {
  ORCID: { label: 'ORCID', bg: 'rgba(166, 206, 57, 0.18)', color: '#4d6b0f' },
  HOSPITIUM: { label: 'Hospitium', bg: 'rgba(139, 108, 188, 0.12)', color: PURPLE_DARK },
};

function authorLine(authors) {
  if (!authors?.length) return null;
  return authors.length > 6 ? `${authors.slice(0, 6).join(', ')}, ...` : authors.join(', ');
}

export function PublicationsTable({ works = [], pageSize = 10, emptyMessage = 'No works found' }) {
  const [sortBy, setSortBy] = useState('citedBy');
  const [visible, setVisible] = useState(pageSize);

  const sorted = useMemo(() => {
    const list = [...works];
    if (sortBy === 'citedBy') {
      list.sort((a, b) => (b.citedBy ?? -1) - (a.citedBy ?? -1) || (b.year || 0) - (a.year || 0));
    } else {
      list.sort((a, b) => (b.year || 0) - (a.year || 0) || (b.citedBy ?? -1) - (a.citedBy ?? -1));
    }
    return list;
  }, [works, sortBy]);

  if (!works.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4, fontSize: '0.813rem' }}>
        {emptyMessage}
      </Typography>
    );
  }

  const headSx = { color: MUTED, fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.04em', textTransform: 'uppercase', bgcolor: '#f8fafc', borderColor: LINE };

  return (
    <Box>
      <Table size="small" sx={{ '& td': { borderColor: LINE, verticalAlign: 'top', py: 1.5 } }}>
        <TableHead>
          <TableRow>
            <TableCell sx={headSx}>Title</TableCell>
            <TableCell align="right" sx={{ ...headSx, width: 90 }}>
              <TableSortLabel active={sortBy === 'citedBy'} direction="desc" onClick={() => setSortBy('citedBy')}>
                Cited by
              </TableSortLabel>
            </TableCell>
            <TableCell align="right" sx={{ ...headSx, width: 70 }}>
              <TableSortLabel active={sortBy === 'year'} direction="desc" onClick={() => setSortBy('year')}>
                Year
              </TableSortLabel>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.slice(0, visible).map((w) => {
            const href = w.doi ? `https://doi.org/${w.doi}` : w.url;
            const authors = authorLine(w.authors);
            return (
              <TableRow key={w.id} hover>
                <TableCell>
                  {href ? (
                    <MuiLink href={href} target="_blank" rel="noopener noreferrer" underline="hover" sx={{ color: PURPLE_DARK, fontWeight: 500, fontSize: '0.9rem', lineHeight: 1.4 }}>
                      {w.title}
                    </MuiLink>
                  ) : (
                    <Typography sx={{ color: INK, fontWeight: 500, fontSize: '0.9rem', lineHeight: 1.4 }}>{w.title}</Typography>
                  )}
                  {authors && (
                    <Typography variant="caption" sx={{ display: 'block', color: MUTED, mt: 0.25 }}>
                      {authors}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.75, mt: 0.25 }}>
                    {(w.venue || w.journal) && (
                      <Typography variant="caption" sx={{ color: MUTED }}>
                        {w.venue || w.journal}
                      </Typography>
                    )}
                    {(w.sources || []).map((s) =>
                      SOURCE_CHIP[s] ? (
                        <Chip
                          key={s}
                          label={SOURCE_CHIP[s].label}
                          size="small"
                          sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, bgcolor: SOURCE_CHIP[s].bg, color: SOURCE_CHIP[s].color }}
                        />
                      ) : null
                    )}
                  </Box>
                </TableCell>
                <TableCell align="right" sx={{ color: PURPLE_DARK, fontSize: '0.875rem' }}>
                  {w.citedBy ?? '—'}
                </TableCell>
                <TableCell align="right" sx={{ color: INK, fontSize: '0.875rem' }}>
                  {w.year || '—'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {visible < sorted.length && (
        <Box sx={{ textAlign: 'center', mt: 1.5 }}>
          <Button onClick={() => setVisible((v) => v + pageSize)} sx={{ color: PURPLE, fontWeight: 600, textTransform: 'none' }}>
            Show more ({sorted.length - visible} remaining)
          </Button>
        </Box>
      )}
    </Box>
  );
}
