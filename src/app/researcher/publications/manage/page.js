'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  TextField,
  Button,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  Avatar,
  Badge,
  InputAdornment,
  Select,
  FormControl,
  InputLabel,
  Divider,
  Tooltip,
  Alert,
  Stack,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Checkbox
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Share as ShareIcon,
  GetApp as DownloadIcon,
  Add as AddIcon,
  Sort as SortIcon,
  Public as PublicIcon,
  Lock as PrivateIcon,
  Schedule as DraftIcon,
  CheckCircle as PublishedIcon,
  MoreVert as MoreIcon,
  Article as ArticleIcon,
  School as BookIcon,
  Event as ConferenceIcon,
  Description as ReportIcon,
  Assignment as ThesisIcon,
  Link as LinkIcon,
  DateRange as DateIcon,
  Person as AuthorIcon,
  LocalOffer as TagIcon,
  Assessment as MetricsIcon,
  ViewList as TableViewIcon,
  ViewModule as CardViewIcon
} from '@mui/icons-material';
import PageHeader from '../../../../components/common/PageHeader';
import { useAuth } from '../../../../components/AuthProvider';

export default function ManagePublications() {
  const { user } = useAuth();
  const [publications, setPublications] = useState([]);
  const [filteredPublications, setFilteredPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [selectedPublication, setSelectedPublication] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState(null);
  const [viewType, setViewType] = useState('table'); // 'table' or 'cards'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Transform database publication to UI format
  const transformPublicationForUI = (dbPublication) => {
    return {
      id: dbPublication.id,
      title: dbPublication.title || 'Unknown Title',
      authors: Array.isArray(dbPublication.authors) && dbPublication.authors.length > 0 
        ? dbPublication.authors 
        : ['Unknown Author'],
      journal: dbPublication.journal || 'Unknown Journal',
      year: dbPublication.year || (dbPublication.publicationDate 
        ? new Date(dbPublication.publicationDate).getFullYear() 
        : 'Unknown Year'),
      type: dbPublication.type || 'article',
      status: dbPublication.status ? dbPublication.status.toLowerCase().replace('_', '-') : 'published',
      doi: dbPublication.doi || null,
      abstract: dbPublication.abstract || '',
      url: dbPublication.url || '',
      volume: dbPublication.volume || '',
      pages: dbPublication.pages || '',
      isbn: dbPublication.isbn || '',
      source: dbPublication.source || 'Unknown',
      // UI-specific fields with defaults
      citations: 0, // Could be added to database later
      downloads: 0, // Could be added to database later
      visibility: 'public', // Could be added to database later
      tags: Array.isArray(dbPublication.keywords) && dbPublication.keywords.length > 0 
        ? dbPublication.keywords 
        : [],
      createdAt: dbPublication.createdAt ? new Date(dbPublication.createdAt) : new Date(),
      updatedAt: dbPublication.updatedAt ? new Date(dbPublication.updatedAt) : new Date(),
      // Additional metadata
      publicationDate: dbPublication.publicationDate ? new Date(dbPublication.publicationDate) : null,
      authorId: dbPublication.authorId || null
    };
  };

  useEffect(() => {
    // Fetch publications from API
    const fetchPublications = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/publications/import', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch publications: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && Array.isArray(data.publications)) {
          // Transform database publications to UI format
          const transformedPublications = data.publications.map(transformPublicationForUI);
          setPublications(transformedPublications);
          setFilteredPublications(transformedPublications);
        } else {
          console.error('Invalid response format:', data);
          setError('Invalid response format from server');
          setPublications([]);
          setFilteredPublications([]);
        }
      } catch (error) {
        console.error('Error fetching publications:', error);
        setError(`Failed to load publications: ${error.message}`);
        setPublications([]);
        setFilteredPublications([]);
      } finally {
      setLoading(false);
      }
    };

    fetchPublications();
  }, []);

  useEffect(() => {
    // Filter and search publications
    let filtered = publications.filter(pub => {
      const matchesSearch = pub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          pub.authors.some(author => author.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          pub.journal.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = typeFilter === 'all' || pub.type === typeFilter;

      return matchesSearch && matchesType;
    });

    // Sort publications
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.year) - new Date(a.year);
        case 'date-asc':
          return new Date(a.year) - new Date(b.year);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'citations':
          return b.citations - a.citations;
        default:
          return 0;
      }
    });

    setFilteredPublications(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [publications, searchQuery, typeFilter, sortBy]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'published':
        return <PublishedIcon sx={{ color: '#4caf50' }} />;
      case 'under-review':
        return <DraftIcon sx={{ color: '#ff9800' }} />;
      case 'draft':
        return <DraftIcon sx={{ color: '#757575' }} />;
      default:
        return <ArticleIcon />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return '#4caf50';
      case 'under-review':
        return '#ff9800';
      case 'draft':
        return '#757575';
      default:
        return '#8b6cbc';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'journal':
        return <ArticleIcon />;
      case 'book':
        return <BookIcon />;
      case 'conference':
        return <ConferenceIcon />;
      case 'report':
        return <ReportIcon />;
      case 'thesis':
        return <ThesisIcon />;
      default:
        return <ArticleIcon />;
    }
  };

  const handleViewPublication = (publication) => {
    setSelectedPublication(publication);
    setViewDialogOpen(true);
  };

  const handleDeletePublication = (publication) => {
    setSelectedPublication(publication);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    setPublications(prev => prev.filter(pub => pub.id !== selectedPublication.id));
    setDeleteDialogOpen(false);
    setSelectedPublication(null);
  };

  const handleMenuClick = useCallback((event, publication) => {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('Menu click:', event.currentTarget); // Debug log
    
    // Try multiple approaches to ensure we get the right anchor
    const target = event.currentTarget || event.target;
    
    if (target) {
      setMenuAnchor(target);
    setSelectedPublication(publication);
      
      // Also get position for debugging
      const rect = target.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left: rect.right + window.scrollX
      });
      
      console.log('Anchor element:', target);
      console.log('Position:', { top: rect.bottom, left: rect.right });
    } else {
      console.error('No target element found');
    }
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchor(null);
    setSelectedPublication(null);
  }, []);

  // Pagination calculations
  const totalPages = Math.ceil(filteredPublications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPagePublications = filteredPublications.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setSortBy('date-desc');
    setCurrentPage(1);
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );

  const getSourceIcon = (source) => {
    switch (source?.toLowerCase()) {
      case 'pubmed':
        return <img src="/pubmed.svg" alt="PubMed" style={{ width: 20, height: 20 }} />;
      case 'crossref':
        return <img src="/doi.svg" alt="Crossref" style={{ width: 20, height: 20 }} />;
      case 'openalex':
        return <img src="/OpenAlex.png" alt="OpenAlex" style={{ width: 20, height: 20 }} />;
      case 'bibtex':
        return <img src="/bibtex_s.png" alt="BibTeX" style={{ width: 20, height: 20 }} />;
      default:
        return <ArticleIcon sx={{ fontSize: 20 }} />;
    }
  };

  const PublicationsCards = ({ publications }) => (
    <Box>
      {publications.map((publication) => (
        <Card key={publication.id} sx={{ mb: 2, '&:hover': { boxShadow: 4 } }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
              {getTypeIcon(publication.type)}
                  <Box sx={{ ml: 1, flex: 1 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600, 
                        lineHeight: 1.3,
                        cursor: 'pointer',
                        '&:hover': { color: '#8b6cbc' }
                      }}
                      onClick={() => handleViewPublication(publication)}
                    >
                {publication.title}
                    </Typography>
                    {publication.source && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        {getSourceIcon(publication.source)}
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                          Imported from {publication.source}
              </Typography>
                      </Box>
                    )}
                  </Box>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <AuthorIcon sx={{ fontSize: 16, mr: 0.5 }} />
              {publication.authors.join(', ')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <DateIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  {publication.journal} {publication.year && `(${publication.year})`}
                  {publication.volume && `, Vol. ${publication.volume}`}
                  {publication.pages && `, pp. ${publication.pages}`}
            </Typography>
            {publication.doi && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <LinkIcon sx={{ fontSize: 16, mr: 0.5 }} />
                    DOI: <a href={`https://doi.org/${publication.doi}`} target="_blank" rel="noopener noreferrer" style={{ color: '#8b6cbc' }}>
                      {publication.doi}
                    </a>
                  </Typography>
                )}
                {publication.abstract && (
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    mb: 1, 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {publication.abstract}
              </Typography>
            )}
          </Box>
          
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, ml: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                label={publication.status.replace('-', ' ')} 
                size="small"
                sx={{ 
                  bgcolor: getStatusColor(publication.status),
                  color: 'white'
                }}
                icon={getStatusIcon(publication.status)}
              />
              <IconButton
                size="small"
                onClick={(e) => handleMenuClick(e, publication)}
                title="More Actions"
                sx={{ 
                  ml: 0.5,
                  color: '#666',
                  '&:hover': { 
                    bgcolor: '#8b6cbc10' 
                  } 
                }}
              >
                <MoreIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {publication.tags && publication.tags.length > 0 && publication.tags.map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                variant="outlined"
                sx={{ borderColor: '#8b6cbc40', color: '#8b6cbc' }}
              />
            ))}
          </Box>
          
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            {publication.visibility === 'public' ? (
              <PublicIcon sx={{ fontSize: 18, color: '#4caf50' }} />
            ) : (
              <PrivateIcon sx={{ fontSize: 18, color: '#757575' }} />
            )}
            <Typography variant="caption" color="text.secondary">
              Updated {publication.updatedAt.toLocaleDateString()}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
      ))}
    </Box>
  );

  const PublicationsTable = ({ publications }) => (
    <TableContainer sx={{ borderRadius: 1, overflow: 'hidden' }}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: '#8b6cbc' }}>
            <TableCell sx={{ fontWeight: 600, color: 'white', borderBottom: 'none', py: 2 }}>Title</TableCell>
            <TableCell sx={{ fontWeight: 600, color: 'white', borderBottom: 'none', py: 2 }}>Authors</TableCell>
            <TableCell sx={{ fontWeight: 600, color: 'white', borderBottom: 'none', py: 2 }}>Date</TableCell>
            <TableCell sx={{ fontWeight: 600, color: 'white', borderBottom: 'none', py: 2 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 600, color: 'white', borderBottom: 'none', py: 2 }}>Type</TableCell>
            <TableCell sx={{ fontWeight: 600, color: 'white', borderBottom: 'none', py: 2, textAlign: 'center' }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {publications.map((publication, index) => (
            <TableRow 
              key={publication.id} 
              sx={{ 
                bgcolor: index % 2 === 0 ? '#fafafa' : 'white',
                '&:hover': { backgroundColor: '#f0f0f0' } 
              }}
            >
              {/* Title */}
              <TableCell sx={{ py: 2, maxWidth: 400 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  {getTypeIcon(publication.type)}
                  <Box sx={{ flex: 1 }}>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: 600,
                        lineHeight: 1.3,
                        mb: 0.5,
                        cursor: 'pointer',
                        '&:hover': { color: '#8b6cbc' }
                      }}
                      onClick={() => handleViewPublication(publication)}
                    >
                      {publication.title}
                    </Typography>
                    {publication.journal && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {publication.journal}
                        {publication.volume && ` • Vol. ${publication.volume}`}
                        {publication.pages && ` • pp. ${publication.pages}`}
                      </Typography>
                    )}
                    {publication.doi && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        <LinkIcon sx={{ fontSize: 12, mr: 0.5 }} />
                        {publication.doi.length > 40 ? `${publication.doi.substring(0, 40)}...` : publication.doi}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </TableCell>

              {/* Authors */}
              <TableCell sx={{ py: 2, maxWidth: 200 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    lineHeight: 1.4
                  }}
                >
                  {publication.authors.join(', ')}
                </Typography>
              </TableCell>

              {/* Date */}
              <TableCell sx={{ py: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {publication.publicationDate 
                    ? new Date(publication.publicationDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })
                    : publication.year || 'N/A'
                  }
                </Typography>
              </TableCell>

              {/* Status */}
              <TableCell sx={{ py: 2 }}>
                <Chip 
                  label={publication.status === 'published' ? 'Published' : publication.status.replace('-', ' ')} 
                  size="small"
                  sx={{ 
                    bgcolor: publication.status === 'published' ? '#4caf50' : '#ff9800',
                    color: 'white',
                    fontWeight: 500,
                    textTransform: 'capitalize'
                  }}
                />
              </TableCell>

              {/* Type */}
              <TableCell sx={{ py: 2 }}>
                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                  {publication.type}
                </Typography>
              </TableCell>

              {/* Actions */}
              <TableCell sx={{ py: 2, textAlign: 'center' }}>
                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                  <Tooltip title="View Details">
                    <IconButton 
                      size="small" 
                      onClick={() => handleViewPublication(publication)}
                      sx={{ color: '#8b6cbc' }}
                    >
                      <ViewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton 
                      size="small" 
                      sx={{ color: '#666' }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, publication)}
                    title="More Actions"
                      sx={{ 
                        color: '#666',
                        '&:hover': { 
                          bgcolor: '#8b6cbc10' 
                        } 
                      }}
                    >
                      <MoreIcon fontSize="small" />
                    </IconButton>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa', mt:8}} >
      <PageHeader
        title="Manage Publications"
        description="Manage and track your research publications"
        icon={<EditIcon />}
        breadcrumbs={[
          { label: 'Dashboard', path: '/researcher' },
          { label: 'Publications', path: '/researcher/publications' },
          { label: 'Manage Publications' }
        ]}
        actionButton={
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<SearchIcon />}
              sx={{ 
                borderColor: 'white',
                color: 'white',
                '&:hover': { 
                  borderColor: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ 
                bgcolor: 'white',
                color: '#8b6cbc',
                '&:hover': { 
                  bgcolor: '#f5f5f5',
                  color: '#7559a3'
                }
              }}
              onClick={() => window.location.href = '/researcher/publications/import'}
            >
              Import Publication
            </Button>
          </Box>
        }
      />

      <Container maxWidth="xl" sx={{ py: 4, mt:5 }}>
        {/* Statistics Cards */}
        <Grid container spacing={2.5} sx={{ mb: 4, mt: -6 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ 
              p: 2, 
              borderRadius: 2,
              bgcolor: '#8b6cbc',
              boxShadow: '0 2px 8px rgba(139, 108, 188, 0.2)',
              border: 'none',
              position: 'relative',
              overflow: 'hidden',
              height: '100px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                  Total Publications
                </Typography>
                <ArticleIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {publications.length}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', fontSize: '0.7rem' }}>
                <Box component="span" sx={{ mr: 0.5, fontSize: '0.8rem' }}>📚</Box>
                All research outputs
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ 
              p: 2, 
              borderRadius: 2,
              bgcolor: '#8b6cbc',
              boxShadow: '0 2px 8px rgba(139, 108, 188, 0.2)',
              border: 'none',
              position: 'relative',
              overflow: 'hidden',
              height: '100px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                  With DOI
              </Typography>
                <LinkIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {publications.filter(pub => pub.doi && pub.doi.length > 0).length}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', fontSize: '0.7rem' }}>
                <Box component="span" sx={{ mr: 0.5, fontSize: '0.8rem' }}>🔗</Box>
                {publications.length > 0 ? Math.round((publications.filter(pub => pub.doi && pub.doi.length > 0).length / publications.length) * 100) : 0}% have DOI
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ 
              p: 2, 
              borderRadius: 2,
              bgcolor: '#8b6cbc',
              boxShadow: '0 2px 8px rgba(139, 108, 188, 0.2)',
              border: 'none',
              position: 'relative',
              overflow: 'hidden',
              height: '100px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                  Recent (6M)
              </Typography>
                <DateIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {publications.filter(pub => {
                  const pubDate = new Date(pub.createdAt);
                  const sixMonthsAgo = new Date();
                  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
                  return pubDate >= sixMonthsAgo;
                }).length}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', fontSize: '0.7rem' }}>
                <Box component="span" sx={{ mr: 0.5, fontSize: '0.8rem' }}>⏰</Box>
                Last 6 months
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ 
              p: 2, 
              borderRadius: 2,
              bgcolor: '#8b6cbc',
              boxShadow: '0 2px 8px rgba(139, 108, 188, 0.2)',
              border: 'none',
              position: 'relative',
              overflow: 'hidden',
              height: '100px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                  Most Common
              </Typography>
                <MetricsIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem', textTransform: 'capitalize' }}>
                {publications.length > 0 ? (() => {
                  const typeCounts = publications.reduce((acc, pub) => {
                    const type = pub.type || 'article';
                    acc[type] = (acc[type] || 0) + 1;
                    return acc;
                  }, {});
                  const mostCommon = Object.keys(typeCounts).reduce((a, b) => typeCounts[a] > typeCounts[b] ? a : b);
                  return mostCommon === 'article' ? 'Articles' : mostCommon === 'conference' ? 'Conf.' : mostCommon.charAt(0).toUpperCase() + mostCommon.slice(1);
                })() : 'N/A'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', fontSize: '0.7rem' }}>
                <Box component="span" sx={{ mr: 0.5, fontSize: '0.8rem' }}>📊</Box>
                Publication type
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Filter & Search Publications */}
        <Paper sx={{ p: 2.5, mb: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)' }}>
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <FilterIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
              Search & Filter
            </Typography>
          </Box>
          <Grid container spacing={2.5} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                placeholder="Search publications, authors, journals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#8b6cbc' }} />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#8b6cbc',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#8b6cbc',
                    },
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'text.secondary' }}>Publication Type</InputLabel>
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  label="Publication Type"
                  sx={{
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8b6cbc',
                    },
                  }}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="article">Journal Article</MenuItem>
                  <MenuItem value="conference">Conference Paper</MenuItem>
                  <MenuItem value="book">Book/Chapter</MenuItem>
                  <MenuItem value="report">Report</MenuItem>
                  <MenuItem value="thesis">Thesis</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'text.secondary' }}>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="Sort By"
                  sx={{
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8b6cbc',
                    },
                  }}
                >
                  <MenuItem value="date-desc">Newest First</MenuItem>
                  <MenuItem value="date-asc">Oldest First</MenuItem>
                  <MenuItem value="title">Title A-Z</MenuItem>
                  <MenuItem value="citations">Most Citations</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FilterIcon />}
                  onClick={clearFilters}
                  sx={{ 
                    borderColor: '#8b6cbc',
                    color: '#8b6cbc',
                    '&:hover': {
                      bgcolor: '#8b6cbc10',
                      borderColor: '#8b6cbc'
                    }
                  }}
                >
                  Clear Filters
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 4 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Publications List */}
        <Paper sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <Box sx={{ p: 2.5, bgcolor: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <ArticleIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem' }}>
                  Publications
            </Typography>
                <Chip 
                  label={filteredPublications.length}
                  size="small"
                  sx={{ 
                    bgcolor: '#8b6cbc',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: 20
                  }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                Showing {startIndex + 1}-{Math.min(endIndex, filteredPublications.length)} of {filteredPublications.length} publications
              </Typography>
            </Box>

            {loading ? (
              <Box sx={{ py: 4 }}>
                <LinearProgress sx={{ color: '#8b6cbc' }} />
                <Typography sx={{ textAlign: 'center', mt: 2 }}>
                  Loading publications...
                </Typography>
              </Box>
            ) : filteredPublications.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <ArticleIcon sx={{ fontSize: 80, color: '#e0e0e0', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No publications found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {searchQuery || typeFilter !== 'all'
                    ? 'Try adjusting your search filters'
                    : 'Start by importing publications from PubMed, Crossref, OpenAlex, or other sources'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  sx={{ bgcolor: '#8b6cbc', '&:hover': { bgcolor: '#7559a3' } }}
                    onClick={() => window.location.href = '/researcher/publications/submit'}
                  >
                    Import Publications
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    sx={{ borderColor: '#8b6cbc', color: '#8b6cbc', '&:hover': { bgcolor: '#8b6cbc10' } }}
                    onClick={() => window.location.href = '/researcher/publications/add-manual'}
                  >
                    Add Manually
                </Button>
              </Box>
              </Box>
            ) : viewType === 'table' ? (
              <>
                <PublicationsTable publications={currentPagePublications} />
                {/* Pagination */}
                {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, pt: 2, borderTop: '1px solid #eee' }}>
                  <Typography variant="body2" color="text.secondary">
                      Rows per page: {itemsPerPage}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        {startIndex + 1}-{Math.min(endIndex, filteredPublications.length)} of {filteredPublications.length}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton 
                          size="small" 
                          disabled={currentPage === 1}
                          onClick={() => handlePageChange(currentPage - 1)}
                          sx={{ color: currentPage === 1 ? '#ccc' : '#8b6cbc' }}
                        >
                        <Box sx={{ transform: 'rotate(180deg)' }}>▶</Box>
                      </IconButton>
                        <Typography variant="body2" sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          px: 1,
                          minWidth: 60,
                          justifyContent: 'center'
                        }}>
                          Page {currentPage} of {totalPages}
                        </Typography>
                        <IconButton 
                          size="small" 
                          disabled={currentPage === totalPages}
                          onClick={() => handlePageChange(currentPage + 1)}
                          sx={{ color: currentPage === totalPages ? '#ccc' : '#8b6cbc' }}
                        >
                        ▶
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
                )}
              </>
            ) : (
              <>
                <PublicationsCards publications={currentPagePublications} />
                {/* Pagination for Cards View */}
                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 4, pt: 3, borderTop: '1px solid #eee' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <IconButton 
                        size="small" 
                        disabled={currentPage === 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                        sx={{ 
                          color: currentPage === 1 ? '#ccc' : '#8b6cbc',
                          border: '1px solid',
                          borderColor: currentPage === 1 ? '#ccc' : '#8b6cbc'
                        }}
                      >
                        <Box sx={{ transform: 'rotate(180deg)' }}>▶</Box>
                      </IconButton>
                      <Typography variant="body2" sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        px: 2,
                        color: 'text.secondary'
                      }}>
                        Page {currentPage} of {totalPages} • {filteredPublications.length} total publications
                      </Typography>
                      <IconButton 
                        size="small" 
                        disabled={currentPage === totalPages}
                        onClick={() => handlePageChange(currentPage + 1)}
                        sx={{ 
                          color: currentPage === totalPages ? '#ccc' : '#8b6cbc',
                          border: '1px solid',
                          borderColor: currentPage === totalPages ? '#ccc' : '#8b6cbc'
                        }}
                      >
                        ▶
                      </IconButton>
                    </Box>
                  </Box>
                )}
              </>
            )}
          </Box>
        </Paper>

        {/* Action Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          sx={{
            '& .MuiPaper-root': {
                minWidth: 180,
              mt: 0.5,
              borderRadius: 2,
              border: '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0px 2px 8px rgba(0,0,0,0.15)',
                '& .MuiMenuItem-root': {
                  px: 2,
                py: 1.5,
                borderRadius: 1,
                mx: 1,
                my: 0.5,
                fontSize: '0.875rem',
                  '&:hover': {
                    bgcolor: '#8b6cbc10',
                },
              },
            },
          }}
        >
          <MenuItem onClick={() => { handleViewPublication(selectedPublication); handleMenuClose(); }}>
            <ViewIcon sx={{ mr: 1, fontSize: 18 }} /> View Details
          </MenuItem>
          <MenuItem onClick={() => { handleMenuClose(); }}>
            <EditIcon sx={{ mr: 1, fontSize: 18 }} /> Edit Publication
          </MenuItem>
          <MenuItem onClick={() => { handleMenuClose(); }}>
            <ShareIcon sx={{ mr: 1, fontSize: 18 }} /> Share
          </MenuItem>
          <MenuItem onClick={() => { handleMenuClose(); }}>
            <DownloadIcon sx={{ mr: 1, fontSize: 18 }} /> Download Citation
          </MenuItem>
          <Divider sx={{ mx: 0.5 }} />
          <MenuItem 
            onClick={() => { handleDeletePublication(selectedPublication); handleMenuClose(); }} 
            sx={{ 
              color: 'error.main',
              '&:hover': {
                bgcolor: '#ff525210',
              }
            }}
          >
            <DeleteIcon sx={{ mr: 1, fontSize: 18 }} /> Delete
          </MenuItem>
        </Menu>

        {/* View Publication Dialog */}
        <Dialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ bgcolor: '#8b6cbc', color: 'white', display: 'flex', alignItems: 'center' }}>
            <ViewIcon sx={{ mr: 1 }} />
            Publication Details
          </DialogTitle>
          <DialogContent dividers>
            {selectedPublication && (
              <Box>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                  {selectedPublication.title}
                </Typography>
                
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid size={3}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Authors</Typography>
                  </Grid>
                  <Grid size={9}>
                    <Typography variant="body2">{selectedPublication.authors.join(', ')}</Typography>
                  </Grid>
                  
                  <Grid size={3}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Publication</Typography>
                  </Grid>
                  <Grid size={9}>
                    <Typography variant="body2">
                      {selectedPublication.journal}
                      {selectedPublication.year && ` (${selectedPublication.year})`}
                      {selectedPublication.volume && `, Vol. ${selectedPublication.volume}`}
                      {selectedPublication.pages && `, pp. ${selectedPublication.pages}`}
                </Typography>
                  </Grid>
                  
                  <Grid size={3}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Type</Typography>
                  </Grid>
                  <Grid size={9}>
                    <Typography variant="body2">{selectedPublication.type}</Typography>
                  </Grid>
                  
                  <Grid size={3}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Status</Typography>
                  </Grid>
                  <Grid size={9}>
                    <Chip 
                      label={selectedPublication.status.replace('-', ' ')} 
                      size="small"
                      sx={{ bgcolor: getStatusColor(selectedPublication.status), color: 'white' }}
                    />
                  </Grid>
                  
                  {selectedPublication.source && (
                    <>
                      <Grid size={3}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Source</Typography>
                      </Grid>
                      <Grid size={9}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getSourceIcon(selectedPublication.source)}
                          <Typography variant="body2" sx={{ ml: 0.5 }}>
                            Imported from {selectedPublication.source}
                </Typography>
                        </Box>
                      </Grid>
                    </>
                  )}
                  
                  {selectedPublication.doi && (
                    <>
                      <Grid size={3}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>DOI</Typography>
                      </Grid>
                      <Grid size={9}>
                        <Typography variant="body2">
                          <a 
                            href={`https://doi.org/${selectedPublication.doi}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: '#8b6cbc' }}
                          >
                            {selectedPublication.doi}
                          </a>
                </Typography>
                      </Grid>
                    </>
                  )}
                  
                  {selectedPublication.url && (
                    <>
                      <Grid size={3}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>URL</Typography>
                      </Grid>
                      <Grid size={9}>
                        <Typography variant="body2">
                          <a 
                            href={selectedPublication.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: '#8b6cbc' }}
                          >
                            View Publication
                          </a>
                </Typography>
                      </Grid>
                    </>
                  )}
                  
                  {selectedPublication.isbn && (
                    <>
                      <Grid size={3}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>ISBN</Typography>
                      </Grid>
                      <Grid size={9}>
                        <Typography variant="body2">{selectedPublication.isbn}</Typography>
                      </Grid>
                    </>
                  )}
                </Grid>

                {selectedPublication.abstract && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Abstract</Typography>
                    <Typography variant="body2" sx={{ 
                      textAlign: 'justify',
                      bgcolor: '#f5f5f5',
                      p: 2,
                      borderRadius: 1,
                      lineHeight: 1.6
                    }}>
                      {selectedPublication.abstract}
                  </Typography>
                  </Box>
                )}
                
                {selectedPublication.tags && selectedPublication.tags.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Keywords</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {selectedPublication.tags.map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="small"
                          variant="outlined"
                          sx={{ borderColor: '#8b6cbc40', color: '#8b6cbc' }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'text.secondary' }}>
                  <Typography variant="body2">
                    Created: {selectedPublication.createdAt.toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2">
                    Updated: {selectedPublication.updatedAt.toLocaleDateString()}
                </Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
            <Button variant="contained" sx={{ bgcolor: '#8b6cbc', '&:hover': { bgcolor: '#7559a3' } }}>
              Edit Publication
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{selectedPublication?.title}"? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmDelete} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
