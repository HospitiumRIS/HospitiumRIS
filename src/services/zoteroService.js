/**
 * Zotero API Service
 * Handles interactions with the Zotero Web API
 * 
 * API Documentation: https://www.zotero.org/support/dev/web_api/v3/start
 */

const ZOTERO_API_BASE = 'https://api.zotero.org';

/**
 * Test authentication and fetch user collections
 * @param {string} userID - Zotero user ID
 * @param {string} apiKey - Zotero API key
 * @returns {Promise<Array>} Array of collections
 */
export const authenticateAndFetchCollections = async (userID, apiKey) => {
  try {
    const response = await fetch(`${ZOTERO_API_BASE}/users/${userID}/collections?key=${apiKey}`);
    
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Invalid API key or insufficient permissions');
      } else if (response.status === 404) {
        throw new Error('User ID not found');
      } else {
        throw new Error(`Authentication failed: ${response.statusText}`);
      }
    }

    const collections = await response.json();
    
    // Add "All Items" collection at the top
    return [
      { key: '', name: 'All Items', numItems: 0 },
      ...collections.map(col => ({
        key: col.key,
        name: col.data.name,
        numItems: col.meta.numItems || 0,
        parentCollection: col.data.parentCollection
      }))
    ];
  } catch (error) {
    console.error('Zotero authentication error:', error);
    throw error;
  }
};

/**
 * Fetch items from a specific collection or all items
 * @param {string} userID - Zotero user ID
 * @param {string} apiKey - Zotero API key
 * @param {string} collectionKey - Collection key (empty for all items)
 * @param {number} limit - Maximum number of items to fetch
 * @returns {Promise<Array>} Array of Zotero items
 */
export const fetchZoteroItems = async (userID, apiKey, collectionKey = '', limit = 50) => {
  try {
    const baseUrl = `${ZOTERO_API_BASE}/users/${userID}`;
    const endpoint = collectionKey 
      ? `${baseUrl}/collections/${collectionKey}/items`
      : `${baseUrl}/items`;
    
    const url = `${endpoint}?key=${apiKey}&format=json&include=data,meta&itemType=-attachment,-note&limit=${limit}&sort=dateModified&direction=desc`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch items: ${response.statusText}`);
    }

    const items = await response.json();
    return items;
  } catch (error) {
    console.error('Zotero fetch items error:', error);
    throw error;
  }
};

/**
 * Transform Zotero items to our publication format
 * @param {Array} zoteroItems - Array of Zotero items
 * @returns {Array} Array of transformed publications
 */
export const transformZoteroItems = (zoteroItems) => {
  return zoteroItems.map(item => ({
    id: item.key,
    title: item.data.title || 'Untitled',
    type: mapZoteroItemType(item.data.itemType),
    authors: extractAuthors(item.data.creators || []),
    journal: item.data.publicationTitle || item.data.journalAbbreviation || 'Unknown',
    year: item.data.date ? extractYear(item.data.date) : new Date().getFullYear(),
    doi: item.data.DOI || null,
    url: item.data.url || null,
    abstract: item.data.abstractNote || '',
    keywords: item.data.tags ? item.data.tags.map(tag => tag.tag) : [],
    volume: item.data.volume || null,
    number: item.data.issue || null,
    pages: item.data.pages || null,
    isbn: item.data.ISBN || null,
    publisher: item.data.publisher || null,
    source: 'Zotero',
    zoteroKey: item.key,
    zoteroItemType: item.data.itemType,
    zoteroVersion: item.version,
    dateAdded: item.data.dateAdded,
    dateModified: item.data.dateModified
  }));
};

/**
 * Map Zotero item types to our publication types
 * @param {string} itemType - Zotero item type
 * @returns {string} Our publication type
 */
const mapZoteroItemType = (itemType) => {
  const mapping = {
    'journalArticle': 'article',
    'bookSection': 'book-chapter',
    'book': 'book',
    'thesis': 'thesis',
    'conferencePaper': 'conference',
    'report': 'report',
    'webpage': 'other',
    'blogPost': 'other',
    'magazineArticle': 'article',
    'newspaperArticle': 'article',
    'patent': 'other',
    'preprint': 'preprint',
    'presentation': 'presentation',
    'software': 'software',
    'videoRecording': 'other',
    'podcast': 'other'
  };
  return mapping[itemType] || 'other';
};

/**
 * Extract authors from Zotero creators
 * @param {Array} creators - Array of Zotero creators
 * @returns {Array} Array of author names
 */
const extractAuthors = (creators) => {
  return creators
    .filter(creator => creator.creatorType === 'author')
    .map(creator => {
      if (creator.name) return creator.name;
      return `${creator.firstName || ''} ${creator.lastName || ''}`.trim();
    })
    .filter(name => name.length > 0);
};

/**
 * Extract year from Zotero date string
 * @param {string} dateString - Zotero date string
 * @returns {number} Year
 */
const extractYear = (dateString) => {
  if (!dateString) return new Date().getFullYear();
  
  // Try to extract 4-digit year
  const match = dateString.match(/\d{4}/);
  if (match) return parseInt(match[0]);
  
  // Try to parse as date
  const date = new Date(dateString);
  if (!isNaN(date)) return date.getFullYear();
  
  return new Date().getFullYear();
};

/**
 * Get user profile information
 * @param {string} userID - Zotero user ID
 * @param {string} apiKey - Zotero API key
 * @returns {Promise<Object>} User profile data
 */
export const getUserProfile = async (userID, apiKey) => {
  try {
    const response = await fetch(`${ZOTERO_API_BASE}/users/${userID}?key=${apiKey}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user profile: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Zotero user profile error:', error);
    throw error;
  }
};

/**
 * Get library statistics
 * @param {string} userID - Zotero user ID
 * @param {string} apiKey - Zotero API key
 * @returns {Promise<Object>} Library statistics
 */
export const getLibraryStats = async (userID, apiKey) => {
  try {
    const response = await fetch(`${ZOTERO_API_BASE}/users/${userID}/items?key=${apiKey}&format=json&limit=1&include=meta`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch library stats: ${response.statusText}`);
    }

    const totalCount = response.headers.get('Total-Results');
    return {
      totalItems: parseInt(totalCount) || 0,
      lastModified: response.headers.get('Last-Modified-Version')
    };
  } catch (error) {
    console.error('Zotero library stats error:', error);
    throw error;
  }
};
