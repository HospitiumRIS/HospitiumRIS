'use client';

import React, { useRef, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  PhotoCamera as CameraIcon,
  Upload as UploadIcon,
  DeleteOutline as RemoveIcon,
} from '@mui/icons-material';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
} from '../GlobalAdmin/InstitutionModalShell';

const PURPLE = '#8b6cbc';
const PURPLE_DARK = '#7a5caa';
const ACCEPT = 'image/png,image/jpeg,image/webp';
const MAX_INPUT_BYTES = 15 * 1024 * 1024; // before client-side resize
const OUTPUT_SIZE = 512;

/**
 * Center-crop to a square and resize to 512px JPEG in the browser.
 * Keeps uploads small and applies EXIF orientation from phone cameras.
 */
async function prepareImage(file) {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const side = Math.min(bitmap.width, bitmap.height);
    const sx = (bitmap.width - side) / 2;
    const sy = (bitmap.height - side) / 2;
    const size = Math.min(OUTPUT_SIZE, side);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; // flatten transparent PNGs
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
    bitmap.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    if (!blob) return file;
    return new File([blob], 'profile-photo.jpg', { type: 'image/jpeg' });
  } catch {
    return file; // fall back to the original; the server still validates it
  }
}

/**
 * Profile avatar with add / change / remove photo controls.
 * Photos go through POST/DELETE /api/researcher/profile/photo (R2 storage pipeline).
 */
export default function ProfilePhotoAvatar({ avatarUrl, initials, size = 96, editable = true, onChange, avatarSx = {} }) {
  const inputRef = useRef(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const pickFile = () => {
    setMenuAnchor(null);
    inputRef.current?.click();
  };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    setError('');
    if (!ACCEPT.split(',').includes(file.type)) {
      setError('Please choose a PNG, JPG or WebP image.');
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      setError('That image is too large (max 15 MB).');
      return;
    }

    setBusy(true);
    try {
      const prepared = await prepareImage(file);
      const form = new FormData();
      form.append('photo', prepared);
      const res = await fetch('/api/researcher/profile/photo', { method: 'POST', body: form, credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setError(data.message || 'Failed to upload photo');
        return;
      }
      setImgFailed(false);
      onChange?.(data.avatarUrl);
    } catch (err) {
      console.error('Photo upload failed:', err);
      setError('Failed to upload photo');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/researcher/profile/photo', { method: 'DELETE', credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setError(data.message || 'Failed to remove photo');
        return;
      }
      setConfirmOpen(false);
      onChange?.(null);
    } catch (err) {
      console.error('Photo removal failed:', err);
      setError('Failed to remove photo');
    } finally {
      setBusy(false);
    }
  };

  const showImage = avatarUrl && !imgFailed;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ position: 'relative', width: size, height: size }}>
        <Avatar
          src={showImage ? avatarUrl : undefined}
          imgProps={{ onError: () => setImgFailed(true) }}
          sx={{ width: size, height: size, bgcolor: PURPLE, fontSize: size / 3, fontWeight: 700, ...avatarSx }}
        >
          {initials}
        </Avatar>

        {busy && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CircularProgress size={28} sx={{ color: PURPLE }} />
          </Box>
        )}

        {editable && (
          <Tooltip title={avatarUrl ? 'Change or remove photo' : 'Add a photo'}>
            <span style={{ position: 'absolute', right: -2, bottom: -2 }}>
              <IconButton
                size="small"
                disabled={busy}
                onClick={(e) => (avatarUrl ? setMenuAnchor(e.currentTarget) : pickFile())}
                aria-label={avatarUrl ? 'Change or remove photo' : 'Add a photo'}
                sx={{
                  bgcolor: 'white',
                  border: `2px solid ${PURPLE}`,
                  color: PURPLE_DARK,
                  width: 32,
                  height: 32,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                  '&:hover': { bgcolor: '#f5f0fb' },
                }}
              >
                <CameraIcon sx={{ fontSize: 17 }} />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>

      <input ref={inputRef} type="file" accept={ACCEPT} hidden onChange={handleFile} />

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={pickFile}>
          <ListItemIcon><UploadIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Change photo</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            setConfirmOpen(true);
          }}
          sx={{ color: '#b91c1c' }}
        >
          <ListItemIcon><RemoveIcon fontSize="small" sx={{ color: '#b91c1c' }} /></ListItemIcon>
          <ListItemText>Remove photo</ListItemText>
        </MenuItem>
      </Menu>

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mt: 1.5, py: 0, borderRadius: 2, fontSize: '0.75rem' }}>
          {error}
        </Alert>
      )}

      <InstitutionModal open={confirmOpen} onClose={() => !busy && setConfirmOpen(false)} disableClose={busy} maxWidth="xs">
        <InstitutionModalHeader
          icon={RemoveIcon}
          title="Remove profile photo"
          subtitle="Your initials will be shown instead"
          tone="danger"
          onClose={() => setConfirmOpen(false)}
          disableClose={busy}
        />
        <InstitutionModalBody>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to remove your profile photo? You can add a new one at any time.
          </Typography>
        </InstitutionModalBody>
        <InstitutionModalFooter>
          <Button onClick={() => setConfirmOpen(false)} disabled={busy} color="inherit">
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleRemove} disabled={busy}>
            {busy ? 'Removing…' : 'Remove photo'}
          </Button>
        </InstitutionModalFooter>
      </InstitutionModal>
    </Box>
  );
}
