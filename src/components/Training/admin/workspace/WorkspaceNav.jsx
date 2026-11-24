'use client';

import React from 'react';
import { Badge, Box, List, ListItemButton, ListItemIcon, ListItemText, MenuItem, Paper, TextField, Typography, alpha } from '@mui/material';
import { PURPLE } from '@/components/Training/admin/analytics/AnalyticsParts';

/**
 * Section navigation for the training workspace. A sticky list on wide screens, a
 * select on small ones. sections: [{ group, items: [{ key, label, icon, count?, alert? }] }]
 */
export default function WorkspaceNav({ sections, value, onChange }) {
  const flat = sections.flatMap((s) => s.items);
  return (
    <>
      <Paper sx={{ display: { xs: 'block', md: 'none' }, p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <TextField select size="small" fullWidth label="Section" value={value} onChange={(e) => onChange(e.target.value)}>
          {flat.map((item) => (
            <MenuItem key={item.key} value={item.key}>
              {item.label}{item.count !== undefined && item.count !== null ? ` (${item.count})` : ''}{item.alert ? ` · ${item.alert} to act on` : ''}
            </MenuItem>
          ))}
        </TextField>
      </Paper>
      <Paper
        component="nav"
        aria-label="Training sections"
        sx={{ display: { xs: 'none', md: 'block' }, position: 'sticky', top: 16, borderRadius: 2, border: '1px solid', borderColor: 'divider', py: 1 }}
      >
        {sections.map((section) => (
          <Box key={section.group} sx={{ mb: 0.5 }}>
            <Typography variant="caption" sx={{ px: 2, pt: 1, pb: 0.5, display: 'block', fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.6 }}>{section.group}</Typography>
            <List dense disablePadding>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = item.key === value;
                return (
                  <ListItemButton
                    key={item.key}
                    selected={active}
                    onClick={() => onChange(item.key)}
                    sx={{
                      mx: 1,
                      borderRadius: 1.5,
                      py: 0.75,
                      '&.Mui-selected': { bgcolor: alpha(PURPLE, 0.12), color: PURPLE, '&:hover': { bgcolor: alpha(PURPLE, 0.16) } },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 34, color: active ? PURPLE : 'text.secondary' }}>
                      <Badge color="warning" variant="dot" invisible={!item.alert}><Icon fontSize="small" /></Badge>
                    </ListItemIcon>
                    <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 800 : 600 }} />
                    {item.alert ? (
                      <Box sx={{ px: 0.8, borderRadius: 5, fontSize: 12, fontWeight: 800, bgcolor: '#fef3c7', color: '#92400e' }}>{item.alert}</Box>
                    ) : item.count !== undefined && item.count !== null ? (
                      <Typography variant="caption" sx={{ fontWeight: 700, color: active ? PURPLE : 'text.secondary' }}>{item.count}</Typography>
                    ) : null}
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        ))}
      </Paper>
    </>
  );
}
