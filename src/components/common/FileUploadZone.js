'use client';

import React, { useCallback, useState } from 'react';
import { Box, Typography, Paper, IconButton, Chip, LinearProgress } from '@mui/material';
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
  maxSize = 10485760, // 10MB
  files = [],
  onChange,
  multiple = false,
  required = false
}) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (fileList) => {
    const newFiles = Array.from(fileList);
    
    // Validate file size
    const validFiles = newFiles.filter(file => {
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
  };

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    onChange(newFiles);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#2D3748' }}>
        {label} {required && <span style={{ color: '#e53e3e' }}>*</span>}
      </Typography>
      {description && (
        <Typography variant="caption" sx={{ display: 'block', mb: 1.5, color: '#718096' }}>
          {description}
        </Typography>
      )}
      
      <Paper
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        sx={{
          p: 3,
          border: dragActive ? '2px dashed #8b6cbc' : '2px dashed #e2e8f0',
          bgcolor: dragActive ? 'rgba(139, 108, 188, 0.05)' : '#fafafa',
          borderRadius: 2,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: '#8b6cbc',
            bgcolor: 'rgba(139, 108, 188, 0.02)',
          }
        }}
      >
        <input
          type="file"
          id={`file-upload-${label}`}
          multiple={multiple}
          accept={acceptedTypes}
          onChange={handleChange}
          style={{ display: 'none' }}
        />
        <label htmlFor={`file-upload-${label}`} style={{ cursor: 'pointer', display: 'block' }}>
          <UploadIcon sx={{ fontSize: 48, color: dragActive ? '#8b6cbc' : '#a0aec0', mb: 1 }} />
          <Typography variant="body1" sx={{ fontWeight: 600, color: '#2D3748', mb: 0.5 }}>
            {dragActive ? 'Drop files here' : 'Drag & drop files here'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#718096' }}>
            or click to browse
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#a0aec0' }}>
            Accepted: {acceptedTypes} • Max size: {maxSize / 1048576}MB
          </Typography>
        </label>
      </Paper>

      {uploading && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress sx={{ '& .MuiLinearProgress-bar': { bgcolor: '#8b6cbc' } }} />
        </Box>
      )}

      {files.length > 0 && (
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {files.map((file, index) => (
            <Paper
              key={index}
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: 'rgba(139, 108, 188, 0.05)',
                border: '1px solid rgba(139, 108, 188, 0.2)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                <FileIcon sx={{ color: '#8b6cbc' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#2D3748' }}>
                    {file.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#718096' }}>
                    {formatFileSize(file.size)}
                  </Typography>
                </Box>
                <CheckIcon sx={{ color: '#10b981', fontSize: 20 }} />
              </Box>
              <IconButton
                size="small"
                onClick={() => removeFile(index)}
                sx={{ color: '#e53e3e', '&:hover': { bgcolor: 'rgba(229, 62, 62, 0.1)' } }}
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
