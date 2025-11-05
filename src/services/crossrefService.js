/**
 * Crossref Service - Handles interactions with Crossref API
 * 
 * Crossref API Documentation:
 * https://github.com/CrossRef/rest-api-doc
 */

const CROSSREF_BASE_URL = 'https://api.crossref.org/works';

/**
 * Search Crossref by query terms and return publication data
 * @param {string} query - The search query
 * @param {number} maxResults - Maximum number of results to return (default: 20)
 * @param {Object} filters - Additional filters like publication year, type, etc.
 * @returns {Promise<Object[]>} Array of formatted publication objects
 */
export const searchCrossref = async (query, maxResults = 20, filters = {}) => {
    if (!query?.trim()) {
        throw new Error('Search query is required');
    }

    try {
        // Build query parameters
        const params = new URLSearchParams({
            query: query.trim(),
            rows: Math.min(maxResults, 100), // Crossref limits to 100 per request
            sort: 'relevance',
            order: 'desc'
        });

        // Add filters if provided
        if (filters.fromYear) {
            params.append('filter', `from-pub-date:${filters.fromYear}`);
        }
        if (filters.untilYear) {
            params.append('filter', `until-pub-date:${filters.untilYear}`);
        }
        if (filters.type) {
            params.append('filter', `type:${filters.type}`);
        }

        const searchUrl = `${CROSSREF_BASE_URL}?${params}`;
        
        const response = await fetch(searchUrl, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Hospitium Research Platform (mailto:support@hospitium.org)'
            }
        });

        if (!response.ok) {
            throw new Error(`Crossref search failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.message?.items || data.message.items.length === 0) {
            return [];
        }

        return data.message.items.map(item => transformCrossrefData(item));
    } catch (error) {
        console.error('Error in searchCrossref:', error);
        throw error;
    }
};

/**
 * Get publication by DOI from Crossref
 * @param {string} doi - The DOI to lookup
 * @returns {Promise<Object>} Formatted publication object
 */
export const getPublicationByDOI = async (doi) => {
    if (!doi?.trim()) {
        throw new Error('DOI is required');
    }

    // Clean DOI (remove https://doi.org/ prefix if present)
    const cleanDOI = doi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//, '');

    try {
        const response = await fetch(`${CROSSREF_BASE_URL}/${encodeURIComponent(cleanDOI)}`, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Hospitium Research Platform (mailto:support@hospitium.org)'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Publication not found for this DOI');
            }
            throw new Error(`Crossref lookup failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.message) {
            throw new Error('Invalid response from Crossref');
        }

        return transformCrossrefData(data.message);
    } catch (error) {
        console.error('Error in getPublicationByDOI:', error);
        throw error;
    }
};

/**
 * Transform raw Crossref data into standardized publication format
 * @param {Object} item - Raw publication data from Crossref
 * @returns {Object} Standardized publication object
 */
export const transformCrossrefData = (item) => {
    if (!item) {
        throw new Error('Publication data not found');
    }

    // Helper function to format authors
    const formatAuthors = (authors) => {
        if (!Array.isArray(authors)) return ['Unknown Author'];
        return authors
            .map(author => {
                if (author.given && author.family) {
                    return `${author.given} ${author.family}`;
                } else if (author.family) {
                    return author.family;
                } else if (author.name) {
                    return author.name;
                }
                return null;
            })
            .filter(name => name)
            .slice(0, 20); // Limit to 20 authors
    };

    // Helper function to extract year from date
    const extractYear = (dateArray) => {
        if (!Array.isArray(dateArray) || dateArray.length === 0) return 'Unknown Year';
        return parseInt(dateArray[0]?.toString()) || 'Unknown Year';
    };

    // Helper function to format journal name
    const formatJournal = (containerTitle) => {
        if (!Array.isArray(containerTitle) || containerTitle.length === 0) return 'Unknown Journal';
        return containerTitle[0] || 'Unknown Journal';
    };

    // Helper function to extract pages
    const formatPages = (page) => {
        if (!page) return '';
        return page.replace(/^([0-9]+)-([0-9]+)$/, '$1-$2'); // Ensure proper page format
    };

    // Helper function to create publication date
    const createPublicationDate = (dateArray) => {
        if (!Array.isArray(dateArray) || dateArray.length === 0) return null;
        
        const year = dateArray[0];
        const month = dateArray[1] || 1;
        const day = dateArray[2] || 1;
        
        try {
            return new Date(year, month - 1, day).toISOString();
        } catch {
            return null;
        }
    };

    return {
        id: `crossref_${item.DOI}_${Date.now()}`,
        title: Array.isArray(item.title) ? item.title[0] : (item.title || 'Unknown Title'),
        authors: formatAuthors(item.author),
        year: extractYear(item.published?.['date-parts']?.[0] || item.created?.['date-parts']?.[0]),
        journal: formatJournal(item['container-title']),
        type: item.type === 'journal-article' ? 'article' : (item.type || 'article'),
        abstract: item.abstract || '',
        keywords: item.subject || [],
        doi: item.DOI || '',
        url: item.URL || (item.DOI ? `https://doi.org/${item.DOI}` : ''),
        volume: item.volume || '',
        issue: item.issue || '',
        pages: formatPages(item.page),
        isbn: item.ISBN?.[0] || '',
        publicationDate: createPublicationDate(item.published?.['date-parts']?.[0]),
        publisher: item.publisher || '',
        source: 'Crossref',
        // Additional Crossref-specific fields
        crossrefType: item.type,
        crossrefScore: item.score,
        crossrefIndexed: item.indexed?.['date-time'],
        // Import source metadata
        importSource: {
            method: 'crossref',
            sourceId: item.DOI || '',
            importDate: new Date().toISOString(),
            metadata: {
                originalSource: 'Crossref',
                crossrefUrl: item.URL,
                crossrefType: item.type,
                score: item.score
            }
        }
    };
};

/**
 * Determine if input is a DOI or search term
 * @param {string} input - User input
 * @returns {boolean} True if input appears to be a DOI
 */
export const isDOI = (input) => {
    if (!input?.toString().trim()) return false;
    const cleanInput = input.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
    return /^10\.\d{4,}\/[^\s]+$/.test(cleanInput);
};

/**
 * Main function to handle Crossref import - automatically determines if input is DOI or search term
 * @param {string} input - User input (DOI or search term)
 * @param {number} maxResults - Maximum results for search (ignored for direct DOI lookup)
 * @returns {Promise<{type: string, data: Object|Object[]}>} Result object with type and data
 */
export const importFromCrossref = async (input, maxResults = 50) => {
    if (!input?.toString().trim()) {
        throw new Error('DOI or search term is required');
    }

    if (isDOI(input)) {
        // Direct DOI lookup
        const publication = await getPublicationByDOI(input);
        return {
            type: 'single',
            data: publication
        };
    } else {
        // Search by terms
        const publications = await searchCrossref(input, maxResults);
        return {
            type: 'multiple',
            data: publications
        };
    }
};
