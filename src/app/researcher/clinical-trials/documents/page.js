'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  Tooltip,
  Tabs,
  Tab,
  Paper,
  FormControl,
  InputLabel,
  Select,
  Stack,
  TablePagination,
  LinearProgress,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  FolderShared as DocumentIcon,
  Description as FileIcon,
  CloudUpload as UploadIcon,
  History as VersionIcon,
  Lock as LockedIcon,
  CheckCircle as ApprovedIcon,
  Edit as EditIcon,
  Clear as ClearIcon,
  CalendarToday as CalendarIcon,
  InsertDriveFile as DocIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import PageHeader from '../../../../components/common/PageHeader';
import { useAuth } from '../../../../components/AuthProvider';

const documentTypes = {
  PROTOCOL: { color: '#8b6cbc', label: 'Protocol' },
  CONSENT_FORM: { color: '#2196f3', label: 'Consent Form' },
  CRF_TEMPLATE: { color: '#ff9800', label: 'CRF Template' },
  INVESTIGATOR_BROCHURE: { color: '#4caf50', label: 'Investigator Brochure' },
  SAE_FORM: { color: '#f44336', label: 'SAE Form' },
  AMENDMENT: { color: '#00bcd4', label: 'Amendment' },
  OTHER: { color: '#9e9e9e', label: 'Other' },
};

export default function DocumentRepositoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [sortBy, setSortBy] = useState('Recent');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    locked: 0,
    draft: 0
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const mockDocuments = [
        {
          id: 1,
          name: 'Study Protocol v3.2',
          type: 'PROTOCOL',
          trialId: 'CT-2024-001',
          trialTitle: 'Phase III Trial of Novel Antimalarial Drug',
          version: '3.2',
          uploadedBy: 'Dr. Sarah Johnson',
          uploadedDate: new Date('2024-03-15'),
          fileSize: '2.4 MB',
          status: 'APPROVED',
          locked: true,
        },
        {
          id: 2,
          name: 'Informed Consent Form - English',
          type: 'CONSENT_FORM',
          trialId: 'CT-2024-001',
          trialTitle: 'Phase III Trial of Novel Antimalarial Drug',
          version: '2.0',
          uploadedBy: 'Dr. Sarah Johnson',
          uploadedDate: new Date('2024-02-20'),
          fileSize: '850 KB',
          status: 'APPROVED',
          locked: true,
        },
        {
          id: 3,
          name: 'Case Report Form Template',
          type: 'CRF_TEMPLATE',
          trialId: 'CT-2024-002',
          trialTitle: 'Observational Study on HIV Treatment Adherence',
          version: '1.0',
          uploadedBy: 'Dr. Michael Omondi',
          uploadedDate: new Date('2024-03-01'),
          fileSize: '1.2 MB',
          status: 'DRAFT',
          locked: false,
        },
        {
          id: 4,
          name: 'Investigator Brochure',
          type: 'INVESTIGATOR_BROCHURE',
          trialId: 'CT-2024-001',
          trialTitle: 'Phase III Trial of Novel Antimalarial Drug',
          version: '1.5',
          uploadedBy: 'Dr. Sarah Johnson',
          uploadedDate: new Date('2024-01-10'),
          fileSize: '5.8 MB',
          status: 'APPROVED',
          locked: true,
        },
        {
          id: 5,
          name: 'SAE Reporting Form',
          type: 'SAE_FORM',
          trialId: 'CT-2024-001',
          trialTitle: 'Phase III Trial of Novel Antimalarial Drug',
          version: '1.0',
          uploadedBy: 'Mary Kamau',
          uploadedDate: new Date('2024-02-05'),
          fileSize: '450 KB',
          status: 'APPROVED',
          locked: true,
        },
      ];
      setDocuments(mockDocuments);
      
      // Calculate statistics
      const total = mockDocuments.length;
      const approved = mockDocuments.filter(d => d.status === 'APPROVED').length;
      const locked = mockDocuments.filter(d => d.locked).length;
      const draft = mockDocuments.filter(d => d.status === 'DRAFT').length;
      
      setStats({ total, approved, locked, draft });
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, document) => {
    setMenuAnchor(event.currentTarget);
    setSelectedDocument(document);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedDocument(null);
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.trialId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'All Types' || doc.type === typeFilter;
    const matchesStatus = statusFilter === 'All Statuses' || doc.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });
  
  // Paginated documents
  const paginatedDocuments = filteredDocuments.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  
  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/researcher' },
    { label: 'Clinical Trials', href: '/researcher/clinical-trials' },
    { label: 'Master Trial File (eTMF)' },
  ];

  return (
    <>
      <Box sx={{ width: '100%', mt: 8, mb: 0 }}>
        <PageHeader
          title="Master Trial File (eTMF)"
          description="Store version-controlled protocols and regulatory documents"
          icon={<DocIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={breadcrumbs}
          actionButton={
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={() => router.push('/researcher/clinical-trials/documents/upload')}
              sx={{
                bgcolor: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 2,
                px: 3,
                py: 1,
                fontWeight: 600,
                letterSpacing: '0.5px',
                textTransform: 'none',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.25)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
                }
              }}
            >
              Upload Document
            </Button>
          }
        />
      </Box>

      <Container maxWidth="xl" sx={{ py: 6, backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 300px)' }}>
        {/* Statistics Cards */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
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
                  Total Documents
                </Typography>
                <FileIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {stats.total}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                All documents
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
                  Approved
                </Typography>
                <ApprovedIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {stats.approved}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Approved documents
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
                  Version Locked
                </Typography>
                <LockedIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {stats.locked}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Locked versions
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
                  Drafts
                </Typography>
                <EditIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
                {stats.draft}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                Work in progress
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Search and Filters */}
        <Paper sx={{ 
          p: 4, 
          mb: 5, 
          borderRadius: 4, 
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
        }}>
          <Box sx={{ 
            display: 'flex', 
            gap: 3, 
            alignItems: 'center',
            flexWrap: 'wrap',
            '@media (max-width: 768px)': {
              flexDirection: 'column',
              alignItems: 'stretch'
            }
          }}>
            <Box sx={{ flex: '2 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                placeholder="Search documents by name, trial ID, or uploader..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setSearchQuery('')} size="small">
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,1)'
                    }
                  }
                }}
              />
            </Box>

            <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
              <FormControl fullWidth>
                <InputLabel>Document Type</InputLabel>
                <Select
                  value={typeFilter}
                  label="Document Type"
                  onChange={(e) => setTypeFilter(e.target.value)}
                  sx={{ 
                    borderRadius: 3,
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,1)'
                    }
                  }}
                >
                  <MenuItem value="All Types">All Types</MenuItem>
                  <MenuItem value="PROTOCOL">Protocol</MenuItem>
                  <MenuItem value="CONSENT_FORM">Consent Form</MenuItem>
                  <MenuItem value="CRF_TEMPLATE">CRF Template</MenuItem>
                  <MenuItem value="INVESTIGATOR_BROCHURE">Investigator Brochure</MenuItem>
                  <MenuItem value="SAE_FORM">SAE Form</MenuItem>
                  <MenuItem value="AMENDMENT">Amendment</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{ 
                    borderRadius: 3,
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,1)'
                    }
                  }}
                >
                  <MenuItem value="All Statuses">All Statuses</MenuItem>
                  <MenuItem value="APPROVED">Approved</MenuItem>
                  <MenuItem value="DRAFT">Draft</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value)}
                  sx={{ 
                    borderRadius: 3,
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,1)'
                    }
                  }}
                >
                  <MenuItem value="Recent">Recent</MenuItem>
                  <MenuItem value="Name">Name</MenuItem>
                  <MenuItem value="Type">Type</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ flex: '0 0 auto' }}>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={() => {
                  setSearchQuery('');
                  setTypeFilter('All Types');
                  setStatusFilter('All Statuses');
                  setSortBy('Recent');
                }}
                sx={{ 
                  borderRadius: 3,
                  height: '56px',
                  px: 3,
                  borderColor: '#e0e0e0',
                  color: '#667eea',
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  '&:hover': {
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.08)',
                    color: '#5a67d8',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)'
                  }
                }}
              >
                Clear All
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Documents Table */}
        {loading ? (
          <Paper sx={{ 
            p: 8, 
            textAlign: 'center', 
            borderRadius: 4,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.06)'
          }}>
            <DocumentIcon sx={{ fontSize: 64, color: '#ddd', mb: 3 }} />
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#666' }}>
              Loading documents...
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Please wait while we fetch your documents
            </Typography>
            <Box sx={{ width: 200, mx: 'auto' }}>
              <LinearProgress sx={{ 
                height: 4, 
                borderRadius: 2,
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#667eea'
                }
              }} />
            </Box>
          </Paper>
        ) : filteredDocuments.length === 0 ? (
          <Paper sx={{ 
            p: 8, 
            textAlign: 'center', 
            borderRadius: 4,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
            border: '1px solid rgba(0,0,0,0.04)'
          }}>
            <Box sx={{ 
              width: 120, 
              height: 120, 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #764ba2 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
              opacity: 0.1
            }}>
              <DocumentIcon sx={{ fontSize: 48, color: 'white' }} />
            </Box>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 700, color: '#2c3e50' }}>
              No documents found
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto', lineHeight: 1.6 }}>
              {searchQuery || typeFilter !== 'All Types' 
                ? 'Try adjusting your search criteria or clear all filters to see more results'
                : 'Upload your first document to get started'
              }
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<UploadIcon />}
              onClick={() => router.push('/researcher/clinical-trials/documents/upload')}
              sx={{
                background: 'linear-gradient(135deg, #764ba2 0%, #764ba2 100%)',
                borderRadius: 3,
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 35px rgba(102, 126, 234, 0.4)'
                }
              }}
            >
              Upload Document
            </Button>
          </Paper>
        ) : (
          <Paper sx={{ 
            borderRadius: 4,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.06)',
            overflow: 'hidden'
          }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Document Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Trial</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Version</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Uploaded By</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Upload Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Size</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.875rem', textAlign: 'center' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedDocuments.map((doc) => (
                    <TableRow 
                      key={doc.id}
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: 'rgba(139, 108, 188, 0.04)'
                        },
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      <TableCell sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FileIcon sx={{ color: documentTypes[doc.type].color, fontSize: 20 }} />
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                            {doc.name}
                          </Typography>
                          {doc.locked && (
                            <Tooltip title="Version Locked">
                              <LockedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Chip
                          label={documentTypes[doc.type].label}
                          size="small"
                          sx={{
                            backgroundColor: documentTypes[doc.type].color,
                            color: 'white',
                            fontWeight: 500,
                            fontSize: '0.7rem'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Stack direction="column" spacing={0.5}>
                          <Typography variant="body2" sx={{ color: '#8b6cbc', fontWeight: 600, fontSize: '0.8rem' }}>
                            {doc.trialId}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            {doc.trialTitle}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Chip
                          icon={<VersionIcon />}
                          label={`v${doc.version}`}
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(139, 108, 188, 0.1)',
                            color: '#8b6cbc',
                            fontWeight: 500,
                            '& .MuiChip-icon': {
                              color: '#8b6cbc'
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ 
                            width: 28, 
                            height: 28, 
                            backgroundColor: '#8b6cbc',
                            fontSize: '0.7rem',
                            fontWeight: 600
                          }}>
                            {doc.uploadedBy.split(' ').map(n => n[0]).join('')}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#2c3e50' }}>
                            {doc.uploadedBy}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarIcon sx={{ fontSize: 16, color: '#8b6cbc' }} />
                          <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#2c3e50' }}>
                            {format(doc.uploadedDate, 'MMM dd, yyyy')}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#2c3e50' }}>
                          {doc.fileSize}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Chip
                          icon={doc.status === 'APPROVED' ? <ApprovedIcon /> : <EditIcon />}
                          label={doc.status}
                          size="small"
                          sx={{
                            backgroundColor: doc.status === 'APPROVED' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(158, 158, 158, 0.1)',
                            color: doc.status === 'APPROVED' ? '#4caf50' : '#9e9e9e',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            '& .MuiChip-icon': {
                              color: doc.status === 'APPROVED' ? '#4caf50' : '#9e9e9e'
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="View">
                            <IconButton
                              size="small"
                              onClick={() => router.push(`/researcher/clinical-trials/documents/view/${doc.id}`)}
                              sx={{ 
                                color: '#8b6cbc',
                                '&:hover': { backgroundColor: 'rgba(139, 108, 188, 0.08)' }
                              }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Download">
                            <IconButton
                              size="small"
                              sx={{ 
                                color: '#8b6cbc',
                                '&:hover': { backgroundColor: 'rgba(139, 108, 188, 0.08)' }
                              }}
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="More">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, doc)}
                              sx={{ 
                                color: '#8b6cbc',
                                '&:hover': { backgroundColor: 'rgba(139, 108, 188, 0.08)' }
                              }}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filteredDocuments.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
              sx={{
                borderTop: '1px solid rgba(0,0,0,0.06)',
                '.MuiTablePagination-toolbar': {
                  backgroundColor: '#f8f9fa'
                }
              }}
            />
          </Paper>
        )}

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleMenuClose}>
            <ViewIcon sx={{ mr: 1 }} /> View Document
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <DownloadIcon sx={{ mr: 1 }} /> Download
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <VersionIcon sx={{ mr: 1 }} /> Version History
          </MenuItem>
          {selectedDocument && !selectedDocument.locked && (
            <MenuItem onClick={handleMenuClose}>
              <EditIcon sx={{ mr: 1 }} /> Upload New Version
            </MenuItem>
          )}
          <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
            <DeleteIcon sx={{ mr: 1 }} /> Delete
          </MenuItem>
        </Menu>
      </Container>
    </>
  );
}
