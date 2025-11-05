'use client';

import React, { useState, useCallback, useMemo, Suspense } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Paper,
  CircularProgress,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Add as AddIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import dynamic from 'next/dynamic';
import PageHeader from '../common/PageHeader';
import { useAuth } from '../AuthProvider';

// Dynamically import tab components for code splitting
const PubMedImport = dynamic(() => import('./ImportTabs/PubMedImport'), {
  loading: () => <TabSkeleton />,
  ssr: false
});

const DoiImport = dynamic(() => import('./ImportTabs/DoiImport'), {
  loading: () => <TabSkeleton />,
  ssr: false
});

const OpenAlexImport = dynamic(() => import('./ImportTabs/OpenAlexImport'), {
  loading: () => <TabSkeleton />,
  ssr: false
});

const Research4LifeImport = dynamic(() => import('./ImportTabs/Research4LifeImport'), {
  loading: () => <TabSkeleton />,
  ssr: false
});

const BibtexImport = dynamic(() => import('./ImportTabs/BibtexImport'), {
  loading: () => <TabSkeleton />,
  ssr: false
});

const ZoteroImport = dynamic(() => import('./ImportTabs/ZoteroImport'), {
  loading: () => <TabSkeleton />,
  ssr: false
});

const EndNoteImport = dynamic(() => import('./ImportTabs/EndNoteImport'), {
  loading: () => <TabSkeleton />,
  ssr: false
});

const MendeleyImport = dynamic(() => import('./ImportTabs/MendeleyImport'), {
  loading: () => <TabSkeleton />,
  ssr: false
});

const ImportResults = dynamic(() => import('./ImportResults'), {
  loading: () => <ResultsSkeleton />,
  ssr: false
});

// Loading skeletons
const TabSkeleton = () => (
  <Box sx={{ maxWidth: 600, py: 4 }}>
    <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
    <Skeleton variant="rectangular" width="100%" height={56} sx={{ mb: 2 }} />
    <Skeleton variant="rectangular" width={200} height={36} />
  </Box>
);

const ResultsSkeleton = () => (
  <Paper sx={{ p: 4, mt: 4 }}>
    <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
    <Skeleton variant="rectangular" width="100%" height={200} />
  </Paper>
);

// Memoized import method card component
const ImportMethodCard = React.memo(({ method, isActive, onSelect }) => (
  <Card
    sx={{
      height: '100%',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      border: isActive ? `2px solid ${method.color}` : '2px solid transparent',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: `0 8px 32px ${method.color}40`,
      }
    }}
  >
    <CardActionArea
      onClick={() => onSelect(method.id)}
      sx={{ height: '100%', p: 2 }}
    >
      <CardContent sx={{ textAlign: 'center' }}>
        {method.icon}
        <Typography variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
          {method.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {method.description}
        </Typography>
      </CardContent>
    </CardActionArea>
  </Card>
));

ImportMethodCard.displayName = 'ImportMethodCard';

// Main component
const ImportPublications = ({ onImport }) => {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeMethod, setActiveMethod] = useState('pubmed');
  const [importResults, setImportResults] = useState([]);

  // Debug logging without hydration issues
  React.useEffect(() => {
    console.log('ImportPublications RENDER: importResults count:', importResults.length);
  }, [importResults.length]);

  // Memoized import methods configuration
  const importMethods = useMemo(() => [
    {
      id: 'pubmed',
      name: 'PubMed',
      description: 'Search and import from PubMed database',
      icon: <img src="/pubmed.svg" alt="PubMed" style={{ width: 48, height: 48 }} />,
      color: '#044b84'
    },
    {
      id: 'doi',
      name: 'DOI / Crossref',
      description: 'Search publications via Crossref database or import by DOI',
      icon: <img src="/doi.svg" alt="DOI Crossref" style={{ width: 48, height: 48 }} />,
      color: '#8b6cbc'
    },
    {
      id: 'openalex',
      name: 'OpenAlex',
      description: 'Search OpenAlex - comprehensive scholarly knowledge graph',
      icon: <img src="/OpenAlex.png" alt="OpenAlex" style={{ width: 48, height: 48 }} />,
      color: '#8b6cbc'
    },
    {
      id: 'research4life',
      name: 'Research4Life',
      description: 'Import from Research4Life - access to research in developing countries',
      icon: <img src="/R4L.png" alt="Research4Life" style={{ width: 48, height: 48 }} />,
      color: '#8b6cbc'
    },
    {
      id: 'bibtex',
      name: 'BibTeX File',
      description: 'Upload and import BibTeX files',
      icon: <img src="/bibtex_s.png" alt="BibTeX" style={{ width: 48, height: 48 }} />,
      color: '#8b6cbc'
    },
    {
      id: 'zotero',
      name: 'Zotero',
      description: 'Import from Zotero reference manager - organize research efficiently',
      icon: <img src="/zotero.svg" alt="Zotero" style={{ width: 48, height: 48 }} />,
      color: '#db2c3a'
    },
    {
      id: 'endnote',
      name: 'EndNote',
      description: 'Import from EndNote reference manager - industry standard for researchers',
      icon: <img src="/endnote-logo.png" alt="EndNote" style={{ width: 48, height: 48 }} />,
      color: '#000000'
    },
    {
      id: 'mendeley',
      name: 'Mendeley',
      description: 'Import from Mendeley reference manager - social research platform',
      icon: <img src="/mendeley.svg" alt="Mendeley" style={{ width: 48, height: 48 }} />,
      color: '#000000'
    }
  ], []);

  const handleMethodSelect = useCallback((methodId) => {
    setActiveMethod(methodId);
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const handleImportSuccess = useCallback((results) => {
    console.log('ImportPublications: Received import results:', results);
    console.log('ImportPublications: Results length:', results?.length);
    console.log('ImportPublications: Setting import results...');
    
    setImportResults(results);
    
    // Delay modal closing to ensure state update completes
    setTimeout(() => {
      console.log('ImportPublications: Closing modal after state update');
      setModalOpen(false);
    }, 50);
  }, []);

  const handleRemoveResult = useCallback((id) => {
    setImportResults(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleConfirmImport = useCallback(async () => {
    try {
      console.log('ImportPublications: Confirming import with:', {
        publications: importResults,
        method: activeMethod,
        userId: user?.id
      });
      
      if (onImport) {
        await onImport({
          publications: importResults,
          method: activeMethod,
          userId: user?.id
        });
      }
      setImportResults([]);
    } catch (error) {
      console.error('Import failed:', error);
    }
  }, [onImport, importResults, activeMethod, user?.id]);

  // Render active import component
  const renderImportComponent = () => {
    const commonProps = {
      onImportSuccess: handleImportSuccess,
      color: importMethods.find(m => m.id === activeMethod)?.color
    };

    switch (activeMethod) {
      case 'pubmed':
        return <PubMedImport {...commonProps} />;
      case 'doi':
        return <DoiImport {...commonProps} />;
      case 'openalex':
        return <OpenAlexImport {...commonProps} />;
      case 'research4life':
        return <Research4LifeImport {...commonProps} />;
      case 'bibtex':
        return <BibtexImport {...commonProps} />;
      case 'zotero':
        return <ZoteroImport {...commonProps} />;
      case 'endnote':
        return <EndNoteImport {...commonProps} />;
      case 'mendeley':
        return <MendeleyImport {...commonProps} />;
      default:
        return <TabSkeleton />;
    }
  };

  return (
    <Box sx={{ width: '100%', mt: 8, mb: 4 }}>
      <PageHeader
        title="Import Publications"
        description="Import your research publications from various sources"
        icon={<UploadIcon />}
        breadcrumbs={[
          { label: 'Dashboard', href: '/researcher' },
          { label: 'Publications', href: '/researcher/publications' },
          { label: 'Import Publications' }
        ]}
      />

      <Container maxWidth="lg">
        {/* Import Methods Grid */}
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          Choose Import Method
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {importMethods.map((method) => (
            <Grid key={method.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <ImportMethodCard
                method={method}
                isActive={activeMethod === method.id}
                onSelect={handleMethodSelect}
              />
            </Grid>
          ))}
        </Grid>

        {/* Import Results */}
        {importResults.length > 0 && (
          <Suspense fallback={<ResultsSkeleton />}>
            <ImportResults
              results={importResults}
              onRemove={handleRemoveResult}
              onConfirmImport={handleConfirmImport}
            />
          </Suspense>
        )}

        {/* Import Modal */}
        <Dialog 
          open={modalOpen} 
          onClose={handleCloseModal}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            pb: 1
          }}>
            <Typography variant="h6" component="span">
              {importMethods.find(m => m.id === activeMethod)?.name} Import
            </Typography>
            <IconButton onClick={handleCloseModal} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Suspense fallback={<TabSkeleton />}>
              {renderImportComponent()}
            </Suspense>
          </DialogContent>
        </Dialog>
      </Container>
    </Box>
  );
};

export default ImportPublications;


