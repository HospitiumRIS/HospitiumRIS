'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  LinearProgress,
  Link,
  Menu,
  MenuItem,
  Paper,
  Stack,
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
  Add as AddIcon,
  AccountBalanceWallet as BudgetIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  MoreVert as MoreIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { InstitutionModal, InstitutionModalBody, InstitutionModalHeader } from '@/components/GlobalAdmin/InstitutionModalShell';
import { BurnChip, ExpenseStatusChip, PURPLE, SpendBar, btn, fmtDate, money } from './BudgetParts';
import { ExpenseActionDialog, ExpenseDialog, LineDialog } from './BudgetDialogs';

function Figure({ label, value, tone }) {
  return (
    <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: alpha(tone || PURPLE, 0.06), flex: 1, minWidth: 120 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{label}</Typography>
      <Typography sx={{ fontWeight: 800, color: tone || 'text.primary' }}>{value}</Typography>
    </Box>
  );
}

/**
 * One project's budget (#179): figures, budget lines, expenses and claims. The
 * research office edits lines, records expenses and decides claims; researchers on
 * the project submit claims and withdraw their own pending ones.
 */
export function ProjectBudgetView({ projectId, onChanged, onLoaded }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [lineDialog, setLineDialog] = useState(null); // {line?}
  const [expenseMode, setExpenseMode] = useState(null); // 'office' | 'claim'
  const [action, setAction] = useState(null); // {expense, action}
  const [menu, setMenu] = useState(null); // {anchor, expense}

  const load = useCallback(async () => {
    try {
      setError('');
      const res = await fetch(`/api/projects/${projectId}/budget`, { credentials: 'include' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Could not load the budget');
      setData(json);
      onLoaded?.(json);
    } catch (err) {
      setError(err.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => { if (projectId) { setData(null); load(); } }, [projectId, load]);

  const done = (message) => {
    setNotice(message);
    setLineDialog(null);
    setExpenseMode(null);
    setAction(null);
    load();
    onChanged?.();
  };

  const removeLine = async (line) => {
    const res = await fetch(`/api/projects/${projectId}/budget/lines/${line.id}`, { method: 'DELETE', credentials: 'include' });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) setError(json.error || 'Could not remove the line');
    else done('Budget line removed. Its expenses are now unallocated.');
  };

  if (error && !data) return <Alert severity="error" action={<Button size="small" onClick={load}>Retry</Button>}>{error}</Alert>;
  if (!data) return <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress sx={{ color: PURPLE }} /></Box>;

  const { project, figures: f, lines, expenses, permissions: perms } = data;
  const cur = project.currency;
  const m = (v) => money(v, cur);

  return (
    <Stack spacing={2}>
      {notice ? <Alert severity="success" onClose={() => setNotice('')}>{notice}</Alert> : null}
      {error ? <Alert severity="error" onClose={() => setError('')}>{error}</Alert> : null}

      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <BurnChip burn={f.burn} />
        <Typography variant="body2" color="text.secondary">
          {project.funder ? `${project.funder} · ` : ''}{fmtDate(project.startDate)} – {fmtDate(project.endDate)}{project.grantNumber ? ` · ${project.grantNumber}` : ''}
        </Typography>
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Figure label="Budget" value={f.budget ? m(f.budget) : 'Not set'} />
        <Figure label="Spent" value={m(f.spent)} tone={f.burn === 'OVERSPENT' ? '#dc2626' : undefined} />
        <Figure label="Awaiting approval" value={m(f.pending)} tone="#d97706" />
        <Figure label="Remaining" value={m(f.remaining)} tone={f.remaining < 0 ? '#dc2626' : '#16a34a'} />
      </Stack>
      {f.budget > 0 ? <SpendBar figures={f} width="100%" /> : null}
      {f.budgetSource === 'PROPOSAL' && perms.editLines ? <Alert severity="info">Using the proposal&apos;s total budget. Add budget lines to track spending by category.</Alert> : null}
      {f.budgetSource === 'NONE' ? <Alert severity="warning">No budget recorded for this project yet.{perms.editLines ? ' Add budget lines to start tracking.' : ''}</Alert> : null}
      {f.differsFromProposal ? <Alert severity="warning">Budget lines add up to {m(f.linesTotal)}, but the approved proposal budget is {m(project.proposalBudget)}.</Alert> : null}

      <Paper variant="outlined" sx={{ borderRadius: 2 }}>
        <Stack direction="row" alignItems="center" sx={{ px: 2, py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography sx={{ fontWeight: 800, flex: 1 }}>Budget lines</Typography>
          {perms.editLines ? <Button size="small" startIcon={<AddIcon />} onClick={() => setLineDialog({})} sx={{ ...btn, color: PURPLE }}>Add line</Button> : null}
        </Stack>
        {f.byLine.length ? (
          <Table size="small">
            <TableHead><TableRow><TableCell>Category</TableCell><TableCell align="right">Budget</TableCell><TableCell align="right">Spent</TableCell><TableCell sx={{ width: 120 }} />{perms.editLines ? <TableCell /> : null}</TableRow></TableHead>
            <TableBody>
              {f.byLine.map((l) => (
                <TableRow key={l.id}>
                  <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{l.category}</Typography>{l.description ? <Typography variant="caption" color="text.secondary">{l.description}</Typography> : null}</TableCell>
                  <TableCell align="right">{m(l.amount)}</TableCell>
                  <TableCell align="right" sx={{ color: l.over ? '#dc2626' : undefined, fontWeight: l.over ? 700 : 400 }}>{m(l.spent)}</TableCell>
                  <TableCell><LinearProgress variant="determinate" value={Math.min(100, l.pctSpent || 0)} sx={{ height: 6, borderRadius: 3, bgcolor: alpha(PURPLE, 0.12), '& .MuiLinearProgress-bar': { bgcolor: l.over ? '#dc2626' : PURPLE } }} /></TableCell>
                  {perms.editLines ? (
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <Tooltip title="Edit"><IconButton size="small" onClick={() => setLineDialog({ line: lines.find((x) => x.id === l.id) })}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Remove"><IconButton size="small" onClick={() => removeLine(l)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
              {f.unallocated > 0 ? <TableRow><TableCell><Typography variant="body2" color="text.secondary">Unallocated</Typography></TableCell><TableCell /><TableCell align="right">{m(f.unallocated)}</TableCell><TableCell />{perms.editLines ? <TableCell /> : null}</TableRow> : null}
            </TableBody>
          </Table>
        ) : <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>No budget lines yet.</Typography>}
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography sx={{ fontWeight: 800, flex: 1 }}>Expenses{f.claimsPending ? ` · ${f.claimsPending} awaiting approval` : ''}</Typography>
          {perms.claim && !perms.recordExpense ? <Button size="small" variant="contained" startIcon={<ReceiptIcon />} onClick={() => setExpenseMode('claim')} sx={{ ...btn, bgcolor: PURPLE }}>Submit a claim</Button> : null}
          {perms.recordExpense ? <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setExpenseMode('office')} sx={{ ...btn, bgcolor: PURPLE }}>Record expense</Button> : null}
        </Stack>
        {expenses.length ? (
          <Table size="small">
            <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Expense</TableCell><TableCell align="right">Amount</TableCell><TableCell>Status</TableCell><TableCell /></TableRow></TableHead>
            <TableBody>
              {expenses.map((e) => {
                const canDecide = perms.decide && e.status === 'SUBMITTED' && !e.mine;
                const canVoid = perms.decide && e.status === 'APPROVED';
                const canWithdraw = e.status === 'SUBMITTED' && e.mine;
                return (
                  <TableRow key={e.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(e.spentOn)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{e.description}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {e.lineCategory || 'Unallocated'}{e.payee ? ` · ${e.payee}` : ''}{e.source === 'CLAIM' && e.submittedByName ? ` · claim by ${e.submittedByName}` : ''}
                      </Typography>
                      {e.decisionNote ? <Typography variant="caption" display="block" color={e.status === 'REJECTED' || e.status === 'VOID' ? 'error' : 'text.secondary'}>“{e.decisionNote}”</Typography> : null}
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap', textDecoration: e.status === 'VOID' || e.status === 'REJECTED' ? 'line-through' : 'none' }}>{m(e.amount)}</TableCell>
                    <TableCell><ExpenseStatusChip status={e.status} /></TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      {e.receiptFileId ? <Tooltip title="Open receipt"><IconButton size="small" component={Link} href={`/api/files/${e.receiptFileId}`} target="_blank" rel="noopener"><ReceiptIcon fontSize="small" /></IconButton></Tooltip> : null}
                      {canDecide || canVoid || canWithdraw ? <IconButton size="small" aria-label="Actions" onClick={(ev) => setMenu({ anchor: ev.currentTarget, expense: e, canDecide, canVoid, canWithdraw })}><MoreIcon fontSize="small" /></IconButton> : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>No expenses yet.</Typography>}
      </Paper>

      <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={() => setMenu(null)}>
        {menu?.canDecide ? <MenuItem onClick={() => { setAction({ expense: menu.expense, action: 'approve' }); setMenu(null); }}>Approve</MenuItem> : null}
        {menu?.canDecide ? <MenuItem onClick={() => { setAction({ expense: menu.expense, action: 'reject' }); setMenu(null); }}>Reject</MenuItem> : null}
        {menu?.canVoid ? <MenuItem onClick={() => { setAction({ expense: menu.expense, action: 'void' }); setMenu(null); }}>Void</MenuItem> : null}
        {menu?.canWithdraw ? <MenuItem onClick={() => { setAction({ expense: menu.expense, action: 'withdraw' }); setMenu(null); }}>Withdraw claim</MenuItem> : null}
      </Menu>

      <LineDialog open={Boolean(lineDialog)} projectId={projectId} line={lineDialog?.line} currency={cur} onClose={() => setLineDialog(null)} onSaved={done} />
      <ExpenseDialog open={Boolean(expenseMode)} projectId={projectId} mode={expenseMode} lines={lines} currency={cur} onClose={() => setExpenseMode(null)} onSaved={done} />
      <ExpenseActionDialog open={Boolean(action)} projectId={projectId} expense={action?.expense} action={action?.action} onClose={() => setAction(null)} onDone={done} />
    </Stack>
  );
}

/** Right-side panel wrapper. */
export default function ProjectBudgetPanel({ open, project, onClose, onChanged }) {
  return (
    <InstitutionModal open={open} onClose={onClose} variant="panel" maxWidth="md">
      <InstitutionModalHeader icon={BudgetIcon} title={project?.title || 'Project budget'} subtitle="Budget & expenses" onClose={onClose} />
      <InstitutionModalBody>
        {project ? <ProjectBudgetView projectId={project.id} onChanged={onChanged} /> : null}
      </InstitutionModalBody>
    </InstitutionModal>
  );
}
