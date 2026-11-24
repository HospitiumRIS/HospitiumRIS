'use client';

import React, { use, useState } from 'react';
import { Box, Container, Paper } from '@mui/material';
import { AccountBalance as BudgetIcon } from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import { ProjectBudgetView } from '@/components/Projects/budget/ProjectBudgetPanel';

/** One project's budget for a researcher on it (#179): figures, lines, expenses, claims. */
export default function MyProjectBudgetPage({ params }) {
  const { id } = use(params);
  const [title, setTitle] = useState('Project budget');
  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <PageHeader
        title={title}
        description="Budget, spending and your expense claims"
        icon={<BudgetIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[{ label: 'Home', path: '/researcher' }, { label: 'Project budgets', path: '/researcher/projects/budget/view' }]}
      />
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <ProjectBudgetView projectId={id} onLoaded={(j) => j?.project?.title && setTitle(j.project.title)} />
        </Paper>
      </Container>
    </Box>
  );
}
