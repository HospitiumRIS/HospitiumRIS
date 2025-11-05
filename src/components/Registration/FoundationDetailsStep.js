import React from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  AccountBalance as FoundationIcon,
  Public as PublicIcon,
  Category as CategoryIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material/styles';

const FoundationDetailsStep = ({ formData, onInputChange, errors }) => {
  const theme = useTheme();

  // Foundation types
  const foundationTypes = [
    'Private Foundation',
    'Public Foundation', 
    'Corporate Foundation',
    'Family Foundation',
    'Community Foundation',
    'Other'
  ];

  // Full list of countries (same as InstitutionDetailsStep)
  const countries = [
    { code: 'AF', name: 'Afghanistan' },
    { code: 'AL', name: 'Albania' },
    { code: 'DZ', name: 'Algeria' },
    { code: 'AD', name: 'Andorra' },
    { code: 'AO', name: 'Angola' },
    { code: 'AG', name: 'Antigua and Barbuda' },
    { code: 'AR', name: 'Argentina' },
    { code: 'AM', name: 'Armenia' },
    { code: 'AU', name: 'Australia' },
    { code: 'AT', name: 'Austria' },
    { code: 'AZ', name: 'Azerbaijan' },
    { code: 'BS', name: 'Bahamas' },
    { code: 'BH', name: 'Bahrain' },
    { code: 'BD', name: 'Bangladesh' },
    { code: 'BB', name: 'Barbados' },
    { code: 'BY', name: 'Belarus' },
    { code: 'BE', name: 'Belgium' },
    { code: 'BZ', name: 'Belize' },
    { code: 'BJ', name: 'Benin' },
    { code: 'BT', name: 'Bhutan' },
    { code: 'BO', name: 'Bolivia' },
    { code: 'BA', name: 'Bosnia and Herzegovina' },
    { code: 'BW', name: 'Botswana' },
    { code: 'BR', name: 'Brazil' },
    { code: 'BN', name: 'Brunei' },
    { code: 'BG', name: 'Bulgaria' },
    { code: 'BF', name: 'Burkina Faso' },
    { code: 'BI', name: 'Burundi' },
    { code: 'CV', name: 'Cabo Verde' },
    { code: 'KH', name: 'Cambodia' },
    { code: 'CM', name: 'Cameroon' },
    { code: 'CA', name: 'Canada' },
    { code: 'CF', name: 'Central African Republic' },
    { code: 'TD', name: 'Chad' },
    { code: 'CL', name: 'Chile' },
    { code: 'CN', name: 'China' },
    { code: 'CO', name: 'Colombia' },
    { code: 'KM', name: 'Comoros' },
    { code: 'CG', name: 'Congo' },
    { code: 'CR', name: 'Costa Rica' },
    { code: 'HR', name: 'Croatia' },
    { code: 'CU', name: 'Cuba' },
    { code: 'CY', name: 'Cyprus' },
    { code: 'CZ', name: 'Czech Republic' },
    { code: 'CD', name: 'Democratic Republic of the Congo' },
    { code: 'DK', name: 'Denmark' },
    { code: 'DJ', name: 'Djibouti' },
    { code: 'DM', name: 'Dominica' },
    { code: 'DO', name: 'Dominican Republic' },
    { code: 'EC', name: 'Ecuador' },
    { code: 'EG', name: 'Egypt' },
    { code: 'SV', name: 'El Salvador' },
    { code: 'GQ', name: 'Equatorial Guinea' },
    { code: 'ER', name: 'Eritrea' },
    { code: 'EE', name: 'Estonia' },
    { code: 'SZ', name: 'Eswatini' },
    { code: 'ET', name: 'Ethiopia' },
    { code: 'FJ', name: 'Fiji' },
    { code: 'FI', name: 'Finland' },
    { code: 'FR', name: 'France' },
    { code: 'GA', name: 'Gabon' },
    { code: 'GM', name: 'Gambia' },
    { code: 'GE', name: 'Georgia' },
    { code: 'DE', name: 'Germany' },
    { code: 'GH', name: 'Ghana' },
    { code: 'GR', name: 'Greece' },
    { code: 'GD', name: 'Grenada' },
    { code: 'GT', name: 'Guatemala' },
    { code: 'GN', name: 'Guinea' },
    { code: 'GW', name: 'Guinea-Bissau' },
    { code: 'GY', name: 'Guyana' },
    { code: 'HT', name: 'Haiti' },
    { code: 'HN', name: 'Honduras' },
    { code: 'HU', name: 'Hungary' },
    { code: 'IS', name: 'Iceland' },
    { code: 'IN', name: 'India' },
    { code: 'ID', name: 'Indonesia' },
    { code: 'IR', name: 'Iran' },
    { code: 'IQ', name: 'Iraq' },
    { code: 'IE', name: 'Ireland' },
    { code: 'IL', name: 'Israel' },
    { code: 'IT', name: 'Italy' },
    { code: 'JM', name: 'Jamaica' },
    { code: 'JP', name: 'Japan' },
    { code: 'JO', name: 'Jordan' },
    { code: 'KZ', name: 'Kazakhstan' },
    { code: 'KE', name: 'Kenya' },
    { code: 'KI', name: 'Kiribati' },
    { code: 'KW', name: 'Kuwait' },
    { code: 'KG', name: 'Kyrgyzstan' },
    { code: 'LA', name: 'Laos' },
    { code: 'LV', name: 'Latvia' },
    { code: 'LB', name: 'Lebanon' },
    { code: 'LS', name: 'Lesotho' },
    { code: 'LR', name: 'Liberia' },
    { code: 'LY', name: 'Libya' },
    { code: 'LI', name: 'Liechtenstein' },
    { code: 'LT', name: 'Lithuania' },
    { code: 'LU', name: 'Luxembourg' },
    { code: 'MG', name: 'Madagascar' },
    { code: 'MW', name: 'Malawi' },
    { code: 'MY', name: 'Malaysia' },
    { code: 'MV', name: 'Maldives' },
    { code: 'ML', name: 'Mali' },
    { code: 'MT', name: 'Malta' },
    { code: 'MH', name: 'Marshall Islands' },
    { code: 'MR', name: 'Mauritania' },
    { code: 'MU', name: 'Mauritius' },
    { code: 'MX', name: 'Mexico' },
    { code: 'FM', name: 'Micronesia' },
    { code: 'MD', name: 'Moldova' },
    { code: 'MC', name: 'Monaco' },
    { code: 'MN', name: 'Mongolia' },
    { code: 'ME', name: 'Montenegro' },
    { code: 'MA', name: 'Morocco' },
    { code: 'MZ', name: 'Mozambique' },
    { code: 'MM', name: 'Myanmar' },
    { code: 'NA', name: 'Namibia' },
    { code: 'NR', name: 'Nauru' },
    { code: 'NP', name: 'Nepal' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'NI', name: 'Nicaragua' },
    { code: 'NE', name: 'Niger' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'KP', name: 'North Korea' },
    { code: 'MK', name: 'North Macedonia' },
    { code: 'NO', name: 'Norway' },
    { code: 'OM', name: 'Oman' },
    { code: 'PK', name: 'Pakistan' },
    { code: 'PW', name: 'Palau' },
    { code: 'PS', name: 'Palestine' },
    { code: 'PA', name: 'Panama' },
    { code: 'PG', name: 'Papua New Guinea' },
    { code: 'PY', name: 'Paraguay' },
    { code: 'PE', name: 'Peru' },
    { code: 'PH', name: 'Philippines' },
    { code: 'PL', name: 'Poland' },
    { code: 'PT', name: 'Portugal' },
    { code: 'QA', name: 'Qatar' },
    { code: 'RO', name: 'Romania' },
    { code: 'RU', name: 'Russia' },
    { code: 'RW', name: 'Rwanda' },
    { code: 'KN', name: 'Saint Kitts and Nevis' },
    { code: 'LC', name: 'Saint Lucia' },
    { code: 'VC', name: 'Saint Vincent and the Grenadines' },
    { code: 'WS', name: 'Samoa' },
    { code: 'SM', name: 'San Marino' },
    { code: 'ST', name: 'Sao Tome and Principe' },
    { code: 'SA', name: 'Saudi Arabia' },
    { code: 'SN', name: 'Senegal' },
    { code: 'RS', name: 'Serbia' },
    { code: 'SC', name: 'Seychelles' },
    { code: 'SL', name: 'Sierra Leone' },
    { code: 'SG', name: 'Singapore' },
    { code: 'SK', name: 'Slovakia' },
    { code: 'SI', name: 'Slovenia' },
    { code: 'SB', name: 'Solomon Islands' },
    { code: 'SO', name: 'Somalia' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'KR', name: 'South Korea' },
    { code: 'SS', name: 'South Sudan' },
    { code: 'ES', name: 'Spain' },
    { code: 'LK', name: 'Sri Lanka' },
    { code: 'SD', name: 'Sudan' },
    { code: 'SR', name: 'Suriname' },
    { code: 'SE', name: 'Sweden' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'SY', name: 'Syria' },
    { code: 'TW', name: 'Taiwan' },
    { code: 'TJ', name: 'Tajikistan' },
    { code: 'TZ', name: 'Tanzania' },
    { code: 'TH', name: 'Thailand' },
    { code: 'TL', name: 'Timor-Leste' },
    { code: 'TG', name: 'Togo' },
    { code: 'TO', name: 'Tonga' },
    { code: 'TT', name: 'Trinidad and Tobago' },
    { code: 'TN', name: 'Tunisia' },
    { code: 'TR', name: 'Turkey' },
    { code: 'TM', name: 'Turkmenistan' },
    { code: 'TV', name: 'Tuvalu' },
    { code: 'UG', name: 'Uganda' },
    { code: 'UA', name: 'Ukraine' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'US', name: 'United States' },
    { code: 'UY', name: 'Uruguay' },
    { code: 'UZ', name: 'Uzbekistan' },
    { code: 'VU', name: 'Vanuatu' },
    { code: 'VA', name: 'Vatican City' },
    { code: 'VE', name: 'Venezuela' },
    { code: 'VN', name: 'Vietnam' },
    { code: 'YE', name: 'Yemen' },
    { code: 'ZM', name: 'Zambia' },
    { code: 'ZW', name: 'Zimbabwe' }
  ];

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

  const SectionHeader = ({ icon, title, subtitle }) => (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1.5,
      mb: 3,
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

  return (
    <Box sx={{ width: '100%', mt: 1 }}>
      <SectionHeader 
        icon={<FoundationIcon />}
        title="Foundation Details"
        subtitle="Please provide information about your foundation."
      />
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Institution Name - Full Width (Primary) */}
        <TextField
          fullWidth
          label="Institution Name"
          name="institutionName"
          value={formData.institutionName || ''}
          onChange={onInputChange}
          error={!!errors.institutionName}
          helperText={errors.institutionName}
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

        {/* Foundation Name - Full Width */}
          <TextField
            fullWidth
            label="Foundation Name"
            name="foundationName"
            value={formData.foundationName || ''}
            onChange={onInputChange}
            error={!!errors.foundationName}
            helperText={errors.foundationName}
            size="small"
          sx={fieldStyle}
          InputProps={{
            startAdornment: (
              <FoundationIcon sx={{ 
                color: alpha(theme.palette.text.secondary, 0.6),
                fontSize: 18,
                mr: 1,
              }} />
            ),
          }}
        />

        {/* Foundation Type and Country - Same Row 50% Each */}
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
          <Box sx={{ width: '50%' }}>
            <FormControl 
              fullWidth 
              error={!!errors.foundationType} 
              size="small"
              sx={fieldStyle}
            >
              <InputLabel sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 1,
              }}>
                <CategoryIcon sx={{ fontSize: 16 }} />
                Foundation Type
              </InputLabel>
            <Select
              name="foundationType"
              value={formData.foundationType || ''}
              onChange={onInputChange}
              label="Foundation Type"
                startAdornment={
                  <CategoryIcon sx={{ 
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
                {foundationTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
            </Select>
              {errors.foundationType && (
                <Typography variant="caption" color="error" sx={{ 
                  ml: 2, 
                  mt: 0.5, 
                  display: 'block',
                  fontWeight: 500,
                }}>
                  {errors.foundationType}
                </Typography>
              )}
          </FormControl>
          </Box>
          <Box sx={{ width: '50%' }}>
            <FormControl 
            fullWidth
              error={!!errors.foundationCountry} 
              size="small"
              sx={fieldStyle}
            >
              <InputLabel sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 1,
              }}>
                <PublicIcon sx={{ fontSize: 16 }} />
                Country
              </InputLabel>
              <Select
            name="foundationCountry"
            value={formData.foundationCountry || ''}
            onChange={onInputChange}
                label="Country"
                startAdornment={
                  <PublicIcon sx={{ 
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
                {countries.map((country) => (
                  <MenuItem key={country.code} value={country.name}>
                    {country.name}
                  </MenuItem>
                ))}
            </Select>
              {errors.foundationCountry && (
                <Typography variant="caption" color="error" sx={{ 
                  ml: 2, 
                  mt: 0.5, 
                  display: 'block',
                  fontWeight: 500,
                }}>
                  {errors.foundationCountry}
                </Typography>
              )}
          </FormControl>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default FoundationDetailsStep; 