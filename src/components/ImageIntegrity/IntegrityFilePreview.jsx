'use client';

import React, { useState } from 'react';
import { Box, Button, Stack, Typography, alpha } from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  FolderZip as ZipIcon,
  InsertDriveFile as FileIcon,
  BrokenImage as BrokenImageIcon,
} from '@mui/icons-material';
import { IMAGE_EXTENSIONS, PURPLE } from './integrityDetailUtils';

function FileTypeIcon({ extension, sx }) {
  if (extension === 'pdf') return <PdfIcon sx={sx} />;
  if (extension === 'zip') return <ZipIcon sx={sx} />;
  return <FileIcon sx={sx} />;
}

export default function IntegrityFilePreview({ record, fileUrl, downloadLabel = 'Download' }) {
  const [broken, setBroken] = useState(false);
  const extension = (record?.fileFormat || '').toLowerCase();
  const isImage = IMAGE_EXTENSIONS.includes(extension);

  return (
    <Box
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: alpha(PURPLE, 0.04),
        minHeight: 240,
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        p: 2,
      }}
    >
      {isImage && !broken ? (
        <Box
          component="img"
          src={fileUrl}
          alt={record.fileName}
          onError={() => setBroken(true)}
          sx={{ maxWidth: '100%', maxHeight: 320, objectFit: 'contain' }}
        />
      ) : (
        <Stack alignItems="center" spacing={1}>
          {broken ? (
            <BrokenImageIcon sx={{ fontSize: 40, color: '#94a3b8' }} />
          ) : (
            <FileTypeIcon extension={extension} sx={{ fontSize: 40, color: PURPLE }} />
          )}
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', wordBreak: 'break-word' }}>
            {record?.fileName}
          </Typography>
          {!isImage && (
            <Button
              size="small"
              href={`${fileUrl}?download=1`}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: PURPLE, textTransform: 'none', fontWeight: 600 }}
            >
              {downloadLabel}
            </Button>
          )}
        </Stack>
      )}
    </Box>
  );
}
