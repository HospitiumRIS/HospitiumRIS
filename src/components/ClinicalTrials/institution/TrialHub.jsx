'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Button, CircularProgress, Container, Paper, Tab, Tabs } from '@mui/material';
import { Home as HomeIcon, OpenInNew as OpenIcon } from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';

const PURPLE = '#8b6cbc';
const ghostBtn = { color: 'white', borderColor: 'rgba(255,255,255,0.6)', textTransform: 'none', fontWeight: 700, '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } };

function Hub({ path, title, description, icon, tabs, links = [] }) {
  const router = useRouter();
  const params = useSearchParams();
  const tab = tabs.some((t) => t.id === params.get('tab')) ? params.get('tab') : tabs[0].id;
  const Active = tabs.find((t) => t.id === tab).Component;
  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <PageHeader
        title={title}
        description={description}
        icon={icon}
        breadcrumbs={[
          { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/institution' },
          ...(path === '/institution/clinical-trials' ? [] : [{ label: 'Clinical trials', path: '/institution/clinical-trials' }]),
        ]}
        actionButton={links.length ? (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {links.map((l) => <Button key={l.href} variant="outlined" endIcon={<OpenIcon />} onClick={() => router.push(l.href)} sx={ghostBtn}>{l.label}</Button>)}
          </Box>
        ) : null}
      />
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {tabs.length > 1 ? (
          <Paper sx={{ mb: 3, borderRadius: 2.5, border: '1px solid rgba(139,108,188,0.12)', boxShadow: 'none' }}>
            <Tabs
              value={tab}
              onChange={(_, v) => router.replace(`${path}${v === tabs[0].id ? '' : `?tab=${v}`}`, { scroll: false })}
              variant="scrollable"
              sx={{ px: 1, '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, minHeight: 52 }, '& .Mui-selected': { color: `${PURPLE} !important` }, '& .MuiTabs-indicator': { bgcolor: PURPLE, height: 3 } }}
            >
              {tabs.map((t) => <Tab key={t.id} value={t.id} label={t.label} />)}
            </Tabs>
          </Paper>
        ) : null}
        <Active embedded />
      </Container>
    </Box>
  );
}

/**
 * Research-office clinical trials hub: one page header, tabs for related views
 * (?tab=...). Each view also works on its own (embedded=false).
 */
export default function TrialHub(props) {
  return (
    <Suspense fallback={<Box sx={{ py: 10, textAlign: 'center' }}><CircularProgress sx={{ color: PURPLE }} /></Box>}>
      <Hub {...props} />
    </Suspense>
  );
}
