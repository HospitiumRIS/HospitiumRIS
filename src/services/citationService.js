/**
 * Citation Service - Fetches real citation counts from external APIs
 * Uses OpenAlex API (free, no API key required)
 */

/**
 * Fetch citation count from OpenAlex API using DOI
 * @param {string} doi - Publication DOI
 * @returns {Promise<number>} Citation count
 */
export async function getCitationCountByDOI(doi) {
  if (!doi) return 0;

  try {
    // Clean DOI (remove https://doi.org/ if present)
    const cleanDoi = doi.replace('https://doi.org/', '').replace('http://doi.org/', '');
    
    // OpenAlex API endpoint
    const url = `https://api.openalex.org/works/doi:${encodeURIComponent(cleanDoi)}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'HospitiumRis/1.0 (mailto:contact@hospitiumris.org)' // Polite API usage
      }
    });

    if (!response.ok) {
      console.log(`OpenAlex API returned ${response.status} for DOI: ${doi}`);
      return 0;
    }

    const data = await response.json();
    
    // OpenAlex provides cited_by_count
    return data.cited_by_count || 0;
  } catch (error) {
    console.error(`Error fetching citations for DOI ${doi}:`, error.message);
    return 0;
  }
}

/**
 * Fetch citation count from OpenAlex API using title
 * (Fallback for publications without DOI)
 * @param {string} title - Publication title
 * @param {number} year - Publication year
 * @returns {Promise<number>} Citation count
 */
export async function getCitationCountByTitle(title, year) {
  if (!title) return 0;

  try {
    // OpenAlex search endpoint
    const searchQuery = encodeURIComponent(title);
    const url = `https://api.openalex.org/works?search=${searchQuery}${year ? `&filter=publication_year:${year}` : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'HospitiumRis/1.0 (mailto:contact@hospitiumris.org)'
      }
    });

    if (!response.ok) {
      console.log(`OpenAlex API returned ${response.status} for title: ${title}`);
      return 0;
    }

    const data = await response.json();
    
    // Get the first result (most relevant)
    if (data.results && data.results.length > 0) {
      return data.results[0].cited_by_count || 0;
    }
    
    return 0;
  } catch (error) {
    console.error(`Error fetching citations for title "${title}":`, error.message);
    return 0;
  }
}

/**
 * Fetch citations for multiple publications in batch
 * @param {Array} publications - Array of publication objects with doi and/or title
 * @returns {Promise<Map>} Map of publication IDs to citation counts
 */
export async function fetchCitationsForPublications(publications) {
  const citationMap = new Map();
  
  // Process publications with a small delay to respect rate limits
  for (const pub of publications) {
    let citationCount = 0;
    
    // Try DOI first (more accurate)
    if (pub.doi) {
      citationCount = await getCitationCountByDOI(pub.doi);
    }
    
    // Fallback to title search if DOI didn't work
    if (citationCount === 0 && pub.title) {
      citationCount = await getCitationCountByTitle(pub.title, pub.year);
    }
    
    citationMap.set(pub.id, citationCount);
    
    // Small delay to respect rate limits (OpenAlex allows 10 req/sec)
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  
  return citationMap;
}

/**
 * Fetch citation count for a single publication
 * @param {Object} publication - Publication object with doi, title, year
 * @returns {Promise<number>} Citation count
 */
export async function getCitationCount(publication) {
  if (!publication) return 0;
  
  let citationCount = 0;
  
  // Try DOI first (most accurate)
  if (publication.doi) {
    citationCount = await getCitationCountByDOI(publication.doi);
  }
  
  // Fallback to title search
  if (citationCount === 0 && publication.title) {
    citationCount = await getCitationCountByTitle(publication.title, publication.year);
  }
  
  return citationCount;
}

/**
 * Get total citation count for a researcher
 * @param {Array} publications - Array of publications
 * @returns {Promise<number>} Total citation count
 */
export async function getTotalCitationCount(publications) {
  const citationMap = await fetchCitationsForPublications(publications);
  
  let totalCitations = 0;
  for (const count of citationMap.values()) {
    totalCitations += count;
  }
  
  return totalCitations;
}

