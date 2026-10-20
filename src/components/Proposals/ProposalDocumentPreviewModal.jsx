'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
  alpha,
} from '@mui/material';
import {
  Download as DownloadIcon,
  InsertDriveFile as FileIcon,
  Visibility as PreviewIcon,
} from '@mui/icons-material';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
} from '../GlobalAdmin/InstitutionModalShell';

const PURPLE = '#8b6cbc';
const MAX_ROWS = 500;
const MAX_COLUMNS = 40;

const MIME_BY_EXT = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  csv: 'text/csv',
  txt: 'text/plain',
};

export function documentName(file) {
  return file?.name || file?.originalName || file?.fileName || 'Document';
}

export function documentSize(file) {
  const size = Number(file?.size) || 0;
  if (!size) return '';
  return size >= 1024 * 1024 ? `${(size / (1024 * 1024)).toFixed(1)} MB` : `${(size / 1024).toFixed(1)} KB`;
}

/** Client-side mirror of proposalDocumentDisplayUrl (that helper is server-only). */
function documentUrl(file) {
  if (!file || (typeof File !== 'undefined' && file instanceof File)) return null;
  if (file.url) return file.url;
  if (file.fileId) return `/api/files/${file.fileId}`;
  if (file.fileName) return `/uploads/proposals/${file.fileName}`;
  return null;
}

function extensionOf(name) {
  const parts = String(name || '').toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() : '';
}

function previewKind(ext) {
  if (ext === 'pdf') return 'pdf';
  if (['png', 'jpg', 'jpeg'].includes(ext)) return 'image';
  if (ext === 'csv') return 'csv';
  if (ext === 'txt') return 'text';
  if (['xls', 'xlsx'].includes(ext)) return 'sheet';
  return 'unsupported';
}

function normalizeRows(rows) {
  const trimmed = rows
    .filter((row) => Array.isArray(row) && row.some((cell) => String(cell ?? '').trim() !== ''))
    .slice(0, MAX_ROWS + 1);
  const width = Math.min(Math.max(0, ...trimmed.map((row) => row.length)), MAX_COLUMNS);
  return {
    rows: trimmed.slice(0, MAX_ROWS + 1).map((row) => Array.from({ length: width }, (_, i) => row[i] ?? '')),
    truncated: rows.length > MAX_ROWS + 1,
  };
}

function GridPreview({ rows, truncated }) {
  if (!rows.length) {
    return <Alert severity="info" sx={{ borderRadius: 2 }}>This sheet is empty.</Alert>;
  }
  const [header, ...body] = rows;
  const numeric = (value) => typeof value === 'number' || /^-?[\d,]+(\.\d+)?%?$/.test(String(value).trim());
  return (
    <Box>
      <TableContainer sx={{ maxHeight: '62vh', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {header.map((cell, i) => (
                <TableCell
                  key={i}
                  sx={{ fontWeight: 800, bgcolor: '#f8f6fb', whiteSpace: 'nowrap', borderBottomColor: alpha(PURPLE, 0.25) }}
                >
                  {String(cell)}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {body.map((row, r) => (
              <TableRow key={r} hover>
                {row.map((cell, c) => (
                  <TableCell
                    key={c}
                    align={numeric(cell) ? 'right' : 'left'}
                    sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}
                  >
                    {String(cell)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {truncated ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Showing the first {MAX_ROWS} rows. Download the file to see everything.
        </Typography>
      ) : null}
    </Box>
  );
}

/**
 * Preview a proposal document: either a freshly picked File (not yet uploaded)
 * or a saved document record ({ url | fileId | fileName, originalName, size }).
 * PDF and images render inline; CSV and Excel render as tables; other types offer download.
 */
export default function ProposalDocumentPreviewModal({ open, file, onClose, title = 'Document preview' }) {
  const name = documentName(file);
  const ext = extensionOf(name);
  const kind = previewKind(ext);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [objectUrl, setObjectUrl] = useState('');
  const [text, setText] = useState('');
  const [sheets, setSheets] = useState([]); // [{ name, rows, truncated }]
  const [activeSheet, setActiveSheet] = useState(0);

  useEffect(() => {
    if (!open || !file) return undefined;
    let cancelled = false;
    let createdUrl = '';

    setLoading(true);
    setError('');
    setText('');
    setSheets([]);
    setActiveSheet(0);
    setObjectUrl('');

    (async () => {
      try {
        let blob;
        if (typeof File !== 'undefined' && file instanceof File) {
          blob = file;
        } else {
          const url = documentUrl(file);
          if (!url) throw new Error('This document has no stored location.');
          const response = await fetch(url, { credentials: 'include' });
          if (!response.ok) throw new Error(`Could not load the document (${response.status}).`);
          blob = await response.blob();
        }

        // Re-type the blob so the browser's PDF / image viewer accepts it
        const typed = MIME_BY_EXT[ext] && blob.type !== MIME_BY_EXT[ext]
          ? new Blob([blob], { type: MIME_BY_EXT[ext] })
          : blob;
        createdUrl = URL.createObjectURL(typed);
        if (cancelled) return;
        setObjectUrl(createdUrl);

        if (kind === 'csv' || kind === 'text') {
          const content = await blob.text();
          if (cancelled) return;
          if (kind === 'text') {
            setText(content.slice(0, 200000));
          } else {
            const Papa = (await import('papaparse')).default;
            const parsed = Papa.parse(content, { skipEmptyLines: true });
            setSheets([{ name: 'CSV', ...normalizeRows(parsed.data || []) }]);
          }
        } else if (kind === 'sheet') {
          const XLSX = await import('xlsx');
          const workbook = XLSX.read(await blob.arrayBuffer(), { type: 'array' });
          const parsed = workbook.SheetNames.map((sheetName) => ({
            name: sheetName,
            ...normalizeRows(XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, raw: false, defval: '' })),
          }));
          if (!cancelled) setSheets(parsed);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not preview this document.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [open, file, ext, kind]);

  const subtitle = useMemo(
    () => [documentSize(file), ext ? ext.toUpperCase() : ''].filter(Boolean).join(' · ') || 'Saved document',
    [file, ext],
  );

  const renderBody = () => {
    if (loading) {
      return (
        <Box sx={{ py: 10, textAlign: 'center' }}>
          <CircularProgress sx={{ color: PURPLE }} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>Loading preview...</Typography>
        </Box>
      );
    }
    if (error) return <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>;

    if (kind === 'pdf' && objectUrl) {
      return (
        <Box
          component="iframe"
          title={name}
          src={objectUrl}
          sx={{ width: '100%', height: '70vh', border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: '#f1f5f9' }}
        />
      );
    }
    if (kind === 'image' && objectUrl) {
      return (
        <Box sx={{ textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 2, p: 1 }}>
          <Box component="img" src={objectUrl} alt={name} sx={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} />
        </Box>
      );
    }
    if (kind === 'text') {
      return (
        <Box
          component="pre"
          sx={{ m: 0, p: 2, maxHeight: '65vh', overflow: 'auto', bgcolor: '#f8fafc', borderRadius: 2, fontSize: 13, whiteSpace: 'pre-wrap' }}
        >
          {text}
        </Box>
      );
    }
    if ((kind === 'csv' || kind === 'sheet') && sheets.length) {
      const sheet = sheets[Math.min(activeSheet, sheets.length - 1)];
      return (
        <Box>
          {sheets.length > 1 ? (
            <Tabs
              value={activeSheet}
              onChange={(_e, value) => setActiveSheet(value)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                mb: 1.5,
                minHeight: 38,
                '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, minHeight: 38 },
                '& .Mui-selected': { color: `${PURPLE} !important` },
                '& .MuiTabs-indicator': { bgcolor: PURPLE },
              }}
            >
              {sheets.map((s, i) => <Tab key={s.name} value={i} label={s.name} />)}
            </Tabs>
          ) : null}
          <GridPreview rows={sheet.rows} truncated={sheet.truncated} />
        </Box>
      );
    }
    return (
      <Box sx={{ py: 6, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
        <FileIcon sx={{ fontSize: 44, color: '#cbd5e1', mb: 1 }} />
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
          Preview isn&apos;t available for {ext ? `.${ext}` : 'this'} files
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Download the file to open it in Word or another app.
        </Typography>
      </Box>
    );
  };

  return (
    <InstitutionModal open={open} onClose={onClose} maxWidth="lg">
      <InstitutionModalHeader icon={PreviewIcon} title={name} subtitle={`${title} · ${subtitle}`} onClose={onClose} dense />
      <InstitutionModalBody dense>{renderBody()}</InstitutionModalBody>
      <InstitutionModalFooter>
        <Button onClick={onClose} sx={{ textTransform: 'none', mr: 'auto' }}>
          Close
        </Button>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          component="a"
          href={objectUrl || undefined}
          download={name}
          disabled={!objectUrl}
          sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#7a5aad' } }}
        >
          Download
        </Button>
      </InstitutionModalFooter>
    </InstitutionModal>
  );
}
