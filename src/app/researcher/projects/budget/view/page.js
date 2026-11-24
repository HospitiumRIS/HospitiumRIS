'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material';
import {
  AccountBalance as BudgetIcon,
  AttachMoney as MoneyIcon,
  HourglassTop as PendingIcon,
  Assignment as ProjectIcon,
  TrendingUp as SpentIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import { PurpleTableHead, StatCards, TablePaper, zebraRowSx } from '@/components/common/ListPage';
import { BurnChip, SpendBar, fmtDate, money } from '@/components/Projects/budget/BudgetParts';

/**
 * My project budgets (#179): the signed-in researcher's approved projects with real
 * budget figures. Opening one shows its budget, expenses and the claim form.
 */
export default function MyBudgetsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setError('');
      const res = await fetch('/api/researcher/budget', { credentials: 'include' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Could not load your budgets');
      setProjects(json.projects || []);
    } catch (err) {
      setError(err.message);
    }
  };
  useEffect(() => { load(); }, []);

  const cards = useMemo(() => {
    if (!projects) return [];
    const currency = projects[0]?.currency || 'USD';
    const same = projects.filter((p) => p.currency === currency);
    const sum = (k) => same.reduce((a, p) => a + (p.figures[k] || 0), 0);
    const mixed = same.length !== projects.length ? ` (${currency} projects)` : '';
    return [
      { label: 'Approved projects', value: projects.length, sub: 'With a budget to track', icon: <ProjectIcon /> },
      { label: `Total budget${mixed}`, value: money(sum('budget'), currency, true), sub: 'Across your projects', icon: <MoneyIcon /> },
      { label: 'Spent', value: money(sum('spent'), currency, true), sub: 'Approved expenses', icon: <SpentIcon /> },
      { label: 'My claims waiting', value: projects.reduce((a, p) => a + p.myPendingClaims, 0), sub: 'With the research office', icon: <PendingIcon /> },
    ];
  }, [projects]);

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <PageHeader
        title="Project budgets"
        description="Budgets and spending for your approved projects. Submit expense claims with receipts for the research office to approve."
        icon={<BudgetIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[{ label: 'Home', path: '/researcher' }]}
      />
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {error ? <Alert severity="error" action={<Button size="small" onClick={load}>Retry</Button>} sx={{ mb: 2 }}>{error}</Alert> : null}
        {!projects && !error ? <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress /></Box> : null}
        {projects ? (
          <>
            <StatCards cards={cards} />
            <TablePaper>
              {projects.length ? (
                <TableContainer>
                  <Table>
                    <PurpleTableHead columns={['Project', 'Budget', 'Spent', 'Remaining', 'Progress', 'Burn', 'Ends']} />
                    <TableBody>
                      {projects.map((p, i) => (
                        <TableRow key={p.id} hover onClick={() => router.push(`/researcher/projects/budget/view/${p.id}`)} sx={{ cursor: 'pointer', ...zebraRowSx(i) }}>
                          <TableCell sx={{ maxWidth: 360 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{p.title}</Typography>
                            <Typography variant="caption" color="text.secondary">{p.funder || '—'}{p.myPendingClaims ? ` · ${p.myPendingClaims} claim(s) waiting` : ''}</Typography>
                          </TableCell>
                          <TableCell>{p.figures.budget ? money(p.figures.budget, p.currency) : 'Not set'}</TableCell>
                          <TableCell>{money(p.figures.spent, p.currency)}</TableCell>
                          <TableCell sx={{ color: p.figures.remaining < 0 ? '#dc2626' : undefined }}>{p.figures.budget ? money(p.figures.remaining, p.currency) : '—'}</TableCell>
                          <TableCell>{p.figures.budget ? <SpendBar figures={p.figures} width={140} /> : '—'}</TableCell>
                          <TableCell><BurnChip burn={p.figures.burn} /></TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(p.endDate)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary" sx={{ p: 4, textAlign: 'center' }}>
                  No approved projects yet. A project gets a budget here once its proposal is approved.
                </Typography>
              )}
            </TablePaper>
          </>
        ) : null}
      </Container>
    </Box>
  );
}
