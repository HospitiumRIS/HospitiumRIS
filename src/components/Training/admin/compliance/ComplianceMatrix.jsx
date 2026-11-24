'use client';

import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Block as ExemptIcon,
  EventRepeat as ExtendIcon,
  NotificationsActive as RemindIcon,
  OpenInNew as OpenIcon,
  PersonAdd as AssignIcon,
  Undo as UndoIcon,
} from '@mui/icons-material';
import { REQUIREMENT_STATE_LABELS } from '@/lib/training-requirements';

const PURPLE = '#8b6cbc';
export const CELL_SX = {
  COMPLIANT: { bgcolor: '#dcfce7', color: '#166534' },
  EXPIRING: { bgcolor: '#fef3c7', color: '#92400e' },
  DUE: { bgcolor: '#e0e7ff', color: '#3730a3' },
  OVERDUE: { bgcolor: '#fee2e2', color: '#b91c1c' },
  EXPIRED: { bgcolor: '#fee2e2', color: '#b91c1c' },
  MISSING: { bgcolor: '#f1f5f9', color: '#475569' },
  EXEMPT: { bgcolor: '#f3f0f9', color: PURPLE },
};
const fmt = (v) => (v ? new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : '');
const GAP = new Set(['MISSING', 'EXPIRED']);

function cellNote(c) {
  if (c.until) return `${c.state === 'EXPIRED' ? 'expired' : 'to'} ${fmt(c.until)}`;
  if (c.dueDate) return `due ${fmt(c.dueDate)}`;
  return '';
}

/**
 * People × requirements (#140). Click a cell to act on that person for that requirement.
 * filter: { requirementId, state } can come from the needs-attention strip.
 */
export default function ComplianceMatrix({ requirements, rows, departments, filter, onFilter, onAction, onOpenTraining }) {
  const [search, setSearch] = useState('');
  const dept = filter.department || 'all';
  const [menu, setMenu] = useState(null);
  const reqs = requirements.filter((r) => r.isActive && (!filter.requirementId || r.id === filter.requirementId));

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter((r) => Object.values(r.cells).some((c) => c.state !== 'NOT_REQUIRED'))
      .filter((r) => dept === 'all' || (r.department || 'Not set') === dept)
      .filter((r) => !q || `${r.name} ${r.email}`.toLowerCase().includes(q))
      .filter((r) => {
        if (!filter.state || filter.state === 'all') return true;
        const states = reqs.map((q2) => r.cells[q2.id]?.state);
        if (filter.state === 'GAP') return states.some((s) => GAP.has(s));
        if (filter.state === 'NOT_COMPLIANT') return states.some((s) => ['OVERDUE', 'EXPIRED', 'MISSING', 'DUE'].includes(s));
        return states.includes(filter.state);
      })
      .sort((a, b) => (a.percent ?? 101) - (b.percent ?? 101) || a.name.localeCompare(b.name));
  }, [rows, reqs, search, dept, filter.state]);

  // "Assign these" for a requirement's gaps, from the filter.
  const gapUsers = filter.requirementId && (filter.state === 'GAP' || filter.state === 'EXPIRING')
    ? visible.filter((r) => (filter.state === 'GAP' ? GAP.has(r.cells[filter.requirementId]?.state) : r.cells[filter.requirementId]?.state === 'EXPIRING')).map((r) => r.id)
    : [];

  const act = (action, payload, extra = {}) => { setMenu(null); onAction(action, payload, extra); };
  const m = menu;
  const c = m ? m.row.cells[m.req.id] : null;

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 1.5 }} alignItems={{ md: 'center' }}>
        <TextField size="small" placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 220 }} />
        <TextField select size="small" label="Department" value={dept} onChange={(e) => onFilter({ ...filter, department: e.target.value === 'all' ? null : e.target.value })} sx={{ minWidth: 170 }}>
          <MenuItem value="all">All departments</MenuItem>
          {dept !== 'all' && !departments.includes(dept) ? <MenuItem value={dept}>{dept}</MenuItem> : null}
          {departments.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Requirement" value={filter.requirementId || ''} onChange={(e) => onFilter({ ...filter, requirementId: e.target.value || null })} sx={{ minWidth: 200 }}>
          <MenuItem value="">All requirements</MenuItem>
          {requirements.filter((r) => r.isActive).map((r) => <MenuItem key={r.id} value={r.id}>{r.title}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Show" value={filter.state || 'all'} onChange={(e) => onFilter({ ...filter, state: e.target.value })} sx={{ minWidth: 170 }}>
          <MenuItem value="all">Everyone</MenuItem>
          <MenuItem value="NOT_COMPLIANT">Not compliant</MenuItem>
          <MenuItem value="GAP">Not done or expired</MenuItem>
          {['OVERDUE', 'DUE', 'EXPIRING', 'COMPLIANT', 'EXEMPT'].map((s) => <MenuItem key={s} value={s}>{REQUIREMENT_STATE_LABELS[s]}</MenuItem>)}
        </TextField>
        <Box sx={{ flex: 1 }} />
        {gapUsers.length ? (
          <Button variant="contained" size="small" startIcon={<AssignIcon />} onClick={() => onAction('assign', { userIds: gapUsers }, { requirementId: filter.requirementId })} sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700 }}>
            Assign these {gapUsers.length}
          </Button>
        ) : null}
      </Stack>

      {!reqs.length ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>Add a requirement in the Requirements tab to see the matrix.</Typography>
      ) : (
        <TableContainer sx={{ maxHeight: 620, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#f7f4fb', position: 'sticky', left: 0, zIndex: 3, minWidth: 220 }}>Person</TableCell>
                {reqs.map((r) => (
                  <TableCell key={r.id} sx={{ fontWeight: 700, bgcolor: '#f7f4fb', minWidth: 140 }}>
                    <Tooltip title={`${r.departments.length ? r.departments.join(', ') : 'Everyone'} · ${r.validityMonths ? `valid ${r.validityMonths} months` : 'no expiry'}`}>
                      <span>{r.title}</span>
                    </Tooltip>
                  </TableCell>
                ))}
                <TableCell align="right" sx={{ fontWeight: 700, bgcolor: '#f7f4fb' }}>%</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.slice(0, 400).map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ position: 'sticky', left: 0, bgcolor: 'background.paper', zIndex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{row.department || 'No department'}</Typography>
                  </TableCell>
                  {reqs.map((r) => {
                    const cell = row.cells[r.id];
                    if (!cell || cell.state === 'NOT_REQUIRED') return <TableCell key={r.id} sx={{ color: 'text.disabled' }}>—</TableCell>;
                    return (
                      <TableCell key={r.id}>
                        <Chip
                          size="small"
                          clickable
                          onClick={(e) => setMenu({ anchor: e.currentTarget, row, req: r })}
                          label={REQUIREMENT_STATE_LABELS[cell.state]}
                          sx={{ fontWeight: 700, ...CELL_SX[cell.state] }}
                        />
                        {cellNote(cell) ? <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>{cellNote(cell)}</Typography> : null}
                      </TableCell>
                    );
                  })}
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{row.percent === null ? '—' : `${row.percent}%`}</TableCell>
                </TableRow>
              ))}
              {!visible.length ? <TableRow><TableCell colSpan={reqs.length + 2} sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>No one matches these filters.</TableCell></TableRow> : null}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {visible.length > 400 ? <Typography variant="caption" color="text.secondary">Showing 400 of {visible.length}. Narrow the filters or download Excel for everyone.</Typography> : null}

      <Menu anchorEl={m?.anchor} open={Boolean(m)} onClose={() => setMenu(null)}>
        {m ? <MenuItem disabled sx={{ opacity: '1 !important' }}><Typography variant="caption" sx={{ fontWeight: 700 }}>{m.row.name} · {m.req.title}</Typography></MenuItem> : null}
        {c && ['DUE', 'OVERDUE'].includes(c.state) ? [
          <MenuItem key="remind" onClick={() => act('remind', { registrationIds: [c.registrationId] })}><ListItemIcon><RemindIcon fontSize="small" /></ListItemIcon><ListItemText>Send reminder</ListItemText></MenuItem>,
          <MenuItem key="extend" onClick={() => act('extend', { registrationIds: [c.registrationId] })}><ListItemIcon><ExtendIcon fontSize="small" /></ListItemIcon><ListItemText>Extend due date</ListItemText></MenuItem>,
        ] : null}
        {c && ['MISSING', 'EXPIRED', 'EXPIRING'].includes(c.state) ? (
          <MenuItem onClick={() => act('assign', { userIds: [m.row.id] }, { requirementId: m.req.id })}><ListItemIcon><AssignIcon fontSize="small" /></ListItemIcon><ListItemText>Assign to a cohort</ListItemText></MenuItem>
        ) : null}
        {c && c.state === 'EXEMPT' && c.exemptId ? (
          <MenuItem onClick={() => act('unexempt', { exemptionIds: [c.exemptId] })}><ListItemIcon><UndoIcon fontSize="small" /></ListItemIcon><ListItemText primary="Remove exemption" secondary={c.reason || null} /></MenuItem>
        ) : null}
        {c && c.state !== 'EXEMPT' ? (
          <MenuItem onClick={() => act('exempt', { cells: [{ userId: m.row.id, requirementId: m.req.id }] })}><ListItemIcon><ExemptIcon fontSize="small" /></ListItemIcon><ListItemText>Exempt from this requirement</ListItemText></MenuItem>
        ) : null}
        {c && c.trainingId ? (
          <MenuItem onClick={() => { setMenu(null); onOpenTraining(c.trainingId); }}><ListItemIcon><OpenIcon fontSize="small" /></ListItemIcon><ListItemText>Open the training</ListItemText></MenuItem>
        ) : null}
      </Menu>
    </Box>
  );
}
