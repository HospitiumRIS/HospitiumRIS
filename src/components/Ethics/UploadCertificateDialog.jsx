'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { CloudUpload as UploadIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { DEPARTMENTS } from '@/lib/departments';
import FileUploadZone from '../common/FileUploadZone';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
} from '../GlobalAdmin/InstitutionModalShell';

const RESEARCH_TYPES = [
  'Clinical Trial',
  'Observational Study',
  'Survey Research',
  'Interview Study',
  'Laboratory Research',
  'Secondary Data Analysis',
  'Community-Based Research',
  'Other',
];

const EMPTY_FORM = {
  title: '',
  principalInvestigator: '',
  department: '',
  researchType: '',
  committeeName: '',
  referenceNumber: '',
  approvalDate: '',
  expiryDate: '',
};

const fieldSx = { '& .MuiInputBase-root': { borderRadius: 1.5 } };

const selectMenuProps = {
  PaperProps: { sx: { maxHeight: 280 } },
  anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
  transformOrigin: { vertical: 'top', horizontal: 'left' },
};

function SectionLabel({ children }) {
  return (
    <Typography
      variant="caption"
      sx={{
        display: 'block',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: 'text.secondary',
        mb: 1,
      }}
    >
      {children}
    </Typography>
  );
}

export default function UploadCertificateDialog({ open, onClose, onUploaded, user, defaults }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(EMPTY_FORM);
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const defaultInvestigator = useMemo(() => {
    if (!user) return '';
    const name = [user.givenName || user.firstName, user.familyName || user.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();
    return name || user.email || '';
  }, [user]);

  useEffect(() => {
    if (!open) return;
    setForm({
      ...EMPTY_FORM,
      title: defaults?.title || '',
      principalInvestigator: defaults?.principalInvestigator || defaultInvestigator,
      department: defaults?.department || '',
      researchType: defaults?.researchType || '',
      committeeName: defaults?.committeeName || '',
      referenceNumber: defaults?.referenceNumber || '',
      approvalDate: defaults?.approvalDate || '',
      expiryDate: defaults?.expiryDate || '',
    });
    setFiles([]);
    setError('');
    setSubmitting(false);
  }, [open, defaultInvestigator]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.title.trim()) {
      setError(t('researcher.ethics_cert_title_required', 'Study title is required'));
      return;
    }
    if (!form.principalInvestigator.trim()) {
      setError(t('researcher.ethics_cert_pi_required', 'Principal investigator is required'));
      return;
    }
    if (!form.committeeName.trim()) {
      setError(t('researcher.ethics_cert_committee_required', 'Issuing ethics committee is required'));
      return;
    }
    if (!form.referenceNumber.trim()) {
      setError(t('researcher.ethics_cert_ref_required', 'Certificate / protocol reference number is required'));
      return;
    }
    if (!form.approvalDate) {
      setError(t('researcher.ethics_cert_date_required', 'Approval date is required'));
      return;
    }
    if (form.expiryDate && form.expiryDate < form.approvalDate) {
      setError(t('researcher.ethics_cert_expiry_invalid', 'Expiry date must be on or after the approval date'));
      return;
    }
    if (!files[0]) {
      setError(t('researcher.ethics_cert_file_required', 'Please attach the ethics clearance certificate'));
      return;
    }

    try {
      setSubmitting(true);
      const body = new FormData();
      body.append('title', form.title.trim());
      body.append('principalInvestigator', form.principalInvestigator.trim());
      body.append('department', form.department.trim());
      body.append('researchType', form.researchType);
      body.append('committeeName', form.committeeName.trim());
      body.append('referenceNumber', form.referenceNumber.trim());
      body.append('approvalDate', form.approvalDate);
      if (form.expiryDate) body.append('expiryDate', form.expiryDate);
      body.append('certificate', files[0]);

      const response = await fetch('/api/ethics/applications/certificate', {
        method: 'POST',
        body,
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || t('researcher.ethics_cert_upload_failed', 'Failed to upload certificate'));
        return;
      }
      onUploaded?.(data.application);
      onClose?.();
    } catch (err) {
      console.error('Certificate upload failed:', err);
      setError(t('researcher.ethics_cert_upload_failed', 'Failed to upload certificate'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <InstitutionModal
      open={open}
      onClose={() => !submitting && onClose?.()}
      disableClose={submitting}
      maxWidth="sm"
    >
      <InstitutionModalHeader
        icon={UploadIcon}
        title={t('researcher.ethics_upload_certificate', 'Upload Existing Certificate')}
        subtitle={t(
          'researcher.ethics_upload_certificate_help_short',
          'Upload an existing IRB or ethics committee clearance certificate.'
        )}
        onClose={onClose}
        disableClose={submitting}
        dense
      />
      <InstitutionModalBody dense>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mt: -0.5 }}>
          {error && (
            <Alert severity="error" onClose={() => setError('')} sx={{ borderRadius: 1.5, py: 0.25 }}>
              {error}
            </Alert>
          )}

          <SectionLabel>{t('researcher.ethics_cert_study_section', 'Study details')}</SectionLabel>
          <TextField
            label={t('researcher.ethics_cert_study_title', 'Study title')}
            value={form.title}
            onChange={handleChange('title')}
            fullWidth
            required
            size="small"
            sx={fieldSx}
          />
          <TextField
            label={t('researcher.principal_investigator', 'Principal Investigator')}
            value={form.principalInvestigator}
            onChange={handleChange('principalInvestigator')}
            fullWidth
            required
            size="small"
            sx={fieldSx}
          />
          <TextField
            select
            label={t('common.department', 'Department')}
            value={form.department}
            onChange={handleChange('department')}
            fullWidth
            size="small"
            sx={fieldSx}
            SelectProps={{ MenuProps: selectMenuProps }}
          >
            <MenuItem value="">{t('common.select', 'Select')}</MenuItem>
            {DEPARTMENTS.map((dept) => (
              <MenuItem key={dept} value={dept}>
                {dept}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label={t('researcher.ethics_research_type', 'Research type')}
            value={form.researchType}
            onChange={handleChange('researchType')}
            fullWidth
            size="small"
            sx={fieldSx}
            SelectProps={{ MenuProps: selectMenuProps }}
          >
            <MenuItem value="">{t('common.select', 'Select')}</MenuItem>
            {RESEARCH_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>

          <Divider sx={{ my: 0.5 }} />

          <SectionLabel>{t('researcher.ethics_cert_clearance_section', 'Clearance details')}</SectionLabel>
          <TextField
            label={t('researcher.ethics_cert_committee', 'Issuing ethics committee / IRB')}
            value={form.committeeName}
            onChange={handleChange('committeeName')}
            fullWidth
            required
            size="small"
            sx={fieldSx}
          />
          <TextField
            label={t('researcher.ethics_cert_reference', 'Certificate / protocol reference number')}
            value={form.referenceNumber}
            onChange={handleChange('referenceNumber')}
            fullWidth
            required
            size="small"
            sx={fieldSx}
          />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.25 }}>
            <TextField
              label={t('researcher.ethics_cert_approval_date', 'Approval date')}
              type="date"
              value={form.approvalDate}
              onChange={handleChange('approvalDate')}
              required
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={fieldSx}
            />
            <TextField
              label={t('researcher.ethics_cert_expiry_date', 'Expiry date')}
              type="date"
              value={form.expiryDate}
              onChange={handleChange('expiryDate')}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={fieldSx}
            />
          </Box>

          <Divider sx={{ my: 0.5 }} />

          <SectionLabel>{t('researcher.ethics_cert_file_section', 'Certificate file')}</SectionLabel>
          <FileUploadZone
            acceptedTypes=".pdf,.png,.jpg,.jpeg,.webp"
            maxSize={15 * 1024 * 1024}
            files={files}
            onChange={setFiles}
            required
            compact
            dense
          />
        </Box>
      </InstitutionModalBody>
      <InstitutionModalFooter>
        <Button onClick={onClose} disabled={submitting} color="inherit" size="small">
          {t('common.cancel', 'Cancel')}
        </Button>
        <Button
          variant="contained"
          size="small"
          startIcon={submitting ? <CircularProgress size={14} color="inherit" /> : <UploadIcon />}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting
            ? t('common.uploading', 'Uploading...')
            : t('researcher.ethics_upload_certificate', 'Upload Existing Certificate')}
        </Button>
      </InstitutionModalFooter>
    </InstitutionModal>
  );
}
