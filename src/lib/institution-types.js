export const INSTITUTION_TYPES = [
  { value: 'UNIVERSITY', label: 'University' },
  { value: 'RESEARCH_INSTITUTE', label: 'Research Institute' },
  { value: 'HOSPITAL', label: 'Hospital' },
  { value: 'GOVERNMENT', label: 'Government Agency' },
  { value: 'PRIVATE', label: 'Private Organization' },
  { value: 'NON_PROFIT', label: 'Non-Profit Organization' },
  { value: 'OTHER', label: 'Other' },
];

export const INSTITUTION_TYPE_VALUES = INSTITUTION_TYPES.map((type) => type.value);
