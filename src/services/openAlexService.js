/**
 * OpenAlex Service - Handles interactions with OpenAlex API
 * 
 * OpenAlex API Documentation:
 * https://docs.openalex.org/
 */

const OPENALEX_BASE_URL = 'https://api.openalex.org';

/**
 * Search OpenAlex by query terms and return publication data
 * @param {string} query - The search query
 * @param {number} maxResults - Maximum number of results to return (default: 20)
 * @param {Object} filters - Additional filters like publication year, type, etc.
 * @returns {Promise<Object[]>} Array of formatted publication objects
 */
export const searchOpenAlex = async (query, maxResults = 20, filters = {}) => {
    if (!query?.trim()) {
        throw new Error('Search query is required');
    }

    try {
        // Build query parameters
        const params = new URLSearchParams({
            search: query.trim(),
            per_page: Math.min(maxResults, 200), // OpenAlex limits to 200 per request
            mailto: 'support@hospitium.org' // Polite pool access
        });

        // Add filters if provided
        if (filters.fromYear) {
            params.append('filter', `publication_year:>${filters.fromYear - 1}`);
        }
        if (filters.untilYear) {
            params.append('filter', `publication_year:<${filters.untilYear + 1}`);
        }
        if (filters.type) {
            params.append('filter', `type:${filters.type}`);
        }
        if (filters.isOpenAccess !== undefined) {
            params.append('filter', `is_oa:${filters.isOpenAccess}`);
        }

        const searchUrl = `${OPENALEX_BASE_URL}/works?${params}`;
        
        const response = await fetch(searchUrl);

        if (!response.ok) {
            throw new Error(`OpenAlex search failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.results || data.results.length === 0) {
            return [];
        }

        return data.results.map(item => transformOpenAlexData(item));
    } catch (error) {
        console.error('Error in searchOpenAlex:', error);
        throw error;
    }
};

/**
 * Get publication by OpenAlex ID or DOI
 * @param {string} identifier - The OpenAlex ID or DOI
 * @returns {Promise<Object>} Formatted publication object
 */
export const getPublicationById = async (identifier) => {
    if (!identifier?.trim()) {
        throw new Error('Identifier is required');
    }

    try {
        let url;
        const cleanIdentifier = identifier.trim();

        // Check if it's a DOI
        if (cleanIdentifier.includes('doi.org') || cleanIdentifier.startsWith('10.')) {
            const cleanDOI = cleanIdentifier.replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
            url = `${OPENALEX_BASE_URL}/works/https://doi.org/${cleanDOI}?mailto=support@hospitium.org`;
        } 
        // Check if it's an OpenAlex ID
        else if (cleanIdentifier.startsWith('W') || cleanIdentifier.startsWith('https://openalex.org/W')) {
            const openAlexId = cleanIdentifier.startsWith('W') ? cleanIdentifier : cleanIdentifier.split('/').pop();
            url = `${OPENALEX_BASE_URL}/works/W${openAlexId.replace('W', '')}?mailto=support@hospitium.org`;
        }
        // Otherwise, search by title or other identifier
        else {
            const searchResults = await searchOpenAlex(cleanIdentifier, 1);
            if (searchResults.length === 0) {
                throw new Error('Publication not found');
            }
            return searchResults[0];
        }

        const response = await fetch(url);

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Publication not found');
            }
            throw new Error(`OpenAlex lookup failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return transformOpenAlexData(data);
    } catch (error) {
        console.error('Error in getPublicationById:', error);
        throw error;
    }
};

/**
 * Transform raw OpenAlex data into standardized publication format
 * @param {Object} item - Raw publication data from OpenAlex
 * @returns {Object} Standardized publication object
 */
export const transformOpenAlexData = (item) => {
    if (!item) {
        throw new Error('Publication data not found');
    }

    // Helper function to format authors
    const formatAuthors = (authorships) => {
        if (!Array.isArray(authorships)) return ['Unknown Author'];
        return authorships
            .map(authorship => {
                const author = authorship.author;
                if (author?.display_name) {
                    return author.display_name;
                }
                return null;
            })
            .filter(name => name)
            .slice(0, 20); // Limit to 20 authors
    };

    // Helper function to extract year from date
    const extractYear = (dateString) => {
        if (!dateString) return 'Unknown Year';
        return parseInt(new Date(dateString).getFullYear().toString()) || 'Unknown Year';
    };

    // Helper function to format venue/journal name
    const formatJournal = (primaryLocation) => {
        if (primaryLocation?.source?.display_name) {
            return primaryLocation.source.display_name;
        }
        return 'Unknown Journal';
    };

    // Helper function to extract keywords from concepts
    const formatKeywords = (concepts) => {
        if (!Array.isArray(concepts)) return [];
        return concepts
            .filter(concept => concept.score > 0.3) // Only include relevant concepts
            .map(concept => concept.display_name)
            .slice(0, 10); // Limit to 10 keywords
    };

    // Helper function to create publication date
    const createPublicationDate = (dateString) => {
        if (!dateString) return null;
        try {
            return new Date(dateString).toISOString();
        } catch {
            return null;
        }
    };

    // Helper function to determine publication type
    const getPublicationType = (type, typesCrossref) => {
        if (type === 'article') return 'article';
        if (type === 'book') return 'book';
        if (type === 'book-chapter') return 'book-chapter';
        if (type === 'preprint') return 'preprint';
        if (type === 'dataset') return 'dataset';
        if (type === 'review') return 'review';
        
        // Fallback to crossref type if available
        if (typesCrossref && typesCrossref.length > 0) {
            return typesCrossref[0];
        }
        
        return 'article';
    };

    // Helper function to format pages
    const formatPages = (biblio) => {
        if (!biblio) return '';
        if (biblio.first_page && biblio.last_page) {
            return `${biblio.first_page}-${biblio.last_page}`;
        }
        if (biblio.first_page) {
            return biblio.first_page;
        }
        return '';
    };

    return {
        id: `openalex_${item.id}_${Date.now()}`,
        title: item.title || 'Unknown Title',
        authors: formatAuthors(item.authorships),
        year: extractYear(item.publication_date),
        journal: formatJournal(item.primary_location),
        type: getPublicationType(item.type, item.type_crossref),
        abstract: item.abstract_inverted_index ? 
            reconstructAbstractFromInvertedIndex(item.abstract_inverted_index) : '',
        keywords: formatKeywords(item.concepts),
        doi: item.doi ? item.doi.replace('https://doi.org/', '') : '',
        url: item.primary_location?.pdf_url || item.primary_location?.landing_page_url || '',
        volume: item.biblio?.volume || '',
        issue: item.biblio?.issue || '',
        pages: formatPages(item.biblio),
        isbn: item.biblio?.isbn || '',
        publicationDate: createPublicationDate(item.publication_date),
        publisher: item.primary_location?.source?.host_organization || '',
        source: 'OpenAlex',
        // Additional OpenAlex-specific fields
        openAlexId: item.id,
        citationCount: item.cited_by_count || 0,
        isOpenAccess: item.open_access?.is_oa || false,
        openAccessType: item.open_access?.oa_type || null,
        // Import source metadata
        importSource: {
            method: 'openalex',
            sourceId: item.id || '',
            importDate: new Date().toISOString(),
            metadata: {
                originalSource: 'OpenAlex',
                openAlexUrl: item.id,
                citationCount: item.cited_by_count || 0,
                isOpenAccess: item.open_access?.is_oa || false,
                concepts: item.concepts?.slice(0, 5).map(c => ({
                    name: c.display_name,
                    score: c.score
                })) || []
            }
        }
    };
};

/**
 * Reconstruct abstract from inverted index format used by OpenAlex
 * @param {Object} invertedIndex - The inverted index from OpenAlex
 * @returns {string} Reconstructed abstract text
 */
function reconstructAbstractFromInvertedIndex(invertedIndex) {
    if (!invertedIndex || typeof invertedIndex !== 'object') return '';
    
    try {
        const words = [];
        
        // Build word-position pairs
        for (const [word, positions] of Object.entries(invertedIndex)) {
            for (const position of positions) {
                words[position] = word;
            }
        }
        
        // Join words and clean up
        return words
            .filter(word => word) // Remove undefined entries
            .join(' ')
            .replace(/\s+/g, ' ') // Normalize spaces
            .trim()
            .substring(0, 2000); // Limit abstract length
    } catch (error) {
        console.warn('Failed to reconstruct abstract:', error);
        return '';
    }
}

/**
 * Main function to handle OpenAlex import - search by terms
 * @param {string} input - User input (search terms)
 * @param {number} maxResults - Maximum results for search
 * @returns {Promise<{type: string, data: Object[]}>} Result object with type and data
 */
export const importFromOpenAlex = async (input, maxResults = 50) => {
    if (!input?.toString().trim()) {
        throw new Error('Search term is required');
    }

    // OpenAlex primarily works with search terms
    const publications = await searchOpenAlex(input, maxResults);
    return {
        type: 'multiple',
        data: publications
    };
};
