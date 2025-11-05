import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Divider,
  Chip,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  Badge as BadgeIcon,
} from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material/styles';

const AccountDetailsStep = ({ 
  formData, 
  onInputChange, 
  errors, 
  accountType,
  monthOptions = [],
  yearOptions = []
}) => {
  const theme = useTheme();

  const fieldStyle = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      backgroundColor: theme.palette.mode === 'dark' 
        ? alpha(theme.palette.background.paper, 0.7)
        : alpha(theme.palette.primary.main, 0.02),
      border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        backgroundColor: theme.palette.mode === 'dark' 
          ? alpha(theme.palette.background.paper, 0.9)
          : alpha(theme.palette.primary.main, 0.04),
        borderColor: alpha(theme.palette.primary.main, 0.3),
        transform: 'translateY(-1px)',
        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
      },
      '&.Mui-focused': {
        backgroundColor: theme.palette.background.paper,
        borderColor: theme.palette.primary.main,
        borderWidth: '2px',
        boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.12)}`,
        transform: 'translateY(-2px)',
      },
      '&.Mui-error': {
        borderColor: theme.palette.error.main,
        '&:hover': {
          borderColor: theme.palette.error.dark,
        },
      },
    },
    '& .MuiInputLabel-root': {
      fontWeight: 500,
      color: theme.palette.text.secondary,
      '&.Mui-focused': {
        color: theme.palette.primary.main,
        fontWeight: 600,
      },
    },
  };

  const orcidFieldStyle = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      backgroundColor: formData.orcidId 
        ? (theme.palette.mode === 'dark' 
          ? alpha(theme.palette.success.main, 0.15)
          : alpha(theme.palette.success.main, 0.08))
        : (theme.palette.mode === 'dark' 
          ? alpha(theme.palette.background.paper, 0.7)
          : alpha(theme.palette.primary.main, 0.02)),
      border: formData.orcidId 
        ? `2px solid ${alpha(theme.palette.success.main, 0.4)}`
        : `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        backgroundColor: formData.orcidId 
          ? (theme.palette.mode === 'dark' 
            ? alpha(theme.palette.success.main, 0.2)
            : alpha(theme.palette.success.main, 0.12))
          : (theme.palette.mode === 'dark' 
            ? alpha(theme.palette.background.paper, 0.9)
            : alpha(theme.palette.primary.main, 0.04)),
        borderColor: formData.orcidId 
          ? alpha(theme.palette.success.main, 0.6)
          : alpha(theme.palette.primary.main, 0.3),
        transform: 'translateY(-1px)',
        boxShadow: formData.orcidId
          ? `0 4px 12px ${alpha(theme.palette.success.main, 0.25)}`
          : `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
      },
      '&.Mui-focused': {
        backgroundColor: theme.palette.background.paper,
        borderColor: formData.orcidId 
          ? theme.palette.success.main
          : theme.palette.primary.main,
        borderWidth: '2px',
        boxShadow: formData.orcidId 
          ? `0 0 0 4px ${alpha(theme.palette.success.main, 0.12)}`
          : `0 0 0 4px ${alpha(theme.palette.primary.main, 0.12)}`,
        transform: 'translateY(-2px)',
      },
    },
    '& .MuiInputBase-input': {
      fontWeight: formData.orcidId ? 600 : 400,
      fontFamily: formData.orcidId ? 'monospace' : 'inherit',
    },
    '& .MuiInputLabel-root': {
      fontWeight: 500,
      color: formData.orcidId 
        ? theme.palette.success.main
        : theme.palette.text.secondary,
      '&.Mui-focused': {
        color: formData.orcidId 
          ? theme.palette.success.main
          : theme.palette.primary.main,
        fontWeight: 600,
      },
    },
  };

  const SectionHeader = ({ icon, title, subtitle }) => (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1.5,
      mb: 2,
      p: 2,
      borderRadius: 2,
      backgroundColor: alpha(theme.palette.primary.main, 0.04),
      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
    }}>
      <Box sx={{ 
        p: 1,
        borderRadius: 1.5,
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        color: theme.palette.primary.main,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="h6" sx={{ 
          fontSize: '1.1rem', 
          fontWeight: 600,
          color: theme.palette.text.primary,
          mb: 0.5,
        }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ 
          fontSize: '0.85rem',
          color: theme.palette.text.secondary,
          fontWeight: 400,
        }}>
          {subtitle}
        </Typography>
      </Box>
    </Box>
  );

  if (accountType === 'RESEARCHER' || accountType === 'RESEARCH_ADMIN' || accountType === 'FOUNDATION_ADMIN') {
    return (
      <Box sx={{ width: '100%', mt: 1 }}>
        <SectionHeader 
          icon={<PersonIcon />}
          title="Account Details"
          subtitle="Please provide your personal information and research details."
        />
        
        <Grid container spacing={3} sx={{ mt: 2, flexDirection: 'column' }}>
          {/* Personal Information Section */}
          <Grid size={12}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              mb: 2,
            }}>
              <PersonIcon sx={{ 
                color: theme.palette.primary.main, 
                fontSize: 20 
              }} />
              <Typography variant="subtitle1" sx={{ 
                fontWeight: 600,
                color: theme.palette.text.primary,
              }}>
                Personal Information
              </Typography>
            </Box>
          </Grid>

          {/* Given Name and Family Name - Same Row 50% Each */}
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>

        <Box sx={{ width: '50%' }}>
            <TextField
              fullWidth
              label="Given Name"
              name="givenName"
              value={formData.givenName || ''}
              onChange={onInputChange}
              error={!!errors.givenName}
              helperText={errors.givenName}
              size="small"
              sx={fieldStyle}
              InputProps={{
                startAdornment: (
                  <PersonIcon sx={{ 
                    color: alpha(theme.palette.text.secondary, 0.6),
                    fontSize: 18,
                    mr: 1,
                  }} />
                ),
              }}
            />
          </Box>
          <Box sx={{ width: '50%' }}>
            <TextField
              fullWidth
              label="Family Name"
              name="familyName"
              value={formData.familyName || ''}
              onChange={onInputChange}
              error={!!errors.familyName}
              helperText={errors.familyName}
              size="small"
              sx={fieldStyle}
              InputProps={{
                startAdornment: (
                  <PersonIcon sx={{ 
                    color: alpha(theme.palette.text.secondary, 0.6),
                    fontSize: 18,
                    mr: 1,
                  }} />
                ),
              }}
            />
          </Box>
        </Box>



          {/* Email - Full Width */}
          <Grid size={12}>
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email || ''}
              onChange={onInputChange}
              error={!!errors.email}
              helperText={errors.email}
              size="small"
              sx={fieldStyle}
              InputProps={{
                startAdornment: (
                  <EmailIcon sx={{ 
                    color: alpha(theme.palette.text.secondary, 0.6),
                    fontSize: 18,
                    mr: 1,
                  }} />
                ),
              }}
            />
          </Grid>

          {/* ORCID ID - Full Width */}
          <Grid size={12}>
            <Box sx={{ position: 'relative' }}>
              <TextField
                fullWidth
                label="ORCID ID"
                name="orcidId"
                value={formData.orcidId || ''}
                onChange={onInputChange}
                size="small"
                InputProps={{
                  readOnly: !!formData.orcidId,
                  startAdornment: (
                    <BadgeIcon sx={{ 
                      color: formData.orcidId 
                        ? theme.palette.success.main
                        : alpha(theme.palette.text.secondary, 0.6),
                      fontSize: 18,
                      mr: 1,
                    }} />
                  ),
                }}
                sx={orcidFieldStyle}
              />
              {formData.orcidId && (
                <Chip
                  label="Verified"
                  size="small"
                  color="success"
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: -8,
                    fontSize: '0.7rem',
                    height: 20,
                    fontWeight: 600,
                  }}
                />
              )}
            </Box>
          </Grid>

          {/* Divider */}
          <Grid size={12}>
            <Divider sx={{ 
              my: 1,
              borderColor: alpha(theme.palette.primary.main, 0.1),
            }} />
          </Grid>

          {/* Primary Affiliation Section */}
          <Grid size={12}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              mb: 2,
            }}>
              <BusinessIcon sx={{ 
                color: theme.palette.primary.main, 
                fontSize: 20 
              }} />
              <Typography variant="subtitle1" sx={{ 
                fontWeight: 600,
                color: theme.palette.text.primary,
              }}>
                Primary Affiliation
              </Typography>
            </Box>
          </Grid>

          {/* Primary Institution - Full Width */}
          <Box sx={{ width: '100%' }}>
            <TextField
              fullWidth
              label="Primary Institution"
              name="primaryInstitution"
              value={formData.primaryInstitution || ''}
              onChange={onInputChange}
              error={!!errors.primaryInstitution}
              helperText={errors.primaryInstitution}
              size="small"
              sx={fieldStyle}
              InputProps={{
                startAdornment: (
                  <BusinessIcon sx={{ 
                    color: alpha(theme.palette.text.secondary, 0.6),
                    fontSize: 18,
                    mr: 1,
                  }} />
                ),
              }}
            />
          </Box>

          {/* Start Month and Start Year - Same Row 50% Each */}
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
          <Box sx={{ width: '50%' }}>
            <FormControl 
              fullWidth 
              error={!!errors.startMonth} 
              size="small"
              sx={fieldStyle}
            >
              <InputLabel sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 1,
              }}>
                <CalendarIcon sx={{ fontSize: 16 }} />
                Start Month
              </InputLabel>
              <Select
                name="startMonth"
                value={formData.startMonth || ''}
                onChange={onInputChange}
                label="Start Month"
                startAdornment={
                  <CalendarIcon sx={{ 
                    color: alpha(theme.palette.text.secondary, 0.6),
                    fontSize: 18,
                    ml: 1,
                  }} />
                }
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 200,
                      marginTop: 4,
                    },
                  },
                  anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'left',
                  },
                  transformOrigin: {
                    vertical: 'top',
                    horizontal: 'left',
                  },
                  disableScrollLock: true,
                }}
              >
                {monthOptions.map((month) => (
                  <MenuItem key={month.value} value={month.value}>
                    {month.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.startMonth && (
                <Typography variant="caption" color="error" sx={{ 
                  ml: 2, 
                  mt: 0.5, 
                  display: 'block',
                  fontWeight: 500,
                }}>
                  {errors.startMonth}
                </Typography>
              )}
            </FormControl>
          </Box>
          <Box sx={{ width: '50%' }}>
            <FormControl 
              fullWidth 
              error={!!errors.startYear} 
              size="small"
              sx={fieldStyle}
            >
              <InputLabel sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 1,
              }}>
                <CalendarIcon sx={{ fontSize: 16 }} />
                Start Year
              </InputLabel>
              <Select
                name="startYear"
                value={formData.startYear || ''}
                onChange={onInputChange}
                label="Start Year"
                startAdornment={
                  <CalendarIcon sx={{ 
                    color: alpha(theme.palette.text.secondary, 0.6),
                    fontSize: 18,
                    ml: 1,
                  }} />
                }
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 200,
                      marginTop: 4,
                    },
                  },
                  anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'left',
                  },
                  transformOrigin: {
                    vertical: 'top',
                    horizontal: 'left',
                  },
                  disableScrollLock: true,
                }}
              >
                {yearOptions.map((year) => (
                  <MenuItem key={year.value} value={year.value}>
                    {year.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.startYear && (
                <Typography variant="caption" color="error" sx={{ 
                  ml: 2, 
                  mt: 0.5, 
                  display: 'block',
                  fontWeight: 500,
                }}>
                  {errors.startYear}
                </Typography>
              )}
            </FormControl>
          </Box>
          </Box>
        </Grid>
      </Box>
    );
  }
};

export default AccountDetailsStep; 