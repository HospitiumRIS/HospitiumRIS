'use client';

import React, { useState, useEffect } from 'react';
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
    Select
} from '@mui/material';
import {
    Search as SearchIcon,
    Clear as ClearIcon,
    FilterList as FilterListIcon
} from '@mui/icons-material';

/**
 * SearchResultsDialog - Displays search results from publication databases
 * with filtering and selection capabilities
 */
const SearchResultsDialog = ({ 
    open, 
    onClose, 
    results, 
    onPreview, 
    loading, 
    title = "Search Results" 
}) => {
    const [filteredResults, setFilteredResults] = useState(results);
    const [filterText, setFilterText] = useState('');
    const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
    const [filters, setFilters] = useState({
        year: '',
        journal: '',
        author: ''
    });

    useEffect(() => {
        setFilteredResults(results);
    }, [results]);

    const handleFilter = () => {
        let filtered = [...results];

        // Apply text search across all fields
        if (filterText) {
            const searchTerm = filterText.toLowerCase();
            filtered = filtered.filter(item => 
                item.title.toLowerCase().includes(searchTerm) ||
                item.authors.some(author => author.toLowerCase().includes(searchTerm)) ||
                item.journal.toLowerCase().includes(searchTerm)
            );
        }

        // Apply specific filters
        if (filters.year) {
            filtered = filtered.filter(item => item.year.toString() === filters.year);
        }
        if (filters.journal) {
            filtered = filtered.filter(item => 
                item.journal.toLowerCase().includes(filters.journal.toLowerCase())
            );
        }
        if (filters.author) {
            filtered = filtered.filter(item => 
                item.authors.some(author => 
                    author.toLowerCase().includes(filters.author.toLowerCase())
                )
            );
        }

        setFilteredResults(filtered);
    };

    useEffect(() => {
        handleFilter();
    }, [filterText, filters, results]);

    // Get unique values for filter dropdowns
    const uniqueYears = [...new Set(results.map(item => item.year))].sort().reverse();
    const uniqueJournals = [...new Set(results.map(item => item.journal))].sort();
    const uniqueAuthors = [...new Set(results.flatMap(item => item.authors))].sort();

    const clearFilters = () => {
        setFilters({
            year: '',
            journal: '',
            author: ''
        });
        setFilterText('');
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: { minHeight: '70vh' }
            }}
        >
            <DialogTitle sx={{ 
                backgroundColor: '#8b6cbc', 
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <Typography component="div" variant="h6">
                    {title} ({results.length} found)
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
                <Box sx={{ mb: 2, mt: 2 }}>
                    <TextField
                        fullWidth
                        placeholder="Search in results..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
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
                </Box>

                {/* Active filters display */}
                {(filters.year || filters.journal || filters.author) && (
                    <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {Object.entries(filters).map(([key, value]) => value && (
                            <Chip
                                key={key}
                                label={`${key}: ${value}`}
                                onDelete={() => setFilters(prev => ({ ...prev, [key]: '' }))}
                                size="small"
                                sx={{ backgroundColor: '#8b6cbc', color: 'white' }}
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

                <TableContainer component={Paper} sx={{ mt: 2, maxHeight: '60vh' }}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ minWidth: 300 }}>Title</TableCell>
                                <TableCell sx={{ minWidth: 200 }}>Authors</TableCell>
                                <TableCell sx={{ minWidth: 80 }}>Year</TableCell>
                                <TableCell sx={{ minWidth: 200 }}>Journal</TableCell>
                                <TableCell sx={{ minWidth: 100 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
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
                                    <TableCell colSpan={5} align="center">
                                        <Typography sx={{ py: 3, color: 'text.secondary' }}>
                                            {results.length === 0 ? 'No publications found' : 'No results match your filters'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredResults.map((result, index) => (
                                    <TableRow 
                                        key={result.pubmedId || result.doi || result.id || index}
                                        hover
                                        sx={{
                                            cursor: 'pointer',
                                            '&:hover': {
                                                backgroundColor: 'rgba(139, 108, 188, 0.08)'
                                            }
                                        }}
                                    >
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
                                                {result.authors.slice(0, 3).join(', ')}
                                                {result.authors.length > 3 && ' et al.'}
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
                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onPreview(result);
                                                }}
                                                sx={{
                                                    backgroundColor: '#8b6cbc',
                                                    '&:hover': {
                                                        backgroundColor: '#7b5ca7'
                                                    }
                                                }}
                                            >
                                                Preview
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Results summary */}
                {!loading && filteredResults.length > 0 && (
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                            Showing {filteredResults.length} of {results.length} results
                        </Typography>
                    </Box>
                )}
            </DialogContent>

            {/* Filter Menu */}
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
                            onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
                            label="Year"
                        >
                            <MenuItem value="">All Years</MenuItem>
                            {uniqueYears.map(year => (
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
                            onChange={(e) => setFilters(prev => ({ ...prev, journal: e.target.value }))}
                            label="Journal"
                        >
                            <MenuItem value="">All Journals</MenuItem>
                            {uniqueJournals.slice(0, 20).map(journal => (
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
                            onChange={(e) => setFilters(prev => ({ ...prev, author: e.target.value }))}
                            label="Author"
                        >
                            <MenuItem value="">All Authors</MenuItem>
                            {uniqueAuthors.slice(0, 50).map(author => (
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
