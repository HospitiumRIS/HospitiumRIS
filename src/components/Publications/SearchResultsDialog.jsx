'use client';

import { useTranslation } from 'react-i18next';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Typography,
    TextField,
    InputAdornment,
    IconButton,
    Box,
    CircularProgress,
    Chip,
    Menu,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Tooltip
} from '@mui/material';
import {
    Search as SearchIcon,
    Clear as ClearIcon,
    FilterList as FilterListIcon,
    Download as ImportIcon,
    Visibility as PreviewIcon,
    AutoAwesome as AIIcon
} from '@mui/icons-material';
import { qualityBand } from '../../lib/publicationQuality';

const PURPLE = '#8b6cbc';

function mergeEnrichment(item, enrichment) {
    const extra = enrichment[item.id] || {};
    return {
        ...item,
        inLibrary: extra.inLibrary === true,
        citationCount: extra.citationCount ?? item.citationCount ?? 0,
        citationSource: extra.citationSource || item.citationSource || null,
        qualityScore: extra.qualityScore ?? item.qualityScore ?? null,
        rcr: extra.rcr ?? item.rcr ?? null,
        evidenceLevel: extra.evidenceLevel || item.evidenceLevel || null,
        nihPercentile: extra.nihPercentile ?? null,
    };
}

/**
 * SearchResultsDialog - Displays search results from publication databases
 * with filtering and selection capabilities
 */
const SearchResultsDialog = ({
    open,
    onClose,
    results,
    onPreview,
    onImport,
    onPreviewMultiple,
    loading,
    title = "Search Results",
    hasMore = false,
    onLoadMore,
    loadingMore = false
}) => {
    const { t } = useTranslation();
    const [filterText, setFilterText] = useState('');
    const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
    const [selectedPublications, setSelectedPublications] = useState([]);
    const [filters, setFilters] = useState({
        year: '',
        journal: '',
        author: ''
    });
    const [enrichment, setEnrichment] = useState({});
    const [enriching, setEnriching] = useState(false);
    const [sortBy, setSortBy] = useState('quality');
    const enrichmentRef = useRef({});

    useEffect(() => {
        enrichmentRef.current = enrichment;
    }, [enrichment]);

    useEffect(() => {
        setSelectedPublications([]);
        if (!open) {
            setEnrichment({});
            enrichmentRef.current = {};
        }
    }, [results, open]);

    useEffect(() => {
        if (!open || !results?.length) return undefined;

        const missing = results.filter((item) => item?.id && !enrichmentRef.current[item.id]);
        if (missing.length === 0) return undefined;

        let cancelled = false;
        const run = async () => {
            setEnriching(true);
            try {
                const response = await fetch('/api/publications/search-enrich', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        publications: missing.map((pub) => ({
                            id: pub.id,
                            doi: pub.doi,
                            pubmedId: pub.pubmedId,
                            title: pub.title,
                            year: pub.year,
                            journal: pub.journal,
                            type: pub.type,
                            pubTypes: pub.pubTypes,
                            citationCount: pub.citationCount
                        }))
                    })
                });
                const data = await response.json();
                if (!cancelled && data.items) {
                    setEnrichment((prev) => ({ ...prev, ...data.items }));
                }
            } catch (error) {
                console.error('Failed to enrich search results:', error);
            } finally {
                if (!cancelled) setEnriching(false);
            }
        };

        run();
        return () => {
            cancelled = true;
        };
    }, [open, results]);

    const enrichedResults = useMemo(
        () => (results || []).map((item) => mergeEnrichment(item, enrichment)),
        [results, enrichment]
    );

    const filteredResults = useMemo(() => {
        let filtered = [...enrichedResults];

        if (filterText) {
            const searchTerms = filterText.toLowerCase().trim().split(/\s+/);
            filtered = filtered.filter((item) => {
                const searchableText = [
                    item.title || '',
                    ...(item.authors || []),
                    item.journal || '',
                    item.abstract || '',
                    item.year?.toString() || '',
                    item.doi || '',
                    item.keywords?.join(' ') || ''
                ].join(' ').toLowerCase();

                return searchTerms.every((term) => searchableText.includes(term));
            });
        }

        if (filters.year) {
            filtered = filtered.filter((item) => item.year?.toString() === filters.year);
        }
        if (filters.journal) {
            filtered = filtered.filter((item) =>
                (item.journal || '').toLowerCase().includes(filters.journal.toLowerCase())
            );
        }
        if (filters.author) {
            filtered = filtered.filter((item) =>
                (item.authors || []).some((author) =>
                    author.toLowerCase().includes(filters.author.toLowerCase())
                )
            );
        }

        filtered.sort((a, b) => {
            if (sortBy === 'year') return (Number(b.year) || 0) - (Number(a.year) || 0);
            if (sortBy === 'citations') return (b.citationCount || 0) - (a.citationCount || 0);
            if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
            const scoreDiff = (b.qualityScore || 0) - (a.qualityScore || 0);
            if (scoreDiff !== 0) return scoreDiff;
            return (b.citationCount || 0) - (a.citationCount || 0);
        });

        return filtered;
    }, [enrichedResults, filterText, filters, sortBy]);

    const uniqueYears = [...new Set(results.map((item) => item.year))].sort().reverse();
    const uniqueJournals = [...new Set(results.map((item) => item.journal))].sort();
    const uniqueAuthors = [...new Set(results.flatMap((item) => item.authors || []))].sort();
    const importableResults = filteredResults.filter((item) => !item.inLibrary);

    const clearFilters = () => {
        setFilters({
            year: '',
            journal: '',
            author: ''
        });
        setFilterText('');
    };

    const handleSelectAll = (event) => {
        if (event.target.checked) {
            setSelectedPublications(importableResults.map((r) => r.id));
        } else {
            setSelectedPublications([]);
        }
    };

    const handleSelectOne = (publicationId) => {
        setSelectedPublications((prev) => {
            if (prev.includes(publicationId)) {
                return prev.filter((id) => id !== publicationId);
            }
            return [...prev, publicationId];
        });
    };

    const selectedPubs = () => enrichedResults.filter((r) => selectedPublications.includes(r.id));

    const handleImportSelected = () => {
        const pubs = selectedPubs();
        if (pubs.length === 0) return;
        if (onPreviewMultiple) {
            onPreviewMultiple(pubs);
            return;
        }
        if (onImport) onImport(pubs);
    };

    const handlePreviewSelected = () => {
        const pubs = selectedPubs();
        if (onPreviewMultiple && pubs.length > 0) {
            onPreviewMultiple(pubs);
        }
    };

    const isAllSelected = importableResults.length > 0 && importableResults.every((item) => selectedPublications.includes(item.id));
    const isSomeSelected = selectedPublications.length > 0 && !isAllSelected;
    const checkboxRef = React.useRef(null);

    useEffect(() => {
        if (checkboxRef.current) {
            checkboxRef.current.indeterminate = isSomeSelected;
        }
    }, [isSomeSelected]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    minHeight: '70vh',
                    borderRadius: 3,
                    overflow: 'hidden',
                }
            }}
        >
            <DialogTitle sx={{
                background: 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <Typography component="div" variant="h6">
                    {title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton
                        size="small"
                        onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
                        sx={{ color: 'white' }}
                        title="Filter results"
                    >
                        <FilterListIcon />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={onClose}
                        sx={{ color: 'white' }}
                        title="Close dialog"
                    >
                        <ClearIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent>
                <Box sx={{ mb: 2, mt: 2, display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <TextField
                        fullWidth
                        placeholder="Filter by title, author, journal, abstract, keywords..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        helperText={filterText ? `Filtering ${filteredResults.length} of ${results.length} results` : 'Type to search across all fields'}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                            endAdornment: filterText && (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setFilterText('')}>
                                        <ClearIcon />
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                    <FormControl size="small" sx={{ minWidth: 180, mt: 0.5 }}>
                        <InputLabel>Rank by</InputLabel>
                        <Select
                            value={sortBy}
                            label="Rank by"
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <MenuItem value="quality">Citation quality</MenuItem>
                            <MenuItem value="citations">Citations</MenuItem>
                            <MenuItem value="year">Year</MenuItem>
                            <MenuItem value="title">Title</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                    {enriching
                        ? 'Checking your library and ranking papers by citation quality…'
                        : 'Ranked for citation use: field-normalized impact (NIH RCR), citation count, and study design.'}
                </Typography>

                {(filters.year || filters.journal || filters.author) && (
                    <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {Object.entries(filters).map(([key, value]) => value && (
                            <Chip
                                key={key}
                                label={`${key}: ${value}`}
                                onDelete={() => setFilters((prev) => ({ ...prev, [key]: '' }))}
                                size="small"
                                sx={{ backgroundColor: PURPLE, color: 'white' }}
                            />
                        ))}
                        <Chip
                            label="Clear all filters"
                            onClick={clearFilters}
                            size="small"
                            variant="outlined"
                        />
                    </Box>
                )}

                {selectedPublications.length > 0 && (
                    <Box sx={{
                        mb: 2,
                        p: 2,
                        backgroundColor: 'rgba(139, 108, 188, 0.1)',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {selectedPublications.length} publication{selectedPublications.length !== 1 ? 's' : ''} selected
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => setSelectedPublications([])}
                                sx={{ borderColor: PURPLE, color: PURPLE }}
                            >
                                Clear Selection
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<PreviewIcon />}
                                onClick={handlePreviewSelected}
                                sx={{
                                    borderColor: PURPLE,
                                    color: PURPLE,
                                    '&:hover': {
                                        borderColor: '#7b5ca7',
                                        backgroundColor: 'rgba(139, 108, 188, 0.08)'
                                    }
                                }}
                            >
                                Preview Selected
                            </Button>
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<ImportIcon />}
                                onClick={handleImportSelected}
                                sx={{
                                    backgroundColor: PURPLE,
                                    '&:hover': { backgroundColor: '#7b5ca7' }
                                }}
                            >
                                Import Selected
                            </Button>
                        </Box>
                    </Box>
                )}

                <TableContainer component={Paper} sx={{ mt: 2, maxHeight: '60vh' }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox">
                                    <input
                                        ref={checkboxRef}
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={handleSelectAll}
                                        style={{ cursor: 'pointer' }}
                                    />
                                </TableCell>
                                <TableCell sx={{ minWidth: 260 }}>Title</TableCell>
                                <TableCell sx={{ minWidth: 150 }}>Authors</TableCell>
                                <TableCell sx={{ minWidth: 70 }}>Year</TableCell>
                                <TableCell sx={{ minWidth: 160 }}>Journal</TableCell>
                                <TableCell sx={{ minWidth: 110 }}>Library</TableCell>
                                <TableCell sx={{ minWidth: 110 }}>Quality</TableCell>
                                <TableCell sx={{ minWidth: 100 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center">
                                        <Box sx={{ py: 4 }}>
                                            <CircularProgress sx={{ mb: 2 }} />
                                            <Typography variant="body2" color="text.secondary">
                                                Loading publications...
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ) : filteredResults.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center">
                                        <Typography sx={{ py: 3, color: 'text.secondary' }}>
                                            {results.length === 0 ? 'No publications found' : 'No results match your filters'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredResults.map((result, index) => {
                                    const isSelected = selectedPublications.includes(result.id);
                                    const qualityTip = [
                                        result.evidenceLevel,
                                        result.rcr != null ? `RCR ${Number(result.rcr).toFixed(2)}` : null,
                                        `${result.citationCount || 0} citation${(result.citationCount || 0) === 1 ? '' : 's'}${result.citationSource ? ` (${result.citationSource})` : ''}`,
                                        result.nihPercentile != null ? `NIH percentile ${Math.round(result.nihPercentile)}` : null
                                    ].filter(Boolean).join(' · ');

                                    return (
                                        <TableRow
                                            key={`${result.pubmedId || result.doi || result.id || 'result'}-${index}`}
                                            hover
                                            selected={isSelected}
                                            sx={{
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    backgroundColor: 'rgba(139, 108, 188, 0.08)'
                                                },
                                                backgroundColor: isSelected ? 'rgba(139, 108, 188, 0.12)' : 'inherit'
                                            }}
                                        >
                                            <TableCell padding="checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    disabled={result.inLibrary}
                                                    onChange={() => handleSelectOne(result.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={{ cursor: result.inLibrary ? 'not-allowed' : 'pointer' }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {result.title}
                                                </Typography>
                                                {result.abstract && (
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                        sx={{
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden',
                                                            mt: 0.5
                                                        }}
                                                    >
                                                        {result.abstract}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {(result.authors || []).slice(0, 3).join(', ')}
                                                    {(result.authors || []).length > 3 && ' et al.'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {result.year}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {result.journal}
                                                </Typography>
                                                {result.volume && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        Vol. {result.volume}
                                                        {result.issue && `, Issue ${result.issue}`}
                                                        {result.pages && `, pp. ${result.pages}`}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {result.inLibrary ? (
                                                    <Chip
                                                        label="In library"
                                                        size="small"
                                                        sx={{ bgcolor: 'rgba(46, 125, 50, 0.12)', color: '#2e7d32', fontWeight: 600 }}
                                                    />
                                                ) : (
                                                    <Chip
                                                        label="Not added"
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ borderColor: 'rgba(139, 108, 188, 0.35)', color: PURPLE }}
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {result.qualityScore == null && enriching ? (
                                                    <CircularProgress size={14} sx={{ color: PURPLE }} />
                                                ) : (
                                                    <Tooltip title={qualityTip || 'Quality score pending'} placement="top">
                                                        <Box>
                                                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                                                                {result.qualityScore ?? '—'}
                                                                {result.qualityScore != null && (
                                                                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5, fontWeight: 500 }}>
                                                                        {qualityBand(result.qualityScore)}
                                                                    </Typography>
                                                                )}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {result.citationCount || 0} cite{(result.citationCount || 0) === 1 ? '' : 's'}
                                                            </Typography>
                                                        </Box>
                                                    </Tooltip>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    startIcon={<AIIcon />}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onPreview(result);
                                                    }}
                                                    sx={{
                                                        backgroundColor: PURPLE,
                                                        '&:hover': { backgroundColor: '#7b5ca7' }
                                                    }}
                                                >
                                                    {t('common.preview')}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {!loading && filteredResults.length > 0 && (
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                            Showing {filteredResults.length} of {results.length} results
                        </Typography>
                        {hasMore && onLoadMore && (
                            <Box sx={{ mt: 2 }}>
                                <Button
                                    variant="outlined"
                                    onClick={onLoadMore}
                                    disabled={loadingMore}
                                    sx={{
                                        borderColor: PURPLE,
                                        color: PURPLE,
                                        '&:hover': {
                                            borderColor: '#7b5ca7',
                                            backgroundColor: 'rgba(139, 108, 188, 0.08)'
                                        }
                                    }}
                                >
                                    {loadingMore ? (
                                        <>
                                            <CircularProgress size={20} sx={{ mr: 1 }} />
                                            Loading more...
                                        </>
                                    ) : (
                                        'Load More Results'
                                    )}
                                </Button>
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>

            <Menu
                anchorEl={filterMenuAnchor}
                open={Boolean(filterMenuAnchor)}
                onClose={() => setFilterMenuAnchor(null)}
                PaperProps={{
                    sx: { width: 250 }
                }}
            >
                <MenuItem>
                    <FormControl fullWidth size="small">
                        <InputLabel>Year</InputLabel>
                        <Select
                            value={filters.year}
                            onChange={(e) => setFilters((prev) => ({ ...prev, year: e.target.value }))}
                            label="Year"
                        >
                            <MenuItem value="">All Years</MenuItem>
                            {uniqueYears.map((year) => (
                                <MenuItem key={year} value={year}>{year}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </MenuItem>
                <MenuItem>
                    <FormControl fullWidth size="small">
                        <InputLabel>Journal</InputLabel>
                        <Select
                            value={filters.journal}
                            onChange={(e) => setFilters((prev) => ({ ...prev, journal: e.target.value }))}
                            label="Journal"
                        >
                            <MenuItem value="">All Journals</MenuItem>
                            {uniqueJournals.slice(0, 20).map((journal) => (
                                <MenuItem key={journal} value={journal}>
                                    {journal.length > 30 ? `${journal.substring(0, 30)}...` : journal}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </MenuItem>
                <MenuItem>
                    <FormControl fullWidth size="small">
                        <InputLabel>Author</InputLabel>
                        <Select
                            value={filters.author}
                            onChange={(e) => setFilters((prev) => ({ ...prev, author: e.target.value }))}
                            label="Author"
                        >
                            <MenuItem value="">All Authors</MenuItem>
                            {uniqueAuthors.slice(0, 50).map((author) => (
                                <MenuItem key={author} value={author}>
                                    {author.length > 25 ? `${author.substring(0, 25)}...` : author}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </MenuItem>
            </Menu>
        </Dialog>
    );
};

export default SearchResultsDialog;
