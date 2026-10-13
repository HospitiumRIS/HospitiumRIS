'use client';

import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  Link,
} from '@mui/material';
import {
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { StepHeader, SectionLabel, Field } from './FormKit';
import { useTheme, alpha } from '@mui/material/styles';

const OrcidSearchStep = ({ onOrcidSelect, onSkipOrcid, selectedOrcidProfile, errors }) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [orcidSearchData, setOrcidSearchData] = useState({
    givenNames: '',
    familyName: '',
  });
  const [orcidLoading, setOrcidLoading] = useState(false);
  const [orcidResults, setOrcidResults] = useState([]);
  const [orcidError, setOrcidError] = useState(null);
  const [hasSearchedOrcid, setHasSearchedOrcid] = useState(false);

  // Handle ORCID search input changes
  const handleOrcidInputChange = (e) => {
    const { name, value } = e.target;
    setOrcidSearchData(prev => ({
      ...prev,
      [name]: value
    }));
    setHasSearchedOrcid(false);
    setOrcidError(null);
  };

  // Handle ORCID search
  const handleOrcidSearch = async () => {
    setOrcidLoading(true);
    setOrcidError(null);
    setHasSearchedOrcid(true);
    
    try {
      const baseUrl = 'https://pub.orcid.org/v3.0/expanded-search';
      const query = `given-names:${orcidSearchData.givenNames}+AND+family-name:${orcidSearchData.familyName}`;
      
      const response = await fetch(`${baseUrl}?q=${query}`, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ORCID data: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data || typeof data['num-found'] === 'undefined') {
        setOrcidError(t('auth.orcid_api_error'));
        return;
      }

      if (data['num-found'] === 0 || !data['expanded-result'] || !data['expanded-result'].length) {
        setOrcidResults([]);
        setOrcidError(t('auth.orcid_no_results'));
        return;
      }

      const processedResults = data['expanded-result']
        .filter(result => result['orcid-id'] && result['given-names'] && result['family-names'])
        .map(result => ({
          'orcid-id': result['orcid-id'],
          'given-names': result['given-names'],
          'family-names': result['family-names'],
          'institution-name': Array.isArray(result['institution-name']) ? result['institution-name'] : []
        }))
        .slice(0, 5);

      setOrcidResults(processedResults);

      if (processedResults.length === 1) {
        handleOrcidProfileSelect(processedResults[0]);
      }

      if (processedResults.length === 0) {
        setOrcidError(t('auth.orcid_no_valid_results'));
      }
    } catch (err) {
      console.error('ORCID search error:', err);
      setOrcidError(t('auth.orcid_search_failed'));
    } finally {
      setOrcidLoading(false);
    }
  };

  // Handle ORCID profile selection
  const handleOrcidProfileSelect = (profile) => {
    onOrcidSelect(profile);
  };


  // Clear ORCID search results
  const handleClearOrcidResults = () => {
    setOrcidResults([]);
    setOrcidSearchData({
      givenNames: '',
      familyName: ''
    });
    setHasSearchedOrcid(false);
    setOrcidError(null);
  };

  const OrcidBadge = ({ size = 20 }) => (
    <Box
      sx={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        bgcolor: '#A6CE39', color: '#fff',
        display: 'grid', placeItems: 'center',
        fontSize: size * 0.45, fontWeight: 700, lineHeight: 1,
      }}
    >
      iD
    </Box>
  );

  const selectedId = selectedOrcidProfile?.['orcid-id'];

  return (
    <Box>
      <StepHeader title={t('auth.orcid_search_title')} subtitle={t('auth.orcid_search_subtitle')} />

      {/* Why ORCID */}
      <Box
        sx={{
          display: 'flex', gap: 1.5, alignItems: 'flex-start',
          p: 1.5, mb: 2.5, borderRadius: 1.5,
          bgcolor: alpha('#A6CE39', theme.palette.mode === 'dark' ? 0.08 : 0.08),
          border: `1px solid ${alpha('#A6CE39', 0.35)}`,
        }}
      >
        <OrcidBadge size={24} />
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
          {t('auth.orcid_why', 'Linking your ORCID iD verifies your identity as a researcher and lets us import your publications automatically.')}
        </Typography>
      </Box>

      {/* Search form */}
      <Box
        component="form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (!orcidLoading && orcidSearchData.givenNames && orcidSearchData.familyName) handleOrcidSearch();
        }}
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr auto' },
          gap: 2,
          alignItems: 'end',
          mb: 2.5,
        }}
      >
        <Field label={t('auth.orcid_given_names')} htmlFor="orcid-given">
          <TextField
            id="orcid-given"
            name="givenNames"
            value={orcidSearchData.givenNames}
            onChange={handleOrcidInputChange}
            fullWidth
            autoComplete="given-name"
            placeholder={t('auth.given_name_placeholder', 'John')}
          />
        </Field>
        <Field label={t('auth.orcid_family_name')} htmlFor="orcid-family">
          <TextField
            id="orcid-family"
            name="familyName"
            value={orcidSearchData.familyName}
            onChange={handleOrcidInputChange}
            fullWidth
            autoComplete="family-name"
            placeholder={t('auth.family_name_placeholder', 'Doe')}
          />
        </Field>
        <Button
          type="submit"
          variant="outlined"
          disabled={orcidLoading || !orcidSearchData.givenNames || !orcidSearchData.familyName}
          startIcon={orcidLoading ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
          sx={{ height: 38, px: 2.5, fontWeight: 600, borderRadius: 1.25, whiteSpace: 'nowrap' }}
        >
          {t('common.search')}
        </Button>
      </Box>

      {orcidError && (
        <Alert severity="warning" variant="outlined" sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setOrcidError(null)}>
          {orcidError}
        </Alert>
      )}

      {/* Results */}
      {orcidResults.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <SectionLabel sx={{ mb: 0, flex: 1, mr: 2 }}>
              {t('auth.orcid_matches', '{{count}} matching profiles', { count: orcidResults.length })}
            </SectionLabel>
            <Button size="small" onClick={handleClearOrcidResults} sx={{ color: 'text.secondary', fontWeight: 500 }}>
              {t('auth.orcid_clear_results')}
            </Button>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }} role="radiogroup">
            {orcidResults.map((result) => {
              const selected = selectedId === result['orcid-id'];
              const affiliations = result['institution-name'];
              return (
                <Box
                  key={result['orcid-id']}
                  role="radio"
                  aria-checked={selected}
                  tabIndex={0}
                  onClick={() => handleOrcidProfileSelect(result)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleOrcidProfileSelect(result);
                    }
                  }}
                  sx={{
                    display: 'flex', alignItems: 'flex-start', gap: 1.5,
                    p: 1.5, px: 1.75, borderRadius: 1.5, cursor: 'pointer',
                    border: '1px solid',
                    borderColor: selected ? 'primary.main' : 'divider',
                    bgcolor: selected ? alpha(theme.palette.primary.main, 0.05) : 'background.paper',
                    boxShadow: selected ? `0 0 0 3px ${alpha(theme.palette.primary.main, 0.12)}` : 'none',
                    transition: 'border-color 0.15s, background-color 0.15s, box-shadow 0.15s',
                    '&:hover': { borderColor: selected ? 'primary.main' : 'text.disabled' },
                    '&:focus-visible': { outline: 'none', boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.25)}` },
                  }}
                >
                  {selected ? (
                    <CheckCircleIcon sx={{ color: 'primary.main', fontSize: 20, mt: 0.25 }} />
                  ) : (
                    <UncheckedIcon sx={{ color: 'text.disabled', fontSize: 20, mt: 0.25 }} />
                  )}
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                      {result['given-names']} {result['family-names']}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5 }}>
                      <OrcidBadge size={16} />
                      <Typography sx={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.8125rem', color: 'text.secondary' }}>
                        {result['orcid-id']}
                      </Typography>
                    </Box>
                    {affiliations.length > 0 && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.75, fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
                      >
                        {affiliations.join(' · ')}
                      </Typography>
                    )}
                  </Box>
                  <IconButton
                    size="small"
                    component="a"
                    href={`https://orcid.org/${result['orcid-id']}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={t('auth.orcid_view_profile', 'View ORCID profile')}
                    sx={{ color: 'text.secondary' }}
                  >
                    <OpenInNewIcon fontSize="small" />
                  </IconButton>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Selected (when results were cleared or came back from a later step) */}
      {selectedOrcidProfile && orcidResults.length === 0 && (
        <Box
          sx={{
            display: 'flex', alignItems: 'center', gap: 1.5, p: 2, mb: 3, borderRadius: 1.5,
            border: '1px solid', borderColor: 'success.main',
            bgcolor: alpha(theme.palette.success.main, 0.06),
          }}
        >
          <CheckCircleIcon sx={{ color: 'success.main' }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem' }}>
              {selectedOrcidProfile['given-names']} {selectedOrcidProfile['family-names']}
            </Typography>
            <Typography sx={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.8125rem', color: 'text.secondary' }}>
              {selectedOrcidProfile['orcid-id']}
            </Typography>
          </Box>
        </Box>
      )}

      {errors?.orcidSearch && !selectedOrcidProfile && (
        <Alert severity="error" variant="outlined" sx={{ mb: 2, borderRadius: 1.5 }}>
          {errors.orcidSearch}
        </Alert>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
        {t('auth.orcid_dont_have')}{' '}
        <Link
          href="https://orcid.org/register"
          target="_blank"
          rel="noopener noreferrer"
          underline="hover"
          sx={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
        >
          {t('auth.orcid_register')}
          <OpenInNewIcon sx={{ fontSize: 14 }} />
        </Link>
      </Typography>
    </Box>
  );
};

export default OrcidSearchStep; 