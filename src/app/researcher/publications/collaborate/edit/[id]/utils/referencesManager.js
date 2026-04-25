/**
 * References Manager Utility
 * Handles automatic reference list generation and management
 */

import {
  formatCitationAPA,
  formatCitationMLA,
  formatCitationChicago,
  formatCitationHarvard,
  formatCitationVancouver,
  formatCitationIEEE,
  formatCitationAMA
} from '@/utils/citationFormatters';

/**
 * Find the References section in the document
 * @param {Editor} editor - TipTap editor instance
 * @returns {Object|null} - { pos, node } or null if not found
 */
export function findReferencesSection(editor) {
  if (!editor) return null;

  const { doc } = editor.state;
  let referencesPos = null;
  let referencesNode = null;

  doc.descendants((node, pos) => {
    if (node.type.name === 'heading' && node.attrs.level === 1) {
      const text = node.textContent.toLowerCase().trim();
      if (text === 'references' || text === 'bibliography' || text === 'works cited') {
        referencesPos = pos;
        referencesNode = node;
        return false; // Stop searching
      }
    }
  });

  return referencesPos !== null ? { pos: referencesPos, node: referencesNode } : null;
}

/**
 * Ensure References section exists, create if not found
 * @param {Editor} editor - TipTap editor instance
 * @returns {number} - Position where reference content should be inserted
 */
export function ensureReferencesSection(editor) {
  if (!editor) return null;

  const existing = findReferencesSection(editor);
  
  if (existing) {
    // Return position after the heading
    return existing.pos + existing.node.nodeSize;
  }

  // Create new References section at end of document
  const { doc } = editor.state;
  const endPos = doc.content.size;

  editor
    .chain()
    .focus()
    .setTextSelection(endPos)
    .insertContent([
      { type: 'paragraph', content: [] }, // Spacing
      { type: 'paragraph', content: [] }, // Spacing
      { 
        type: 'heading', 
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'References' }]
      },
      { type: 'paragraph', content: [] }, // Spacing after heading
    ])
    .run();

  // Return position after the new heading (for content insertion)
  const newDoc = editor.state.doc;
  const newReferences = findReferencesSection(editor);
  
  return newReferences ? newReferences.pos + newReferences.node.nodeSize : null;
}

/**
 * Extract all citations from the document
 * @param {Editor} editor - TipTap editor instance
 * @returns {Set} - Set of citation IDs
 */
export function extractCitationsFromDocument(editor) {
  if (!editor) return new Set();

  const citationIds = new Set();
  const { doc } = editor.state;

  doc.descendants((node) => {
    if (node.marks) {
      node.marks.forEach((mark) => {
        if (mark.type.name === 'citationMark' && mark.attrs.citationId) {
          citationIds.add(mark.attrs.citationId);
        }
      });
    }
  });

  return citationIds;
}

/**
 * Format a single citation based on style
 * @param {Object} citation - Citation data
 * @param {string} style - Citation style (APA, MLA, etc.)
 * @returns {string} - Formatted citation
 */
function formatSingleCitation(citation, style) {
  const formatters = {
    'APA': formatCitationAPA,
    'MLA': formatCitationMLA,
    'Chicago': formatCitationChicago,
    'Harvard': formatCitationHarvard,
    'Vancouver': formatCitationVancouver,
    'IEEE': formatCitationIEEE,
    'AMA': formatCitationAMA,
  };

  const formatter = formatters[style] || formatCitationAPA;
  return formatter(citation);
}

/**
 * Sort citations based on style requirements
 * @param {Array} citations - Array of citation objects
 * @param {string} style - Citation style
 * @returns {Array} - Sorted citations
 */
function sortCitations(citations, style) {
  // Vancouver, IEEE, AMA use order of appearance (handled elsewhere)
  // APA, MLA, Chicago, Harvard use alphabetical by author
  
  if (['Vancouver', 'IEEE', 'AMA'].includes(style)) {
    return citations; // Keep order of appearance
  }

  // Alphabetical sort by first author's last name
  return [...citations].sort((a, b) => {
    const authorA = a.authors?.[0]?.familyName || a.authors?.[0]?.name || '';
    const authorB = b.authors?.[0]?.familyName || b.authors?.[0]?.name || '';
    return authorA.localeCompare(authorB);
  });
}

/**
 * Generate formatted reference list
 * @param {Array} citations - Array of citation objects with full data
 * @param {string} style - Citation style
 * @returns {string} - Formatted reference list as HTML
 */
export function generateReferenceList(citations, style = 'APA') {
  if (!citations || citations.length === 0) {
    return '<p><em>No references</em></p>';
  }

  const sortedCitations = sortCitations(citations, style);
  
  // For numbered styles, add numbers
  if (['Vancouver', 'IEEE', 'AMA'].includes(style)) {
    const formattedRefs = sortedCitations.map((citation, index) => {
      const formatted = formatSingleCitation(citation, style);
      return `<p>${index + 1}. ${formatted}</p>`;
    });
    return formattedRefs.join('');
  }

  // For other styles, just list them
  const formattedRefs = sortedCitations.map((citation) => {
    const formatted = formatSingleCitation(citation, style);
    return `<p>${formatted}</p>`;
  });

  return formattedRefs.join('');
}

/**
 * Update the reference list in the document
 * @param {Editor} editor - TipTap editor instance
 * @param {Array} citations - Array of citation objects
 * @param {string} style - Citation style
 */
export function updateReferenceList(editor, citations, style = 'APA') {
  if (!editor) return;

  // Ensure References section exists
  const contentPos = ensureReferencesSection(editor);
  if (contentPos === null) return;

  // Generate formatted reference list
  const formattedRefs = generateReferenceList(citations, style);

  // Find the References heading again (position may have changed)
  const referencesSection = findReferencesSection(editor);
  if (!referencesSection) return;

  const { doc } = editor.state;
  const startPos = referencesSection.pos + referencesSection.node.nodeSize;

  // Find the end of the references section (next heading or end of document)
  let endPos = doc.content.size;
  let foundNextHeading = false;

  doc.nodesBetween(startPos, doc.content.size, (node, pos) => {
    if (!foundNextHeading && node.type.name === 'heading' && pos > startPos) {
      endPos = pos;
      foundNextHeading = true;
      return false; // Stop iteration
    }
  });

  // Delete old content and insert new
  editor
    .chain()
    .focus()
    .deleteRange({ from: startPos, to: endPos })
    .setTextSelection(startPos)
    .insertContent(formattedRefs)
    .run();
}

/**
 * Remove the References section from the document
 * @param {Editor} editor - TipTap editor instance
 */
export function removeReferencesSection(editor) {
  if (!editor) return;

  const referencesSection = findReferencesSection(editor);
  if (!referencesSection) return;

  const { doc } = editor.state;
  const startPos = referencesSection.pos;

  // Find the end of the references section
  let endPos = doc.content.size;
  let foundNextHeading = false;

  doc.nodesBetween(startPos + referencesSection.node.nodeSize, doc.content.size, (node, pos) => {
    if (!foundNextHeading && node.type.name === 'heading') {
      endPos = pos;
      foundNextHeading = true;
      return false;
    }
  });

  // Delete the entire section
  editor
    .chain()
    .focus()
    .deleteRange({ from: startPos, to: endPos })
    .run();
}
