/**
 * PubMed Service - Handles interactions with NCBI eUtils API
 * 
 * NCBI eUtils API Documentation:
 * https://www.ncbi.nlm.nih.gov/books/NBK25497/
 */

const PUBMED_BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

/**
 * Search PubMed by terms and return a list of PMIDs
 * @param {string} searchTerm - The search query
 * @param {number} maxResults - Maximum number of results to return (default: 50)
 * @returns {Promise<string[]>} Array of PMIDs
 */
export const searchPubMed = async (searchTerm, maxResults = 50) => {
    if (!searchTerm?.trim()) {
        throw new Error('Search term is required');
    }

    const searchUrl = `${PUBMED_BASE_URL}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(searchTerm.trim())}&retmode=json&retmax=${maxResults}`;
    
    const response = await fetch(searchUrl);
    if (!response.ok) {
        throw new Error(`PubMed search failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.esearchresult?.idlist || data.esearchresult.idlist.length === 0) {
        throw new Error('No publications found for this search term');
    }

    return data.esearchresult.idlist;
};

/**
 * Get publication summaries for one or more PMIDs
 * @param {string|string[]} pmids - Single PMID or array of PMIDs
 * @returns {Promise<Object>} Summary data from NCBI
 */
export const getPubMedSummaries = async (pmids) => {
    const ids = Array.isArray(pmids) ? pmids : [pmids];
    if (ids.length === 0) {
        throw new Error('At least one PMID is required');
    }

    const summaryUrl = `${PUBMED_BASE_URL}/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`;
    
    const response = await fetch(summaryUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch PubMed data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.result;
};

/**
 * Transform raw PubMed summary data into standardized publication format
 * @param {string} pmid - The PubMed ID
 * @param {Object} pubData - Raw publication data from NCBI
 * @returns {Object} Standardized publication object
 */
export const transformPubMedData = (pmid, pubData) => {
    if (!pubData) {
        throw new Error('Publication data not found');
    }

    // Helper function to extract DOI from article IDs
    const extractDOI = (articleIds) => {
        if (!Array.isArray(articleIds)) return '';
        const doiEntry = articleIds.find(id => id.idtype === 'doi');
        return doiEntry?.value || '';
    };

    // Helper function to format authors
    const formatAuthors = (authors) => {
        if (!Array.isArray(authors)) return ['Unknown Author'];
        return authors
            .map(author => author.name || '')
            .filter(name => name.trim())
            .slice(0, 20); // Limit to 20 authors to avoid overly long lists
    };

    // Helper function to extract year from publication date
    const extractYear = (pubDate) => {
        if (!pubDate) return 'Unknown Year';
        // PubMed dates can be in format "2023", "2023 Jan", "2023 Jan 15", etc.
        const yearMatch = pubDate.match(/(\d{4})/);
        return yearMatch ? parseInt(yearMatch[1]) : 'Unknown Year';
    };

    return {
        id: `pubmed_${pmid}_${Date.now()}`,
        title: pubData.title || 'Unknown Title',
        authors: formatAuthors(pubData.authors),
        year: extractYear(pubData.pubdate),
        journal: pubData.fulljournalname || pubData.source || 'Unknown Journal',
        type: 'article',
        abstract: pubData.abstract || '',
        keywords: pubData.keywords || [],
        doi: extractDOI(pubData.articleids),
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        volume: pubData.volume || '',
        issue: pubData.issue || '',
        pages: pubData.pages || '',
        isbn: '',
        pubmedId: pmid.toString(),
        source: 'PubMed',
        // Additional metadata for tracking
        importSource: {
            method: 'pubmed',
            sourceId: pmid.toString(),
            importDate: new Date().toISOString(),
            metadata: {
                originalSource: 'PubMed',
                ncbiUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
            }
        }
    };
};

/**
 * Search PubMed and return formatted publication objects
 * @param {string} searchTerm - The search query
 * @param {number} maxResults - Maximum number of results to return
 * @returns {Promise<Object[]>} Array of formatted publication objects
 */
export const searchAndFormatPubMed = async (searchTerm, maxResults = 50) => {
    try {
        // Step 1: Search for PMIDs
        const pmids = await searchPubMed(searchTerm, maxResults);
        
        // Step 2: Get summaries for all PMIDs
        const summaryData = await getPubMedSummaries(pmids);
        
        // Step 3: Transform each result
        const publications = pmids.map(pmid => {
            const pubData = summaryData[pmid];
            return transformPubMedData(pmid, pubData);
        });

        return publications;
    } catch (error) {
        console.error('Error in searchAndFormatPubMed:', error);
        throw error;
    }
};

/**
 * Get a single publication by PMID
 * @param {string} pmid - The PubMed ID
 * @returns {Promise<Object>} Formatted publication object
 */
export const getPubMedByPMID = async (pmid) => {
    if (!pmid?.toString().trim()) {
        throw new Error('PMID is required');
    }

    // Validate PMID format (should be numeric)
    const cleanPmid = pmid.toString().trim();
    if (!/^\d+$/.test(cleanPmid)) {
        throw new Error('Invalid PMID format. PMID should be a number.');
    }

    try {
        // Get summary data for the specific PMID
        const summaryData = await getPubMedSummaries([cleanPmid]);
        const pubData = summaryData[cleanPmid];
        
        if (!pubData) {
            throw new Error('Publication not found for this PMID');
        }

        return transformPubMedData(cleanPmid, pubData);
    } catch (error) {
        console.error('Error in getPubMedByPMID:', error);
        throw error;
    }
};

/**
 * Determine if input is a PMID (numeric) or search term
 * @param {string} input - User input
 * @returns {boolean} True if input appears to be a PMID
 */
export const isPMID = (input) => {
    if (!input?.toString().trim()) return false;
    return /^\d+$/.test(input.toString().trim());
};

/**
 * Main function to handle PubMed import - automatically determines if input is PMID or search term
 * @param {string} input - User input (PMID or search term)
 * @param {number} maxResults - Maximum results for search (ignored for direct PMID lookup)
 * @returns {Promise<{type: string, data: Object|Object[]}>} Result object with type and data
 */
export const importFromPubMed = async (input, maxResults = 50) => {
    if (!input?.toString().trim()) {
        throw new Error('PubMed ID or search term is required');
    }

    if (isPMID(input)) {
        // Direct PMID lookup
        const publication = await getPubMedByPMID(input);
        return {
            type: 'single',
            data: publication
        };
    } else {
        // Search by terms
        const publications = await searchAndFormatPubMed(input, maxResults);
        return {
            type: 'multiple',
            data: publications
        };
    }
};
