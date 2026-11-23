'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControlLabel,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as BackIcon,
  Delete as DeleteIcon,
  EmojiEvents as CertificateIcon,
  Home as HomeIcon,
  Image as ImageIcon,
  Star as DefaultIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
} from '@/components/GlobalAdmin/InstitutionModalShell';
import { DEFAULT_TEMPLATE, MERGE_FIELDS } from '@/lib/certificate-template';

const PURPLE = '#8b6cbc';
const LIMITS = { logo: 400, signature: 300, background: 1200 };

function readImage(file, kind) {
  return new Promise((resolve, reject) => {
    if (!/^image\/(png|jpeg)$/.test(file.type)) {
      reject(new Error('Use a PNG or JPEG image'));
      return;
    }
    if (file.size > LIMITS[kind] * 1024 * 0.74) {
      reject(new Error(`That image is too large (max about ${Math.round(LIMITS[kind] * 0.74)} KB)`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the image'));
    reader.readAsDataURL(file);
  });
}

function ImagePicker({ label, value, kind, onChange, onError }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box sx={{ width: 72, height: 44, border: '1px dashed', borderColor: 'divider', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', bgcolor: '#fafafa' }}>
        {value ? <Box component="img" src={value} alt="" sx={{ maxWidth: '100%', maxHeight: '100%' }} /> : <ImageIcon sx={{ color: 'text.disabled' }} />}
      </Box>
      <Button component="label" size="small" variant="outlined" sx={{ textTransform: 'none' }}>
        {value ? `Change ${label}` : `Add ${label}`}
        <input
          hidden
          type="file"
          accept="image/png,image/jpeg"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            try {
              onChange(await readImage(file, kind));
            } catch (err) {
              onError(err.message);
            }
          }}
        />
      </Button>
      {value ? <Button size="small" color="error" onClick={() => onChange(null)} sx={{ textTransform: 'none' }}>Remove</Button> : null}
    </Stack>
  );
}

const blankDraft = () => ({ ...DEFAULT_TEMPLATE, signatories: [], isDefault: false });

/**
 * Certificate template designer (#98): list, edit and preview the institution's templates.
 */
export default function CertificateTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState([]);
  const [selectedId, setSelectedId] = useState(null); // null = new
  const [draft, setDraft] = useState(blankDraft);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const previewTimer = useRef(null);
  const lastUrl = useRef('');

  const loadList = useCallback(async () => {
    const res = await fetch('/api/training/certificate-templates', { credentials: 'include' });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load templates');
    setTemplates(json.templates);
    return json.templates;
  }, []);

  const openTemplate = useCallback(async (id) => {
    if (!id) {
      setSelectedId(null);
      setDraft(blankDraft());
      return;
    }
    const res = await fetch(`/api/training/certificate-templates/${id}`, { credentials: 'include' });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load template');
    setSelectedId(id);
    setDraft({ ...json.template, signatories: json.template.signatories || [] });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const list = await loadList();
        if (list.length) await openTemplate(list[0].id);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadList, openTemplate]);

  // Live preview, debounced.
  useEffect(() => {
    clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(async () => {
      setPreviewing(true);
      try {
        const res = await fetch('/api/training/certificate-templates/preview', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ template: draft }),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error || 'Preview failed');
        }
        const url = URL.createObjectURL(await res.blob());
        if (lastUrl.current) URL.revokeObjectURL(lastUrl.current);
        lastUrl.current = url;
        setPreviewUrl(url);
      } catch (err) {
        setError(err.message);
      } finally {
        setPreviewing(false);
      }
    }, 700);
    return () => clearTimeout(previewTimer.current);
  }, [draft]);

  useEffect(() => () => { if (lastUrl.current) URL.revokeObjectURL(lastUrl.current); }, []);

  const update = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const updateSignatory = (index, patch) => setDraft((d) => ({
    ...d,
    signatories: d.signatories.map((s, i) => (i === index ? { ...s, ...patch } : s)),
  }));

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(selectedId ? `/api/training/certificate-templates/${selectedId}` : '/api/training/certificate-templates', {
        method: selectedId ? 'PUT' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Could not save the template');
      setNotice('Template saved.');
      await loadList();
      await openTemplate(json.template.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/training/certificate-templates/${selectedId}`, { method: 'DELETE', credentials: 'include' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Could not delete the template');
      setConfirmDelete(false);
      setNotice('Template deleted.');
      const list = await loadList();
      await openTemplate(list[0]?.id || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const insertField = (field) => update({ bodyTemplate: `${draft.bodyTemplate || ''}{{${field}}}` });

  return (
    <Box>
      <PageHeader
        title="Certificate templates"
        description="Design the certificates your trainings issue. Each training picks a template, or uses the default."
        icon={<CertificateIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/institution' },
          { label: 'Training', path: '/institution/training' },
          { label: 'Certificate templates' },
        ]}
        actionButton={(
          <Button variant="contained" startIcon={<BackIcon />} onClick={() => router.push('/institution/training')} sx={{ bgcolor: 'white', color: PURPLE, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#f5f5f5' } }}>
            Back to trainings
          </Button>
        )}
      />
      <Container maxWidth={false} sx={{ py: 3, maxWidth: '1600px', mx: 'auto' }}>
        {error ? <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert> : null}
        {notice ? <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setNotice('')}>{notice}</Alert> : null}

        {loading ? (
          <Box sx={{ py: 10, display: 'flex', justifyContent: 'center' }}><CircularProgress sx={{ color: PURPLE }} /></Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '260px minmax(0, 1fr) minmax(0, 1.2fr)' }, gap: 2, alignItems: 'start' }}>
            <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
              <Box sx={{ p: 1.5 }}>
                <Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={() => openTemplate(null)} sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700 }}>
                  New template
                </Button>
              </Box>
              <Divider />
              <List dense disablePadding>
                {templates.map((t) => (
                  <ListItemButton key={t.id} selected={t.id === selectedId} onClick={() => openTemplate(t.id).catch((e) => setError(e.message))}>
                    <ListItemText
                      primary={<Stack direction="row" spacing={0.75} alignItems="center"><span>{t.name}</span>{t.isDefault ? <DefaultIcon sx={{ fontSize: 16, color: '#f59e0b' }} /> : null}</Stack>}
                      secondary={`${t.orientation === 'PORTRAIT' ? 'Portrait' : 'Landscape'} · ${t.signatories} signator${t.signatories === 1 ? 'y' : 'ies'}`}
                    />
                  </ListItemButton>
                ))}
                {!templates.length ? (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                    No templates yet. Trainings use the standard design until you save one.
                  </Typography>
                ) : null}
              </List>
            </Paper>

            <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{selectedId ? 'Edit template' : 'New template'}</Typography>
                  {draft.isDefault ? <Chip size="small" icon={<DefaultIcon />} label="Default" sx={{ bgcolor: alpha('#f59e0b', 0.12), color: '#92400e', fontWeight: 700 }} /> : null}
                </Stack>
                <TextField size="small" label="Template name" value={draft.name || ''} onChange={(e) => update({ name: e.target.value })} required />
                <Stack direction="row" spacing={1.5}>
                  <TextField select size="small" label="Orientation" value={draft.orientation} onChange={(e) => update({ orientation: e.target.value })} sx={{ flex: 1 }}>
                    <MenuItem value="LANDSCAPE">Landscape</MenuItem>
                    <MenuItem value="PORTRAIT">Portrait</MenuItem>
                  </TextField>
                  <TextField size="small" type="color" label="Colour" value={draft.primaryColor} onChange={(e) => update({ primaryColor: e.target.value })} sx={{ width: 110 }} InputLabelProps={{ shrink: true }} />
                </Stack>
                <TextField size="small" label="Title" value={draft.titleText || ''} onChange={(e) => update({ titleText: e.target.value })} />
                <TextField
                  label="Body (after the participant's name)"
                  multiline
                  minRows={3}
                  value={draft.bodyTemplate || ''}
                  onChange={(e) => update({ bodyTemplate: e.target.value })}
                  helperText="Click a field below to add it."
                />
                <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', rowGap: 0.75 }}>
                  {Object.entries(MERGE_FIELDS).map(([key, label]) => (
                    <Chip key={key} size="small" label={label} onClick={() => insertField(key)} variant="outlined" />
                  ))}
                </Stack>
                <TextField size="small" label="Footer line (optional)" value={draft.footerText || ''} onChange={(e) => update({ footerText: e.target.value })} />

                <Divider />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Images</Typography>
                <ImagePicker label="logo" kind="logo" value={draft.logoDataUrl} onChange={(v) => update({ logoDataUrl: v })} onError={setError} />
                <ImagePicker label="background" kind="background" value={draft.backgroundDataUrl} onChange={(v) => update({ backgroundDataUrl: v })} onError={setError} />
                <Typography variant="caption" color="text.secondary">A background replaces the printed frame; use a full-page A4 image.</Typography>

                <Divider />
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Signatories ({draft.signatories.length}/3)</Typography>
                  <Button size="small" startIcon={<AddIcon />} disabled={draft.signatories.length >= 3} onClick={() => update({ signatories: [...draft.signatories, { name: '', title: '', signatureDataUrl: null }] })} sx={{ textTransform: 'none' }}>
                    Add
                  </Button>
                </Stack>
                {draft.signatories.map((s, i) => (
                  <Paper key={i} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1}>
                        <TextField size="small" label="Name" value={s.name} onChange={(e) => updateSignatory(i, { name: e.target.value })} sx={{ flex: 1 }} />
                        <IconButton size="small" color="error" onClick={() => update({ signatories: draft.signatories.filter((_, j) => j !== i) })}><DeleteIcon fontSize="small" /></IconButton>
                      </Stack>
                      <TextField size="small" label="Title / role" value={s.title || ''} onChange={(e) => updateSignatory(i, { title: e.target.value })} />
                      <ImagePicker label="signature" kind="signature" value={s.signatureDataUrl} onChange={(v) => updateSignatory(i, { signatureDataUrl: v })} onError={setError} />
                    </Stack>
                  </Paper>
                ))}

                <Divider />
                <FormControlLabel control={<Switch checked={draft.showQr !== false} onChange={(e) => update({ showQr: e.target.checked })} />} label="Show a QR code linking to the verification page" />
                <FormControlLabel
                  control={<Switch checked={Boolean(draft.isDefault)} disabled={Boolean(selectedId && templates.find((t) => t.id === selectedId)?.isDefault)} onChange={(e) => update({ isDefault: e.target.checked })} />}
                  label="Default for trainings without a template"
                />

                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  {selectedId ? (
                    <Button color="error" startIcon={<DeleteIcon />} disabled={busy} onClick={() => setConfirmDelete(true)} sx={{ textTransform: 'none', mr: 'auto' }}>Delete</Button>
                  ) : null}
                  <Button variant="contained" disabled={busy || !draft.name?.trim()} onClick={save} sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700 }}>
                    {busy ? 'Saving…' : selectedId ? 'Save changes' : 'Create template'}
                  </Button>
                </Stack>
              </Stack>
            </Paper>

            <Paper sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', position: { lg: 'sticky' }, top: { lg: 16 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1, px: 0.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Live preview (sample data)</Typography>
                {previewing ? <CircularProgress size={16} sx={{ color: PURPLE }} /> : null}
              </Stack>
              {previewUrl ? (
                <Box
                  component="iframe"
                  title="Certificate preview"
                  src={`${previewUrl}#toolbar=0&navpanes=0&view=FitH`}
                  sx={{ width: '100%', border: 0, borderRadius: 1, bgcolor: '#f1f5f9', aspectRatio: draft.orientation === 'PORTRAIT' ? '210 / 297' : '297 / 210' }}
                />
              ) : (
                <Box sx={{ py: 10, display: 'flex', justifyContent: 'center' }}><CircularProgress sx={{ color: PURPLE }} /></Box>
              )}
              <Tooltip title="Trainings fill in the real participant, dates, CPD and accreditation when certificates are issued.">
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, px: 0.5 }}>
                  Real certificates use each participant&apos;s details and the training&apos;s CPD and accreditation.
                </Typography>
              </Tooltip>
            </Paper>
          </Box>
        )}
      </Container>

      <InstitutionModal open={confirmDelete} onClose={() => setConfirmDelete(false)} disableClose={busy} maxWidth="xs">
        <InstitutionModalHeader icon={DeleteIcon} tone="danger" title="Delete template" subtitle="This action cannot be undone" onClose={() => setConfirmDelete(false)} disableClose={busy} />
        <InstitutionModalBody>
          <Alert severity="warning" sx={{ borderRadius: 1.5 }}>
            “{draft.name}” will be deleted. Trainings using it switch to the default template. Certificates already issued are not affected.
          </Alert>
        </InstitutionModalBody>
        <InstitutionModalFooter>
          <Button onClick={() => setConfirmDelete(false)} disabled={busy} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={remove} disabled={busy} sx={{ textTransform: 'none', fontWeight: 700 }}>{busy ? 'Deleting…' : 'Delete template'}</Button>
        </InstitutionModalFooter>
      </InstitutionModal>
    </Box>
  );
}
