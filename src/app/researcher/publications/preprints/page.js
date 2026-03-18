'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box,
    Container,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    TableSortLabel,
    Chip,
    IconButton,
    TextField,
    InputAdornment,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Button,
    Tooltip,
    CircularProgress,
    Link as MuiLink,
    Skeleton,
    Grid
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import ArticleIcon from '@mui/icons-material/Article';
import AddIcon from '@mui/icons-material/Add';
import PageHeader from '../../../../components/common/PageHeader';

const STATUS_CONFIG = {
    PENDING: { label: 'Pending', color: '#ff9800', bgColor: '#fff3e0' },
    UNDER_REVIEW: { label: 'Under Review', color: '#2196f3', bgColor: '#e3f2fd' },
    ACCEPTED: { label: 'Accepted', color: '#4caf50', bgColor: '#e8f5e9' },
    PUBLISHED: { label: 'Published', color: '#388e3c', bgColor: '#c8e6c9' },
    REJECTED: { label: 'Rejected', color: '#f44336', bgColor: '#ffebee' },
    WITHDRAWN: { label: 'Withdrawn', color: '#9e9e9e', bgColor: '#f5f5f5' },
};

const SERVER_CONFIG = {
    biorxiv: { label: 'bioRxiv', color: '#b31b1b' },
    medrxiv: { label: 'medRxiv', color: '#0868ac' },
    africarxiv: { label: 'AfricArXiv', color: '#E07B27' },
};

const StatusChip = ({ status }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
    return (
        <Chip
            label={config.label}
            size="small"
            sx={{
                bgcolor: config.bgColor,
                color: config.color,
                fontWeight: 600,
                fontSize: '0.7rem',
                height: 24,
                border: `1px solid ${config.color}30`,
            }}
        />
    );
};

const ServerChip = ({ server }) => {
    const config = SERVER_CONFIG[server] || { label: server, color: '#666' };
    return (
        <Chip
            label={config.label}
            size="small"
            variant="outlined"
            sx={{
                borderColor: config.color,
                color: config.color,
                fontWeight: 600,
                fontSize: '0.7rem',
                height: 24,
            }}
        />
    );
};

export default function PreprintSubmissionsPage() {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [total, setTotal] = useState(0);
    const [sortBy, setSortBy] = useState('submittedAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterServer, setFilterServer] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const fetchSubmissions = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: (page + 1).toString(),
                limit: rowsPerPage.toString(),
                sortBy,
                sortOrder,
            });
            if (filterServer) params.set('server', filterServer);
            if (filterStatus) params.set('status', filterStatus);
            if (searchQuery.trim()) params.set('search', searchQuery.trim());

            const response = await fetch(`/api/publications/preprints?${params}`);
            const data = await response.json();

            if (data.success) {
                setSubmissions(data.submissions);
                setTotal(data.pagination.total);
            }
        } catch (error) {
            console.error('Failed to fetch submissions:', error);
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, sortBy, sortOrder, filterServer, filterStatus, searchQuery]);

    useEffect(() => {
        fetchSubmissions();
    }, [fetchSubmissions]);

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('desc');
        }
        setPage(0);
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setPage(0); // Reset to first page when searching
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '—';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
    };

    return (
        <Box sx={{ width: '100%', mt: 8, mb: 4 }}>
            <PageHeader
                title="Preprint Submissions"
                description="Track and manage your preprint submissions across all servers"
                icon={<ArticleIcon />}
                breadcrumbs={[
                    { label: 'Dashboard', href: '/researcher' },
                    { label: 'Publications', href: '/researcher/publications' },
                    { label: 'Preprint Submissions' },
                ]}
                actionButton={
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        href="/researcher/publications/submit"
                        sx={{
                            bgcolor: 'white',
                            color: '#8b6cbc',
                            fontWeight: 600,
                            '&:hover': { bgcolor: '#f5f5f5', color: '#7559a3' },
                        }}
                    >
                        New Submission
                    </Button>
                }
            />

            <Container maxWidth="xl" sx={{ mt: 0 }}>
                {/* Filters Bar */}
                <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, sm: 4, md: 4 }}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Search by title, author, or DOI..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        bgcolor: '#fafafa',
                                    },
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3, md: 2.5 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Server</InputLabel>
                                <Select
                                    value={filterServer}
                                    label="Server"
                                    onChange={(e) => { setFilterServer(e.target.value); setPage(0); }}
                                    sx={{ borderRadius: 2, bgcolor: '#fafafa' }}
                                >
                                    <MenuItem value="">All Servers</MenuItem>
                                    <MenuItem value="biorxiv">bioRxiv</MenuItem>
                                    <MenuItem value="medrxiv">medRxiv</MenuItem>
                                    <MenuItem value="africarxiv">AfricArXiv</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3, md: 2.5 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={filterStatus}
                                    label="Status"
                                    onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
                                    sx={{ borderRadius: 2, bgcolor: '#fafafa' }}
                                >
                                    <MenuItem value="">All Statuses</MenuItem>
                                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                        <MenuItem key={key} value={key}>{cfg.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 2, md: 3 }} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <Tooltip title="Refresh">
                                <IconButton onClick={fetchSubmissions} sx={{ bgcolor: '#f5f5f5' }}>
                                    <RefreshIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            {(filterServer || filterStatus || searchQuery) && (
                                <Button
                                    size="small"
                                    onClick={() => { setFilterServer(''); setFilterStatus(''); setSearchQuery(''); setPage(0); }}
                                    sx={{ color: 'text.secondary', fontSize: '0.75rem' }}
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </Grid>
                    </Grid>
                </Paper>

                {/* Table */}
                <Paper sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                    <TableContainer>
                        <Table sx={{ minWidth: 900 }}>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#fafafa' }}>
                                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        <TableSortLabel
                                            active={sortBy === 'title'}
                                            direction={sortBy === 'title' ? sortOrder : 'asc'}
                                            onClick={() => handleSort('title')}
                                        >
                                            Title
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, width: 180 }}>
                                        Authors
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, width: 100 }}>
                                        Type
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, width: 120 }}>
                                        <TableSortLabel
                                            active={sortBy === 'server'}
                                            direction={sortBy === 'server' ? sortOrder : 'asc'}
                                            onClick={() => handleSort('server')}
                                        >
                                            Server
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, width: 120 }}>
                                        <TableSortLabel
                                            active={sortBy === 'status'}
                                            direction={sortBy === 'status' ? sortOrder : 'asc'}
                                            onClick={() => handleSort('status')}
                                        >
                                            Status
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, width: 120 }}>
                                        <TableSortLabel
                                            active={sortBy === 'submittedAt'}
                                            direction={sortBy === 'submittedAt' ? sortOrder : 'asc'}
                                            onClick={() => handleSort('submittedAt')}
                                        >
                                            Submitted
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, width: 140 }}>
                                        DOI
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, width: 60 }} align="center">
                                        Link
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <TableRow key={i}>
                                            {[...Array(8)].map((_, j) => (
                                                <TableCell key={j}>
                                                    <Skeleton variant="text" width={j === 0 ? '80%' : '60%'} />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : submissions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} sx={{ textAlign: 'center', py: 8 }}>
                                            <ArticleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                                            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                                                No preprint submissions found
                                            </Typography>
                                            <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
                                                {searchQuery || filterServer || filterStatus
                                                    ? 'Try adjusting your filters'
                                                    : 'Submit your first preprint to see it listed here'}
                                            </Typography>
                                            {!searchQuery && !filterServer && !filterStatus && (
                                                <Button
                                                    variant="contained"
                                                    startIcon={<AddIcon />}
                                                    href="/researcher/publications/submit"
                                                    sx={{ bgcolor: '#8b6cbc', '&:hover': { bgcolor: '#7559a3' } }}
                                                >
                                                    Submit a Preprint
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    submissions.map((submission) => (
                                        <TableRow
                                            key={submission.id}
                                            hover
                                            sx={{
                                                '&:last-child td': { borderBottom: 0 },
                                                transition: 'background 0.15s',
                                            }}
                                        >
                                            <TableCell>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: 600,
                                                        fontSize: '0.85rem',
                                                        lineHeight: 1.4,
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                        maxWidth: 350,
                                                    }}
                                                >
                                                    {submission.title}
                                                </Typography>
                                                {submission.manuscriptFileName && (
                                                    <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.3 }}>
                                                        {submission.manuscriptFileName}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{
                                                        fontSize: '0.8rem',
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                    }}
                                                >
                                                    {submission.authors}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                                    {submission.articleType || '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <ServerChip server={submission.server} />
                                            </TableCell>
                                            <TableCell>
                                                <StatusChip status={submission.status} />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                                    {formatDate(submission.submittedAt)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {submission.doi ? (
                                                    <MuiLink
                                                        href={`https://doi.org/${submission.doi}`}
                                                        target="_blank"
                                                        rel="noopener"
                                                        sx={{ fontSize: '0.75rem', color: '#8b6cbc' }}
                                                    >
                                                        {submission.doi}
                                                    </MuiLink>
                                                ) : (
                                                    <Typography variant="body2" color="text.disabled" sx={{ fontSize: '0.8rem' }}>
                                                        —
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                {submission.serverUrl ? (
                                                    <Tooltip title={`View on ${submission.serverName}`}>
                                                        <IconButton
                                                            size="small"
                                                            href={submission.serverUrl}
                                                            target="_blank"
                                                            rel="noopener"
                                                            sx={{ color: '#8b6cbc' }}
                                                        >
                                                            <OpenInNewIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                ) : (
                                                    <Typography variant="body2" color="text.disabled">—</Typography>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {!loading && submissions.length > 0 && (
                        <TablePagination
                            component="div"
                            count={total}
                            page={page}
                            onPageChange={(_, newPage) => setPage(newPage)}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                            rowsPerPageOptions={[5, 10, 25, 50]}
                            sx={{
                                borderTop: '1px solid',
                                borderColor: 'divider',
                                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                                    fontSize: '0.8rem',
                                },
                            }}
                        />
                    )}
                </Paper>

                {/* Summary Stats */}
                {!loading && total > 0 && (
                    <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Typography variant="caption" color="text.secondary">
                            {total} total submission{total !== 1 ? 's' : ''}
                        </Typography>
                    </Box>
                )}
            </Container>
        </Box>
    );
}
