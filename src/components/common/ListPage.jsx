'use client';

/**
 * Building blocks for list pages, matching the researcher
 * "Collaborative Writing" page: purple stat cards, a filter bar,
 * and a purple-header table in a rounded paper.
 */

import { Box, Button, Grid, InputAdornment, IconButton, Paper, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';

export const BRAND_PURPLE = '#8b6cbc';

export function StatCard({ label, value, sub, icon }) {
  return (
    <Paper sx={{
      p: 2,
      borderRadius: 2,
      bgcolor: BRAND_PURPLE,
      boxShadow: '0 2px 8px rgba(139, 108, 188, 0.2)',
      border: 'none',
      position: 'relative',
      overflow: 'hidden',
      height: '100px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}>
      <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
          {label}
        </Typography>
        {icon && <Box sx={{ display: 'flex', color: 'white', opacity: 0.9, '& svg': { fontSize: 18 } }}>{icon}</Box>}
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem', lineHeight: 1.2 }}>
        {value}
      </Typography>
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
        {sub || ' '}
      </Typography>
    </Paper>
  );
}

/** Grid of StatCards; `cards` is [{ label, value, sub, icon }]. */
export function StatCards({ cards, sx }) {
  const md = cards.length >= 4 ? 3 : 12 / cards.length;
  return (
    <Grid container spacing={2.5} sx={{ mb: 4, ...sx }}>
      {cards.map((card) => (
        <Grid key={card.label} size={{ xs: 12, sm: 6, md }}>
          <StatCard {...card} />
        </Grid>
      ))}
    </Grid>
  );
}

export const filterFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.8)',
    '&:hover': { backgroundColor: 'rgba(255,255,255,1)', '& fieldset': { borderColor: BRAND_PURPLE } },
    '&.Mui-focused fieldset': { borderColor: BRAND_PURPLE },
  },
  '& label.Mui-focused': { color: BRAND_PURPLE },
};

/** Search box styled for the filter bar. */
export function SearchField({ value, onChange, placeholder = 'Search...' }) {
  return (
    <TextField
      fullWidth
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ color: BRAND_PURPLE }} />
          </InputAdornment>
        ),
        endAdornment: value ? (
          <InputAdornment position="end">
            <IconButton onClick={() => onChange('')} size="small" aria-label="Clear search">
              <CloseIcon />
            </IconButton>
          </InputAdornment>
        ) : null,
      }}
      sx={filterFieldSx}
    />
  );
}

/**
 * Filter bar: a search field plus any number of filter controls, and an
 * optional "Clear All" button. Children are laid out after the search box.
 */
export function FilterBar({ search, onSearchChange, searchPlaceholder, onClear, children, sx }) {
  return (
    <Paper sx={{
      mb: 3,
      p: { xs: 2, md: 3 },
      borderRadius: 4,
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      border: '1px solid rgba(0,0,0,0.06)',
      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
      ...sx,
    }}>
      <Box sx={{
        display: 'flex',
        gap: 2,
        alignItems: 'center',
        flexWrap: 'wrap',
        '& > .filter-control': { flex: '1 1 160px', minWidth: 160 },
      }}>
        {onSearchChange && (
          <Box sx={{ flex: '2 1 300px', minWidth: { xs: '100%', sm: 300 } }}>
            <SearchField value={search} onChange={onSearchChange} placeholder={searchPlaceholder} />
          </Box>
        )}
        {children}
        {onClear && (
          <Box sx={{ flex: '0 0 auto' }}>
            <Button
              variant="text"
              startIcon={<CloseIcon />}
              onClick={onClear}
              sx={{
                borderRadius: 3,
                height: 56,
                px: 3,
                color: BRAND_PURPLE,
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': { backgroundColor: 'rgba(139, 108, 188, 0.08)', color: '#7a5cac' },
              }}
            >
              Clear All
            </Button>
          </Box>
        )}
      </Box>
    </Paper>
  );
}

/** Rounded paper that wraps a list table and its pagination. */
export function TablePaper({ children, sx }) {
  return (
    <Paper sx={{
      borderRadius: 3,
      overflow: 'hidden',
      boxShadow: '0 4px 16px rgba(139, 108, 188, 0.08)',
      border: '1px solid rgba(139, 108, 188, 0.12)',
      background: 'linear-gradient(135deg, #ffffff 0%, #fafbfd 100%)',
      ...sx,
    }}>
      {children}
    </Paper>
  );
}

/**
 * Purple table header. `columns` is an array of strings or
 * { label, align, width }.
 */
export function PurpleTableHead({ columns }) {
  return (
    <TableHead>
      <TableRow sx={{ bgcolor: BRAND_PURPLE }}>
        {columns.map((col) => {
          const c = typeof col === 'string' ? { label: col } : col;
          return (
            <TableCell
              key={c.label}
              align={c.align}
              sx={{ fontWeight: 600, color: 'white', borderBottom: 'none', py: 2, width: c.width, whiteSpace: 'nowrap' }}
            >
              {c.label}
            </TableCell>
          );
        })}
      </TableRow>
    </TableHead>
  );
}

/** Zebra row styling used by the list tables. */
export const zebraRowSx = (index) => ({
  bgcolor: index % 2 === 0 ? '#fafafa' : 'white',
  '&:hover': { backgroundColor: '#f0f0f0' },
  transition: 'background-color 0.2s ease',
  '& > td': { py: 2 },
});

export const paginationSx = {
  borderTop: '1px solid rgba(139, 108, 188, 0.12)',
  bgcolor: '#fafbfd',
  '.MuiTablePagination-toolbar': { minHeight: 52 },
  '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': { fontWeight: 500, color: '#6b7280' },
};
