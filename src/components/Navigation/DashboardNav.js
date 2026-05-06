'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Typography,
  Divider,
  ListItemIcon,
} from '@mui/material';
import {
  ArrowDropDown as ArrowDropDownIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/navigation';

const DashboardNav = ({ dashboardConfig }) => {
  const theme = useTheme();
  const router = useRouter();
  const [menuAnchors, setMenuAnchors] = useState({});

  const handleMenuClick = (event, menuKey) => {
    event.preventDefault();
    event.stopPropagation();
    setMenuAnchors(prev => ({
      ...prev,
      [menuKey]: event.currentTarget
    }));
  };

  const handleMenuClose = (menuKey) => {
    setMenuAnchors(prev => ({
      ...prev,
      [menuKey]: null
    }));
  };

  const handleMenuItemClick = (event, path) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setMenuAnchors({});
    router.push(path);
  };

  if (!dashboardConfig || !dashboardConfig.menuItems) {
    return null;
  }

  const renderMenuContent = (menuItem) => {
    // Check if menu item has categories (new structured format)
    if (menuItem.categories) {
      return menuItem.categories.map((category, categoryIndex) => (
        <Box key={categoryIndex}>
          {/* Category Header */}
          <Box sx={{ px: { xs: 2, sm: 2.5, md: 3 }, py: 1.5, backgroundColor: theme.palette.grey[50] }}>
            <Typography 
              variant="overline" 
              sx={{ 
                fontWeight: 600, 
                color: theme.palette.primary.main,
                fontSize: '0.75rem',
                letterSpacing: '0.08rem'
              }}
            >
              {category.title}
            </Typography>
          </Box>
          
          {/* Category Items */}
          {category.items.map((item, itemIndex) => (
            <MenuItem
              key={itemIndex}
              onClick={item.disabled ? undefined : (event) => handleMenuItemClick(event, item.path)}
              disabled={item.disabled}
              sx={{
                px: { xs: 2, sm: 2.5, md: 3 },
                py: { xs: 1.5, sm: 1.75, md: 2 },
                minHeight: 'auto',
                cursor: item.disabled ? 'not-allowed' : 'pointer',
                '&:hover': {
                  backgroundColor: item.disabled ? 'transparent' : 'rgba(139, 108, 188, 0.08)',
                },
                '&.Mui-disabled': {
                  opacity: 0.6,
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {item.icon}
              </ListItemIcon>
              <Box>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    color: item.disabled ? theme.palette.text.disabled : theme.palette.text.primary,
                    mb: 0.5
                  }}
                >
                  {item.label}
                </Typography>
                {item.description && (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: item.disabled ? theme.palette.text.disabled : theme.palette.text.secondary,
                      fontSize: '0.8rem',
                      lineHeight: 1.2
                    }}
                  >
                    {item.description}
                  </Typography>
                )}
              </Box>
            </MenuItem>
          ))}
          
          {/* Add divider between categories (except last) */}
          {categoryIndex < menuItem.categories.length - 1 && (
            <Divider sx={{ my: 0.5 }} />
          )}
        </Box>
      ));
    }
    
    // Fallback to old format for backward compatibility
    return menuItem.items.map((item, itemIndex) => (
      <MenuItem 
        key={itemIndex}
        onClick={(event) => handleMenuItemClick(event, item.path)}
        sx={{
          px: 3,
          py: 1.5,
          fontSize: '0.95rem',
          '&:hover': {
            backgroundColor: 'rgba(139, 108, 188, 0.1)',
          },
        }}
      >
        <Typography variant="body2" sx={{ fontSize: '0.95rem' }}>
          {item.label}
        </Typography>
      </MenuItem>
    ));
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      {dashboardConfig.menuItems.map((menuItem, index) => (
        <Box key={index}>
          <Button
            onClick={(event) => handleMenuClick(event, menuItem.label)}
            endIcon={<ArrowDropDownIcon />}
            sx={{
              color: theme.palette.text.primary,
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '1rem', // Increased font size
              px: 3,
              py: 1.5,
              borderRadius: 2,
              '&:hover': {
                backgroundColor: 'rgba(139, 108, 188, 0.1)',
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            {menuItem.icon && (
              <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                {menuItem.icon}
              </Box>
            )}
            {menuItem.label}
          </Button>
          
          {/* Enhanced Dropdown Menu */}
          <Menu
            anchorEl={menuAnchors[menuItem.label]}
            open={Boolean(menuAnchors[menuItem.label])}
            onClose={() => handleMenuClose(menuItem.label)}
            disableAutoFocusItem
            disableScrollLock
            slotProps={{
              paper: {
                style: {
                  maxHeight: 'calc(100vh - 120px)', // Responsive max height
                  overflowY: 'auto',
                },
              },
            }}
            sx={{
              '& .MuiPaper-root': {
                minWidth: {
                  xs: '280px', // Mobile
                  sm: '320px', // Tablet
                  md: menuItem.categories ? 380 : 280, // Desktop
                },
                maxWidth: {
                  xs: 'calc(100vw - 32px)', // Mobile with padding
                  sm: 'calc(100vw - 64px)', // Tablet with padding
                  md: '90vw', // Desktop
                },
                mt: 1,
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                border: `1px solid ${theme.palette.divider}`,
                // Custom scrollbar styling
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: theme.palette.grey[100],
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: theme.palette.grey[400],
                  borderRadius: '4px',
                  '&:hover': {
                    backgroundColor: theme.palette.grey[500],
                  },
                },
                // Firefox scrollbar
                scrollbarWidth: 'thin',
                scrollbarColor: `${theme.palette.grey[400]} ${theme.palette.grey[100]}`,
              }
            }}
          >
            {/* Menu Header - Sticky */}
            <Box 
              sx={{ 
                px: { xs: 2, sm: 2.5, md: 3 }, 
                py: { xs: 1.5, sm: 1.75, md: 2 }, 
                borderBottom: `1px solid ${theme.palette.divider}`,
                position: 'sticky',
                top: 0,
                backgroundColor: 'white',
                zIndex: 1,
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  color: '#8b6cbc',
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                {menuItem.icon}
                {menuItem.label}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.85rem',
                  mt: 0.5
                }}
              >
                Manage your research workflow and {menuItem.label.toLowerCase()}
              </Typography>
            </Box>

            {/* Menu Content - Scrollable */}
            <Box sx={{ py: 1, overflowY: 'auto' }}>
              {renderMenuContent(menuItem)}
            </Box>
          </Menu>
        </Box>
      ))}
    </Box>
  );
};

export default DashboardNav;
