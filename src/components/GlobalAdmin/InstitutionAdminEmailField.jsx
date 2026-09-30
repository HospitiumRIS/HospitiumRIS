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
  ...textFieldProps
}) {
  const [showDomainPicker, setShowDomainPicker] = useState(false);

  const institutionDomains = useMemo(
    () => collectInstitutionEmailDomains(institution, suggestedDomains),
    [institution, suggestedDomains],
  );

  const matchingDomains = useMemo(() => {
    const { domainPart } = splitEmail(value);
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
    if (!localPart || domainPart == null) {
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

  const helperText = institutionDomains.length
    ? `Institution domains: ${institutionDomains.join(', ')}`
    : 'Add verified domains to enable domain suggestions';

  return (
    <Box>
      <TextField
        fullWidth
        required
        type="email"
        label="Admin email"
        name="email"
        autoComplete="off"
        value={value}
        onChange={handleChange}
        helperText={helperText}
        {...textFieldProps}
      />
      {showDomainPicker && matchingDomains.length > 0 && (
        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Select domain:
          </Typography>
          {matchingDomains.map((domain) => (
            <Chip
              key={domain}
              label={domain}
              size="small"
              color="primary"
              variant="outlined"
              clickable
              onClick={() => applyDomain(domain)}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}
