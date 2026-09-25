'use client';

import { useTranslation } from 'react-i18next';
import React, { useCallback, useState } from 'react';
import { Box, Typography, Paper, IconButton, alpha, useTheme } from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  InsertDriveFile as FileIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';

export default function FileUploadZone({
  label,
  description,
  acceptedTypes = '.pdf,.doc,.docx',
  maxSize = 10485760,
  files = [],
  onChange,
  multiple = false,
  required = false,
  compact = false,
  dense = false,
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = useCallback(
    (fileList) => {
      const newFiles = Array.from(fileList);

      const validFiles = newFiles.filter((file) => {
        if (file.size > maxSize) {
          alert(`File ${file.name} is too large. Maximum size is ${maxSize / 1048576}MB`);
          return false;
        }
        return true;
      });

      if (multiple) {
        onChange([...files, ...validFiles]);
      } else {
        onChange(validFiles.slice(0, 1));
      }
    },
    [files, maxSize, multiple, onChange]
  );

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index) => {
    onChange(files.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
  };

  const inputId = `file-upload-${label?.replace(/\s+/g, '-').toLowerCase() || 'file'}`;

  return (
    <Box sx={{ mb: compact ? 0 : 3 }}>
      {!compact && (
        <>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            {label} {required && <Box component="span" sx={{ color: 'error.main' }}>*</Box>}
          </Typography>
          {description && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
              {description}
            </Typography>
          )}
        </>
      )}

      {(compact || dense) && !dense && description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {description}
          {required && (
            <>
              {' '}
              <Box component="span" sx={{ color: 'error.main' }}>*</Box>
            </>
          )}
        </Typography>
      )}

      <Paper
        elevation={0}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        sx={{
          p: dense ? 1.25 : compact ? 2 : 3,
          border: '2px dashed',
          borderColor: dragActive ? 'primary.main' : 'divider',
          bgcolor: dragActive ? alpha(theme.palette.primary.main, 0.06) : alpha(theme.palette.background.default, 0.6),
          borderRadius: 2,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: alpha(theme.palette.primary.main, 0.5),
            bgcolor: alpha(theme.palette.primary.main, 0.04),
          },
        }}
      >
        <input
          type="file"
          id={inputId}
          multiple={multiple}
          accept={acceptedTypes}
          onChange={handleChange}
          style={{ display: 'none' }}
        />
        <label htmlFor={inputId} style={{ cursor: 'pointer', display: 'block' }}>
          {dense ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.25, flexWrap: 'wrap' }}>
              <UploadIcon sx={{ fontSize: 28, color: dragActive ? 'primary.main' : 'text.disabled' }} />
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {dragActive ? t('common.drop_files') : t('common.drag_drop')} {t('common.or_browse')}
                  {required && (
                    <Box component="span" sx={{ color: 'error.main' }}> *</Box>
                  )}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  PDF or image - Max {maxSize / 1048576}MB
                </Typography>
              </Box>
            </Box>
          ) : (
            <>
              <UploadIcon
                sx={{
                  fontSize: compact ? 40 : 48,
                  color: dragActive ? 'primary.main' : 'text.disabled',
                  mb: 1,
                }}
              />
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                {dragActive ? t('common.drop_files') : t('common.drag_drop')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('common.or_browse')}
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1 }}>
                Accepted: {acceptedTypes} - Max size: {maxSize / 1048576}MB
              </Typography>
            </>
          )}
        </label>
      </Paper>

      {files.length > 0 && (
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {files.map((file, index) => (
            <Paper
              key={index}
              elevation={0}
              sx={{
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: alpha(theme.palette.primary.main, 0.06),
                border: '1px solid',
                borderColor: alpha(theme.palette.primary.main, 0.2),
                borderRadius: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
                <FileIcon color="primary" fontSize="small" />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {file.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatFileSize(file.size)}
                  </Typography>
                </Box>
                <CheckIcon color="success" sx={{ fontSize: 20, flexShrink: 0 }} />
              </Box>
              <IconButton
                size="small"
                onClick={() => removeFile(index)}
                color="error"
                aria-label="Remove file"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
}
