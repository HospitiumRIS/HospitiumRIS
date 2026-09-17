'use client';

import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Tooltip,
  Chip,
  Button,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  AutoAwesome as MagicWandIcon,
  MenuBook as LibraryIcon
} from '@mui/icons-material';

const PANEL_WIDTH = 320;

/**
 * Docked "Cite as You Write" panel.
 *
 * Typing @keyword or cite: keyword in the document streams matches here
 * instead of opening a popup over the text.
 */
export default function CiteAsYouWritePanel({
  triggerActive = false,
  search = '',
  onSearchChange,
  citations = [],
  loading = false,
  error = null,
  selectedIndex = 0,
  onSelectedIndexChange,
  onInsert,
  onDismiss,
  onOpenLibrary,
  citationStyle = 'APA',
  formatCitation
}) {
  const handleSearchKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      onSelectedIndexChange(selectedIndex < citations.length - 1 ? selectedIndex + 1 : 0);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      onSelectedIndexChange(selectedIndex > 0 ? selectedIndex - 1 : citations.length - 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (citations[selectedIndex]) {
        onInsert(citations[selectedIndex]);
      }
    } else if (event.key === 'Escape') {
      onDismiss();
    }
  };

  const renderResults = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={22} sx={{ color: '#8b6cbc' }} />
        </Box>
      );
    }

    if (error) {
      return (
        <Typography sx={{ fontSize: '0.8rem', color: '#c62828', px: 1.5, py: 2 }}>
          {error}
        </Typography>
      );
    }

    if (citations.length === 0) {
      return (
        <Box sx={{ px: 1.5, py: 3, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '0.8rem', color: '#666', mb: 0.5 }}>
            {search ? `No citations match "${search}"` : 'No suggestions yet'}
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: '#999', lineHeight: 1.5 }}>
            Type <strong>@keyword</strong> or <strong>cite: keyword</strong> while writing, or search
            above to find a source.
          </Typography>
          {onOpenLibrary && (
            <Button
              size="small"
              startIcon={<LibraryIcon fontSize="small" />}
              onClick={onOpenLibrary}
              sx={{
                mt: 1.5,
                textTransform: 'none',
                fontSize: '0.75rem',
                color: '#8b6cbc'
              }}
            >
              Browse citation library
            </Button>
          )}
        </Box>
      );
    }

    return citations.map((citation, index) => (
      <Box
        key={citation.id}
        onClick={() => onInsert(citation)}
        onMouseEnter={() => onSelectedIndexChange(index)}
        sx={{
          p: 1.25,
          mb: 0.75,
          cursor: 'pointer',
          borderRadius: 1.5,
          bgcolor: index === selectedIndex ? 'rgba(139, 108, 188, 0.08)' : 'white',
          border: index === selectedIndex ? '1px solid #8b6cbc' : '1px solid #ececec',
          transition: 'background-color 0.15s ease',
          '&:hover': { bgcolor: 'rgba(139, 108, 188, 0.08)' }
        }}
      >
        <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', lineHeight: 1.3, mb: 0.5 }}>
          {citation.title}
        </Typography>

        <Typography sx={{ fontSize: '0.72rem', color: '#666', display: 'block', mb: 0.5 }}>
          {Array.isArray(citation.authors) ? citation.authors.join(', ') : citation.authors}
        </Typography>

        <Typography sx={{ fontSize: '0.7rem', color: '#8b6cbc', fontWeight: 500 }}>
          {citation.type === 'journal' && citation.journal && `${citation.journal}, ${citation.year}`}
          {citation.type === 'book' && `${citation.publisher}, ${citation.year}`}
          {citation.type === 'conference' && `${citation.conference}, ${citation.year}`}
          {citation.type === 'book_chapter' && `${citation.book}, ${citation.year}`}
        </Typography>

        {formatCitation && (
          <Typography
            sx={{
              fontSize: '0.7rem',
              color: '#999',
              fontStyle: 'italic',
              mt: 0.5,
              display: 'block'
            }}
          >
            Inserts {formatCitation(citation)}
          </Typography>
        )}
      </Box>
    ));
  };

  return (
    <Paper
      sx={{
        width: PANEL_WIDTH,
        minWidth: PANEL_WIDTH,
        height: '100%',
        borderRadius: 0,
        borderLeft: '1px solid #e8e8e8',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: '#fafbfc',
        animation: 'editorPanelFade 280ms ease',
        '@keyframes editorPanelFade': {
          from: { opacity: 0, transform: 'translateX(16px)' },
          to: { opacity: 1, transform: 'translateX(0)' }
        }
      }}
    >
      <Box sx={{ p: 1.5, bgcolor: 'white', borderBottom: '1px solid #e8e8e8' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 1.5,
              bgcolor: '#8b6cbc15',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <MagicWandIcon sx={{ fontSize: 16, color: '#8b6cbc' }} />
          </Box>

          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#333' }}>
              Cite as You Write
            </Typography>
          </Box>

          {triggerActive && (
            <Chip
              size="small"
              label="Listening"
              sx={{
                height: 18,
                fontSize: '0.62rem',
                fontWeight: 600,
                bgcolor: '#e8f5e8',
                color: '#2e7d32'
              }}
            />
          )}

          <Tooltip title="Hide panel">
            <IconButton size="small" onClick={onDismiss} sx={{ color: '#888' }}>
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>

        <TextField
          size="small"
          fullWidth
          placeholder="Search by title, author, or year"
          value={search}
          onChange={(e) => {
            onSearchChange(e.target.value);
            onSelectedIndexChange(0);
          }}
          onKeyDown={handleSearchKeyDown}
          sx={{
            '& .MuiOutlinedInput-root': {
              fontSize: '0.8rem',
              bgcolor: 'white'
            }
          }}
        />
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1.25 }}>
        {renderResults()}
      </Box>

      <Box
        sx={{
          px: 1.5,
          py: 1,
          borderTop: '1px solid #e8e8e8',
          bgcolor: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1
        }}
      >
        <Typography sx={{ fontSize: '0.68rem', color: '#888' }}>
          Style: {citationStyle}
        </Typography>
        <Typography sx={{ fontSize: '0.68rem', color: '#aaa' }}>
          ↑↓ Navigate • Enter Insert
        </Typography>
      </Box>
    </Paper>
  );
}
