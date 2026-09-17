'use client';

import { useMemo } from 'react';
import { Box } from '@mui/material';
import { getPageDimensions, DEFAULT_MARGINS, PAGE_GAP } from '../utils/paginationHelper';

const CANVAS_BG = '#e8eaed';
const SHEET_SHADOW = '0 1px 3px rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)';
const PAGELESS_MAX_WIDTH = 1000;

function footerAlignment(position = 'bottom-center') {
  if (position.endsWith('left')) return 'flex-start';
  if (position.endsWith('right')) return 'flex-end';
  return 'center';
}

/**
 * Word / Google Docs style page canvas.
 *
 * Renders the editor on top of a stack of white page sheets sized from the
 * active page settings. The sheets are purely visual: content flows as a
 * single document and the Pagination extension injects spacers so that text
 * skips over the gap between two sheets.
 */
export default function DocumentPageCanvas({
  paginated = true,
  pageSize = 'A4',
  orientation = 'portrait',
  margins = DEFAULT_MARGINS,
  pageGap = PAGE_GAP,
  pageCount = 1,
  showPageNumbers = true,
  pageNumberPosition = 'bottom-center',
  children,
}) {
  const dimensions = useMemo(
    () => getPageDimensions(pageSize, orientation),
    [pageSize, orientation]
  );

  const safePageCount = Math.max(1, pageCount || 1);
  const numbersAtTop = pageNumberPosition.startsWith('top');

  if (!paginated) {
    return (
      <Box
        className="document-canvas document-canvas-pageless"
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          bgcolor: CANVAS_BG,
          px: 3,
          py: 3,
        }}
      >
        <Box
          className="page-sheet"
          sx={{
            maxWidth: PAGELESS_MAX_WIDTH,
            minHeight: 'calc(100% - 8px)',
            mx: 'auto',
            bgcolor: 'white',
            boxShadow: SHEET_SHADOW,
            borderRadius: '2px',
            '& .ProseMirror': {
              paddingTop: '48px',
              paddingBottom: '48px',
              paddingLeft: `${margins.left}px`,
              paddingRight: `${margins.right}px`,
              minHeight: '400px',
            },
          }}
        >
          {children}
        </Box>
      </Box>
    );
  }

  const stackHeight =
    safePageCount * dimensions.heightPx + (safePageCount - 1) * pageGap;

  return (
    <Box
      className="document-canvas"
      sx={{
        flexGrow: 1,
        overflow: 'auto',
        bgcolor: CANVAS_BG,
        py: `${pageGap}px`,
        px: 2,
      }}
    >
      <Box
        className="page-stack"
        sx={{
          position: 'relative',
          width: dimensions.widthPx,
          maxWidth: '100%',
          mx: 'auto',
        }}
      >
        {/* Page sheets: visual paper behind the editable content */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            pointerEvents: 'none',
          }}
        >
          {Array.from({ length: safePageCount }, (_, index) => (
            <Box
              key={index}
              className="page-sheet"
              sx={{
                height: dimensions.heightPx,
                mb: index === safePageCount - 1 ? 0 : `${pageGap}px`,
                bgcolor: 'white',
                boxShadow: SHEET_SHADOW,
                borderRadius: '2px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: numbersAtTop ? 'flex-start' : 'flex-end',
              }}
            >
              {showPageNumbers && (
                <Box
                  className="page-sheet-footer"
                  sx={{
                    display: 'flex',
                    justifyContent: footerAlignment(pageNumberPosition),
                    px: `${Math.max(24, margins.left / 2)}px`,
                    py: '18px',
                    fontSize: '0.7rem',
                    color: '#80868b',
                    letterSpacing: '0.02em',
                    userSelect: 'none',
                  }}
                >
                  {`${index + 1} / ${safePageCount}`}
                </Box>
              )}
            </Box>
          ))}
        </Box>

        {/* Editable content flowing on top of the sheets */}
        <Box
          className="page-stack-content"
          sx={{
            position: 'relative',
            zIndex: 1,
            minHeight: stackHeight,
            '& .ProseMirror': {
              boxSizing: 'content-box',
              paddingTop: `${margins.top}px`,
              paddingBottom: `${margins.bottom}px`,
              paddingLeft: `${margins.left}px`,
              paddingRight: `${margins.right}px`,
              // An empty document still occupies a full sheet
              minHeight: Math.max(
                0,
                dimensions.heightPx - margins.top - margins.bottom
              ),
            },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
