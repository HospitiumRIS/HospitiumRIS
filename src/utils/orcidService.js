/**
 * ORCID API Service
 * Provides functions to search for researchers using ORCID public API
 */

const ORCID_BASE_URL = 'https://pub.orcid.org/v3.0';
const ORCID_SEARCH_URL = 'https://pub.orcid.org/v3.0/search';

/**
 * Search for researchers by structured criteria or general query
 * @param {Object|string} searchCriteria - Search criteria object or simple string query
 * @param {string} searchCriteria.givenName - Given name (first name)
 * @param {string} searchCriteria.familyName - Family name (last name)
 * @param {string} searchCriteria.affiliation - Optional affiliation/institution
 * @param {string} searchCriteria.orcidId - Optional ORCID ID
 * @param {string} searchCriteria.email - Optional email address
 * @param {number} rows - Number of results to return (max 200)
 * @param {number} start - Starting offset for pagination
 * @returns {Promise<Object>} Search results
 */
export async function searchResearchers(searchCriteria, rows = 20, start = 0) {
  try {
    let query = '';
    
    if (typeof searchCriteria === 'string') {
      // Legacy string search
      query = searchCriteria.trim();
    } else {
      // Structured search
      query = buildStructuredQuery(searchCriteria);
    }

    if (!query || query.length < 2) {
      return { researchers: [], total: 0 };
    }

    // Build search query parameters
    const searchParams = new URLSearchParams({
      q: query,
      rows: Math.min(rows, 200), // ORCID limits to 200
      start: Math.max(start, 0)
    });

    const response = await fetch(`${ORCID_SEARCH_URL}?${searchParams}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Hospitium Research Platform/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`ORCID API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform ORCID search results to our format
    const researchers = data.result?.map(transformSearchResult) || [];
    const total = data['num-found'] || 0;

    return {
      researchers,
      total,
      hasMore: start + rows < total
    };

  } catch (error) {
    console.error('Error searching ORCID:', error);
    return { 
      researchers: [], 
      total: 0, 
      error: error.message 
    };
  }
}

/**
 * Build ORCID search query from structured criteria
 * @param {Object} criteria - Search criteria
 * @returns {string} ORCID query string
 */
function buildStructuredQuery(criteria) {
  const queryParts = [];
  
  // Handle given name
  if (criteria.givenName && criteria.givenName.trim()) {
    queryParts.push(`given-names:${criteria.givenName.trim()}`);
  }
  
  // Handle family name
  if (criteria.familyName && criteria.familyName.trim()) {
    queryParts.push(`family-name:${criteria.familyName.trim()}`);
  }
  
  // Handle affiliation/institution
  if (criteria.affiliation && criteria.affiliation.trim()) {
    queryParts.push(`affiliation-org-name:${criteria.affiliation.trim()}`);
  }
  
  // Handle ORCID ID
  if (criteria.orcidId && criteria.orcidId.trim()) {
    const cleanOrcidId = formatOrcidId(criteria.orcidId.trim());
    queryParts.push(`orcid:${cleanOrcidId}`);
  }
  
  // Handle email
  if (criteria.email && criteria.email.trim()) {
    queryParts.push(`email:${criteria.email.trim()}`);
  }
  
  // If no structured criteria provided, try to extract from a general query
  if (queryParts.length === 0) {
    // Return empty to indicate no valid search criteria
    return '';
  }
  
  // Join query parts with AND
  return queryParts.join(' AND ');
}

/**
 * Get detailed researcher information by ORCID ID
 * @param {string} orcidId - ORCID ID (e.g., "0000-0000-0000-0000")
 * @returns {Promise<Object>} Researcher details
 */
export async function getResearcherDetails(orcidId) {
  try {
    if (!orcidId || !isValidOrcidId(orcidId)) {
      throw new Error('Invalid ORCID ID format');
    }

    const response = await fetch(`${ORCID_BASE_URL}/${orcidId}/record`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Hospitium Research Platform/1.0'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Researcher not found');
      }
      throw new Error(`ORCID API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return transformDetailedRecord(data);

  } catch (error) {
    console.error('Error fetching ORCID details:', error);
    throw error;
  }
}

/**
 * Get researcher's email addresses (if public)
 * @param {string} orcidId - ORCID ID
 * @returns {Promise<string[]>} Array of email addresses
 */
export async function getResearcherEmails(orcidId) {
  try {
    if (!orcidId || !isValidOrcidId(orcidId)) {
      return [];
    }

    const response = await fetch(`${ORCID_BASE_URL}/${orcidId}/email`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Hospitium Research Platform/1.0'
      }
    });

    if (!response.ok) {
      return []; // Emails might be private
    }

    const data = await response.json();
    return data.email?.map(emailObj => emailObj.email) || [];

  } catch (error) {
    console.error('Error fetching ORCID emails:', error);
    return [];
  }
}

/**
 * Transform ORCID search result to our format
 * @param {Object} result - Raw ORCID search result
 * @returns {Object} Transformed researcher object
 */
function transformSearchResult(result) {
  const orcidId = result['orcid-identifier']?.path || '';
  const person = result['person'] || {};
  const name = person['name'] || {};
  
  // Extract names
  const givenNames = name['given-names']?.value || '';
  const familyName = name['family-name']?.value || '';
  const displayName = [givenNames, familyName].filter(Boolean).join(' ') || 'Unknown';
  
  // Extract affiliations
  const affiliations = extractAffiliations(result);
  const primaryAffiliation = affiliations[0] || '';
  
  return {
    orcidId: formatOrcidId(orcidId),
    givenNames,
    familyName,
    displayName,
    affiliation: primaryAffiliation,
    affiliations,
    profileUrl: `https://orcid.org/${orcidId}`,
    // Email will need to be fetched separately if needed
    email: null
  };
}

/**
 * Transform detailed ORCID record to our format
 * @param {Object} record - Raw ORCID record
 * @returns {Object} Transformed researcher object
 */
function transformDetailedRecord(record) {
  const person = record.person || {};
  const name = person.name || {};
  const biography = person.biography?.content || '';
  
  // Extract names
  const givenNames = name['given-names']?.value || '';
  const familyName = name['family-name']?.value || '';
  const displayName = [givenNames, familyName].filter(Boolean).join(' ') || 'Unknown';
  
  // Extract affiliations from employments and educations
  const affiliations = [
    ...extractEmployments(person.employments),
    ...extractEducations(person.educations)
  ];
  
  return {
    orcidId: formatOrcidId(record['orcid-identifier']?.path || ''),
    givenNames,
    familyName,
    displayName,
    biography,
    affiliations,
    profileUrl: `https://orcid.org/${record['orcid-identifier']?.path || ''}`,
    lastModified: record['last-modified-date']?.value
  };
}

/**
 * Extract affiliations from ORCID search result
 * @param {Object} result - ORCID search result
 * @returns {string[]} Array of affiliations
 */
function extractAffiliations(result) {
  const affiliations = [];
  
  // Try to get from institution names in the search result
  if (result['institution-name']) {
    result['institution-name'].forEach(inst => {
      if (inst.value) {
        affiliations.push(inst.value);
      }
    });
  }
  
  return [...new Set(affiliations)]; // Remove duplicates
}

/**
 * Extract employment information
 * @param {Object} employments - ORCID employments object
 * @returns {string[]} Array of employment affiliations
 */
function extractEmployments(employments) {
  const affiliations = [];
  
  if (employments && employments['affiliation-group']) {
    employments['affiliation-group'].forEach(group => {
      group.summaries?.forEach(summary => {
        const orgName = summary['employment-summary']?.organization?.name;
        if (orgName) {
          affiliations.push(orgName);
        }
      });
    });
  }
  
  return affiliations;
}

/**
 * Extract education information
 * @param {Object} educations - ORCID educations object
 * @returns {string[]} Array of education affiliations
 */
function extractEducations(educations) {
  const affiliations = [];
  
  if (educations && educations['affiliation-group']) {
    educations['affiliation-group'].forEach(group => {
      group.summaries?.forEach(summary => {
        const orgName = summary['education-summary']?.organization?.name;
        if (orgName) {
          affiliations.push(orgName);
        }
      });
    });
  }
  
  return affiliations;
}

/**
 * Validate ORCID ID format
 * @param {string} orcidId - ORCID ID to validate
 * @returns {boolean} True if valid format
 */
export function isValidOrcidId(orcidId) {
  if (!orcidId) return false;
  
  // Remove any URI prefix
  const cleanId = orcidId.replace(/^https?:\/\/(www\.)?orcid\.org\//, '');
  
  // ORCID format: 0000-0000-0000-000X (where X can be 0-9 or X)
  const orcidPattern = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;
  return orcidPattern.test(cleanId);
}

/**
 * Format ORCID ID consistently
 * @param {string} orcidId - Raw ORCID ID
 * @returns {string} Formatted ORCID ID
 */
export function formatOrcidId(orcidId) {
  if (!orcidId) return '';
  
  // Remove any URI prefix
  const cleanId = orcidId.replace(/^https?:\/\/(www\.)?orcid\.org\//, '');
  
  // Ensure proper format
  if (isValidOrcidId(cleanId)) {
    return cleanId;
  }
  
  return orcidId; // Return as-is if can't format
}

/**
 * Create ORCID profile URL
 * @param {string} orcidId - ORCID ID
 * @returns {string} Full ORCID profile URL
 */
export function getOrcidProfileUrl(orcidId) {
  const cleanId = formatOrcidId(orcidId);
  return `https://orcid.org/${cleanId}`;
}

/**
 * Extract ORCID ID from various formats
 * @param {string} input - ORCID ID in various formats
 * @returns {string} Clean ORCID ID
 */
export function extractOrcidId(input) {
  if (!input) return '';
  
  // Handle URLs
  const urlMatch = input.match(/orcid\.org\/(\d{4}-\d{4}-\d{4}-\d{3}[\dX])/);
  if (urlMatch) {
    return urlMatch[1];
  }
  
  // Handle direct ORCID ID
  const directMatch = input.match(/(\d{4}-\d{4}-\d{4}-\d{3}[\dX])/);
  if (directMatch) {
    return directMatch[1];
  }
  
  return input.trim();
}
