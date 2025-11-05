/**
 * Citation formatting utilities for different academic styles
 * Supports in-text citations and bibliography entries
 */

// Helper function to format author names for different styles
export const formatAuthorNames = (authors, style, maxAuthors = 3) => {
  if (!authors || authors.length === 0) return 'Unknown Author';
  
  // Handle single string of authors (split by comma or 'and')
  let authorList = Array.isArray(authors) ? authors : [authors];
  
  // If authors is a single string with multiple names, try to split it
  if (authorList.length === 1 && typeof authorList[0] === 'string') {
    const singleAuthor = authorList[0];
    if (singleAuthor.includes(',') || singleAuthor.includes(' and ')) {
      authorList = singleAuthor
        .split(/,|\sand\s/)
        .map(name => name.trim())
        .filter(name => name.length > 0);
    }
  }
  
  switch (style) {
    case 'APA':
      return formatAuthorsAPA(authorList, maxAuthors);
    case 'MLA':
      return formatAuthorsMLA(authorList, maxAuthors);
    case 'Chicago':
      return formatAuthorsChicago(authorList, maxAuthors);
    default:
      return formatAuthorsAPA(authorList, maxAuthors);
  }
};

// APA author formatting
const formatAuthorsAPA = (authors, maxAuthors) => {
  if (authors.length === 1) {
    return formatSingleAuthorAPA(authors[0]);
  } else if (authors.length === 2) {
    return `${formatSingleAuthorAPA(authors[0])}, & ${formatSingleAuthorAPA(authors[1])}`;
  } else if (authors.length <= maxAuthors) {
    const lastAuthor = formatSingleAuthorAPA(authors[authors.length - 1]);
    const otherAuthors = authors.slice(0, -1).map(formatSingleAuthorAPA).join(', ');
    return `${otherAuthors}, & ${lastAuthor}`;
  } else {
    return `${formatSingleAuthorAPA(authors[0])}, et al.`;
  }
};

// MLA author formatting
const formatAuthorsMLA = (authors, maxAuthors) => {
  if (authors.length === 1) {
    return formatSingleAuthorMLA(authors[0]);
  } else if (authors.length === 2) {
    return `${formatSingleAuthorMLA(authors[0])}, and ${formatFirstNameFirst(authors[1])}`;
  } else if (authors.length <= maxAuthors) {
    const lastAuthor = formatFirstNameFirst(authors[authors.length - 1]);
    const otherAuthors = authors.slice(0, -1).map(formatFirstNameFirst).join(', ');
    return `${formatSingleAuthorMLA(authors[0])}, ${otherAuthors.slice(formatSingleAuthorMLA(authors[0]).length + 2)}, and ${lastAuthor}`;
  } else {
    return `${formatSingleAuthorMLA(authors[0])}, et al.`;
  }
};

// Chicago author formatting
const formatAuthorsChicago = (authors, maxAuthors) => {
  if (authors.length === 1) {
    return formatSingleAuthorChicago(authors[0]);
  } else if (authors.length <= 3) {
    const lastAuthor = formatFirstNameFirst(authors[authors.length - 1]);
    const otherAuthors = authors.slice(0, -1).map(formatFirstNameFirst).join(', ');
    return authors.length === 2 
      ? `${formatSingleAuthorChicago(authors[0])} and ${lastAuthor}`
      : `${formatSingleAuthorChicago(authors[0])}, ${otherAuthors.slice(formatSingleAuthorChicago(authors[0]).length + 2)}, and ${lastAuthor}`;
  } else {
    return `${formatSingleAuthorChicago(authors[0])} et al.`;
  }
};

// Helper functions for individual author name formatting
const formatSingleAuthorAPA = (author) => {
  if (!author) return 'Unknown';
  const nameParts = author.trim().split(' ');
  if (nameParts.length === 1) return nameParts[0];
  
  const lastName = nameParts[nameParts.length - 1];
  const firstNames = nameParts.slice(0, -1);
  const initials = firstNames.map(name => name.charAt(0).toUpperCase() + '.').join(' ');
  
  return `${lastName}, ${initials}`;
};

const formatSingleAuthorMLA = (author) => {
  if (!author) return 'Unknown';
  const nameParts = author.trim().split(' ');
  if (nameParts.length === 1) return nameParts[0];
  
  const lastName = nameParts[nameParts.length - 1];
  const firstNames = nameParts.slice(0, -1).join(' ');
  
  return `${lastName}, ${firstNames}`;
};

const formatSingleAuthorChicago = (author) => {
  if (!author) return 'Unknown';
  const nameParts = author.trim().split(' ');
  if (nameParts.length === 1) return nameParts[0];
  
  const lastName = nameParts[nameParts.length - 1];
  const firstNames = nameParts.slice(0, -1).join(' ');
  
  return `${lastName}, ${firstNames}`;
};

const formatFirstNameFirst = (author) => {
  if (!author) return 'Unknown';
  return author.trim();
};

// Main formatting functions for each style

/**
 * Format citation in APA style
 * @param {Object} citation - Citation object
 * @param {string} type - 'inline' or 'bibliography'
 * @returns {string} Formatted citation
 */
export const formatCitationAPA = (citation, type = 'inline') => {
  if (type === 'inline') {
    const authors = formatAuthorNames(citation.authors, 'APA', 2);
    const year = citation.year || 'n.d.';
    
    if (citation.authors && citation.authors.length > 2) {
      const firstAuthor = formatSingleAuthorAPA(citation.authors[0]).split(',')[0];
      return `(${firstAuthor} et al., ${year})`;
    } else if (citation.authors && citation.authors.length === 2) {
      const author1 = formatSingleAuthorAPA(citation.authors[0]).split(',')[0];
      const author2 = formatSingleAuthorAPA(citation.authors[1]).split(',')[0];
      return `(${author1} & ${author2}, ${year})`;
    } else {
      const author = citation.authors && citation.authors[0] 
        ? formatSingleAuthorAPA(citation.authors[0]).split(',')[0]
        : 'Unknown Author';
      return `(${author}, ${year})`;
    }
  }
  
  // Bibliography format
  const authors = formatAuthorNames(citation.authors, 'APA');
  const year = citation.year ? `(${citation.year})` : '(n.d.)';
  const title = citation.title || 'Untitled';
  
  let formatted = `${authors}. ${year}. ${title}`;
  
  if (citation.journal) {
    formatted += `. *${citation.journal}*`;
    if (citation.volume) {
      formatted += `, *${citation.volume}*`;
      if (citation.issue) {
        formatted += `(${citation.issue})`;
      }
    }
    if (citation.pages) {
      formatted += `, ${citation.pages}`;
    }
  }
  
  if (citation.doi) {
    formatted += `. https://doi.org/${citation.doi}`;
  } else if (citation.url) {
    formatted += `. ${citation.url}`;
  }
  
  return formatted + '.';
};

/**
 * Format citation in MLA style
 * @param {Object} citation - Citation object
 * @param {string} type - 'inline' or 'bibliography'
 * @returns {string} Formatted citation
 */
export const formatCitationMLA = (citation, type = 'inline') => {
  if (type === 'inline') {
    const author = citation.authors && citation.authors[0] 
      ? formatSingleAuthorMLA(citation.authors[0]).split(',')[0]
      : 'Unknown Author';
    
    if (citation.pages) {
      return `(${author} ${citation.pages})`;
    }
    return `(${author})`;
  }
  
  // Bibliography format
  const authors = formatAuthorNames(citation.authors, 'MLA');
  const title = citation.title ? `"${citation.title}"` : '"Untitled"';
  
  let formatted = `${authors}. ${title}`;
  
  if (citation.journal) {
    formatted += ` *${citation.journal}*`;
    if (citation.volume) {
      formatted += `, vol. ${citation.volume}`;
      if (citation.issue) {
        formatted += `, no. ${citation.issue}`;
      }
    }
    if (citation.year) {
      formatted += `, ${citation.year}`;
    }
    if (citation.pages) {
      formatted += `, pp. ${citation.pages}`;
    }
  }
  
  if (citation.url) {
    formatted += `. Web. ${new Date().toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    })}.`;
  }
  
  return formatted + '.';
};

/**
 * Format citation in Chicago style
 * @param {Object} citation - Citation object
 * @param {string} type - 'inline' or 'bibliography'
 * @returns {string} Formatted citation
 */
export const formatCitationChicago = (citation, type = 'inline') => {
  if (type === 'inline') {
    const author = citation.authors && citation.authors[0] 
      ? citation.authors[0].split(' ').pop()
      : 'Unknown';
    const year = citation.year || 'n.d.';
    
    if (citation.pages) {
      return `(${author} ${year}, ${citation.pages})`;
    }
    return `(${author} ${year})`;
  }
  
  // Bibliography format
  const authors = formatAuthorNames(citation.authors, 'Chicago');
  const title = citation.title ? `"${citation.title}"` : '"Untitled"';
  
  let formatted = `${authors}. ${title}`;
  
  if (citation.journal) {
    formatted += ` *${citation.journal}*`;
    if (citation.volume) {
      formatted += ` ${citation.volume}`;
      if (citation.issue) {
        formatted += `, no. ${citation.issue}`;
      }
    }
    if (citation.year) {
      formatted += ` (${citation.year})`;
    }
    if (citation.pages) {
      formatted += `: ${citation.pages}`;
    }
  }
  
  if (citation.doi) {
    formatted += `. https://doi.org/${citation.doi}`;
  } else if (citation.url) {
    formatted += `. ${citation.url}`;
  }
  
  return formatted + '.';
};

/**
 * Get available citation styles
 * @returns {Array} Array of citation style objects
 */
export const getCitationStyles = () => [
  { value: 'APA', label: 'APA 7th Edition', description: 'American Psychological Association' },
  { value: 'MLA', label: 'MLA 9th Edition', description: 'Modern Language Association' },
  { value: 'Chicago', label: 'Chicago 17th Edition', description: 'Chicago Manual of Style' }
];

/**
 * Format a complete bibliography for multiple citations
 * @param {Array} citations - Array of citation objects
 * @param {string} style - Citation style ('APA', 'MLA', 'Chicago')
 * @param {string} sortOrder - Sort order ('alphabetical', 'chronological', etc.)
 * @returns {string} Formatted bibliography
 */
export const formatBibliography = (citations, style = 'APA', sortOrder = 'alphabetical') => {
  if (!citations || citations.length === 0) return '';
  
  // Sort citations
  const sorted = [...citations].sort((a, b) => {
    switch (sortOrder) {
      case 'alphabetical':
        const authorA = a.authors && a.authors[0] ? a.authors[0] : '';
        const authorB = b.authors && b.authors[0] ? b.authors[0] : '';
        return authorA.localeCompare(authorB);
      case 'chronological':
        return (b.year || 0) - (a.year || 0);
      case 'reverse-chronological':
        return (a.year || 0) - (b.year || 0);
      default:
        return 0;
    }
  });
  
  // Format each citation
  const formatter = {
    'APA': formatCitationAPA,
    'MLA': formatCitationMLA,
    'Chicago': formatCitationChicago
  }[style] || formatCitationAPA;
  
  const formattedEntries = sorted.map(citation => formatter(citation, 'bibliography'));
  
  // Add appropriate header
  const header = style === 'MLA' ? 'Works Cited' : 'References';
  
  return `${header}\n\n${formattedEntries.join('\n\n')}`;
};
