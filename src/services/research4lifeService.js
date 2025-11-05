/**
 * Research4Life Service
 * 
 * Research4Life provides free or low-cost access to scientific journals and books
 * to institutions in low- and middle-income countries. This service integrates
 * with their resources and partner databases.
 */

// Research4Life partner databases and their APIs
const R4L_PARTNERS = {
  PUBMED: {
    name: 'PubMed',
    baseUrl: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/',
    description: 'Biomedical literature database'
  },
  CROSSREF: {
    name: 'CrossRef',
    baseUrl: 'https://api.crossref.org/',
    description: 'DOI registration agency'
  },
  OPENALEX: {
    name: 'OpenAlex',
    baseUrl: 'https://api.openalex.org/',
    description: 'Comprehensive scholarly knowledge graph'
  },
  DOAJ: {
    name: 'Directory of Open Access Journals',
    baseUrl: 'https://doaj.org/api/v2/',
    description: 'Open access journals directory'
  }
};

/**
 * Search Research4Life resources through partner databases
 * @param {string} query - Search query
 * @param {number} limit - Maximum number of results
 * @param {string} partner - Specific partner to search (optional)
 * @returns {Promise<Array>} Array of formatted publications
 */
export const searchResearch4Life = async (query, limit = 20, partner = null) => {
  try {
    const results = [];
    
    if (partner && R4L_PARTNERS[partner]) {
      // Search specific partner
      const partnerResults = await searchPartner(R4L_PARTNERS[partner], query, limit);
      results.push(...partnerResults);
    } else {
      // Search all partners in parallel
      const searchPromises = Object.values(R4L_PARTNERS).map(p => 
        searchPartner(p, query, Math.ceil(limit / Object.keys(R4L_PARTNERS).length))
      );
      
      const allResults = await Promise.allSettled(searchPromises);
      
      allResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(...result.value);
        }
      });
    }
    
    // Remove duplicates and format results
    return formatAndDeduplicateResults(results, limit);
    
  } catch (error) {
    console.error('Research4Life search error:', error);
    throw new Error(`Research4Life search failed: ${error.message}`);
  }
};

/**
 * Search a specific partner database
 * @param {Object} partner - Partner configuration
 * @param {string} query - Search query
 * @param {number} limit - Result limit
 * @returns {Promise<Array>} Search results
 */
const searchPartner = async (partner, query, limit) => {
  try {
    switch (partner.name) {
      case 'PubMed':
        return await searchPubMed(query, limit);
      case 'CrossRef':
        return await searchCrossRef(query, limit);
      case 'OpenAlex':
        return await searchOpenAlex(query, limit);
      case 'Directory of Open Access Journals':
        return await searchDOAJ(query, limit);
      default:
        return [];
    }
  } catch (error) {
    console.error(`Error searching ${partner.name}:`, error);
    return [];
  }
};

/**
 * Search PubMed through Research4Life
 * @param {string} query - Search query
 * @param {number} limit - Result limit
 * @returns {Promise<Array>} Formatted results
 */
const searchPubMed = async (query, limit) => {
  try {
    const searchUrl = `${R4L_PARTNERS.PUBMED.baseUrl}esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${limit}&retmode=json`;
    
    const response = await fetch(searchUrl);
    if (!response.ok) {
      throw new Error(`PubMed API error: ${response.status}`);
    }
    
    const data = await response.json();
    const pmids = data.esearchresult?.idlist || [];
    
    if (pmids.length === 0) {
      return [];
    }
    
    // Fetch detailed information for each PMID
    const fetchUrl = `${R4L_PARTNERS.PUBMED.baseUrl}efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml`;
    const fetchResponse = await fetch(fetchUrl);
    
    if (!fetchResponse.ok) {
      throw new Error(`PubMed fetch error: ${fetchResponse.status}`);
    }
    
    const xmlText = await fetchResponse.text();
    return parsePubMedXML(xmlText);
    
  } catch (error) {
    console.error('PubMed search error:', error);
    return [];
  }
};

/**
 * Search CrossRef through Research4Life
 * @param {string} query - Search query
 * @param {number} limit - Result limit
 * @returns {Promise<Array>} Formatted results
 */
const searchCrossRef = async (query, limit) => {
  try {
    const searchUrl = `${R4L_PARTNERS.CROSSREF.baseUrl}works?query=${encodeURIComponent(query)}&rows=${limit}&mailto=research4life@example.com`;
    
    const response = await fetch(searchUrl);
    if (!response.ok) {
      throw new Error(`CrossRef API error: ${response.status}`);
    }
    
    const data = await response.json();
    const works = data.message?.items || [];
    
    return works.map(work => ({
      id: work.DOI || `crossref_${work['container-title']?.[0]}_${work['published-print']?.['date-parts']?.[0]?.[0]}`,
      title: work.title?.[0] || 'Untitled',
      authors: work.author?.map(author => 
        `${author.given || ''} ${author.family || ''}`.trim()
      ).filter(Boolean) || [],
      journal: work['container-title']?.[0] || 'Unknown Journal',
      year: work['published-print']?.['date-parts']?.[0]?.[0] || work['published-online']?.['date-parts']?.[0]?.[0],
      doi: work.DOI,
      url: work.URL,
      abstract: work.abstract || '',
      keywords: work.subject || [],
      type: work.type || 'article',
      source: 'Research4Life - CrossRef',
      r4lAccessible: true,
      r4lPartner: 'CrossRef'
    }));
    
  } catch (error) {
    console.error('CrossRef search error:', error);
    return [];
  }
};

/**
 * Search OpenAlex through Research4Life
 * @param {string} query - Search query
 * @param {number} limit - Result limit
 * @returns {Promise<Array>} Formatted results
 */
const searchOpenAlex = async (query, limit) => {
  try {
    const searchUrl = `${R4L_PARTNERS.OPENALEX.baseUrl}works?search=${encodeURIComponent(query)}&per-page=${limit}&mailto=research4life@example.com`;
    
    const response = await fetch(searchUrl);
    if (!response.ok) {
      throw new Error(`OpenAlex API error: ${response.status}`);
    }
    
    const data = await response.json();
    const works = data.results || [];
    
    return works.map(work => ({
      id: work.id || `openalex_${work.doi}`,
      title: work.title || 'Untitled',
      authors: work.authorships?.map(authorship => 
        `${authorship.author?.display_name || ''}`.trim()
      ).filter(Boolean) || [],
      journal: work.primary_location?.source?.display_name || 'Unknown Journal',
      year: work.publication_year,
      doi: work.doi,
      url: work.id,
      abstract: work.abstract_inverted_index ? 
        Object.entries(work.abstract_inverted_index)
          .sort(([,a], [,b]) => a[0] - b[0])
          .map(([word]) => word)
          .join(' ') : '',
      keywords: work.concepts?.map(concept => concept.display_name) || [],
      type: work.type || 'article',
      source: 'Research4Life - OpenAlex',
      r4lAccessible: true,
      r4lPartner: 'OpenAlex'
    }));
    
  } catch (error) {
    console.error('OpenAlex search error:', error);
    return [];
  }
};

/**
 * Search DOAJ (Directory of Open Access Journals)
 * @param {string} query - Search query
 * @param {number} limit - Result limit
 * @returns {Promise<Array>} Formatted results
 */
const searchDOAJ = async (query, limit) => {
  try {
    const searchUrl = `${R4L_PARTNERS.DOAJ.baseUrl}articles?title=${encodeURIComponent(query)}&pageSize=${limit}`;
    
    const response = await fetch(searchUrl);
    if (!response.ok) {
      throw new Error(`DOAJ API error: ${response.status}`);
    }
    
    const data = await response.json();
    const articles = data.results || [];
    
    return articles.map(article => ({
      id: article.id || `doaj_${article.bibjson?.title}`,
      title: article.bibjson?.title || 'Untitled',
      authors: article.bibjson?.author?.map(author => 
        `${author.name || ''}`.trim()
      ).filter(Boolean) || [],
      journal: article.bibjson?.journal?.title || 'Unknown Journal',
      year: article.bibjson?.year,
      doi: article.bibjson?.identifier?.find(id => id.type === 'doi')?.id,
      url: article.bibjson?.link?.find(link => link.type === 'fulltext')?.content,
      abstract: article.bibjson?.abstract || '',
      keywords: article.bibjson?.keywords || [],
      type: 'article',
      source: 'Research4Life - DOAJ',
      r4lAccessible: true,
      r4lPartner: 'DOAJ',
      openAccess: true
    }));
    
  } catch (error) {
    console.error('DOAJ search error:', error);
    return [];
  }
};

/**
 * Parse PubMed XML response
 * @param {string} xmlText - XML response text
 * @returns {Array} Formatted publications
 */
const parsePubMedXML = (xmlText) => {
  // This is a simplified parser - in production, you'd want to use a proper XML parser
  const publications = [];
  
  try {
    // Extract basic information using regex (simplified approach)
    const titleRegex = /<ArticleTitle[^>]*>(.*?)<\/ArticleTitle>/g;
    const authorRegex = /<Author[^>]*>.*?<LastName[^>]*>(.*?)<\/LastName>.*?<ForeName[^>]*>(.*?)<\/ForeName>.*?<\/Author>/gs;
    const journalRegex = /<Journal[^>]*>.*?<Title[^>]*>(.*?)<\/Title>.*?<\/Journal>/gs;
    const yearRegex = /<PubDate[^>]*>.*?<Year[^>]*>(.*?)<\/Year>.*?<\/PubDate>/gs;
    const abstractRegex = /<Abstract[^>]*>(.*?)<\/Abstract>/gs;
    const pmidRegex = /<PMID[^>]*>(.*?)<\/PMID>/g;
    
    let match;
    const titles = [];
    const authors = [];
    const journals = [];
    const years = [];
    const abstracts = [];
    const pmids = [];
    
    while ((match = titleRegex.exec(xmlText)) !== null) {
      titles.push(match[1]);
    }
    
    while ((match = authorRegex.exec(xmlText)) !== null) {
      authors.push(`${match[2]} ${match[1]}`.trim());
    }
    
    while ((match = journalRegex.exec(xmlText)) !== null) {
      journals.push(match[1]);
    }
    
    while ((match = yearRegex.exec(xmlText)) !== null) {
      years.push(parseInt(match[1]));
    }
    
    while ((match = abstractRegex.exec(xmlText)) !== null) {
      abstracts.push(match[1].replace(/<[^>]*>/g, '').trim());
    }
    
    while ((match = pmidRegex.exec(xmlText)) !== null) {
      pmids.push(match[1]);
    }
    
    // Create publication objects
    for (let i = 0; i < Math.max(titles.length, pmids.length); i++) {
      publications.push({
        id: pmids[i] || `pubmed_${i}`,
        title: titles[i] || 'Untitled',
        authors: authors.length > 0 ? authors : [],
        journal: journals[i] || 'Unknown Journal',
        year: years[i] || null,
        doi: null,
        url: pmids[i] ? `https://pubmed.ncbi.nlm.nih.gov/${pmids[i]}/` : null,
        abstract: abstracts[i] || '',
        keywords: [],
        type: 'article',
        source: 'Research4Life - PubMed',
        r4lAccessible: true,
        r4lPartner: 'PubMed'
      });
    }
    
  } catch (error) {
    console.error('Error parsing PubMed XML:', error);
  }
  
  return publications;
};

/**
 * Format and deduplicate results from multiple sources
 * @param {Array} results - Array of result arrays
 * @param {number} limit - Maximum results to return
 * @returns {Array} Formatted and deduplicated results
 */
const formatAndDeduplicateResults = (results, limit) => {
  const allResults = results.flat();
  const seen = new Set();
  const uniqueResults = [];
  
  for (const result of allResults) {
    // Create a unique key based on title and first author
    const key = `${result.title}_${result.authors[0] || ''}`.toLowerCase();
    
    if (!seen.has(key)) {
      seen.add(key);
      uniqueResults.push({
        ...result,
        // Add Research4Life specific metadata
        r4lAccessible: true,
        r4lSource: 'Research4Life Partnership',
        importSource: 'research4life'
      });
      
      if (uniqueResults.length >= limit) {
        break;
      }
    }
  }
  
  return uniqueResults;
};

/**
 * Get Research4Life partner information
 * @returns {Object} Partner information
 */
export const getResearch4LifePartners = () => {
  return R4L_PARTNERS;
};

/**
 * Check if a publication is accessible through Research4Life
 * @param {string} doi - Publication DOI
 * @returns {Promise<boolean>} Whether the publication is R4L accessible
 */
export const checkResearch4LifeAccess = async (doi) => {
  try {
    // This would typically check against R4L's database
    // For now, we'll return true for demonstration
    return true;
  } catch (error) {
    console.error('Error checking R4L access:', error);
    return false;
  }
};

