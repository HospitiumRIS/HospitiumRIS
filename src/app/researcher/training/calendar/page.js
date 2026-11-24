'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  Home as HomeIcon,
  Autorenew as RotateIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';

const PURPLE = '#8b6cbc';
const btn = { textTransform: 'none', fontWeight: 700 };
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const time = (v) => new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const longDay = (v) => new Date(v).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

function eventSx(e) {
  if (e.status === 'CANCELLED') return { bgcolor: '#f1f5f9', color: '#64748b', textDecoration: 'line-through' };
  if (e.role === 'facilitator') return { bgcolor: '#e0f2fe', color: '#075985' };
  return { bgcolor: alpha(PURPLE, 0.14), color: '#4c1d95' };
}

/** Month grid starting on Monday, 6 weeks. */
function monthCells(cursor) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - offset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

/**
 * Training calendar (#108): month and agenda views of the person's sessions, plus a
 * private feed link for Google, Outlook or Apple calendars.
 */
export default function TrainingCalendarPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [view, setView] = useState('month');
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [copied, setCopied] = useState(false);
  const [confirmRotate, setConfirmRotate] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/training/my/calendar', { cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Could not load your calendar');
      setData(json);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const byDay = useMemo(() => {
    const map = new Map();
    for (const e of data?.events || []) {
      const k = dayKey(new Date(e.start));
      map.set(k, [...(map.get(k) || []), e]);
    }
    return map;
  }, [data]);

  const agenda = useMemo(() => {
    const now = Date.now() - 2 * 60 * 60 * 1000;
    const groups = new Map();
    for (const e of (data?.events || []).filter((x) => new Date(x.end).getTime() >= now)) {
      const k = new Date(e.start).toDateString();
      groups.set(k, [...(groups.get(k) || []), e]);
    }
    return [...groups.entries()];
  }, [data]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(data.feed.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy. Select the link and copy it by hand.');
    }
  };

  const rotate = async () => {
    if (!confirmRotate) { setConfirmRotate(true); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/training/my/calendar/feed', { method: 'POST' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Could not make a new link');
      setData((d) => ({ ...d, feed: json.feed }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      setConfirmRotate(false);
    }
  };

  const today = dayKey(new Date());
  const cells = monthCells(cursor);
  const goEvent = (e) => router.push(e.role === 'facilitator' ? '/researcher/training/facilitating' : `/researcher/training/${e.trainingId}`);

  return (
    <Box>
      <PageHeader
        title="Training calendar"
        description="Your sessions by month or as a list, and a private link to add them to your own calendar."
        icon={<CalendarIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/researcher' },
          { label: 'Training', path: '/researcher/training' },
        ]}
      />
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Stack spacing={2}>
          {error ? <Alert severity="error" onClose={() => setError('')}>{error}</Alert> : null}
          {!data && !error ? <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress sx={{ color: PURPLE }} /></Box> : null}

          {data ? (
            <>
              <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flex: 1 }}>
                    {view === 'month' ? (
                      <>
                        <IconButton onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))} aria-label="Previous month"><PrevIcon /></IconButton>
                        <Typography variant="h6" sx={{ fontWeight: 800, minWidth: 170, textAlign: 'center' }}>
                          {cursor.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                        </Typography>
                        <IconButton onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))} aria-label="Next month"><NextIcon /></IconButton>
                        <Button size="small" onClick={() => { const d = new Date(); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)); }} sx={{ color: PURPLE, ...btn }}>Today</Button>
                      </>
                    ) : <Typography variant="h6" sx={{ fontWeight: 800 }}>Upcoming</Typography>}
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip size="small" label="Participant" sx={{ bgcolor: alpha(PURPLE, 0.14), color: '#4c1d95', fontWeight: 700 }} />
                    <Chip size="small" label="Facilitating" sx={{ bgcolor: '#e0f2fe', color: '#075985', fontWeight: 700 }} />
                    <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, v) => v && setView(v)}>
                      <ToggleButton value="month" sx={{ textTransform: 'none', px: 2 }}>Month</ToggleButton>
                      <ToggleButton value="agenda" sx={{ textTransform: 'none', px: 2 }}>Agenda</ToggleButton>
                    </ToggleButtonGroup>
                  </Stack>
                </Stack>

                {view === 'month' ? (
                  <Box sx={{ mt: 1.5, overflowX: 'auto' }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(92px, 1fr))', border: '1px solid', borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden', minWidth: 660 }}>
                      {WEEKDAYS.map((d) => (
                        <Box key={d} sx={{ p: 0.75, bgcolor: alpha(PURPLE, 0.06), textAlign: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>{d}</Typography>
                        </Box>
                      ))}
                      {cells.map((d, i) => {
                        const events = byDay.get(dayKey(d)) || [];
                        const inMonth = d.getMonth() === cursor.getMonth();
                        return (
                          <Box key={d.toISOString()} sx={{ minHeight: 96, p: 0.5, borderTop: i >= 7 ? '1px solid' : 'none', borderLeft: i % 7 ? '1px solid' : 'none', borderColor: 'divider', bgcolor: inMonth ? 'white' : '#fafafa' }}>
                            <Typography variant="caption" sx={{ fontWeight: dayKey(d) === today ? 800 : 500, color: dayKey(d) === today ? 'white' : inMonth ? 'text.primary' : 'text.disabled', bgcolor: dayKey(d) === today ? PURPLE : 'transparent', borderRadius: '50%', px: 0.6, py: 0.1 }}>
                              {d.getDate()}
                            </Typography>
                            <Stack spacing={0.4} sx={{ mt: 0.4 }}>
                              {events.slice(0, 3).map((e) => (
                                <Tooltip key={e.uid} title={`${time(e.start)}–${time(e.end)} · ${e.title}${e.location ? ` · ${e.location}` : ''}`}>
                                  <Box onClick={() => goEvent(e)} sx={{ ...eventSx(e), px: 0.5, py: 0.25, borderRadius: 0.75, fontSize: 11, lineHeight: 1.3, cursor: 'pointer', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                    {time(e.start)} {e.title}
                                  </Box>
                                </Tooltip>
                              ))}
                              {events.length > 3 ? (
                                <Typography variant="caption" color="text.secondary" sx={{ cursor: 'pointer' }} onClick={() => setView('agenda')}>+{events.length - 3} more</Typography>
                              ) : null}
                            </Stack>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                ) : (
                  <Stack spacing={2} sx={{ mt: 1.5 }}>
                    {agenda.length ? agenda.map(([day, events]) => (
                      <Box key={day}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.75 }}>{longDay(events[0].start)}</Typography>
                        <Stack spacing={0.75}>
                          {events.map((e) => (
                            <Stack key={e.uid} direction="row" spacing={1.5} alignItems="center" onClick={() => goEvent(e)} sx={{ p: 1.25, borderRadius: 1.5, border: '1px solid', borderColor: 'divider', cursor: 'pointer', '&:hover': { borderColor: alpha(PURPLE, 0.5) } }}>
                              <Box sx={{ width: 4, alignSelf: 'stretch', borderRadius: 2, ...eventSx(e) }} />
                              <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 110 }}>{time(e.start)}–{time(e.end)}</Typography>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, ...(e.status === 'CANCELLED' ? { textDecoration: 'line-through', color: 'text.secondary' } : {}) }}>{e.title}</Typography>
                                {e.location ? <Typography variant="caption" color="text.secondary">{e.location}</Typography> : null}
                              </Box>
                              {e.status === 'CANCELLED' ? <Chip size="small" label="Cancelled" /> : null}
                            </Stack>
                          ))}
                        </Stack>
                      </Box>
                    )) : <Typography variant="body2" color="text.secondary">No upcoming sessions.</Typography>}
                  </Stack>
                )}
              </Paper>

              <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Add to your calendar</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Subscribe with this private link in Google Calendar (Other calendars › From URL), Outlook (Add calendar › Subscribe from web) or Apple Calendar (File › New calendar subscription). New and changed sessions appear automatically; it can take a few hours to refresh.
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={data.feed.url}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button size="small" startIcon={<CopyIcon />} onClick={copy} sx={{ color: PURPLE, ...btn }}>{copied ? 'Copied' : 'Copy'}</Button>
                      </InputAdornment>
                    ),
                  }}
                  onFocus={(e) => e.target.select()}
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1.5 }} alignItems={{ sm: 'center' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                    Anyone with this link can see your session times and places, so keep it private.
                    {data.feed.lastUsedAt ? ` Last used ${new Date(data.feed.lastUsedAt).toLocaleString('en-GB')}.` : ''}
                  </Typography>
                  <Button size="small" startIcon={<DownloadIcon />} component="a" href="/api/training/my/calendar.ics" sx={{ color: PURPLE, ...btn }}>Download .ics</Button>
                  <Button size="small" color={confirmRotate ? 'error' : 'inherit'} startIcon={<RotateIcon />} disabled={busy} onClick={rotate} sx={btn}>
                    {confirmRotate ? 'Tap again: the old link stops working' : 'Make a new link'}
                  </Button>
                </Stack>
              </Paper>
            </>
          ) : null}
        </Stack>
      </Container>
    </Box>
  );
}
