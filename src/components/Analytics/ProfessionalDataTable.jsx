'use client';

import React, { memo, useState, useMemo } from 'react';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Typography,
  Chip,
  Avatar,
  IconButton,
  Stack,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  alpha,
  useTheme,
  LinearProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVertOutlined as MoreIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Launch as LaunchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';

// Utility functions
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Enhanced Table Header
const EnhancedTableHead = memo(({ 
  columns, 
  order, 
  orderBy, 
  onRequestSort 
}) => {
  const theme = useTheme();

  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow sx={{
        '& .MuiTableCell-root': {
          backgroundColor: alpha('#8b6cbc', 0.05),
          borderBottom: `2px solid ${alpha('#8b6cbc', 0.1)}`,
          fontWeight: 700,
          fontSize: '0.875rem',
          color: theme.palette.text.primary
        }
      }}>
        {columns.map((column) => (
          <TableCell
            key={column.id}
            align={column.align || 'left'}
            padding={column.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === column.id ? order : false}
            sx={{ 
              minWidth: column.minWidth,
              position: column.sticky ? 'sticky' : 'relative',
              left: column.sticky ? 0 : 'auto',
              zIndex: column.sticky ? 1 : 'auto',
              backgroundColor: column.sticky ? alpha('#8b6cbc', 0.08) : 'inherit'
            }}
          >
            {column.sortable ? (
              <TableSortLabel
                active={orderBy === column.id}
                direction={orderBy === column.id ? order : 'asc'}
                onClick={createSortHandler(column.id)}
                sx={{
                  '&.Mui-active': {
                    color: '#8b6cbc'
                  },
                  '& .MuiTableSortLabel-icon': {
                    color: '#8b6cbc !important'
                  }
                }}
              >
                {column.label}
              </TableSortLabel>
            ) : (
              column.label
            )}
          </TableCell>
        ))}
        <TableCell align="center" sx={{ width: 80 }}>
          Actions
        </TableCell>
      </TableRow>
    </TableHead>
  );
});

// Table Row Component
const EnhancedTableRow = memo(({ 
  row, 
  columns, 
  onRowClick, 
  onAction,
  actions = []
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleActionClick = (action, event) => {
    event.stopPropagation();
    onAction?.(action, row);
    handleMenuClose();
  };

  const getTrendIcon = (value, prevValue) => {
    if (!prevValue) return RemoveIcon;
    if (value > prevValue) return TrendingUpIcon;
    if (value < prevValue) return TrendingDownIcon;
    return RemoveIcon;
  };

  const getTrendColor = (value, prevValue) => {
    if (!prevValue) return theme.palette.text.secondary;
    if (value > prevValue) return '#4caf50';
    if (value < prevValue) return '#f44336';
    return theme.palette.text.secondary;
  };

  return (
    <>
      <TableRow
        hover
        onClick={() => onRowClick?.(row)}
        sx={{
          cursor: onRowClick ? 'pointer' : 'default',
          '&:hover': {
            backgroundColor: alpha('#8b6cbc', 0.04)
          }
        }}
      >
        {columns.map((column) => {
          const value = row[column.id];
          
          return (
            <TableCell 
              key={column.id} 
              align={column.align || 'left'}
              sx={{
                position: column.sticky ? 'sticky' : 'relative',
                left: column.sticky ? 0 : 'auto',
                zIndex: column.sticky ? 1 : 'auto',
                backgroundColor: column.sticky ? theme.palette.background.paper : 'inherit',
                borderRight: column.sticky ? `1px solid ${theme.palette.divider}` : 'none'
              }}
            >
              {column.render ? (
                column.render(value, row)
              ) : column.type === 'currency' ? (
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#4caf50' }}>
                  {formatCurrency(value || 0)}
                </Typography>
              ) : column.type === 'date' ? (
                <Typography variant="body2">
                  {formatDate(value)}
                </Typography>
              ) : column.type === 'trend' ? (
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  {React.createElement(
                    getTrendIcon(value, row.prevValue),
                    { 
                      sx: { 
                        fontSize: 16, 
                        color: getTrendColor(value, row.prevValue) 
                      } 
                    }
                  )}
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {typeof value === 'number' ? formatCurrency(value) : value}
                  </Typography>
                </Stack>
              ) : column.type === 'avatar' ? (
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ 
                    width: 32, 
                    height: 32, 
                    backgroundColor: alpha('#8b6cbc', 0.1),
                    color: '#8b6cbc',
                    fontSize: '0.875rem',
                    fontWeight: 600
                  }}>
                    {row.isAnonymous ? '?' : (value?.charAt(0) || row.name?.charAt(0) || 'U')}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                      {row.isAnonymous ? 'Anonymous Donor' : (value || row.name || 'Unknown')}
                    </Typography>
                    {row.email && !row.isAnonymous && (
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        {row.email}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              ) : column.type === 'chip' ? (
                <Chip
                  label={value}
                  size="small"
                  color={column.getChipColor?.(value) || 'default'}
                  sx={{ 
                    fontSize: '0.75rem',
                    height: 24
                  }}
                />
              ) : column.type === 'progress' ? (
                <Box sx={{ width: '100%', mr: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(value || 0, 100)}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: alpha('#8b6cbc', 0.1),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        backgroundColor: value > 75 ? '#4caf50' : value > 50 ? '#ff9800' : '#f44336'
                      }
                    }}
                  />
                  <Typography variant="caption" sx={{ 
                    color: theme.palette.text.secondary,
                    mt: 0.5,
                    display: 'block'
                  }}>
                    {value?.toFixed(1) || 0}%
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" sx={{ 
                  fontWeight: column.fontWeight || 400,
                  color: column.color ? column.color(value, row) : 'inherit'
                }}>
                  {value?.toLocaleString?.() || value || '—'}
                </Typography>
              )}
            </TableCell>
          );
        })}
        
        {/* Actions Column */}
        <TableCell align="center">
          <IconButton
            size="small"
            onClick={handleMenuClick}
            sx={{
              color: theme.palette.text.secondary,
              '&:hover': {
                color: '#8b6cbc',
                backgroundColor: alpha('#8b6cbc', 0.1)
              }
            }}
          >
            <MoreIcon fontSize="small" />
          </IconButton>
        </TableCell>
      </TableRow>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 160,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
          }
        }}
      >
        {actions.map((action) => (
          <MenuItem 
            key={action.id} 
            onClick={(e) => handleActionClick(action, e)}
            disabled={action.disabled?.(row)}
          >
            <ListItemIcon>
              <action.icon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{action.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
});

// Main Data Table Component
const ProfessionalDataTable = memo(({
  title,
  subtitle,
  data = [],
  columns = [],
  loading = false,
  searchable = true,
  filterable = true,
  paginated = true,
  pageSize = 10,
  onRowClick,
  onAction,
  actions = [],
  emptyMessage = "No data available",
  stickyHeader = true
}) => {
  const theme = useTheme();
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAnchor, setFilterAnchor] = useState(null);

  // Default actions
  const defaultActions = [
    {
      id: 'view',
      label: 'View Details',
      icon: VisibilityIcon,
      action: (row) => console.log('View:', row)
    },
    {
      id: 'edit',
      label: 'Edit',
      icon: EditIcon,
      action: (row) => console.log('Edit:', row)
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: DeleteIcon,
      action: (row) => console.log('Delete:', row),
      disabled: (row) => row.status === 'active'
    }
  ];

  const allActions = actions.length > 0 ? actions : defaultActions;

  // Sorting logic
  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Filtering and searching
  const filteredData = useMemo(() => {
    let filtered = [...data];

    if (searchTerm) {
      filtered = filtered.filter(row =>
        columns.some(column => {
          const value = row[column.id];
          return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Sorting
    if (orderBy) {
      filtered.sort((a, b) => {
        const aValue = a[orderBy];
        const bValue = b[orderBy];
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return order === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        const aString = aValue?.toString() || '';
        const bString = bValue?.toString() || '';
        
        return order === 'asc' 
          ? aString.localeCompare(bString)
          : bString.localeCompare(aString);
      });
    }

    return filtered;
  }, [data, searchTerm, orderBy, order, columns]);

  // Pagination
  const paginatedData = useMemo(() => {
    if (!paginated) return filteredData;
    
    const startIndex = page * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredData, page, rowsPerPage, paginated]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Card sx={{ 
      borderRadius: 3,
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      border: '1px solid rgba(139, 108, 188, 0.1)',
      overflow: 'hidden'
    }}>
      {/* Table Header */}
      <Box sx={{ 
        p: 3, 
        pb: 2,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        background: `linear-gradient(90deg, ${alpha('#8b6cbc', 0.02)} 0%, ${alpha('#8b6cbc', 0.05)} 100%)`
      }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ 
              fontWeight: 700, 
              color: theme.palette.text.primary,
              fontSize: '1.25rem',
              mb: 0.5
            }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" sx={{ 
                color: theme.palette.text.secondary,
                fontSize: '0.875rem'
              }}>
                {subtitle}
              </Typography>
            )}
          </Box>

          <Stack direction="row" spacing={1}>
            {filterable && (
              <IconButton
                onClick={(e) => setFilterAnchor(e.currentTarget)}
                sx={{
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    color: '#8b6cbc',
                    backgroundColor: alpha('#8b6cbc', 0.1)
                  }
                }}
              >
                <FilterIcon />
              </IconButton>
            )}
          </Stack>
        </Stack>

        {/* Search */}
        {searchable && (
          <TextField
            placeholder="Search data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ 
              width: 300,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />
        )}
      </Box>

      {/* Table */}
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader={stickyHeader}>
          <EnhancedTableHead
            columns={columns}
            order={order}
            orderBy={orderBy}
            onRequestSort={handleRequestSort}
          />
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} align="center" sx={{ py: 8 }}>
                  <Stack alignItems="center" spacing={2}>
                    <Box sx={{ width: '100%', maxWidth: 200 }}>
                      <LinearProgress sx={{ 
                        '& .MuiLinearProgress-bar': { backgroundColor: '#8b6cbc' }
                      }} />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Loading data...
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} align="center" sx={{ py: 8 }}>
                  <Typography variant="h6" color="text.secondary">
                    {emptyMessage}
                  </Typography>
                  {searchTerm && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Try adjusting your search terms
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => (
                <EnhancedTableRow
                  key={row.id || index}
                  row={row}
                  columns={columns}
                  onRowClick={onRowClick}
                  onAction={onAction}
                  actions={allActions}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {paginated && !loading && (
        <TablePagination
          component="div"
          count={filteredData.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          sx={{
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            '& .MuiTablePagination-toolbar': { px: 3 },
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              fontSize: '0.875rem',
              color: theme.palette.text.secondary
            }
          }}
        />
      )}
    </Card>
  );
});

EnhancedTableHead.displayName = 'EnhancedTableHead';
EnhancedTableRow.displayName = 'EnhancedTableRow';
ProfessionalDataTable.displayName = 'ProfessionalDataTable';

export default ProfessionalDataTable;
