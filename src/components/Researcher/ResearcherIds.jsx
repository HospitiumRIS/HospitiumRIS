'use client';

import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  Link as MuiLink,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  DeleteOutline as RemoveIcon,
  Edit as EditIcon,
  OpenInNew as OpenIcon,
  ContentCopy as CopyIcon,
  Fingerprint as IdIcon,
} from '@mui/icons-material';
import {
  RESEARCHER_ID_TYPES,
  MAX_RESEARCHER_IDS,
  normalizeResearcherId,
  researcherIdDisplay,
} from '@/lib/researcher-ids';

const PURPLE = '#8b6cbc';
const PURPLE_DARK = '#7a5caa';
const INK = '#1e293b';
const MUTED = '#64748b';

/** Compact linked chips for the profile card. */
export function ResearcherIdLinks({ ids = [] }) {
  if (!ids.length) return null;
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
      {ids.map((entry) => {
        const d = researcherIdDisplay(entry);
        return (
          <Tooltip key={`${entry.type}-${entry.value}`} title={`${d.label}: ${entry.type === 'OTHER' ? d.url : d.value}`}>
            <Chip
              label={d.short}
              size="small"
              component="a"
              href={d.url}
              target="_blank"
              rel="noopener noreferrer"
              clickable
              sx={{
                height: 22,
                fontSize: '0.7rem',
                fontWeight: 600,
                bgcolor: `${d.color}14`,
                color: d.color,
                border: `1px solid ${d.color}33`,
                '&:hover': { bgcolor: `${d.color}24` },
              }}
            />
          </Tooltip>
        );
      })}
    </Box>
  );
}

const emptyRow = () => ({ type: 'GOOGLE_SCHOLAR', value: '', label: '' });

/** Full tab panel: view + edit the researcher's identifiers. */
export function ResearcherIdsPanel({ ids = [], orcidId, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [rows, setRows] = useState([]);
  const [rowErrors, setRowErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  const startEdit = () => {
    setRows(ids.length ? ids.map((e) => ({ ...e, label: e.label || '' })) : [emptyRow()]);
    setRowErrors({});
    setError('');
    setEditing(true);
  };

  const updateRow = (index, patch) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
    setRowErrors((prev) => ({ ...prev, [index]: undefined }));
  };

  const save = async () => {
    // drop blank rows, validate the rest locally first for instant feedback
    const filled = rows.filter((r) => String(r.value || '').trim());
    const errs = {};
    filled.forEach((r) => {
      const { error: e } = normalizeResearcherId(r);
      if (e) errs[rows.indexOf(r)] = e;
    });
    if (Object.keys(errs).length) {
      setRowErrors(errs);
      return;
    }

    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/researcher/profile/ids', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ researcherIds: filled }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setError(data.message || 'Failed to save identifiers');
        return;
      }
      onSaved?.(data.researcherIds || []);
      setEditing(false);
    } catch (e) {
      console.error(e);
      setError('Failed to save identifiers');
    } finally {
      setSaving(false);
    }
  };

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(''), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: INK }}>
          Researcher IDs
        </Typography>
        {!editing && (
          <Button
            size="small"
            startIcon={ids.length ? <EditIcon /> : <AddIcon />}
            onClick={startEdit}
            sx={{ color: PURPLE, fontWeight: 600, textTransform: 'none' }}
          >
            {ids.length ? 'Edit IDs' : 'Add IDs'}
          </Button>
        )}
      </Box>
      <Typography variant="body2" sx={{ color: MUTED, mb: 3, fontSize: '0.813rem' }}>
        Link your profiles on other research platforms so colleagues and administrators can find all of your work.
      </Typography>

      {/* ORCID is managed on the account itself */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>
        <Box sx={{ width: 180, color: MUTED, fontSize: '0.813rem', fontWeight: 600 }}>ORCID iD</Box>
        {orcidId ? (
          <MuiLink href={`https://orcid.org/${orcidId}`} target="_blank" rel="noopener noreferrer" sx={{ color: PURPLE_DARK, fontSize: '0.875rem' }}>
            {orcidId}
          </MuiLink>
        ) : (
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>Not connected</Typography>
        )}
      </Box>

      {!editing ? (
        ids.length ? (
          ids.map((entry) => {
            const d = researcherIdDisplay(entry);
            const shown = entry.type === 'OTHER' ? d.url : d.value;
            return (
              <Box key={`${entry.type}-${entry.value}`} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>
                <Box sx={{ width: 180, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: d.color, flexShrink: 0 }} />
                  <Typography sx={{ color: MUTED, fontSize: '0.813rem', fontWeight: 600 }}>{d.label}</Typography>
                </Box>
                <Typography noWrap sx={{ flex: 1, minWidth: 0, color: INK, fontSize: '0.875rem' }}>
                  {shown}
                </Typography>
                <Tooltip title={copied === shown ? 'Copied' : 'Copy'}>
                  <IconButton size="small" onClick={() => copy(shown)}>
                    <CopyIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Open profile">
                  <IconButton size="small" component="a" href={d.url} target="_blank" rel="noopener noreferrer">
                    <OpenIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            );
          })
        ) : (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <IdIcon sx={{ fontSize: 44, color: '#cbd5e0', mb: 1 }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.813rem' }}>
              No other researcher IDs added yet. Add Google Scholar, Scopus, Web of Science and more.
            </Typography>
          </Box>
        )
      ) : (
        <Box sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}
          <Stack spacing={2}>
            {rows.map((row, index) => {
              const def = RESEARCHER_ID_TYPES[row.type];
              return (
                <Box key={index} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Platform</InputLabel>
                    <Select
                      label="Platform"
                      value={row.type}
                      onChange={(e) => updateRow(index, { type: e.target.value })}
                      disabled={saving}
                    >
                      {Object.entries(RESEARCHER_ID_TYPES).map(([key, t]) => (
                        <MenuItem key={key} value={key}>{t.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {row.type === 'OTHER' && (
                    <TextField
                      size="small"
                      label="Name"
                      placeholder="e.g. Academia.edu"
                      value={row.label}
                      onChange={(e) => updateRow(index, { label: e.target.value })}
                      disabled={saving}
                      sx={{ width: 170 }}
                    />
                  )}
                  <TextField
                    size="small"
                    fullWidth
                    label={row.type === 'OTHER' ? 'Profile URL' : 'ID or profile URL'}
                    placeholder={def?.placeholder}
                    value={row.value}
                    onChange={(e) => updateRow(index, { value: e.target.value })}
                    error={Boolean(rowErrors[index])}
                    helperText={rowErrors[index] || def?.help}
                    disabled={saving}
                  />
                  <Tooltip title="Remove">
                    <span>
                      <IconButton
                        onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
                        disabled={saving}
                        sx={{ mt: 0.25, color: '#b91c1c' }}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              );
            })}
          </Stack>
          <Button
            startIcon={<AddIcon />}
            onClick={() => setRows((prev) => [...prev, emptyRow()])}
            disabled={saving || rows.length >= MAX_RESEARCHER_IDS}
            sx={{ mt: 2, color: PURPLE, fontWeight: 600, textTransform: 'none' }}
          >
            Add another ID
          </Button>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
            <Button onClick={() => setEditing(false)} disabled={saving} color="inherit">
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={save}
              disabled={saving}
              sx={{ bgcolor: PURPLE, '&:hover': { bgcolor: PURPLE_DARK }, textTransform: 'none', fontWeight: 600 }}
            >
              {saving ? 'Saving…' : 'Save IDs'}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
