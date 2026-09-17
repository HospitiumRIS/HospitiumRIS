'use client';

import React, { useState, useCallback, useMemo, useEffect, Suspense } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Paper,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  alpha
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
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

const CiteReadyImport = dynamic(() => import('./ImportTabs/CiteReadyImport'), {
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
const PURPLE = '#8b6cbc';

const ImportMethodCard = React.memo(({ method, onSelect }) => (
  <Card
    elevation={0}
    sx={{
      height: '100%',
      cursor: 'pointer',
      borderRadius: 2.5,
      border: '1px solid',
      borderColor: alpha(method.color || PURPLE, 0.18),
      bgcolor: 'background.paper',
      transition: 'all 0.2s ease',
      '&:hover': {
        transform: 'translateY(-3px)',
        borderColor: alpha(method.color || PURPLE, 0.45),
        boxShadow: `0 8px 24px ${alpha(method.color || PURPLE, 0.16)}`,
      },
    }}
  >
    <CardActionArea onClick={() => onSelect(method.id)} sx={{ height: '100%', p: 0.5 }}>
      <CardContent sx={{ p: 2.25 }}>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 2,
            bgcolor: alpha(method.color || PURPLE, 0.08),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1.5,
          }}
        >
          {method.icon}
        </Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, lineHeight: 1.25 }}>
          {method.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.45 }}>
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
  const searchParams = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeMethod, setActiveMethod] = useState('pubmed');
  const [importResults, setImportResults] = useState([]);

  // Deep-link support: e.g. the editor's Citation Menu links here with
  // ?tab=citeready to jump straight into a specific import source.
  useEffect(() => {
    const tab = searchParams?.get('tab');
    if (tab) {
      setActiveMethod(tab);
      setModalOpen(true);
    }
  }, [searchParams]);

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
      icon: <img src="/pubmed.svg" alt="PubMed" style={{ width: 32, height: 32 }} />,
      color: PURPLE
    },
    {
      id: 'doi',
      name: 'DOI / Crossref',
      description: 'Search publications via Crossref database or import by DOI',
      icon: <img src="/doi.svg" alt="DOI Crossref" style={{ width: 32, height: 32 }} />,
      color: PURPLE
    },
    {
      id: 'openalex',
      name: 'OpenAlex',
      description: 'Search OpenAlex - comprehensive scholarly knowledge graph',
      icon: <img src="/OpenAlex.png" alt="OpenAlex" style={{ width: 32, height: 32 }} />,
      color: PURPLE
    },
    {
      id: 'research4life',
      name: 'Research4Life',
      description: 'Import from Research4Life - access to research in developing countries',
      icon: <img src="/R4L.png" alt="Research4Life" style={{ width: 32, height: 32 }} />,
      color: PURPLE
    },
    {
      id: 'bibtex',
      name: 'BibTeX File',
      description: 'Upload and import BibTeX files',
      icon: <img src="/bibtex_s.png" alt="BibTeX" style={{ width: 32, height: 32 }} />,
      color: PURPLE
    },
    {
      id: 'zotero',
      name: 'Zotero',
      description: 'Import from Zotero reference manager - organize research efficiently',
      icon: <img src="/zotero.svg" alt="Zotero" style={{ width: 32, height: 32 }} />,
      color: PURPLE
    },
    {
      id: 'endnote',
      name: 'EndNote',
      description: 'Import from EndNote reference manager - industry standard for researchers',
      icon: <img src="/endnote-logo.png" alt="EndNote" style={{ width: 32, height: 32 }} />,
      color: PURPLE
    },
    {
      id: 'mendeley',
      name: 'Mendeley',
      description: 'Import from Mendeley reference manager - social research platform',
      icon: <img src="/mendeley.svg" alt="Mendeley" style={{ width: 32, height: 32 }} />,
      color: PURPLE
    },
    {
      id: 'citeready',
      name: 'CiteReady',
      description: 'Import from your CiteReady library - items and folders, read-only',
      icon: <img src="/citeready.png" alt="CiteReady" style={{ width: 32, height: 32 }} />,
      color: PURPLE
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
      color: PURPLE
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
      case 'citeready':
        return <CiteReadyImport {...commonProps} />;
      default:
        return <TabSkeleton />;
    }
  };

  const databaseMethods = useMemo(
    () => importMethods.filter((m) => ['pubmed', 'doi', 'openalex', 'research4life'].includes(m.id)),
    [importMethods]
  );
  const managerMethods = useMemo(
    () => importMethods.filter((m) => ['bibtex', 'zotero', 'endnote', 'mendeley', 'citeready'].includes(m.id)),
    [importMethods]
  );
  const activeMeta = importMethods.find((m) => m.id === activeMethod);

  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      <PageHeader
        title="Import Publications"
        description="Import your research publications from databases and reference managers"
        icon={<UploadIcon />}
        breadcrumbs={[
          { label: 'Dashboard', href: '/researcher' },
          { label: 'Publications', href: '/researcher/publications' },
          { label: 'Import Publications' }
        ]}
      />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="overline" sx={{ color: PURPLE, fontWeight: 700, letterSpacing: 1 }}>
            Databases
          </Typography>
          <Typography variant="h5" sx={{ mb: 0.75, fontWeight: 700 }}>
            Search scholarly sources
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Find publications by keyword, author, journal, or identifier.
          </Typography>
          <Grid container spacing={2.5}>
            {databaseMethods.map((method) => (
              <Grid key={method.id} size={{ xs: 12, sm: 6, md: 3 }}>
                <ImportMethodCard method={method} onSelect={handleMethodSelect} />
              </Grid>
            ))}
          </Grid>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="overline" sx={{ color: PURPLE, fontWeight: 700, letterSpacing: 1 }}>
            Libraries
          </Typography>
          <Typography variant="h5" sx={{ mb: 0.75, fontWeight: 700 }}>
            Import from your tools
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Bring in records from a file or a reference manager.
          </Typography>
          <Grid container spacing={2.5}>
            {managerMethods.map((method) => (
              <Grid key={method.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <ImportMethodCard method={method} onSelect={handleMethodSelect} />
              </Grid>
            ))}
          </Grid>
        </Box>

        {importResults.length > 0 && (
          <Suspense fallback={<ResultsSkeleton />}>
            <ImportResults
              results={importResults}
              onRemove={handleRemoveResult}
              onConfirmImport={handleConfirmImport}
            />
          </Suspense>
        )}

        <Dialog
          open={modalOpen}
          onClose={handleCloseModal}
          maxWidth="md"
          fullWidth
          disableScrollLock
          PaperProps={{
            sx: {
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: `0 24px 64px ${alpha(PURPLE, 0.22)}`,
            },
          }}
        >
          <DialogTitle
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              py: 1.75,
              px: 2.5,
              background: 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)',
              color: 'white',
            }}
          >
            <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2, color: 'white' }}>
                  {activeMeta?.name} Import
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.72rem' }}>
                  {activeMeta?.description}
                </Typography>
              </Box>
            <IconButton
              onClick={handleCloseModal}
              size="small"
              sx={{
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.16)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 3, pt: 3 }}>
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


