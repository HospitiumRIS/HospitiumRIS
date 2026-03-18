'use client';

import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  Dialog, DialogContent, DialogActions,
  Box, Typography, Button, Stepper, Step, StepLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Alert, Chip, Stack, IconButton, Select, MenuItem,
  FormControl, LinearProgress, Tooltip, Divider, alpha, CircularProgress,
  Tab, Tabs,
} from '@mui/material';
import {
  Close as CloseIcon,
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  FileDownload as DownloadIcon,
  ArrowForward as NextIcon,
  ArrowBack as BackIcon,
  Campaign as CampaignIcon,
  CardGiftcard as DonationIcon,
  TableChart as TableIcon,
  Refresh as ResetIcon,
  CheckCircleOutline as SuccessIcon,
  ErrorOutline as ErrorOutlineIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import Papa from 'papaparse';

// ─── Import Configuration ────────────────────────────────────────────────────

const IMPORT_CONFIGS = {
  donations: {
    label: 'Donations',
    description: 'Import donor records and historical fundraising entries',
    apiEndpoint: '/api/foundation/donations/bulk',
    templateFilename: 'donations_import_template.csv',
    templateHeaders: [
      'Donor Name *', 'Amount *', 'Donation Date *', 'Email', 'Phone',
      'Donor Type', 'Payment Method', 'Transaction ID', 'Campaign Name', 'Status', 'Notes',
    ],
    templateRow: [
      'Jane Smith', '1500', '2024-06-15', 'jane@example.com', '+1 555-0100',
      'INDIVIDUAL', 'BANK_TRANSFER', 'TXN-2024-001', 'Annual Gala', 'COMPLETED', 'Long-term supporter',
    ],
    fields: [
      { key: 'donorName',     label: 'Donor Name',     required: true,  type: 'string' },
      { key: 'amount',        label: 'Amount',          required: true,  type: 'number' },
      { key: 'donationDate',  label: 'Donation Date',   required: true,  type: 'date'   },
      { key: 'donorEmail',    label: 'Email',           required: false, type: 'email'  },
      { key: 'donorPhone',    label: 'Phone',           required: false, type: 'string' },
      {
        key: 'donorType', label: 'Donor Type', required: false, type: 'enum',
        options: ['INDIVIDUAL', 'CORPORATE', 'FOUNDATION', 'GOVERNMENT', 'ANONYMOUS'],
      },
      {
        key: 'paymentMethod', label: 'Payment Method', required: false, type: 'enum',
        options: ['CREDIT_CARD', 'BANK_TRANSFER', 'CHECK', 'CASH', 'ONLINE', 'WIRE_TRANSFER', 'PAYPAL', 'MPESA'],
      },
      { key: 'transactionId', label: 'Transaction ID',  required: false, type: 'string' },
      { key: 'campaignName',  label: 'Campaign Name',   required: false, type: 'string' },
      {
        key: 'status', label: 'Status', required: false, type: 'enum',
        options: ['PENDING', 'COMPLETED'],
      },
      { key: 'notes',         label: 'Notes',           required: false, type: 'string' },
    ],
    apiKey: 'donations',
  },
  campaigns: {
    label: 'Campaigns',
    description: 'Import fundraising campaigns and initiatives',
    apiEndpoint: '/api/foundation/campaigns/bulk',
    templateFilename: 'campaigns_import_template.csv',
    templateHeaders: [
      'Campaign Name *', 'Description', 'Start Date', 'End Date',
      'Target Amount', 'Status', 'Category Name',
    ],
    templateRow: [
      'Healthcare Fund 2024', 'Annual healthcare equipment fundraising',
      '2024-01-01', '2024-12-31', '100000', 'Active', 'Healthcare',
    ],
    fields: [
      { key: 'name',          label: 'Campaign Name',  required: true,  type: 'string' },
      { key: 'description',   label: 'Description',    required: false, type: 'string' },
      { key: 'startDate',     label: 'Start Date',     required: false, type: 'date'   },
      { key: 'endDate',       label: 'End Date',       required: false, type: 'date'   },
      { key: 'targetAmount',  label: 'Target Amount',  required: false, type: 'number' },
      {
        key: 'status', label: 'Status', required: false, type: 'enum',
        options: ['Planning', 'Active', 'Completed', 'Paused', 'Cancelled'],
      },
      { key: 'categoryName',  label: 'Category Name',  required: false, type: 'string' },
    ],
    apiKey: 'campaigns',
  },
};

const STEPS = ['Upload File', 'Map Columns', 'Validate & Import'];

// ─── Column auto-mapping aliases ──────────────────────────────────────────────

const COLUMN_ALIASES = {
  donorName:     ['name', 'donor', 'donor name', 'full name', 'fullname', 'contact name', 'donorname'],
  amount:        ['amount', 'donation amount', 'gift amount', 'sum', 'value', '$', 'gift'],
  donationDate:  ['date', 'donation date', 'gift date', 'transaction date', 'date given', 'donated on'],
  donorEmail:    ['email', 'e-mail', 'donor email', 'email address', 'electronic mail'],
  donorPhone:    ['phone', 'telephone', 'mobile', 'phone number', 'tel', 'contact'],
  donorType:     ['type', 'donor type', 'donor category', 'entity type'],
  paymentMethod: ['payment', 'payment method', 'method', 'payment type', 'how paid'],
  transactionId: ['transaction', 'transaction id', 'txn', 'txn id', 'reference', 'ref', 'receipt no'],
  campaignName:  ['campaign', 'initiative', 'campaign name', 'fund', 'program'],
  status:        ['status', 'state', 'payment status', 'donation status'],
  notes:         ['notes', 'note', 'comments', 'remarks', 'memo'],
  name:          ['campaign name', 'title', 'name', 'initiative name'],
  description:   ['description', 'details', 'about', 'summary'],
  startDate:     ['start date', 'start', 'begin date', 'from date', 'start_date'],
  endDate:       ['end date', 'end', 'finish date', 'to date', 'end_date', 'deadline'],
  targetAmount:  ['target', 'goal', 'target amount', 'fundraising goal', 'target goal'],
  categoryName:  ['category', 'category name', 'category type'],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function autoMap(headers, fields) {
  const mapping = {};
  fields.forEach((field) => {
    const aliases = COLUMN_ALIASES[field.key] || [field.label.toLowerCase()];
    const hit = headers.find((h) => aliases.includes(h.toLowerCase().trim()));
    if (hit) mapping[field.key] = hit;
  });
  return mapping;
}

function validateRow(mapped, fields) {
  const errors = [];
  const warnings = [];

  fields.forEach((field) => {
    const raw = mapped[field.key];
    const val = (raw != null ? String(raw) : '').trim();

    if (field.required && val === '') {
      errors.push(`${field.label} is required`);
      return;
    }
    if (!val) return;

    if (field.type === 'number') {
      const n = parseFloat(val.replace(/[,$ ]/g, ''));
      if (isNaN(n) || n <= 0) errors.push(`${field.label}: must be a positive number`);
    } else if (field.type === 'date') {
      if (isNaN(new Date(val).getTime())) errors.push(`${field.label}: invalid date (use YYYY-MM-DD)`);
    } else if (field.type === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) errors.push(`${field.label}: invalid email address`);
    } else if (field.type === 'enum' && field.options) {
      const upper = val.toUpperCase().replace(/[\s-]+/g, '_');
      const valid = field.options.map((o) => o.toUpperCase());
      if (!valid.includes(upper) && !valid.includes(val.toUpperCase())) {
        warnings.push(`${field.label}: "${val}" is non-standard. Accepted: ${field.options.join(', ')}`);
      }
    }
  });

  return { errors, warnings, isValid: errors.length === 0 };
}

function applyMapping(rawRow, mapping) {
  const out = {};
  Object.entries(mapping).forEach(([fieldKey, sourceCol]) => {
    out[fieldKey] = rawRow[sourceCol] ?? '';
  });
  return out;
}

function downloadTemplate(config) {
  const csv = Papa.unparse({ fields: config.templateHeaders, data: [config.templateRow] });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = config.templateFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SpreadsheetImport({ open, onClose, onImportComplete, campaignContext }) {
  const [importType, setImportType] = useState('donations');
  // When a campaign context is provided, lock to donations and reset on open
  React.useEffect(() => {
    if (open && campaignContext) setImportType('donations');
  }, [open, campaignContext]);
  const [step, setStep] = useState(0);
  const [fileName, setFileName] = useState('');
  const [rawRows, setRawRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [validatedRows, setValidatedRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [parseError, setParseError] = useState('');
  const fileInputRef = useRef(null);

  const config = IMPORT_CONFIGS[importType];

  const reset = useCallback(() => {
    setStep(0);
    setFileName('');
    setRawRows([]);
    setHeaders([]);
    setMapping({});
    setValidatedRows([]);
    setImporting(false);
    setImportResult(null);
    setDragOver(false);
    setParseError('');
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleTypeChange = useCallback(
    (_, newType) => {
      if (newType !== null && !campaignContext) {
        setImportType(newType);
        reset();
      }
    },
    [reset, campaignContext]
  );

  const parseFile = useCallback(
    (file) => {
      if (!file) return;
      setParseError('');

      if (!file.name.toLowerCase().endsWith('.csv')) {
        setParseError('Only .csv files are supported. Export your spreadsheet as CSV first.');
        return;
      }

      setFileName(file.name);
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (!results.meta.fields || results.meta.fields.length === 0) {
            setParseError('Could not read column headers. Ensure the first row contains column names.');
            return;
          }
          const parsedHeaders = results.meta.fields;
          setHeaders(parsedHeaders);
          setRawRows(results.data);
          setMapping(autoMap(parsedHeaders, config.fields));
          setStep(1);
        },
        error: (err) => {
          setParseError(`Failed to parse file: ${err.message}`);
        },
      });
    },
    [config.fields]
  );

  const handleFileChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) parseFile(file);
      e.target.value = '';
    },
    [parseFile]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) parseFile(file);
    },
    [parseFile]
  );

  const handleValidate = useCallback(() => {
    const validated = rawRows.map((row, i) => {
      const mapped = applyMapping(row, mapping);
      const { errors, warnings, isValid } = validateRow(mapped, config.fields);
      return { index: i, mapped, errors, warnings, isValid };
    });
    setValidatedRows(validated);
    setStep(2);
  }, [rawRows, mapping, config.fields]);

  const handleImport = useCallback(async () => {
    const validRows = validatedRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    setImporting(true);
    setImportResult(null);

    try {
      const records = validRows.map((r) => {
        // If a campaign context was provided, always override campaignName
        if (campaignContext && importType === 'donations') {
          return { ...r.mapped, campaignName: campaignContext.name };
        }
        return r.mapped;
      });
      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [config.apiKey]: records }),
      });
      const result = await response.json();
      setImportResult(result);
      if (result.summary?.succeeded > 0 && onImportComplete) {
        onImportComplete();
      }
    } catch (err) {
      setImportResult({ success: false, error: err.message });
    } finally {
      setImporting(false);
    }
  }, [validatedRows, config, onImportComplete, campaignContext, importType]);

  const validCount = useMemo(() => validatedRows.filter((r) => r.isValid).length, [validatedRows]);
  const errorCount = useMemo(() => validatedRows.filter((r) => !r.isValid).length, [validatedRows]);
  const warnCount = useMemo(
    () => validatedRows.filter((r) => r.isValid && r.warnings.length > 0).length,
    [validatedRows]
  );

  const requiredUnmapped = useMemo(
    () => config.fields.filter((f) => f.required && !mapping[f.key]),
    [config.fields, mapping]
  );

  const mappedFieldCount = useMemo(
    () => config.fields.filter((f) => mapping[f.key]).length,
    [config.fields, mapping]
  );

  // ─── Step Renderers ───────────────────────────────────────────────────────

  const renderUpload = () => (
    <Box>
      {campaignContext && importType === 'donations' && (
        <Alert
          severity="success"
          icon={<CampaignIcon />}
          sx={{ mb: 2, borderRadius: 2, border: '1px solid rgba(76,175,80,0.4)', backgroundColor: 'rgba(76,175,80,0.06)' }}
        >
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            Linked to campaign: {campaignContext.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            All imported donations will automatically be associated with this campaign, regardless of the Campaign Name column in your file.
          </Typography>
        </Alert>
      )}
      <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3, borderRadius: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
          {config.description}
        </Typography>
        <Typography variant="caption">
          Upload a <strong>.csv</strong> file. Export from Excel or Google Sheets using &quot;Save as CSV&quot;.
          Download the template below to see the expected format.
        </Typography>
      </Alert>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={() => downloadTemplate(config)}
          sx={{ borderColor: '#8b6cbc', color: '#8b6cbc', borderRadius: 2, fontWeight: 600 }}
        >
          Download Template
        </Button>
      </Box>

      {parseError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setParseError('')}>
          {parseError}
        </Alert>
      )}

      <Box
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        sx={{
          border: `2px dashed ${dragOver ? '#8b6cbc' : 'rgba(139,108,188,0.35)'}`,
          borderRadius: 3,
          p: { xs: 4, md: 7 },
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: dragOver ? 'rgba(139,108,188,0.07)' : 'rgba(139,108,188,0.02)',
          transition: 'all 0.2s ease',
          '&:hover': { borderColor: '#8b6cbc', backgroundColor: 'rgba(139,108,188,0.04)' },
        }}
      >
        <UploadIcon sx={{ fontSize: 52, color: '#8b6cbc', opacity: 0.65, mb: 1.5 }} />
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c3e50', mb: 0.75 }}>
          Drag &amp; drop your CSV file here
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          or click to browse your files
        </Typography>
        <Chip
          label=".csv files only"
          size="small"
          sx={{ backgroundColor: 'rgba(139,108,188,0.1)', color: '#8b6cbc', fontWeight: 600 }}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </Box>

      <Box sx={{ mt: 3, p: 2, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.025)', border: '1px solid rgba(0,0,0,0.07)' }}>
        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'text.secondary', display: 'block', mb: 1 }}>
          Required Fields
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {config.fields.filter((f) => f.required).map((f) => (
            <Chip key={f.key} label={f.label} size="small" color="error" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.7rem', mb: 0.5 }} />
          ))}
        </Stack>
        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'text.secondary', display: 'block', mt: 1.5, mb: 1 }}>
          Optional Fields
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {config.fields.filter((f) => !f.required).map((f) => (
            <Chip key={f.key} label={f.label} size="small" variant="outlined" sx={{ fontWeight: 500, fontSize: '0.7rem', mb: 0.5, borderColor: 'rgba(0,0,0,0.15)', color: 'text.secondary' }} />
          ))}
        </Stack>
      </Box>
    </Box>
  );

  const renderMapping = () => (
    <Box>
      <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
        <Typography variant="body2">
          <strong>{fileName}</strong> parsed — <strong>{rawRows.length} rows</strong>,{' '}
          <strong>{headers.length} columns</strong> detected.{' '}
          <strong>{Object.keys(mapping).length} / {config.fields.length}</strong> fields auto-mapped.
        </Typography>
      </Alert>

      {requiredUnmapped.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          Map all required fields before proceeding:{' '}
          <strong>{requiredUnmapped.map((f) => f.label).join(', ')}</strong>
        </Alert>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Review and adjust the column mapping. The first row of your file is shown as a preview.
      </Typography>

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgba(139,108,188,0.06)' }}>
              {['Import Field', 'Your Spreadsheet Column', 'Required', 'Sample Value'].map((h) => (
                <TableCell
                  key={h}
                  sx={{ fontWeight: 700, color: '#8b6cbc', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                >
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {config.fields.map((field) => {
              const selected = mapping[field.key] || '';
              const preview = selected && rawRows[0] ? String(rawRows[0][selected] ?? '') : '';
              const isMapped = Boolean(selected);

              return (
                <TableRow
                  key={field.key}
                  sx={{ '&:hover': { backgroundColor: 'rgba(139,108,188,0.025)' } }}
                >
                  <TableCell sx={{ minWidth: 140 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{field.label}</Typography>
                    {field.type === 'enum' && (
                      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', lineHeight: 1.3 }}>
                        {field.options?.join(' | ')}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                      <Select
                        value={selected}
                        onChange={(e) => setMapping((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        displayEmpty
                        MenuProps={{ disableScrollLock: true, PaperProps: { sx: { maxHeight: 240 } } }}
                        sx={{
                          fontSize: '0.82rem',
                          borderRadius: 1.5,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: isMapped ? 'rgba(76,175,80,0.5)' : 'rgba(0,0,0,0.18)',
                          },
                        }}
                      >
                        <MenuItem value=""><em style={{ color: '#aaa' }}>— Not mapped —</em></MenuItem>
                        {headers.map((h) => (
                          <MenuItem key={h} value={h} sx={{ fontSize: '0.82rem' }}>{h}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    {field.required ? (
                      <Chip label="Required" size="small" color="error" sx={{ fontSize: '0.65rem', height: 20 }} />
                    ) : (
                      <Chip label="Optional" size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20, borderColor: 'rgba(0,0,0,0.15)', color: 'text.secondary' }} />
                    )}
                  </TableCell>
                  <TableCell>
                    {preview ? (
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: 'monospace',
                          backgroundColor: 'rgba(0,0,0,0.04)',
                          px: 1, py: 0.25,
                          borderRadius: 0.5,
                          display: 'inline-block',
                          maxWidth: 160,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {preview}
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="text.disabled">—</Typography>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderPreviewAndImport = () => {
    if (importResult) {
      const { summary, failed = [], error } = importResult;
      const allFailed = summary?.succeeded === 0;
      return (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          {!allFailed ? (
            <SuccessIcon sx={{ fontSize: 64, color: '#4caf50', mb: 2 }} />
          ) : (
            <ErrorOutlineIcon sx={{ fontSize: 64, color: '#f44336', mb: 2 }} />
          )}
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            {allFailed ? 'Import Failed' : 'Import Complete'}
          </Typography>
          {summary && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {importType === 'donations' ? 'Donations' : 'Campaigns'} processed
            </Typography>
          )}
          {summary && (
            <Stack direction="row" spacing={3} justifyContent="center" sx={{ mb: 3 }}>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 800, color: '#4caf50', lineHeight: 1 }}>
                  {summary.succeeded}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#4caf50', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Succeeded
                </Typography>
              </Box>
              {summary.failed > 0 && (
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: '#f44336', lineHeight: 1 }}>
                    {summary.failed}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#f44336', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Failed
                  </Typography>
                </Box>
              )}
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 800, color: '#8b6cbc', lineHeight: 1 }}>
                  {summary.total}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#8b6cbc', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Total
                </Typography>
              </Box>
            </Stack>
          )}
          {failed.length > 0 && (
            <Box sx={{ textAlign: 'left', mt: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#f44336' }}>
                Failed Rows:
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, maxHeight: 200, overflow: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', width: 60 }}>Row</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Error</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {failed.map((f, i) => (
                      <TableRow key={i}>
                        <TableCell><Typography variant="caption">{f.rowIndex}</Typography></TableCell>
                        <TableCell><Typography variant="caption" color="error">{f.error}</Typography></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
          {error && !summary && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: 2, textAlign: 'left' }}>
              {error}
            </Alert>
          )}
        </Box>
      );
    }

    return (
      <Box>
        {/* Summary stats */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <Paper
            sx={{ p: 2, flex: 1, borderRadius: 2, textAlign: 'center',
              border: '1px solid rgba(76,175,80,0.35)', backgroundColor: 'rgba(76,175,80,0.05)' }}
          >
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#4caf50', lineHeight: 1 }}>{validCount}</Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#4caf50', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Ready
            </Typography>
          </Paper>
          {errorCount > 0 && (
            <Paper
              sx={{ p: 2, flex: 1, borderRadius: 2, textAlign: 'center',
                border: '1px solid rgba(244,67,54,0.35)', backgroundColor: 'rgba(244,67,54,0.05)' }}
            >
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#f44336', lineHeight: 1 }}>{errorCount}</Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#f44336', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Errors
              </Typography>
            </Paper>
          )}
          {warnCount > 0 && (
            <Paper
              sx={{ p: 2, flex: 1, borderRadius: 2, textAlign: 'center',
                border: '1px solid rgba(255,152,0,0.35)', backgroundColor: 'rgba(255,152,0,0.05)' }}
            >
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#ff9800', lineHeight: 1 }}>{warnCount}</Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#ff9800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Warnings
              </Typography>
            </Paper>
          )}
          <Paper
            sx={{ p: 2, flex: 1, borderRadius: 2, textAlign: 'center',
              border: '1px solid rgba(139,108,188,0.35)', backgroundColor: 'rgba(139,108,188,0.05)' }}
          >
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#8b6cbc', lineHeight: 1 }}>{validatedRows.length}</Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#8b6cbc', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total
            </Typography>
          </Paper>
        </Stack>

        {errorCount > 0 && (
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            <strong>{errorCount} row{errorCount !== 1 ? 's' : ''} with errors</strong> will be skipped.
            Only <strong>{validCount}</strong> valid records will be imported.
          </Alert>
        )}

        {importing && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress
              sx={{ borderRadius: 2, height: 8, '& .MuiLinearProgress-bar': { backgroundColor: '#8b6cbc' } }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Importing records — please wait…
            </Typography>
          </Box>
        )}

        {/* Preview table */}
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, maxHeight: 320, overflow: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow
                sx={{ '& .MuiTableCell-stickyHeader': { backgroundColor: 'rgba(139,108,188,0.08)' } }}
              >
                <TableCell sx={{ fontWeight: 700, color: '#8b6cbc', fontSize: '0.72rem', textTransform: 'uppercase', width: 44 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#8b6cbc', fontSize: '0.72rem', textTransform: 'uppercase', width: 96 }}>Status</TableCell>
                {config.fields.filter((f) => mapping[f.key]).map((f) => (
                  <TableCell key={f.key} sx={{ fontWeight: 700, color: '#8b6cbc', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                    {f.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {validatedRows.map((row) => (
                <TableRow
                  key={row.index}
                  sx={{
                    backgroundColor: !row.isValid
                      ? 'rgba(244,67,54,0.04)'
                      : row.warnings.length > 0
                      ? 'rgba(255,152,0,0.04)'
                      : 'transparent',
                    '&:hover': { backgroundColor: 'rgba(139,108,188,0.03)' },
                  }}
                >
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">{row.index + 1}</Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip
                      title={
                        [...row.errors, ...row.warnings].length > 0
                          ? [...row.errors, ...row.warnings].join(' · ')
                          : 'Valid row'
                      }
                      arrow
                    >
                      <Box>
                        {!row.isValid ? (
                          <Chip
                            label={`${row.errors.length} error${row.errors.length !== 1 ? 's' : ''}`}
                            size="small"
                            color="error"
                            sx={{ fontSize: '0.6rem', height: 18 }}
                          />
                        ) : row.warnings.length > 0 ? (
                          <Chip
                            label={`${row.warnings.length} warn`}
                            size="small"
                            color="warning"
                            sx={{ fontSize: '0.6rem', height: 18 }}
                          />
                        ) : (
                          <Chip label="✓ OK" size="small" color="success" sx={{ fontSize: '0.6rem', height: 18 }} />
                        )}
                      </Box>
                    </Tooltip>
                  </TableCell>
                  {config.fields.filter((f) => mapping[f.key]).map((f) => (
                    <TableCell key={f.key}>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          maxWidth: 130,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: '0.75rem',
                        }}
                      >
                        {String(row.mapped[f.key] ?? '')}
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)',
          px: 3,
          pt: 3,
          pb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 36, height: 36,
                borderRadius: 2,
                backgroundColor: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <TableIcon sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', lineHeight: 1.1 }}>
                Spreadsheet Import
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
                Import data from CSV files
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={handleClose}
            size="small"
            sx={{
              color: 'white',
              backgroundColor: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.25)',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.25)' },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {!importResult && (
          <Tabs
            value={importType}
            onChange={handleTypeChange}
            sx={{
              minHeight: 40,
              '& .MuiTabs-indicator': { backgroundColor: 'white', height: 3, borderRadius: '2px 2px 0 0' },
              '& .MuiTab-root': {
                color: 'rgba(255,255,255,0.65)',
                fontWeight: 600,
                fontSize: '0.85rem',
                minHeight: 40,
                py: 0.5,
                '&.Mui-selected': { color: 'white' },
              },
            }}
          >
            <Tab
              value="donations"
              label="Donations"
              icon={<DonationIcon sx={{ fontSize: 16 }} />}
              iconPosition="start"
            />
            {!campaignContext && (
              <Tab
                value="campaigns"
                label="Campaigns"
                icon={<CampaignIcon sx={{ fontSize: 16 }} />}
                iconPosition="start"
              />
            )}
          </Tabs>
        )}
      </Box>

      {/* Stepper */}
      <Box
        sx={{
          px: 3,
          py: 2,
          borderBottom: '1px solid rgba(0,0,0,0.07)',
          backgroundColor: 'rgba(139,108,188,0.02)',
        }}
      >
        <Stepper
          activeStep={importResult ? 3 : step}
          sx={{
            '& .MuiStepLabel-label': { fontSize: '0.8rem' },
            '& .MuiStepIcon-root.Mui-active': { color: '#8b6cbc' },
            '& .MuiStepIcon-root.Mui-completed': { color: '#4caf50' },
          }}
        >
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Content */}
      <DialogContent sx={{ px: 3, py: 3, minHeight: 360 }}>
        {step === 0 && renderUpload()}
        {step === 1 && renderMapping()}
        {step === 2 && renderPreviewAndImport()}
      </DialogContent>

      {/* Actions */}
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: '1px solid rgba(0,0,0,0.07)',
          backgroundColor: 'rgba(0,0,0,0.015)',
          gap: 1,
        }}
      >
        {importResult ? (
          <>
            <Button
              onClick={reset}
              startIcon={<ResetIcon />}
              variant="outlined"
              sx={{ borderColor: '#8b6cbc', color: '#8b6cbc', fontWeight: 600, borderRadius: 2 }}
            >
              Import More
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button
              onClick={handleClose}
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 100%)',
                fontWeight: 600, borderRadius: 2,
              }}
            >
              Done
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleClose} sx={{ color: 'text.secondary', fontWeight: 500 }}>
              Cancel
            </Button>
            <Box sx={{ flex: 1 }} />
            {step > 0 && (
              <Button
                startIcon={<BackIcon />}
                onClick={() => setStep((s) => s - 1)}
                variant="outlined"
                sx={{ borderColor: 'rgba(0,0,0,0.2)', color: 'text.primary', fontWeight: 600, borderRadius: 2 }}
              >
                Back
              </Button>
            )}
            {step === 1 && (
              <Button
                endIcon={<NextIcon />}
                variant="contained"
                onClick={handleValidate}
                disabled={requiredUnmapped.length > 0}
                sx={{
                  background: 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 100%)',
                  fontWeight: 600, borderRadius: 2,
                  '&:disabled': { background: '#e0e0e0', color: '#aaa' },
                }}
              >
                Validate Data
              </Button>
            )}
            {step === 2 && !importResult && (
              <Button
                variant="contained"
                onClick={handleImport}
                disabled={importing || validCount === 0}
                startIcon={
                  importing
                    ? <CircularProgress size={16} color="inherit" />
                    : <CheckIcon />
                }
                sx={{
                  background: validCount > 0
                    ? 'linear-gradient(135deg, #43a047 0%, #66bb6a 100%)'
                    : undefined,
                  fontWeight: 600, borderRadius: 2,
                  '&:disabled': { background: '#e0e0e0', color: '#aaa' },
                }}
              >
                {importing
                  ? 'Importing…'
                  : `Import ${validCount} Record${validCount !== 1 ? 's' : ''}`}
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
