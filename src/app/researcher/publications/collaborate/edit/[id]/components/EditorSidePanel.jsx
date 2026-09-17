'use client';

import { Collapse } from '@mui/material';

/**
 * Shared open/close animation for the editor's right-hand panels.
 * Width eases in so the page canvas shrinks with the panel, rather than jumping.
 */
export default function EditorSidePanel({ open, children }) {
  return (
    <Collapse
      in={open}
      orientation="horizontal"
      timeout={280}
      unmountOnExit
      sx={{
        height: '100%',
        '& .MuiCollapse-wrapper': {
          height: '100% !important'
        },
        '& .MuiCollapse-wrapperInner': {
          height: '100%',
          display: 'flex'
        }
      }}
    >
      {children}
    </Collapse>
  );
}
