'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  LinearProgress,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  InputAdornment,
  alpha,
} from '@mui/material';
import {
  Business as InstitutionIcon,
  ChevronRight as ChevronRightIcon,
  PersonSearch as PersonSearchIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
} from '../../../../../../components/GlobalAdmin/InstitutionModalShell';
import {
  PURPLE,
  ResearcherAvatar,
  displayName,
  fieldFocusSx,
  outlinedButtonSx,
  primaryButtonSx,
} from './researcherDisplay';

const PAGE_SIZES = [10, 25, 50];
const SORT_OPTIONS = [
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'publications', label: 'Most publications' },
  { value: 'recent', label: 'Recently joined' },
];

const headCellSx = {
  fontWeight: 800,
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  letterSpacing: 0.4,
  color: '#475569',
  bgcolor: '#f8f6fb',
  borderBottomColor: alpha(PURPLE, 0.2),
};

/**
 * Full, server-paginated directory of researchers at the user's institution.
 * Built for hundreds of members: search + department filter + sort + paging.
 */
export default function InstitutionDirectoryModal({
  open,
  onClose,
  onView,
  onAdd,
  isTaken = () => false,
  roleLabel = 'investigator',
  institutionName = '',
  initialQuery = '',
  selectable = false,
  isSelectable = () => false,
  isSelected = () => false,
  onToggle = () => {},
  onToggleMany = () => {},
  selectedCount = 0,
  onContinueBatch = () => {},
}) {
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState(null);
  const [sort, setSort] = useState('name');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [directoryTotal, setDirectoryTotal] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestRef = useRef(null);
  const metaLoadedRef = useRef(false);

  // Seed the search box from the quick search each time the modal opens
  useEffect(() => {
    if (open) {
      setQuery(initialQuery);
      setPage(0);
    }
  }, [open, initialQuery]);

  useEffect(() => {
    if (!open) return undefined;
    const timer = setTimeout(async () => {
      requestRef.current?.abort();
      const controller = new AbortController();
      requestRef.current = controller;
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), sort });
        if (query.trim()) params.append('q', query.trim());
        if (department) params.append('department', department);
        if (metaLoadedRef.current) params.append('meta', '0');
        const response = await fetch(`/api/researcher/institution-directory?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'Failed to load the directory.');
        setRows(data.researchers || []);
        setTotal(data.total || 0);
        if (data.departments) {
          setDepartments(data.departments);
          setDirectoryTotal(data.directoryTotal ?? null);
          metaLoadedRef.current = true;
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        setError(err.message || 'Failed to load the directory.');
        setRows([]);
      } finally {
        if (requestRef.current === controller) {
          requestRef.current = null;
          setLoading(false);
        }
      }
    }, query ? 300 : 0);
    return () => clearTimeout(timer);
  }, [open, query, department, sort, page, pageSize]);

  useEffect(() => () => requestRef.current?.abort(), []);

  const filtered = Boolean(query.trim() || department);
  const pageSelectable = rows.filter(isSelectable);
  const pageSelectedCount = pageSelectable.filter(isSelected).length;
  const allPageSelected = pageSelectable.length > 0 && pageSelectedCount === pageSelectable.length;
  const checkboxSx = { color: alpha(PURPLE, 0.6), '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: PURPLE } };
  const columnCount = selectable ? 6 : 5;
  const name = institutionName || 'Institution';

  return (
    <InstitutionModal open={open} onClose={onClose} maxWidth="lg">
      <InstitutionModalHeader
        icon={InstitutionIcon}
        title={`${name} Directory`}
        subtitle={
          directoryTotal != null
            ? `${directoryTotal.toLocaleString()} registered researcher${directoryTotal === 1 ? '' : 's'}. View a profile or add someone as ${roleLabel}.`
            : `Browse registered researchers and add them as ${roleLabel}.`
        }
        onClose={onClose}
      />
      <InstitutionModalBody dense>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '2fr 1.3fr 1fr' },
            gap: 1.5,
          }}
        >
          <TextField
            autoFocus
            size="small"
            label="Search"
            placeholder="Name, email, ORCID iD or department"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0); }}
            autoComplete="off"
            InputLabelProps={{ shrink: true }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: PURPLE, fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={fieldFocusSx}
          />
          <Autocomplete
            size="small"
            options={departments}
            value={department}
            onChange={(_e, value) => { setDepartment(value); setPage(0); }}
            noOptionsText="No departments on profiles yet"
            renderInput={(params) => (
              <TextField {...params} label="Department" placeholder="All departments" InputLabelProps={{ shrink: true }} sx={fieldFocusSx} />
            )}
          />
          <TextField
            select
            size="small"
            label="Sort by"
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(0); }}
            InputLabelProps={{ shrink: true }}
            SelectProps={{ MenuProps: { disableScrollLock: true } }}
            sx={fieldFocusSx}
          >
            {SORT_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
            ))}
          </TextField>
        </Box>

        {error ? <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert> : null}

        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ height: 3 }}>{loading ? <LinearProgress sx={{ height: 3, '& .MuiLinearProgress-bar': { bgcolor: PURPLE }, bgcolor: alpha(PURPLE, 0.12) }} /> : null}</Box>
          <TableContainer sx={{ maxHeight: '52vh' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {selectable ? (
                    <TableCell padding="checkbox" sx={headCellSx}>
                      <Checkbox
                        size="small"
                        checked={allPageSelected}
                        indeterminate={pageSelectedCount > 0 && !allPageSelected}
                        disabled={!pageSelectable.length}
                        onChange={() => onToggleMany(pageSelectable, !allPageSelected)}
                        inputProps={{ 'aria-label': 'Select all on this page' }}
                        sx={checkboxSx}
                      />
                    </TableCell>
                  ) : null}
                  <TableCell sx={headCellSx}>Researcher</TableCell>
                  <TableCell sx={{ ...headCellSx, display: { xs: 'none', sm: 'table-cell' } }}>Department</TableCell>
                  <TableCell sx={{ ...headCellSx, display: { xs: 'none', md: 'table-cell' } }}>ORCID iD</TableCell>
                  <TableCell align="center" sx={{ ...headCellSx, display: { xs: 'none', md: 'table-cell' } }}>Publications</TableCell>
                  <TableCell align="right" sx={headCellSx}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody sx={{ opacity: loading ? 0.6 : 1, transition: 'opacity 120ms' }}>
                {!loading && rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columnCount} sx={{ py: 6, textAlign: 'center', borderBottom: 0 }}>
                      <PersonSearchIcon sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                        {filtered ? 'No researchers match your filters' : 'No other researchers registered yet'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {filtered ? 'Try another name or clear the department filter.' : 'Use the ORCID tab to find external collaborators.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : null}
                {rows.map((researcher) => {
                  const taken = isTaken(researcher);
                  const checked = isSelected(researcher);
                  return (
                    <TableRow key={researcher.userId} hover selected={checked}>
                      {selectable ? (
                        <TableCell padding="checkbox">
                          <Checkbox
                            size="small"
                            checked={checked}
                            disabled={!isSelectable(researcher)}
                            onChange={() => onToggle(researcher)}
                            inputProps={{ 'aria-label': `Select ${displayName(researcher)}` }}
                            sx={checkboxSx}
                          />
                        </TableCell>
                      ) : null}
                      <TableCell sx={{ py: 1.1 }}>
                        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                          <ResearcherAvatar researcher={researcher} size={34} />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              variant="body2"
                              onClick={() => onView(researcher)}
                              sx={{ fontWeight: 700, color: '#1e293b', cursor: 'pointer', '&:hover': { color: PURPLE, textDecoration: 'underline' } }}
                            >
                              {displayName(researcher)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', maxWidth: 300 }}>
                              {[researcher.academicTitle, researcher.email].filter(Boolean).join(' · ')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'block', sm: 'none' } }}>
                              {researcher.department || 'No department'}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        {researcher.department ? (
                          <Typography variant="body2" sx={{ color: '#334155' }}>{researcher.department}</Typography>
                        ) : (
                          <Typography variant="caption" color="text.disabled">Not set</Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        {researcher.orcidId ? (
                          <Chip size="small" label={researcher.orcidId} sx={{ height: 22, fontWeight: 700, fontSize: '0.68rem', bgcolor: alpha(PURPLE, 0.1), color: PURPLE }} />
                        ) : (
                          <Typography variant="caption" color="text.disabled">—</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center" sx={{ display: { xs: 'none', md: 'table-cell' }, fontWeight: 700, color: '#334155' }}>
                        {researcher.publicationCount ?? '—'}
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        <Button size="small" variant="outlined" onClick={() => onView(researcher)} sx={{ ...outlinedButtonSx, mr: 1 }}>
                          Profile
                        </Button>
                        <Button size="small" variant="contained" disabled={taken} onClick={() => onAdd(researcher)} sx={primaryButtonSx}>
                          {taken ? 'Added' : 'Add'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={total}
            page={Math.min(page, Math.max(Math.ceil(total / pageSize) - 1, 0))}
            onPageChange={(_e, value) => setPage(value)}
            rowsPerPage={pageSize}
            onRowsPerPageChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={PAGE_SIZES}
            labelRowsPerPage="Per page"
            SelectProps={{ MenuProps: { disableScrollLock: true } }}
            sx={{ borderTop: '1px solid', borderColor: 'divider' }}
          />
        </Box>
      </InstitutionModalBody>
      <InstitutionModalFooter>
        <Typography variant="caption" color="text.secondary" sx={{ mr: 'auto' }}>
          {selectable && selectedCount > 0
            ? `${selectedCount} selected${filtered ? ` · ${total.toLocaleString()} matching` : ''}`
            : filtered ? `${total.toLocaleString()} matching` : ''}
        </Typography>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          {selectable && selectedCount > 0 ? 'Back' : 'Close'}
        </Button>
        {selectable ? (
          <Button
            variant="contained"
            endIcon={<ChevronRightIcon />}
            disabled={selectedCount === 0}
            onClick={onContinueBatch}
            sx={primaryButtonSx}
          >
            {selectedCount > 0 ? `Continue with ${selectedCount} selected` : 'Select researchers to continue'}
          </Button>
        ) : null}
      </InstitutionModalFooter>
    </InstitutionModal>
  );
}
