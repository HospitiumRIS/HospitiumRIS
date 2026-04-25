export const PAGE_SIZES = {
  A4: {
    width: 210,
    height: 297,
    widthPx: 794,
    heightPx: 1123,
  },
  Letter: {
    width: 215.9,
    height: 279.4,
    widthPx: 816,
    heightPx: 1056,
  },
  Legal: {
    width: 215.9,
    height: 355.6,
    widthPx: 816,
    heightPx: 1344,
  },
};

export const DEFAULT_MARGINS = {
  top: 72,
  right: 72,
  bottom: 72,
  left: 72,
};

export const PAGE_NUMBER_POSITIONS = {
  'bottom-center': { bottom: '20px', left: '50%', transform: 'translateX(-50%)' },
  'bottom-right': { bottom: '20px', right: '20px' },
  'bottom-left': { bottom: '20px', left: '20px' },
  'top-center': { top: '20px', left: '50%', transform: 'translateX(-50%)' },
  'top-right': { top: '20px', right: '20px' },
  'top-left': { top: '20px', left: '20px' },
};

export function getPageDimensions(pageSize, orientation = 'portrait') {
  const size = PAGE_SIZES[pageSize] || PAGE_SIZES.A4;
  
  if (orientation === 'landscape') {
    return {
      width: size.height,
      height: size.width,
      widthPx: size.heightPx,
      heightPx: size.widthPx,
    };
  }
  
  return size;
}

export function calculateContentHeight(pageSize, orientation, margins) {
  const dimensions = getPageDimensions(pageSize, orientation);
  const contentHeight = dimensions.heightPx - margins.top - margins.bottom;
  return contentHeight;
}

export function calculateWordsPerPage(pageSize, orientation, margins, averageWordsPerLine = 12, averageLineHeight = 20) {
  const contentHeight = calculateContentHeight(pageSize, orientation, margins);
  const linesPerPage = Math.floor(contentHeight / averageLineHeight);
  return linesPerPage * averageWordsPerLine;
}

export function countWords(text) {
  if (!text) return 0;
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

export function countWordsInDocument(doc) {
  let totalWords = 0;
  
  doc.descendants((node) => {
    if (node.isText) {
      totalWords += countWords(node.text);
    }
  });
  
  return totalWords;
}

export function estimatePageCount(wordCount, wordsPerPage) {
  return Math.ceil(wordCount / wordsPerPage);
}

export function findPageBreaks(doc) {
  const pageBreaks = [];
  
  doc.descendants((node, pos) => {
    if (node.type.name === 'pageBreak') {
      pageBreaks.push({ pos, node });
    }
  });
  
  return pageBreaks;
}

export function getCurrentPage(doc, currentPos) {
  let pageNumber = 1;
  
  doc.nodesBetween(0, currentPos, (node) => {
    if (node.type.name === 'pageBreak') {
      pageNumber++;
    }
  });
  
  return pageNumber;
}

export function getPageNumberStyle(position) {
  return PAGE_NUMBER_POSITIONS[position] || PAGE_NUMBER_POSITIONS['bottom-center'];
}

export function generatePrintCSS(pageSize, orientation, margins) {
  const dimensions = getPageDimensions(pageSize, orientation);
  
  return `
    @media print {
      @page {
        size: ${pageSize} ${orientation};
        margin: ${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px;
      }
      
      .page-break {
        page-break-after: always;
        break-after: page;
      }
      
      .page-number {
        display: none;
      }
      
      .ProseMirror {
        width: ${dimensions.widthPx}px;
        max-width: 100%;
      }
    }
  `;
}

export function shouldInsertPageBreak(currentWordCount, wordsPerPage, threshold = 0.95) {
  return currentWordCount >= wordsPerPage * threshold;
}

export function findOptimalPageBreakPosition(doc, startPos, targetWordCount) {
  let wordCount = 0;
  let optimalPos = null;
  
  doc.nodesBetween(startPos, doc.content.size, (node, pos) => {
    if (node.isText) {
      const words = countWords(node.text);
      wordCount += words;
      
      if (wordCount >= targetWordCount && node.isBlock) {
        optimalPos = pos + node.nodeSize;
        return false;
      }
    }
  });
  
  return optimalPos;
}

export default {
  PAGE_SIZES,
  DEFAULT_MARGINS,
  PAGE_NUMBER_POSITIONS,
  getPageDimensions,
  calculateContentHeight,
  calculateWordsPerPage,
  countWords,
  countWordsInDocument,
  estimatePageCount,
  findPageBreaks,
  getCurrentPage,
  getPageNumberStyle,
  generatePrintCSS,
  shouldInsertPageBreak,
  findOptimalPageBreakPosition,
};
