'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { CloudUpload as UploadIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import FileUploadZone from '../common/FileUploadZone';

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

export default function UploadCertificateDialog({ open, onClose, onUploaded, user }) {
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
      principalInvestigator: defaultInvestigator,
    });
    setFiles([]);
    setError('');
    setSubmitting(false);
  }, [open, defaultInvestigator]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
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
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        {t('researcher.ethics_upload_certificate', 'Upload Existing Certificate')}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          {t(
            'researcher.ethics_upload_certificate_help',
            'Already have ethics clearance from an IRB or ethics committee? Upload the certificate to keep it on file and link it to proposals.'
          )}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          label={t('researcher.ethics_cert_study_title', 'Study title')}
          value={form.title}
          onChange={handleChange('title')}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label={t('researcher.principal_investigator', 'Principal Investigator')}
          value={form.principalInvestigator}
          onChange={handleChange('principalInvestigator')}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <TextField
            label={t('common.department', 'Department')}
            value={form.department}
            onChange={handleChange('department')}
            sx={{ flex: '1 1 180px' }}
          />
          <TextField
            select
            label={t('common.type', 'Type')}
            value={form.researchType}
            onChange={handleChange('researchType')}
            sx={{ flex: '1 1 180px' }}
          >
            <MenuItem value="">
              {t('common.select', 'Select')}
            </MenuItem>
            {RESEARCH_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        <TextField
          label={t('researcher.ethics_cert_committee', 'Issuing ethics committee / IRB')}
          value={form.committeeName}
          onChange={handleChange('committeeName')}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label={t('researcher.ethics_cert_reference', 'Certificate / protocol reference number')}
          value={form.referenceNumber}
          onChange={handleChange('referenceNumber')}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1 }}>
          <TextField
            label={t('researcher.ethics_cert_approval_date', 'Approval date')}
            type="date"
            value={form.approvalDate}
            onChange={handleChange('approvalDate')}
            required
            InputLabelProps={{ shrink: true }}
            sx={{ flex: '1 1 180px' }}
          />
          <TextField
            label={t('researcher.ethics_cert_expiry_date', 'Expiry date')}
            type="date"
            value={form.expiryDate}
            onChange={handleChange('expiryDate')}
            InputLabelProps={{ shrink: true }}
            sx={{ flex: '1 1 180px' }}
          />
        </Box>

        <FileUploadZone
          label={t('researcher.ethics_cert_file', 'Ethics clearance certificate')}
          description={t(
            'researcher.ethics_cert_file_help',
            'PDF or image of the signed clearance certificate'
          )}
          acceptedTypes=".pdf,.png,.jpg,.jpeg,.webp"
          maxSize={15 * 1024 * 1024}
          files={files}
          onChange={setFiles}
          required
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={submitting} sx={{ color: '#718096' }}>
          {t('common.cancel', 'Cancel')}
        </Button>
        <Button
          variant="contained"
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <UploadIcon />}
          onClick={handleSubmit}
          disabled={submitting}
          sx={{ bgcolor: '#8b6cbc', '&:hover': { bgcolor: '#7a5caa' } }}
        >
          {submitting
            ? t('common.uploading', 'Uploading...')
            : t('researcher.ethics_upload_certificate', 'Upload Existing Certificate')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
