'use client';

import React, { useMemo, useState } from 'react';
import { Box, Chip, Stack, TextField, Typography } from '@mui/material';
import { collectInstitutionEmailDomains } from '../../lib/institution-domain';

function splitEmail(value) {
  const atIndex = value.lastIndexOf('@');
  if (atIndex < 0) {
    return { localPart: value, domainPart: null };
  }
  return {
    localPart: value.slice(0, atIndex),
    domainPart: value.slice(atIndex + 1),
  };
}

export default function InstitutionAdminEmailField({
  value,
  onChange,
  institution,
  suggestedDomains = [],
  onErrorClear,
  helperText: helperTextProp,
  onBlur: onBlurProp,
  ...textFieldProps
}) {
  const [showDomainPicker, setShowDomainPicker] = useState(false);

  const institutionDomains = useMemo(
    () => collectInstitutionEmailDomains(institution, suggestedDomains),
    [institution, suggestedDomains],
  );

  const matchingDomains = useMemo(() => {
    const { localPart, domainPart } = splitEmail(value);
    if (!localPart) return [];
    if (domainPart == null) return institutionDomains;
    const query = domainPart.toLowerCase();
    return institutionDomains.filter((domain) => domain.startsWith(query));
  }, [value, institutionDomains]);

  const applyDomain = (domain, emailValue = value) => {
    const { localPart } = splitEmail(emailValue);
    if (!localPart) return;
    onChange(`${localPart}@${domain}`);
    setShowDomainPicker(false);
    onErrorClear?.();
  };

  const handleChange = (event) => {
    const nextValue = event.target.value;
    onErrorClear?.();

    const { localPart, domainPart } = splitEmail(nextValue);

    if (!nextValue.includes('@')) {
      onChange(nextValue);
      setShowDomainPicker(Boolean(localPart?.trim()) && institutionDomains.length > 0);
      return;
    }

    if (!localPart) {
      onChange(nextValue);
      setShowDomainPicker(false);
      return;
    }

    if (domainPart === '') {
      if (institutionDomains.length === 1) {
        applyDomain(institutionDomains[0], nextValue);
        return;
      }
      onChange(nextValue);
      setShowDomainPicker(institutionDomains.length > 1);
      return;
    }

    setShowDomainPicker(false);
    onChange(nextValue);

    const exactMatch = institutionDomains.find((domain) => domain === domainPart.toLowerCase());
    if (exactMatch && domainPart !== exactMatch) {
      onChange(`${localPart}@${exactMatch}`);
    }
  };

  const handleBlur = (event) => {
    const { localPart } = splitEmail(value);
    if (localPart?.trim() && !value.includes('@') && institutionDomains.length === 1) {
      applyDomain(institutionDomains[0], value);
    }
    onBlurProp?.(event);
  };

  const defaultHelperText = institutionDomains.length
    ? institutionDomains.length === 1
      ? `Domain will autocomplete to @${institutionDomains[0]}`
      : `Select a domain: ${institutionDomains.join(', ')}`
    : 'Add verified domains to enable domain suggestions';

  const helperText = helperTextProp ?? defaultHelperText;

  return (
    <Box>
      <TextField
        fullWidth
        required
        type="email"
        label="Admin email"
        name="institution-admin-email"
        autoComplete="off"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        helperText={helperText}
        {...textFieldProps}
      />
      {showDomainPicker && matchingDomains.length > 0 && (
        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {value.includes('@') ? 'Select domain:' : 'Complete email:'}
          </Typography>
          {matchingDomains.map((domain) => {
            const { localPart } = splitEmail(value);
            const preview = localPart ? `${localPart}@${domain}` : domain;
            return (
              <Chip
                key={domain}
                label={preview}
                size="small"
                variant="outlined"
                clickable
                onClick={() => applyDomain(domain)}
                sx={{
                  fontWeight: 600,
                  borderColor: 'rgba(139, 108, 188, 0.45)',
                  color: '#7a5caa',
                  '&:hover': { bgcolor: 'rgba(139, 108, 188, 0.08)' },
                }}
              />
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
