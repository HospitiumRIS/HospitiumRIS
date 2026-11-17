'use client';

import { useState } from 'react';
import { Box, Divider, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from '@mui/material';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';

const iconSx = { color: '#6b7280', '&:hover': { color: '#8b6cbc', bgcolor: 'rgba(139, 108, 188, 0.08)' } };

/**
 * Row actions for list tables: a few always-visible icon buttons in one
 * neutral colour, and everything else in a "more" menu. Destructive menu
 * items (danger: true) go last, after a divider, in red.
 *
 * actions:   [{ key, label, icon, onClick, disabled? }]   always visible
 * menuItems: [{ key, label, icon, onClick, danger? }]     in the ⋯ menu
 * reserveMenuSpace: keep the column aligned when a row has no menu items
 */
export default function RowActions({ actions = [], menuItems = [], reserveMenuSpace = true }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const regular = menuItems.filter((item) => !item.danger);
  const danger = menuItems.filter((item) => item.danger);

  const run = (item) => {
    setAnchorEl(null);
    item.onClick();
  };

  return (
    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', alignItems: 'center' }}>
      {actions.map((action) => (
        <Tooltip key={action.key} title={action.label} arrow>
          <span>
            <IconButton size="small" onClick={action.onClick} disabled={action.disabled} aria-label={action.label} sx={iconSx}>
              {action.icon}
            </IconButton>
          </span>
        </Tooltip>
      ))}
      {menuItems.length > 0 ? (
        <>
          <Tooltip title="More actions" arrow>
            <IconButton
              size="small"
              onClick={(e) => setAnchorEl(e.currentTarget)}
              aria-label="More actions"
              aria-haspopup="menu"
              sx={iconSx}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{ paper: { sx: { minWidth: 200, borderRadius: 2, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' } } }}
          >
            {regular.map((item) => (
              <MenuItem key={item.key} onClick={() => run(item)}>
                <ListItemIcon sx={{ color: '#6b7280' }}>{item.icon}</ListItemIcon>
                <ListItemText primaryTypographyProps={{ fontSize: '0.875rem' }}>{item.label}</ListItemText>
              </MenuItem>
            ))}
            {regular.length > 0 && danger.length > 0 && <Divider />}
            {danger.map((item) => (
              <MenuItem key={item.key} onClick={() => run(item)} sx={{ color: '#dc2626' }}>
                <ListItemIcon sx={{ color: '#dc2626' }}>{item.icon}</ListItemIcon>
                <ListItemText primaryTypographyProps={{ fontSize: '0.875rem' }}>{item.label}</ListItemText>
              </MenuItem>
            ))}
          </Menu>
        </>
      ) : (
        reserveMenuSpace && <Box sx={{ width: 34 }} aria-hidden="true" />
      )}
    </Box>
  );
}
