'use client';

import { useState } from 'react';
import { Box, Divider, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';

/**
 * Actions for a manuscript table row: view and edit stay visible, everything
 * else goes into a "more" menu. Destructive items (danger: true) are listed
 * last, after a divider, in red.
 *
 * menuItems: [{ key, label, icon, onClick, danger? }]
 */
export default function ManuscriptRowActions({
  onView,
  onEdit,
  canEdit = true,
  viewLabel = 'View details',
  editLabel = 'Edit manuscript',
  menuItems = [],
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const regular = menuItems.filter((item) => !item.danger);
  const danger = menuItems.filter((item) => item.danger);

  const iconSx = { color: '#6b7280', '&:hover': { color: '#8b6cbc', bgcolor: 'rgba(139, 108, 188, 0.08)' } };

  const run = (item) => {
    setAnchorEl(null);
    item.onClick();
  };

  return (
    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', alignItems: 'center' }}>
      {onView && (
        <Tooltip title={viewLabel} arrow>
          <IconButton size="small" onClick={onView} aria-label={viewLabel} sx={iconSx}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {onEdit && (
        <Tooltip title={editLabel} arrow>
          <span>
            <IconButton size="small" onClick={onEdit} disabled={!canEdit} aria-label={editLabel} sx={iconSx}>
              <EditIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      )}
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
              <MenuItem key={item.key} onClick={() => run(item)} sx={{ fontSize: '0.875rem' }}>
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
        // Keep the column aligned when a row has no extra actions
        <Box sx={{ width: 34 }} aria-hidden="true" />
      )}
    </Box>
  );
}
