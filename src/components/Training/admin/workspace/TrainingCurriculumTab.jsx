'use client';

import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControlLabel,
  IconButton,
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
  AttachFile as FileIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  MenuBook as ModuleIcon,
} from '@mui/icons-material';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
} from '@/components/GlobalAdmin/InstitutionModalShell';
import { MODULE_COMPLETION_LABELS, MODULE_COMPLETION_MODES } from '@/lib/training-completion';

const PURPLE = '#8b6cbc';
const btn = { textTransform: 'none', fontWeight: 700 };
const EMPTY_MODULE = { title: '', description: '', completionMode: 'ADMIN', isRequired: true };

function MaterialList({ list }) {
  if (!list.length) return <Typography variant="body2" color="text.secondary">No files yet.</Typography>;
  return (
    <Stack spacing={0.75}>
      {list.map((material) => (
        <Stack key={material.id} direction="row" alignItems="center" spacing={1} sx={{ px: 1.25, py: 0.75, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
          <FileIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ fontWeight: 700, flex: 1, minWidth: 0 }} noWrap>{material.name}</Typography>
          <Chip size="small" label={material.accessLevel === 'PUBLIC' ? 'Open' : 'Registered only'} sx={{ height: 20 }} />
          {material.fileUrl ? <Button size="small" onClick={() => window.open(material.fileUrl, '_blank', 'noopener')} sx={{ ...btn, color: PURPLE }}>Open</Button> : null}
        </Stack>
      ))}
    </Stack>
  );
}

/**
 * Curriculum: modules and their materials. Adding and editing a module, and uploading a
 * material, open in the right-side panel; deleting asks first.
 */
export default function TrainingCurriculumTab({ trainingId, modules, materials, onChanged, onNotice, onError }) {
  const [moduleEditor, setModuleEditor] = useState(null); // { id?, ...fields }
  const [materialEditor, setMaterialEditor] = useState(null); // { moduleId, name, accessLevel, file }
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const materialsFor = (moduleId) => materials.filter((m) => (moduleId ? m.moduleId === moduleId : !m.moduleId));

  const call = async (fn, okText) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      onNotice(okText);
      await onChanged();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const json = async (url, method, body) => {
    const res = await fetch(url, { method, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.error || 'That did not work');
    return data;
  };

  const saveModule = async () => {
    const m = moduleEditor;
    const body = { title: m.title.trim(), description: m.description.trim(), completionMode: m.completionMode, isRequired: m.isRequired };
    const ok = await call(
      () => (m.id
        ? json(`/api/training/${trainingId}/modules/${m.id}`, 'PUT', body)
        : json(`/api/training/${trainingId}/modules`, 'POST', { ...body, order: modules.length + 1 })),
      m.id ? 'Module saved.' : 'Module added.',
    );
    if (ok) setModuleEditor(null);
  };

  // Quick inline changes (no panel): completion mode and required.
  const patchModule = async (id, patch) => {
    try {
      await json(`/api/training/${trainingId}/modules/${id}`, 'PUT', patch);
      await onChanged();
    } catch (err) {
      onError(err.message);
    }
  };

  const uploadMaterial = async () => {
    const m = materialEditor;
    const ok = await call(async () => {
      const form = new FormData();
      form.append('file', m.file);
      form.append('name', m.name.trim() || m.file.name);
      form.append('accessLevel', m.accessLevel);
      if (m.moduleId) form.append('moduleId', m.moduleId);
      const res = await fetch(`/api/training/${trainingId}/materials`, { method: 'POST', credentials: 'include', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || 'Upload failed');
    }, 'Material uploaded.');
    if (ok) setMaterialEditor(null);
  };

  const removeModule = async () => {
    const ok = await call(() => json(`/api/training/${trainingId}/modules/${deleting.id}`, 'DELETE'), 'Module removed.');
    if (ok) setDeleting(null);
  };

  return (
    <Stack spacing={2}>
      {error && !moduleEditor && !materialEditor && !deleting ? <Alert severity="error" onClose={() => setError('')}>{error}</Alert> : null}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Curriculum</Typography>
          <Typography variant="body2" color="text.secondary">{modules.length} modules · {materials.length} materials</Typography>
        </Box>
        <Button variant="outlined" startIcon={<UploadIcon />} onClick={() => setMaterialEditor({ moduleId: '', name: '', accessLevel: 'PUBLIC', file: null })} sx={{ ...btn, color: PURPLE, borderColor: alpha(PURPLE, 0.5) }}>Upload material</Button>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setModuleEditor({ ...EMPTY_MODULE })} sx={{ ...btn, bgcolor: PURPLE }}>Add module</Button>
      </Stack>

      {modules.length ? modules.map((module, index) => (
        <Paper key={module.id} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: alpha(PURPLE, 0.12), color: PURPLE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>{index + 1}</Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{module.title}</Typography>
              {module.description ? <Typography variant="body2" color="text.secondary">{module.description}</Typography> : null}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} sx={{ mt: 1 }}>
                <TextField select size="small" label="Completed by" value={module.completionMode || 'ADMIN'} onChange={(e) => patchModule(module.id, { completionMode: e.target.value })} sx={{ minWidth: 240 }}>
                  {MODULE_COMPLETION_MODES.filter((mode) => mode !== 'ON_ASSESSMENT_PASS' || module.completionMode === mode).map((mode) => <MenuItem key={mode} value={mode}>{MODULE_COMPLETION_LABELS[mode]}</MenuItem>)}
                </TextField>
                <FormControlLabel control={<Switch size="small" checked={module.isRequired !== false} onChange={(e) => patchModule(module.id, { isRequired: e.target.checked })} />} label={<Typography variant="body2">Required</Typography>} />
              </Stack>
            </Box>
            <Tooltip title="Upload a file to this module"><IconButton size="small" onClick={() => setMaterialEditor({ moduleId: module.id, name: '', accessLevel: 'PUBLIC', file: null })}><UploadIcon fontSize="small" /></IconButton></Tooltip>
            <Tooltip title="Edit module"><IconButton size="small" onClick={() => setModuleEditor({ id: module.id, title: module.title, description: module.description || '', completionMode: module.completionMode || 'ADMIN', isRequired: module.isRequired !== false })}><EditIcon fontSize="small" /></IconButton></Tooltip>
            <Tooltip title="Delete module"><IconButton size="small" color="error" onClick={() => setDeleting(module)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
          </Stack>
          <Box sx={{ mt: 1.5, pl: { sm: 6.5 } }}><MaterialList list={materialsFor(module.id)} /></Box>
        </Paper>
      )) : (
        <Alert severity="info" sx={{ borderRadius: 2 }} action={<Button size="small" onClick={() => setModuleEditor({ ...EMPTY_MODULE })} sx={{ ...btn, color: PURPLE }}>Add module</Button>}>
          No modules yet. Break the training into modules so participants can follow their progress.
        </Alert>
      )}

      <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>General materials</Typography>
        <MaterialList list={materialsFor(null)} />
      </Paper>

      <InstitutionModal open={Boolean(moduleEditor)} onClose={() => setModuleEditor(null)} disableClose={busy} maxWidth="sm">
        <InstitutionModalHeader icon={ModuleIcon} title={moduleEditor?.id ? 'Edit module' : 'Add a module'} subtitle={moduleEditor?.id ? moduleEditor.title : `Module ${modules.length + 1}`} onClose={() => setModuleEditor(null)} disableClose={busy} />
        <InstitutionModalBody>
          {error ? <Alert severity="error">{error}</Alert> : null}
          {moduleEditor ? (
            <Stack spacing={2}>
              <TextField label="Title" required fullWidth size="small" value={moduleEditor.title} onChange={(e) => setModuleEditor((m) => ({ ...m, title: e.target.value }))} />
              <TextField label="Description" fullWidth size="small" multiline minRows={3} value={moduleEditor.description} onChange={(e) => setModuleEditor((m) => ({ ...m, description: e.target.value }))} />
              <TextField select label="Completed by" size="small" value={moduleEditor.completionMode} onChange={(e) => setModuleEditor((m) => ({ ...m, completionMode: e.target.value }))} helperText="How this module is marked done for each participant">
                {MODULE_COMPLETION_MODES.filter((mode) => mode !== 'ON_ASSESSMENT_PASS' || moduleEditor.completionMode === mode).map((mode) => <MenuItem key={mode} value={mode}>{MODULE_COMPLETION_LABELS[mode]}</MenuItem>)}
              </TextField>
              <FormControlLabel control={<Switch checked={moduleEditor.isRequired} onChange={(e) => setModuleEditor((m) => ({ ...m, isRequired: e.target.checked }))} />} label="Required for completion" />
            </Stack>
          ) : null}
        </InstitutionModalBody>
        <InstitutionModalFooter>
          <Button onClick={() => setModuleEditor(null)} disabled={busy} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={saveModule} disabled={busy || !moduleEditor?.title.trim()} sx={{ ...btn, bgcolor: PURPLE }}>{busy ? 'Saving…' : moduleEditor?.id ? 'Save module' : 'Add module'}</Button>
        </InstitutionModalFooter>
      </InstitutionModal>

      <InstitutionModal open={Boolean(materialEditor)} onClose={() => setMaterialEditor(null)} disableClose={busy} maxWidth="sm">
        <InstitutionModalHeader icon={UploadIcon} title="Upload material" subtitle="Slides, handouts, readings or recordings" onClose={() => setMaterialEditor(null)} disableClose={busy} />
        <InstitutionModalBody>
          {error ? <Alert severity="error">{error}</Alert> : null}
          {materialEditor ? (
            <Stack spacing={2}>
              <Button component="label" variant="outlined" startIcon={<FileIcon />} sx={{ ...btn, borderStyle: 'dashed', py: 2, color: PURPLE, borderColor: alpha(PURPLE, 0.5) }}>
                {materialEditor.file ? materialEditor.file.name : 'Choose a file'}
                <input hidden type="file" onChange={(e) => setMaterialEditor((m) => ({ ...m, file: e.target.files?.[0] || null }))} />
              </Button>
              <TextField label="Name (optional)" size="small" fullWidth value={materialEditor.name} onChange={(e) => setMaterialEditor((m) => ({ ...m, name: e.target.value }))} helperText="Defaults to the file name" />
              <TextField select label="Attach to" size="small" fullWidth value={materialEditor.moduleId} onChange={(e) => setMaterialEditor((m) => ({ ...m, moduleId: e.target.value }))}>
                <MenuItem value="">General materials</MenuItem>
                {modules.map((module) => <MenuItem key={module.id} value={module.id}>{module.title}</MenuItem>)}
              </TextField>
              <TextField select label="Who can open it" size="small" fullWidth value={materialEditor.accessLevel} onChange={(e) => setMaterialEditor((m) => ({ ...m, accessLevel: e.target.value }))}>
                <MenuItem value="PUBLIC">Anyone who can see the training</MenuItem>
                <MenuItem value="REGISTERED_ONLY">Registered participants only</MenuItem>
              </TextField>
            </Stack>
          ) : null}
        </InstitutionModalBody>
        <InstitutionModalFooter>
          <Button onClick={() => setMaterialEditor(null)} disabled={busy} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={uploadMaterial} disabled={busy || !materialEditor?.file} sx={{ ...btn, bgcolor: PURPLE }}>{busy ? 'Uploading…' : 'Upload'}</Button>
        </InstitutionModalFooter>
      </InstitutionModal>

      <InstitutionModal open={Boolean(deleting)} onClose={() => setDeleting(null)} disableClose={busy} maxWidth="xs">
        <InstitutionModalHeader icon={DeleteIcon} tone="danger" title="Delete module" subtitle="This action cannot be undone" onClose={() => setDeleting(null)} disableClose={busy} />
        <InstitutionModalBody>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <Alert severity="warning">Delete <strong>{deleting?.title}</strong>? Participants&apos; progress on it is removed too.</Alert>
        </InstitutionModalBody>
        <InstitutionModalFooter>
          <Button onClick={() => setDeleting(null)} disabled={busy} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={removeModule} disabled={busy} sx={btn}>{busy ? 'Deleting…' : 'Delete'}</Button>
        </InstitutionModalFooter>
      </InstitutionModal>
    </Stack>
  );
}
