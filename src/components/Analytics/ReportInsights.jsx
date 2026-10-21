'use client';

/**
 * "Analyst summary" panel for researcher reports. Loads the page's insights endpoint
 * independently so the report renders first. Handles the AI and fallback shapes from
 * services/{impact,projects,compliance}InsightsService.js.
 */

import React, { useEffect, useState } from 'react';
import { Box, Chip, Paper, Skeleton, Stack, Typography, alpha } from '@mui/material';
import { AutoAwesome as SparkIcon, Flag as PriorityIcon, TipsAndUpdates as TipIcon } from '@mui/icons-material';

const PURPLE = '#8b6cbc';
const PURPLE_DARK = '#6d5499';
const INK = '#1f2937';
const MUTED = '#64748b';

const asText = (r) => (typeof r === 'string' ? { title: r, detail: '' } : { title: r?.title || r?.action || '', detail: r?.detail || r?.description || r?.reason || '' });

export default function ReportInsights({ endpoint, title = 'Analyst summary' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(endpoint, { credentials: 'include' });
        if (!res.ok) throw new Error('insights unavailable');
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [endpoint]);

  if (failed) return null;

  const recommendations = (data?.recommendations || data?.growthRecommendations || []).map(asText).filter((r) => r.title);
  const callout = data?.priorityCallout?.title ? data.priorityCallout : data?.standoutPublication?.title ? { title: data.standoutPublication.title, detail: data.standoutPublication.reason } : null;
  const calloutLabel = data?.standoutPublication?.title ? 'Standout publication' : 'Priority';

  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: alpha(PURPLE, 0.25), background: `linear-gradient(135deg, ${alpha(PURPLE, 0.05)} 0%, #ffffff 70%)` }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
        <SparkIcon sx={{ color: PURPLE, fontSize: 20 }} />
        <Typography sx={{ fontWeight: 700, color: INK }}>{title}</Typography>
        {data ? (
          <Chip size="small" label={data.isFallback ? 'Rule-based' : 'AI-assisted'} sx={{ height: 20, fontSize: '0.66rem', fontWeight: 700, bgcolor: alpha(PURPLE, 0.1), color: PURPLE_DARK }} />
        ) : null}
      </Stack>
      {loading ? (
        <Stack spacing={1}>
          <Skeleton width="92%" />
          <Skeleton width="80%" />
          <Skeleton width="60%" />
        </Stack>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: callout ? '1.4fr 1fr' : '1fr' }, gap: 2.5 }}>
          <Box>
            {data?.narrativeSummary ? (
              <Typography sx={{ color: INK, lineHeight: 1.7, fontSize: '0.95rem' }}>{data.narrativeSummary}</Typography>
            ) : null}
            {recommendations.length ? (
              <Stack spacing={0.75} sx={{ mt: 1.5 }}>
                {recommendations.slice(0, 4).map((r, i) => (
                  <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
                    <TipIcon sx={{ fontSize: 16, color: PURPLE, mt: 0.3 }} />
                    <Typography variant="body2" sx={{ color: INK }}>
                      <strong>{r.title}</strong>{r.detail ? ` ${r.detail}` : ''}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            ) : null}
          </Box>
          {callout ? (
            <Box sx={{ p: 2, borderRadius: 1.5, bgcolor: 'white', border: '1px solid', borderColor: alpha(PURPLE, 0.2) }}>
              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5 }}>
                <PriorityIcon sx={{ fontSize: 16, color: PURPLE_DARK }} />
                <Typography variant="caption" sx={{ fontWeight: 800, color: PURPLE_DARK, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{calloutLabel}</Typography>
              </Stack>
              <Typography sx={{ fontWeight: 700, color: INK, fontSize: '0.92rem' }}>{callout.title}</Typography>
              {callout.detail ? <Typography variant="body2" sx={{ color: MUTED, mt: 0.5 }}>{callout.detail}</Typography> : null}
            </Box>
          ) : null}
        </Box>
      )}
      <Typography variant="caption" sx={{ color: MUTED, display: 'block', mt: 1.5 }}>
        Generated from the figures in this report. Check key numbers before using them externally.
      </Typography>
    </Paper>
  );
}
