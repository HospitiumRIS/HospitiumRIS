'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Menu,
  MenuItem as MuiMenuItem,
  ListItemIcon,
  Divider,
  Typography
} from '@mui/material';
import {
  Save as SaveIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  FileDownload as FileDownloadIcon,
  FileOpen as FileOpenIcon,
  CreateNewFolder as CreateNewFolderIcon,
  PictureAsPdf as PdfIcon,
  Description as WordIcon,
  AutoMode as AutosaveIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  ContentCut as CutIcon,
  ContentCopy as CopyIcon,
  ContentPaste as PasteIcon,
  FindReplace as FindReplaceIcon,
  SelectAll as SelectAllIcon,
  Fullscreen as FullscreenIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusWeak as ResetZoomIcon,
  Visibility as VisibilityIcon,
  ViewList as ViewListIcon,
  Comment as CommentIcon,
  TrackChanges as TrackChangesIcon,
  Link as LinkIcon,
  Image as ImageIcon,
  TableChart as TableIcon,
  BookmarkAdd as BookmarkAddIcon,
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatUnderlined as UnderlineIcon,
  FormatSize as FormatSizeIcon,
  FormatColorText as TextColorIcon,
  Highlight as HighlightIcon,
  FormatClear as ClearFormatIcon,
  Spellcheck as SpellcheckIcon,
  Translate as TranslateIcon,
  Edit as EditIcon,
  HorizontalRule as HorizontalRuleIcon,
  FontDownload as SpecialCharsIcon,
  InsertPageBreak as PageBreakIcon,
  GridOn as TableGridIcon,
  GetApp as ImportIcon,
  Settings as TablePropsIcon,
  Superscript as SuperscriptIcon,
  Subscript as SubscriptIcon,
  StrikethroughS as StrikethroughIcon,
  FormatAlignLeft as AlignLeftIcon,
  FormatAlignCenter as AlignCenterIcon,
  FormatAlignRight as AlignRightIcon,
  FormatAlignJustify as AlignJustifyIcon,
  FormatLineSpacing as LineSpacingIcon,
  FormatListBulleted as BulletListIcon,
  FormatListNumbered as NumberedListIcon,
  FormatQuote as BlockquoteIcon,
  FormatIndentIncrease as IncreaseIndentIcon,
  FormatIndentDecrease as DecreaseIndentIcon,
  Title as H1Icon,
  ViewHeadline as H2Icon,
  Subject as H3Icon,
  FontDownload as FontIcon,
  Palette as ColorIcon,
  RateReview as GrammarCheckIcon,
  Language as LanguageIcon,
  CheckCircle as AcceptIcon,
  Cancel as RejectIcon
} from '@mui/icons-material';

export default function DocumentMenuBar({ 
  onFileAction, 
  onEditAction, 
  onViewAction, 
  onInsertAction, 
  onFormatAction,
  onReviewAction,
  autosaveEnabled,
  editor,
  showComments,
  // Menu anchor setters for menus not yet implemented in this component
  setCitationMenuAnchor,
  onTableProperties
}) {
  // Menu dropdown states (only for menus implemented in this component)
  const [fileMenuAnchor, setFileMenuAnchor] = useState(null);
  const [editMenuAnchor, setEditMenuAnchor] = useState(null);
  const [viewMenuAnchor, setViewMenuAnchor] = useState(null);
  const [insertMenuAnchor, setInsertMenuAnchor] = useState(null);
  const [tableSubMenuAnchor, setTableSubMenuAnchor] = useState(null);
  const [quickTablesAnchor, setQuickTablesAnchor] = useState(null);
  const [tableTemplatesAnchor, setTableTemplatesAnchor] = useState(null);
  const [formatMenuAnchor, setFormatMenuAnchor] = useState(null);
  const [textAlignAnchor, setTextAlignAnchor] = useState(null);
  const [lineSpacingAnchor, setLineSpacingAnchor] = useState(null);
  const [headingsAnchor, setHeadingsAnchor] = useState(null);
  const [fontAnchor, setFontAnchor] = useState(null);
  const [textColorAnchor, setTextColorAnchor] = useState(null);
  const [reviewMenuAnchor, setReviewMenuAnchor] = useState(null);

  // Timeout refs for delayed hover effects
  const quickTablesTimeoutRef = useRef(null);
  const tableTemplatesTimeoutRef = useRef(null);
  const textAlignTimeoutRef = useRef(null);
  const lineSpacingTimeoutRef = useRef(null);
  const headingsTimeoutRef = useRef(null);
  const fontTimeoutRef = useRef(null);
  const textColorTimeoutRef = useRef(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (quickTablesTimeoutRef.current) {
        clearTimeout(quickTablesTimeoutRef.current);
      }
      if (tableTemplatesTimeoutRef.current) {
        clearTimeout(tableTemplatesTimeoutRef.current);
      }
      if (textAlignTimeoutRef.current) {
        clearTimeout(textAlignTimeoutRef.current);
      }
      if (lineSpacingTimeoutRef.current) {
        clearTimeout(lineSpacingTimeoutRef.current);
      }
      if (headingsTimeoutRef.current) {
        clearTimeout(headingsTimeoutRef.current);
      }
      if (fontTimeoutRef.current) {
        clearTimeout(fontTimeoutRef.current);
      }
      if (textColorTimeoutRef.current) {
        clearTimeout(textColorTimeoutRef.current);
      }
    };
  }, []);

  const menuButtonStyle = {
    color: '#333', 
    textTransform: 'none',
    fontSize: '0.875rem',
    fontWeight: 400,
    px: 2,
    py: 0.5,
    '&:hover': { bgcolor: '#e0e0e0' }
  };

  // Simple table submenu hover behavior - fixed
  const handleTableMenuEnter = (e) => {
    setTableSubMenuAnchor(e.currentTarget);
  };

  const handleInsertMenuClose = () => {
    setInsertMenuAnchor(null);
    setTableSubMenuAnchor(null);
    setQuickTablesAnchor(null);
    setTableTemplatesAnchor(null);
  };

  // Format menu handlers
  const handleFormatMenuClose = () => {
    setFormatMenuAnchor(null);
    setTextAlignAnchor(null);
    setLineSpacingAnchor(null);
    setHeadingsAnchor(null);
    setFontAnchor(null);
    setTextColorAnchor(null);
  };

  // Close all format submenus except the specified one
  const closeOtherFormatSubmenus = (except = null) => {
    if (except !== 'textAlign') setTextAlignAnchor(null);
    if (except !== 'lineSpacing') setLineSpacingAnchor(null);
    if (except !== 'headings') setHeadingsAnchor(null);
    if (except !== 'font') setFontAnchor(null);
    if (except !== 'textColor') setTextColorAnchor(null);
  };

  // Format submenu hover behavior with minimal delays
  const handleTextAlignEnter = (e) => {
    if (textAlignTimeoutRef.current) {
      clearTimeout(textAlignTimeoutRef.current);
    }
    closeOtherFormatSubmenus('textAlign');
    setTextAlignAnchor(e.currentTarget);
  };

  const handleTextAlignLeave = () => {
    if (textAlignTimeoutRef.current) {
      clearTimeout(textAlignTimeoutRef.current);
    }
    textAlignTimeoutRef.current = setTimeout(() => {
      setTextAlignAnchor(null);
    }, 150);
  };

  const handleLineSpacingEnter = (e) => {
    if (lineSpacingTimeoutRef.current) {
      clearTimeout(lineSpacingTimeoutRef.current);
    }
    closeOtherFormatSubmenus('lineSpacing');
    setLineSpacingAnchor(e.currentTarget);
  };

  const handleLineSpacingLeave = () => {
    if (lineSpacingTimeoutRef.current) {
      clearTimeout(lineSpacingTimeoutRef.current);
    }
    lineSpacingTimeoutRef.current = setTimeout(() => {
      setLineSpacingAnchor(null);
    }, 150);
  };

  const handleHeadingsEnter = (e) => {
    if (headingsTimeoutRef.current) {
      clearTimeout(headingsTimeoutRef.current);
    }
    closeOtherFormatSubmenus('headings');
    setHeadingsAnchor(e.currentTarget);
  };

  const handleHeadingsLeave = () => {
    if (headingsTimeoutRef.current) {
      clearTimeout(headingsTimeoutRef.current);
    }
    headingsTimeoutRef.current = setTimeout(() => {
      setHeadingsAnchor(null);
    }, 150);
  };

  const handleFontEnter = (e) => {
    if (fontTimeoutRef.current) {
      clearTimeout(fontTimeoutRef.current);
    }
    closeOtherFormatSubmenus('font');
    setFontAnchor(e.currentTarget);
  };

  const handleFontLeave = () => {
    if (fontTimeoutRef.current) {
      clearTimeout(fontTimeoutRef.current);
    }
    fontTimeoutRef.current = setTimeout(() => {
      setFontAnchor(null);
    }, 150);
  };

  const handleTextColorEnter = (e) => {
    if (textColorTimeoutRef.current) {
      clearTimeout(textColorTimeoutRef.current);
    }
    closeOtherFormatSubmenus('textColor');
    setTextColorAnchor(e.currentTarget);
  };

  const handleTextColorLeave = () => {
    if (textColorTimeoutRef.current) {
      clearTimeout(textColorTimeoutRef.current);
    }
    textColorTimeoutRef.current = setTimeout(() => {
      setTextColorAnchor(null);
    }, 150);
  };

  // Quick Tables submenu behavior with delay
  const handleQuickTablesEnter = (e) => {
    // Clear any existing timeout
    if (quickTablesTimeoutRef.current) {
      clearTimeout(quickTablesTimeoutRef.current);
    }
    
    quickTablesTimeoutRef.current = setTimeout(() => {
      setQuickTablesAnchor(e.currentTarget);
    }, 300); // 300ms delay to prevent accidental opening
  };

  const handleQuickTablesLeave = () => {
    // Clear the enter timeout if it's still pending
    if (quickTablesTimeoutRef.current) {
      clearTimeout(quickTablesTimeoutRef.current);
    }
    
    quickTablesTimeoutRef.current = setTimeout(() => {
      setQuickTablesAnchor(null);
    }, 150); // Slightly longer delay to allow moving to submenu
  };

  const handleQuickTableSelect = (rows, cols, type) => {
    // Create table with specific dimensions
    onInsertAction('quick-table', { rows, cols, type });
    setQuickTablesAnchor(null);
    setTableSubMenuAnchor(null);
    setInsertMenuAnchor(null);
  };

  // Table Templates submenu behavior with delay
  const handleTableTemplatesEnter = (e) => {
    // Clear any existing timeout
    if (tableTemplatesTimeoutRef.current) {
      clearTimeout(tableTemplatesTimeoutRef.current);
    }
    
    tableTemplatesTimeoutRef.current = setTimeout(() => {
      setTableTemplatesAnchor(e.currentTarget);
    }, 300); // 300ms delay to prevent accidental opening
  };

  const handleTableTemplatesLeave = () => {
    // Clear the enter timeout if it's still pending
    if (tableTemplatesTimeoutRef.current) {
      clearTimeout(tableTemplatesTimeoutRef.current);
    }
    
    tableTemplatesTimeoutRef.current = setTimeout(() => {
      setTableTemplatesAnchor(null);
    }, 150); // Slightly longer delay to allow moving to submenu
  };

  const handleTableTemplateSelect = (templateType) => {
    // Create table with specific template
    onInsertAction('table-template', { templateType });
    setTableTemplatesAnchor(null);
    setTableSubMenuAnchor(null);
    setInsertMenuAnchor(null);
  };

  return (
    <>
      <Paper sx={{ 
        borderRadius: 0,
        borderBottom: '1px solid #e0e0e0',
        bgcolor: '#fafafa'
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          px: 2, 
          py: 0.5,
          minHeight: 40
        }}>
          {/* Menu Buttons */}
          <Button size="small" onClick={(e) => setFileMenuAnchor(e.currentTarget)} sx={menuButtonStyle}>
            File
          </Button>
          <Button size="small" onClick={(e) => setEditMenuAnchor(e.currentTarget)} sx={menuButtonStyle}>
            Edit
          </Button>
          <Button size="small" onClick={(e) => setViewMenuAnchor(e.currentTarget)} sx={menuButtonStyle}>
            View
          </Button>
          <Button size="small" onClick={(e) => setInsertMenuAnchor(e.currentTarget)} sx={menuButtonStyle}>
            Insert
          </Button>
          <Button size="small" onClick={(e) => setFormatMenuAnchor(e.currentTarget)} sx={menuButtonStyle}>
            Format
          </Button>
          <Button size="small" onClick={(e) => setReviewMenuAnchor(e.currentTarget)} sx={menuButtonStyle}>
            Review
          </Button>
          <Button size="small" onClick={(e) => setCitationMenuAnchor && setCitationMenuAnchor(e.currentTarget)} sx={menuButtonStyle}>
            Citation
          </Button>
        </Box>
      </Paper>

      {/* File Menu */}
      <Menu
        anchorEl={fileMenuAnchor}
        open={Boolean(fileMenuAnchor)}
        onClose={() => setFileMenuAnchor(null)}
        sx={{
          '& .MuiPaper-root': {
            minWidth: 240,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1,
              fontSize: '0.875rem',
              '&:hover': { bgcolor: '#f5f5f5' },
            },
          },
        }}
      >
        <MuiMenuItem onClick={() => { onFileAction('new'); setFileMenuAnchor(null); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <Box sx={{ 
              width: 20, height: 20, border: '2px solid #666', borderRadius: 0.5,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '10px', fontWeight: 'bold'
            }}>+</Box>
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>New Document</Box>
          <Typography variant="caption" color="textSecondary" sx={{ ml: 2, fontSize: '0.75rem' }}>
            Ctrl+N
          </Typography>
        </MuiMenuItem>

        <MuiMenuItem onClick={() => { onFileAction('open'); setFileMenuAnchor(null); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <Box sx={{ 
              width: 20, height: 20, border: '2px solid #666', borderRadius: 0.5,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Box sx={{ width: 8, height: 6, bgcolor: '#666', borderRadius: 0.25 }} />
            </Box>
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Open</Box>
          <Typography variant="caption" color="textSecondary" sx={{ ml: 2, fontSize: '0.75rem' }}>
            Ctrl+O
          </Typography>
        </MuiMenuItem>

        <Divider sx={{ my: 0.5 }} />

        <MuiMenuItem onClick={() => { onFileAction('save'); setFileMenuAnchor(null); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <SaveIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Save</Box>
          <Typography variant="caption" color="textSecondary" sx={{ ml: 2, fontSize: '0.75rem' }}>
            Ctrl+S
          </Typography>
        </MuiMenuItem>

        <MuiMenuItem onClick={() => { onFileAction('save-as'); setFileMenuAnchor(null); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <Box sx={{ position: 'relative' }}>
              <SaveIcon fontSize="small" sx={{ color: '#666' }} />
              <Box sx={{
                position: 'absolute', bottom: -2, right: -2, width: 8, height: 8,
                bgcolor: '#666', borderRadius: '50%', fontSize: '6px',
                color: 'white', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: 'bold'
              }}>⋯</Box>
            </Box>
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Save As...</Box>
          <Typography variant="caption" color="textSecondary" sx={{ ml: 2, fontSize: '0.75rem' }}>
            Ctrl+Shift+S
          </Typography>
        </MuiMenuItem>

        <Divider sx={{ my: 0.5 }} />

        <MuiMenuItem onClick={() => { onFileAction('export-pdf'); setFileMenuAnchor(null); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <PdfIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          Export as PDF
        </MuiMenuItem>

        <MuiMenuItem onClick={() => { onFileAction('export-word'); setFileMenuAnchor(null); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <WordIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          Export as Word
        </MuiMenuItem>

        <Divider sx={{ my: 0.5 }} />

        <MuiMenuItem onClick={() => { onFileAction('share'); setFileMenuAnchor(null); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <ShareIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Share</Box>
          <Typography variant="caption" color="textSecondary" sx={{ ml: 2, fontSize: '0.75rem' }}>
            Ctrl+Shift+P
          </Typography>
        </MuiMenuItem>

        <MuiMenuItem onClick={() => { onFileAction('print'); setFileMenuAnchor(null); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <PrintIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Print</Box>
          <Typography variant="caption" color="textSecondary" sx={{ ml: 2, fontSize: '0.75rem' }}>
            Ctrl+P
          </Typography>
        </MuiMenuItem>

        <Divider sx={{ my: 0.5 }} />

        <MuiMenuItem onClick={() => { onFileAction('toggle-autosave'); setFileMenuAnchor(null); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <AutosaveIcon fontSize="small" sx={{ color: autosaveEnabled ? '#4caf50' : '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1, color: autosaveEnabled ? '#4caf50' : 'inherit' }}>
            Autosave: {autosaveEnabled ? 'ON' : 'OFF'}
          </Box>
        </MuiMenuItem>
      </Menu>

      {/* Edit Menu */}
      <Menu
        anchorEl={editMenuAnchor}
        open={Boolean(editMenuAnchor)}
        onClose={() => setEditMenuAnchor(null)}
        sx={{
          '& .MuiPaper-root': {
            minWidth: 200,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            '& .MuiMenuItem-root': {
              px: 2, py: 1, fontSize: '0.875rem',
              '&:hover': { bgcolor: '#f5f5f5' },
              '&.Mui-disabled': { opacity: 0.5 }
            },
          },
        }}
      >
        <MuiMenuItem 
          onClick={() => { onEditAction('undo'); setEditMenuAnchor(null); }} 
          disabled={!editor?.can().undo()}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <UndoIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Undo</Box>
          <Typography variant="caption" color="textSecondary" sx={{ ml: 2, fontSize: '0.75rem' }}>
            Ctrl+Z
          </Typography>
        </MuiMenuItem>

        <MuiMenuItem 
          onClick={() => { onEditAction('redo'); setEditMenuAnchor(null); }} 
          disabled={!editor?.can().redo()}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <RedoIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Redo</Box>
          <Typography variant="caption" color="textSecondary" sx={{ ml: 2, fontSize: '0.75rem' }}>
            Ctrl+Y
          </Typography>
        </MuiMenuItem>

        <Divider sx={{ my: 0.5 }} />

        <MuiMenuItem onClick={() => { onEditAction('cut'); setEditMenuAnchor(null); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <CutIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Cut</Box>
          <Typography variant="caption" color="textSecondary" sx={{ ml: 2, fontSize: '0.75rem' }}>
            Ctrl+X
          </Typography>
        </MuiMenuItem>

        <MuiMenuItem onClick={() => { onEditAction('copy'); setEditMenuAnchor(null); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <CopyIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Copy</Box>
          <Typography variant="caption" color="textSecondary" sx={{ ml: 2, fontSize: '0.75rem' }}>
            Ctrl+C
          </Typography>
        </MuiMenuItem>

        <MuiMenuItem onClick={() => { onEditAction('paste'); setEditMenuAnchor(null); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <PasteIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Paste</Box>
          <Typography variant="caption" color="textSecondary" sx={{ ml: 2, fontSize: '0.75rem' }}>
            Ctrl+V
          </Typography>
        </MuiMenuItem>

        <Divider sx={{ my: 0.5 }} />

        <MuiMenuItem onClick={() => { onEditAction('find'); setEditMenuAnchor(null); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <FindReplaceIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Find & Replace</Box>
          <Typography variant="caption" color="textSecondary" sx={{ ml: 2, fontSize: '0.75rem' }}>
            Ctrl+H
          </Typography>
        </MuiMenuItem>

        <MuiMenuItem onClick={() => { onEditAction('select-all'); setEditMenuAnchor(null); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <SelectAllIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Select All</Box>
          <Typography variant="caption" color="textSecondary" sx={{ ml: 2, fontSize: '0.75rem' }}>
            Ctrl+A
          </Typography>
        </MuiMenuItem>
      </Menu>

      {/* View Menu */}
      <Menu
        anchorEl={viewMenuAnchor}
        open={Boolean(viewMenuAnchor)}
        onClose={() => setViewMenuAnchor(null)}
        sx={{
          '& .MuiPaper-root': {
            minWidth: 220,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            '& .MuiMenuItem-root': {
              px: 2, py: 1, fontSize: '0.875rem',
              '&:hover': { bgcolor: '#f5f5f5' }
            },
          },
        }}
      >
        <MuiMenuItem onClick={() => { onViewAction('zoom-in'); setViewMenuAnchor(null); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <ZoomInIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Zoom In</Box>
          <Typography variant="caption" color="textSecondary" sx={{ ml: 2, fontSize: '0.75rem' }}>
            Ctrl++
          </Typography>
        </MuiMenuItem>

        <MuiMenuItem onClick={() => { onViewAction('zoom-out'); setViewMenuAnchor(null); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <ZoomOutIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Zoom Out</Box>
          <Typography variant="caption" color="textSecondary" sx={{ ml: 2, fontSize: '0.75rem' }}>
            Ctrl+-
          </Typography>
        </MuiMenuItem>

        <MuiMenuItem onClick={() => { onViewAction('reset-zoom'); setViewMenuAnchor(null); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <ResetZoomIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Reset Zoom (100%)</Box>
          <Typography variant="caption" color="textSecondary" sx={{ ml: 2, fontSize: '0.75rem' }}>
            Ctrl+0
          </Typography>
        </MuiMenuItem>

        <Divider sx={{ my: 0.5 }} />

        <MuiMenuItem onClick={() => { onViewAction('fullscreen'); setViewMenuAnchor(null); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <FullscreenIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Full Screen</Box>
          <Typography variant="caption" color="textSecondary" sx={{ ml: 2, fontSize: '0.75rem' }}>
            F11
          </Typography>
        </MuiMenuItem>

        <Divider sx={{ my: 0.5 }} />

        <MuiMenuItem onClick={() => { onViewAction('show-outline'); setViewMenuAnchor(null); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <ViewListIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          Show Outline
        </MuiMenuItem>

        <MuiMenuItem onClick={() => { onViewAction('comments'); setViewMenuAnchor(null); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <CommentIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          Show Comments
        </MuiMenuItem>

        <MuiMenuItem onClick={() => { onViewAction('track-changes'); setViewMenuAnchor(null); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <TrackChangesIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          Show Track Changes
        </MuiMenuItem>
      </Menu>

      {/* Insert Menu */}
      <Menu
        anchorEl={insertMenuAnchor}
        open={Boolean(insertMenuAnchor)}
        onClose={handleInsertMenuClose}
        sx={{
          '& .MuiPaper-root': {
            minWidth: 200,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            '& .MuiMenuItem-root': {
              px: 2, py: 1, fontSize: '0.875rem',
              '&:hover': { bgcolor: '#f5f5f5' },
              position: 'relative'
            },
          },
        }}
      >
        <MuiMenuItem disabled sx={{ color: '#999 !important' }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <ImageIcon fontSize="small" sx={{ color: '#999' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Image (Coming Soon)</Box>
        </MuiMenuItem>

        <MuiMenuItem 
          onMouseEnter={handleTableMenuEnter}
          sx={{
            position: 'relative',
            '&:hover': { 
              bgcolor: '#f5f5f5',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: -10,
                width: 10,
                height: '100%',
                backgroundColor: 'transparent',
                zIndex: 1000
              }
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <TableIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Table</Box>
          <Box sx={{ 
            width: 0, 
            height: 0, 
            borderLeft: '4px solid #666', 
            borderTop: '4px solid transparent', 
            borderBottom: '4px solid transparent',
            ml: 1 
          }} />
        </MuiMenuItem>

        <MuiMenuItem onClick={() => { onInsertAction('link'); setInsertMenuAnchor(null); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <LinkIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Link</Box>
          <Typography variant="caption" color="textSecondary" sx={{ ml: 2, fontSize: '0.75rem' }}>
            Ctrl+K
          </Typography>
        </MuiMenuItem>

        <Divider sx={{ my: 0.5 }} />

        <MuiMenuItem onClick={() => { onInsertAction('page-break'); setInsertMenuAnchor(null); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <PageBreakIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          Page Break
        </MuiMenuItem>

        <MuiMenuItem onClick={() => { onInsertAction('horizontal-rule'); setInsertMenuAnchor(null); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <HorizontalRuleIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          Horizontal Rule
        </MuiMenuItem>

        <MuiMenuItem onClick={() => { onInsertAction('special-characters'); setInsertMenuAnchor(null); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <SpecialCharsIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          Special Characters
        </MuiMenuItem>
      </Menu>

      {/* Table Submenu */}
      <Menu
        anchorEl={tableSubMenuAnchor}
        open={Boolean(tableSubMenuAnchor)}
        onClose={handleInsertMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        disableAutoFocus
        disableEnforceFocus
        sx={{
          '& .MuiPaper-root': {
            minWidth: 220,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            ml: -1,
            '& .MuiMenuItem-root': {
              px: 2, py: 1, fontSize: '0.875rem',
              '&:hover': { bgcolor: '#f5f5f5' }
            },
          },
        }}
      >
        <MuiMenuItem onClick={() => { onInsertAction('table'); setTableSubMenuAnchor(null); setInsertMenuAnchor(null); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <TableIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Insert Table...</Box>
          <Typography variant="caption" color="textSecondary" sx={{ ml: 2, fontSize: '0.75rem' }}>
            Ctrl+Shift+T
          </Typography>
        </MuiMenuItem>

        <Divider sx={{ my: 0.5 }} />

        <MuiMenuItem 
          onMouseEnter={handleQuickTablesEnter}
          onMouseLeave={handleQuickTablesLeave}
          sx={{
            position: 'relative',
            '&:hover': { 
              bgcolor: '#f5f5f5',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: -10,
                width: 10,
                height: '100%',
                backgroundColor: 'transparent',
                zIndex: 1000
              }
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <TableGridIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Quick Tables</Box>
          <Box sx={{ 
            width: 0, 
            height: 0, 
            borderLeft: '4px solid #666', 
            borderTop: '4px solid transparent', 
            borderBottom: '4px solid transparent',
            ml: 1 
          }} />
        </MuiMenuItem>

        <MuiMenuItem 
          onMouseEnter={handleTableTemplatesEnter}
          onMouseLeave={handleTableTemplatesLeave}
          sx={{
            position: 'relative',
            '&:hover': { 
              bgcolor: '#f5f5f5',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: -10,
                width: 10,
                height: '100%',
                backgroundColor: 'transparent',
                zIndex: 1000
              }
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <TableGridIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Table Templates</Box>
          <Box sx={{ 
            width: 0, 
            height: 0, 
            borderLeft: '4px solid #666', 
            borderTop: '4px solid transparent', 
            borderBottom: '4px solid transparent',
            ml: 1 
          }} />
        </MuiMenuItem>

        <Divider sx={{ my: 0.5 }} />

        <MuiMenuItem disabled sx={{ color: '#999 !important' }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <ImportIcon fontSize="small" sx={{ color: '#999' }} />
          </ListItemIcon>
          Import from CSV...
        </MuiMenuItem>

        <MuiMenuItem disabled sx={{ color: '#999 !important' }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <ImportIcon fontSize="small" sx={{ color: '#999' }} />
          </ListItemIcon>
          Import from Excel...
        </MuiMenuItem>

        <Divider sx={{ my: 0.5 }} />

        <MuiMenuItem 
          onClick={() => { onTableProperties && onTableProperties(); handleInsertMenuClose(); }}
          sx={{
            mt: 0.5, // Add some margin to separate from hover items above
            '&:hover': { bgcolor: '#f5f5f5' }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <TablePropsIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Table Properties...</Box>
          <Typography variant="caption" color="textSecondary" sx={{ ml: 2, fontSize: '0.75rem' }}>
            Alt+Enter
          </Typography>
        </MuiMenuItem>
      </Menu>

      {/* Quick Tables Submenu */}
      <Menu
        anchorEl={quickTablesAnchor}
        open={Boolean(quickTablesAnchor)}
        onClose={handleInsertMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        disableAutoFocus
        disableEnforceFocus
        sx={{
          '& .MuiPaper-root': {
            minWidth: 180,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            ml: -1,
            '& .MuiMenuItem-root': {
              px: 2, py: 1, fontSize: '0.875rem',
              '&:hover': { bgcolor: '#f5f5f5' }
            },
          },
        }}
      >
        {/* Basic Table Sizes */}
        <MuiMenuItem onClick={() => handleQuickTableSelect(2, 2, 'basic')}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <TableGridIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          2×2 Table
        </MuiMenuItem>

        <MuiMenuItem onClick={() => handleQuickTableSelect(3, 3, 'basic')}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <TableGridIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          3×3 Table
        </MuiMenuItem>

        <MuiMenuItem onClick={() => handleQuickTableSelect(4, 4, 'basic')}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <TableGridIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          4×4 Table
        </MuiMenuItem>

        <MuiMenuItem onClick={() => handleQuickTableSelect(5, 5, 'basic')}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <TableGridIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          5×5 Table
        </MuiMenuItem>

        <Divider sx={{ my: 0.5 }} />

        {/* Specialized Tables */}
        <MuiMenuItem onClick={() => handleQuickTableSelect(2, 5, 'list')}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <ViewListIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          2×5 List Table
        </MuiMenuItem>

        <MuiMenuItem onClick={() => handleQuickTableSelect(3, 6, 'data')}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <TableGridIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          3×6 Data Table
        </MuiMenuItem>

        <MuiMenuItem onClick={() => handleQuickTableSelect(4, 8, 'report')}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <TableIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          4×8 Report Table
        </MuiMenuItem>
      </Menu>

      {/* Table Templates Submenu */}
      <Menu
        anchorEl={tableTemplatesAnchor}
        open={Boolean(tableTemplatesAnchor)}
        onClose={handleInsertMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        disableAutoFocus
        disableEnforceFocus
        sx={{
          '& .MuiPaper-root': {
            minWidth: 200,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            ml: -1,
            '& .MuiMenuItem-root': {
              px: 2, py: 1, fontSize: '0.875rem',
              '&:hover': { bgcolor: '#f5f5f5' }
            },
          },
        }}
      >
        {/* Research & Academic Templates */}
        <MuiMenuItem onClick={() => handleTableTemplateSelect('research-data')}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <TableGridIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          Research Data Table
        </MuiMenuItem>

        <MuiMenuItem onClick={() => handleTableTemplateSelect('financial-report')}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <TableIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          Financial Report
        </MuiMenuItem>

        <MuiMenuItem onClick={() => handleTableTemplateSelect('project-timeline')}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <ViewListIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          Project Timeline
        </MuiMenuItem>

        <MuiMenuItem onClick={() => handleTableTemplateSelect('comparison-chart')}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <TableGridIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          Comparison Chart
        </MuiMenuItem>

        <MuiMenuItem onClick={() => handleTableTemplateSelect('contact-list')}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <ViewListIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          Contact List
        </MuiMenuItem>

        <MuiMenuItem onClick={() => handleTableTemplateSelect('product-catalog')}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <TableGridIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          Product Catalog
        </MuiMenuItem>
      </Menu>

      {/* Format Menu */}
      <Menu
        anchorEl={formatMenuAnchor}
        open={Boolean(formatMenuAnchor)}
        onClose={handleFormatMenuClose}
        sx={{
          '& .MuiPaper-root': {
            minWidth: 220,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1,
              fontSize: '0.875rem',
              '&:hover': { bgcolor: '#f5f5f5' },
              '&.Mui-disabled': { opacity: 0.5 }
            },
          },
        }}
      >
        {/* Text Formatting */}
        <MuiMenuItem 
          onClick={() => { onFormatAction('bold'); handleFormatMenuClose(); }}
          onMouseEnter={() => closeOtherFormatSubmenus()}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <BoldIcon fontSize="small" sx={{ color: editor?.isActive('bold') ? '#8b6cbc' : '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Bold</Box>
          <Typography variant="caption" color="textSecondary" sx={{ ml: 2, fontSize: '0.75rem' }}>
            Ctrl+B
          </Typography>
        </MuiMenuItem>

        <MuiMenuItem 
          onClick={() => { onFormatAction('italic'); handleFormatMenuClose(); }}
          onMouseEnter={() => closeOtherFormatSubmenus()}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <ItalicIcon fontSize="small" sx={{ color: editor?.isActive('italic') ? '#8b6cbc' : '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Italic</Box>
          <Typography variant="caption" color="textSecondary" sx={{ ml: 2, fontSize: '0.75rem' }}>
            Ctrl+I
          </Typography>
        </MuiMenuItem>

        <MuiMenuItem 
          onClick={() => { onFormatAction('underline'); handleFormatMenuClose(); }}
          onMouseEnter={() => closeOtherFormatSubmenus()}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <UnderlineIcon fontSize="small" sx={{ color: editor?.isActive('underline') ? '#8b6cbc' : '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Underline</Box>
          <Typography variant="caption" color="textSecondary" sx={{ ml: 2, fontSize: '0.75rem' }}>
            Ctrl+U
          </Typography>
        </MuiMenuItem>

        <MuiMenuItem 
          onClick={() => { onFormatAction('strikethrough'); handleFormatMenuClose(); }}
          onMouseEnter={() => closeOtherFormatSubmenus()}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <StrikethroughIcon fontSize="small" sx={{ color: editor?.isActive('strike') ? '#8b6cbc' : '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Strikethrough</Box>
        </MuiMenuItem>

        <Divider sx={{ my: 0.5 }} />

        {/* Superscript/Subscript */}
        <MuiMenuItem 
          onClick={() => { onFormatAction('superscript'); handleFormatMenuClose(); }}
          onMouseEnter={() => closeOtherFormatSubmenus()}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <SuperscriptIcon fontSize="small" sx={{
              color: (editor?.getAttributes('textStyle')?.verticalAlign === 'super') ? '#8b6cbc' : '#666'
            }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Superscript</Box>
          <Typography variant="caption" color="textSecondary" sx={{ ml: 2, fontSize: '0.75rem' }}>
            Ctrl+Shift+.
          </Typography>
        </MuiMenuItem>

        <MuiMenuItem 
          onClick={() => { onFormatAction('subscript'); handleFormatMenuClose(); }}
          onMouseEnter={() => closeOtherFormatSubmenus()}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <SubscriptIcon fontSize="small" sx={{
              color: (editor?.getAttributes('textStyle')?.verticalAlign === 'sub') ? '#8b6cbc' : '#666'
            }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Subscript</Box>
          <Typography variant="caption" color="textSecondary" sx={{ ml: 2, fontSize: '0.75rem' }}>
            Ctrl+Shift+,
          </Typography>
        </MuiMenuItem>

        <Divider sx={{ my: 0.5 }} />

        {/* Text Alignment */}
        <MuiMenuItem
          onMouseEnter={handleTextAlignEnter}
          onMouseLeave={handleTextAlignLeave}
          onClick={(e) => {
            e.stopPropagation();
            if (textAlignAnchor) {
              setTextAlignAnchor(null);
            } else {
              setTextAlignAnchor(e.currentTarget);
            }
          }}
          sx={{
            position: 'relative',
            '&:hover': {
              bgcolor: '#f5f5f5',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: -10,
                width: 10,
                height: '100%',
                backgroundColor: 'transparent',
                zIndex: 1000
              }
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <AlignLeftIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Text Alignment</Box>
          <Box sx={{
            width: 0,
            height: 0,
            borderLeft: '4px solid #666',
            borderTop: '4px solid transparent',
            borderBottom: '4px solid transparent',
            ml: 1
          }} />
        </MuiMenuItem>

        {/* Line Spacing */}
        <MuiMenuItem
          onMouseEnter={handleLineSpacingEnter}
          onMouseLeave={handleLineSpacingLeave}
          onClick={(e) => {
            e.stopPropagation();
            if (lineSpacingAnchor) {
              setLineSpacingAnchor(null);
            } else {
              setLineSpacingAnchor(e.currentTarget);
            }
          }}
          sx={{
            position: 'relative',
            '&:hover': {
              bgcolor: '#f5f5f5',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: -10,
                width: 10,
                height: '100%',
                backgroundColor: 'transparent',
                zIndex: 1000
              }
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <LineSpacingIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Line Spacing</Box>
          <Box sx={{
            width: 0,
            height: 0,
            borderLeft: '4px solid #666',
            borderTop: '4px solid transparent',
            borderBottom: '4px solid transparent',
            ml: 1
          }} />
        </MuiMenuItem>

        <Divider sx={{ my: 0.5 }} />

        {/* Lists */}
        <MuiMenuItem 
          onClick={() => { onFormatAction('bulletList'); handleFormatMenuClose(); }}
          onMouseEnter={() => closeOtherFormatSubmenus()}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <BulletListIcon fontSize="small" sx={{ color: editor?.isActive('bulletList') ? '#8b6cbc' : '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Bullet List</Box>
        </MuiMenuItem>

        <MuiMenuItem 
          onClick={() => { onFormatAction('orderedList'); handleFormatMenuClose(); }}
          onMouseEnter={() => closeOtherFormatSubmenus()}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <NumberedListIcon fontSize="small" sx={{ color: editor?.isActive('orderedList') ? '#8b6cbc' : '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Numbered List</Box>
        </MuiMenuItem>

        <MuiMenuItem 
          onClick={() => { onFormatAction('blockquote'); handleFormatMenuClose(); }}
          onMouseEnter={() => closeOtherFormatSubmenus()}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <BlockquoteIcon fontSize="small" sx={{ color: editor?.isActive('blockquote') ? '#8b6cbc' : '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Blockquote</Box>
        </MuiMenuItem>

        <Divider sx={{ my: 0.5 }} />

        {/* Indentation */}
        <MuiMenuItem 
          onClick={() => { onFormatAction('increaseIndent'); handleFormatMenuClose(); }}
          onMouseEnter={() => closeOtherFormatSubmenus()}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <IncreaseIndentIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Increase Indent</Box>
          <Typography variant="caption" color="textSecondary" sx={{ ml: 2, fontSize: '0.75rem' }}>
            Tab
          </Typography>
        </MuiMenuItem>

        <MuiMenuItem 
          onClick={() => { onFormatAction('decreaseIndent'); handleFormatMenuClose(); }}
          onMouseEnter={() => closeOtherFormatSubmenus()}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <DecreaseIndentIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Decrease Indent</Box>
          <Typography variant="caption" color="textSecondary" sx={{ ml: 2, fontSize: '0.75rem' }}>
            Shift+Tab
          </Typography>
        </MuiMenuItem>

        <Divider sx={{ my: 0.5 }} />

        {/* Headings */}
        <MuiMenuItem
          onMouseEnter={handleHeadingsEnter}
          onMouseLeave={handleHeadingsLeave}
          onClick={(e) => {
            e.stopPropagation();
            if (headingsAnchor) {
              setHeadingsAnchor(null);
            } else {
              setHeadingsAnchor(e.currentTarget);
            }
          }}
          sx={{
            position: 'relative',
            '&:hover': {
              bgcolor: '#f5f5f5',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: -10,
                width: 10,
                height: '100%',
                backgroundColor: 'transparent',
                zIndex: 1000
              }
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <H1Icon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Headings</Box>
          <Box sx={{
            width: 0,
            height: 0,
            borderLeft: '4px solid #666',
            borderTop: '4px solid transparent',
            borderBottom: '4px solid transparent',
            ml: 1
          }} />
        </MuiMenuItem>

        {/* Font */}
        <MuiMenuItem
          onMouseEnter={handleFontEnter}
          onMouseLeave={handleFontLeave}
          onClick={(e) => {
            e.stopPropagation();
            if (fontAnchor) {
              setFontAnchor(null);
            } else {
              setFontAnchor(e.currentTarget);
            }
          }}
          sx={{
            position: 'relative',
            '&:hover': {
              bgcolor: '#f5f5f5',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: -10,
                width: 10,
                height: '100%',
                backgroundColor: 'transparent',
                zIndex: 1000
              }
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <FontIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Font</Box>
          <Box sx={{
            width: 0,
            height: 0,
            borderLeft: '4px solid #666',
            borderTop: '4px solid transparent',
            borderBottom: '4px solid transparent',
            ml: 1
          }} />
        </MuiMenuItem>

        {/* Text Color */}
        <MuiMenuItem
          onMouseEnter={handleTextColorEnter}
          onMouseLeave={handleTextColorLeave}
          onClick={(e) => {
            e.stopPropagation();
            if (textColorAnchor) {
              setTextColorAnchor(null);
            } else {
              setTextColorAnchor(e.currentTarget);
            }
          }}
          sx={{
            position: 'relative',
            '&:hover': {
              bgcolor: '#f5f5f5',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: -10,
                width: 10,
                height: '100%',
                backgroundColor: 'transparent',
                zIndex: 1000
              }
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <ColorIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Text Color</Box>
          <Box sx={{
            width: 0,
            height: 0,
            borderLeft: '4px solid #666',
            borderTop: '4px solid transparent',
            borderBottom: '4px solid transparent',
            ml: 1
          }} />
        </MuiMenuItem>

        <Divider sx={{ my: 0.5 }} />

        {/* Clear Formatting */}
        <MuiMenuItem 
          onClick={() => { onFormatAction('clearFormatting'); handleFormatMenuClose(); }}
          onMouseEnter={() => closeOtherFormatSubmenus()}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <ClearFormatIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Clear Formatting</Box>
          <Typography variant="caption" color="textSecondary" sx={{ ml: 2, fontSize: '0.75rem' }}>
            Ctrl+\
          </Typography>
        </MuiMenuItem>
      </Menu>

      {/* Text Alignment Submenu */}
      <Menu
        anchorEl={textAlignAnchor}
        open={Boolean(textAlignAnchor)}
        onClose={handleFormatMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        disableAutoFocus disableEnforceFocus
        onMouseEnter={() => {
          if (textAlignTimeoutRef.current) {
            clearTimeout(textAlignTimeoutRef.current);
          }
        }}
        onMouseLeave={handleTextAlignLeave}
        sx={{
          '& .MuiPaper-root': {
            minWidth: 180,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            ml: -1,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1,
              fontSize: '0.875rem',
              '&:hover': { bgcolor: '#f5f5f5' }
            },
          },
        }}
      >
        <MuiMenuItem onClick={() => { onFormatAction('alignLeft'); handleFormatMenuClose(); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <AlignLeftIcon fontSize="small" sx={{ color: editor?.isActive({ textAlign: 'left' }) ? '#8b6cbc' : '#666' }} />
          </ListItemIcon>
          Align Left
        </MuiMenuItem>
        <MuiMenuItem onClick={() => { onFormatAction('alignCenter'); handleFormatMenuClose(); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <AlignCenterIcon fontSize="small" sx={{ color: editor?.isActive({ textAlign: 'center' }) ? '#8b6cbc' : '#666' }} />
          </ListItemIcon>
          Align Center
        </MuiMenuItem>
        <MuiMenuItem onClick={() => { onFormatAction('alignRight'); handleFormatMenuClose(); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <AlignRightIcon fontSize="small" sx={{ color: editor?.isActive({ textAlign: 'right' }) ? '#8b6cbc' : '#666' }} />
          </ListItemIcon>
          Align Right
        </MuiMenuItem>
        <MuiMenuItem onClick={() => { onFormatAction('alignJustify'); handleFormatMenuClose(); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <AlignJustifyIcon fontSize="small" sx={{ color: editor?.isActive({ textAlign: 'justify' }) ? '#8b6cbc' : '#666' }} />
          </ListItemIcon>
          Justify
        </MuiMenuItem>
      </Menu>

      {/* Line Spacing Submenu */}
      <Menu
        anchorEl={lineSpacingAnchor}
        open={Boolean(lineSpacingAnchor)}
        onClose={handleFormatMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        disableAutoFocus disableEnforceFocus
        onMouseEnter={() => {
          if (lineSpacingTimeoutRef.current) {
            clearTimeout(lineSpacingTimeoutRef.current);
          }
        }}
        onMouseLeave={handleLineSpacingLeave}
        sx={{
          '& .MuiPaper-root': {
            minWidth: 160,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            ml: -1,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1,
              fontSize: '0.875rem',
              '&:hover': { bgcolor: '#f5f5f5' }
            },
          },
        }}
      >
        <MuiMenuItem onClick={() => { onFormatAction('lineSpacing', 1.0); handleFormatMenuClose(); }}>
          Single
        </MuiMenuItem>
        <MuiMenuItem onClick={() => { onFormatAction('lineSpacing', 1.15); handleFormatMenuClose(); }}>
          1.15
        </MuiMenuItem>
        <MuiMenuItem onClick={() => { onFormatAction('lineSpacing', 1.5); handleFormatMenuClose(); }}>
          1.5
        </MuiMenuItem>
        <MuiMenuItem onClick={() => { onFormatAction('lineSpacing', 2.0); handleFormatMenuClose(); }}>
          Double
        </MuiMenuItem>
      </Menu>

      {/* Headings Submenu */}
      <Menu
        anchorEl={headingsAnchor}
        open={Boolean(headingsAnchor)}
        onClose={handleFormatMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        disableAutoFocus disableEnforceFocus
        onMouseEnter={() => {
          if (headingsTimeoutRef.current) {
            clearTimeout(headingsTimeoutRef.current);
          }
        }}
        onMouseLeave={handleHeadingsLeave}
        sx={{
          '& .MuiPaper-root': {
            minWidth: 180,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            ml: -1,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1,
              fontSize: '0.875rem',
              '&:hover': { bgcolor: '#f5f5f5' }
            },
          },
        }}
      >
        <MuiMenuItem onClick={() => { onFormatAction('heading', 1); handleFormatMenuClose(); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <H1Icon fontSize="small" sx={{ color: editor?.isActive('heading', { level: 1 }) ? '#8b6cbc' : '#666' }} />
          </ListItemIcon>
          Heading 1
        </MuiMenuItem>
        <MuiMenuItem onClick={() => { onFormatAction('heading', 2); handleFormatMenuClose(); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <H2Icon fontSize="small" sx={{ color: editor?.isActive('heading', { level: 2 }) ? '#8b6cbc' : '#666' }} />
          </ListItemIcon>
          Heading 2
        </MuiMenuItem>
        <MuiMenuItem onClick={() => { onFormatAction('heading', 3); handleFormatMenuClose(); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <H3Icon fontSize="small" sx={{ color: editor?.isActive('heading', { level: 3 }) ? '#8b6cbc' : '#666' }} />
          </ListItemIcon>
          Heading 3
        </MuiMenuItem>
        <MuiMenuItem onClick={() => { onFormatAction('heading', 4); handleFormatMenuClose(); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <H3Icon fontSize="small" sx={{ color: editor?.isActive('heading', { level: 4 }) ? '#8b6cbc' : '#666' }} />
          </ListItemIcon>
          Heading 4
        </MuiMenuItem>
        <MuiMenuItem onClick={() => { onFormatAction('heading', 5); handleFormatMenuClose(); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <H3Icon fontSize="small" sx={{ color: editor?.isActive('heading', { level: 5 }) ? '#8b6cbc' : '#666' }} />
          </ListItemIcon>
          Heading 5
        </MuiMenuItem>
        <MuiMenuItem onClick={() => { onFormatAction('heading', 6); handleFormatMenuClose(); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <H3Icon fontSize="small" sx={{ color: editor?.isActive('heading', { level: 6 }) ? '#8b6cbc' : '#666' }} />
          </ListItemIcon>
          Heading 6
        </MuiMenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MuiMenuItem onClick={() => { onFormatAction('paragraph'); handleFormatMenuClose(); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <Box sx={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
              P
            </Box>
          </ListItemIcon>
          Normal Text
        </MuiMenuItem>
      </Menu>

      {/* Font Submenu */}
      <Menu
        anchorEl={fontAnchor}
        open={Boolean(fontAnchor)}
        onClose={handleFormatMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        disableAutoFocus disableEnforceFocus
        onMouseEnter={() => {
          if (fontTimeoutRef.current) {
            clearTimeout(fontTimeoutRef.current);
          }
        }}
        onMouseLeave={handleFontLeave}
        sx={{
          '& .MuiPaper-root': {
            minWidth: 200,
            maxHeight: 300,
            overflowY: 'auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            ml: -1,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1,
              fontSize: '0.875rem',
              '&:hover': { bgcolor: '#f5f5f5' }
            },
          },
        }}
      >
        {['Arial', 'Times New Roman', 'Calibri', 'Helvetica', 'Georgia', 'Verdana', 'Comic Sans MS', 'Impact', 'Lucida Console', 'Tahoma'].map((font) => (
          <MuiMenuItem key={font} onClick={() => { onFormatAction('fontFamily', font); handleFormatMenuClose(); }}>
            <Box sx={{ fontFamily: font, flexGrow: 1 }}>{font}</Box>
          </MuiMenuItem>
        ))}
      </Menu>

      {/* Text Color Submenu */}
      <Menu
        anchorEl={textColorAnchor}
        open={Boolean(textColorAnchor)}
        onClose={handleFormatMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        disableAutoFocus disableEnforceFocus
        onMouseEnter={() => {
          if (textColorTimeoutRef.current) {
            clearTimeout(textColorTimeoutRef.current);
          }
        }}
        onMouseLeave={handleTextColorLeave}
        sx={{
          '& .MuiPaper-root': {
            minWidth: 220,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            ml: -1,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1,
              fontSize: '0.875rem',
              '&:hover': { bgcolor: '#f5f5f5' }
            },
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Text Colors</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 1, mb: 2 }}>
            {['#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080', '#008000', '#000080'].map((color) => (
              <Box
                key={color}
                onClick={() => { onFormatAction('textColor', color); handleFormatMenuClose(); }}
                sx={{
                  width: 20,
                  height: 20,
                  backgroundColor: color,
                  border: '1px solid #ddd',
                  borderRadius: 1,
                  cursor: 'pointer',
                  '&:hover': { transform: 'scale(1.1)' }
                }}
              />
            ))}
          </Box>
          <Typography variant="subtitle2" gutterBottom>Highlight Colors</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 1 }}>
            {['#ffff00', '#00ff00', '#00ffff', '#ff00ff', '#ffa500', '#ff0000', '#0000ff', '#800080'].map((color) => (
              <Box
                key={color}
                onClick={() => { onFormatAction('highlight', color); handleFormatMenuClose(); }}
                sx={{
                  width: 20,
                  height: 20,
                  backgroundColor: color,
                  border: '1px solid #ddd',
                  borderRadius: 1,
                  cursor: 'pointer',
                  '&:hover': { transform: 'scale(1.1)' }
                }}
              />
            ))}
          </Box>
        </Box>
      </Menu>

      {/* Review Menu */}
      <Menu
        anchorEl={reviewMenuAnchor}
        open={Boolean(reviewMenuAnchor)}
        onClose={() => setReviewMenuAnchor(null)}
        sx={{
          '& .MuiPaper-root': {
            minWidth: 220,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: '1px solid #e0e0e0',
            borderRadius: 2,
          },
        }}
      >
        <MuiMenuItem onClick={() => { onReviewAction && onReviewAction('spell-check'); setReviewMenuAnchor(null); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <SpellcheckIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Spell Check</Box>
          <Typography variant="caption" color="textSecondary" sx={{ ml: 2, fontSize: '0.75rem' }}>
            Ctrl+Shift+L
          </Typography>
        </MuiMenuItem>

        <MuiMenuItem onClick={() => { onReviewAction && onReviewAction('grammar-check'); setReviewMenuAnchor(null); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <GrammarCheckIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Grammar Check</Box>
          <Typography variant="caption" color="textSecondary" sx={{ ml: 2, fontSize: '0.75rem' }}>
            Ctrl+Shift+G
          </Typography>
        </MuiMenuItem>

        <Divider sx={{ my: 0.5 }} />

        <MuiMenuItem onClick={() => { onReviewAction && onReviewAction('language-settings'); setReviewMenuAnchor(null); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <LanguageIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          Language Settings
        </MuiMenuItem>

        <Divider sx={{ my: 0.5 }} />

        <MuiMenuItem onClick={() => { onReviewAction && onReviewAction('track-changes'); setReviewMenuAnchor(null); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <TrackChangesIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          Track Changes
        </MuiMenuItem>

        <MuiMenuItem onClick={() => { onReviewAction && onReviewAction('accept-changes'); setReviewMenuAnchor(null); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <AcceptIcon fontSize="small" sx={{ color: '#4caf50' }} />
          </ListItemIcon>
          Accept Changes
        </MuiMenuItem>

        <MuiMenuItem onClick={() => { onReviewAction && onReviewAction('reject-changes'); setReviewMenuAnchor(null); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <RejectIcon fontSize="small" sx={{ color: '#f44336' }} />
          </ListItemIcon>
          Reject Changes
        </MuiMenuItem>

        <Divider sx={{ my: 0.5 }} />

        <MuiMenuItem onClick={() => { onReviewAction && onReviewAction('new-comment'); setReviewMenuAnchor(null); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <CommentIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>New Comment</Box>
          <Typography variant="caption" color="textSecondary" sx={{ ml: 2, fontSize: '0.75rem' }}>
            Ctrl+Alt+M
          </Typography>
        </MuiMenuItem>

        <MuiMenuItem onClick={() => { onReviewAction && onReviewAction('show-comments'); setReviewMenuAnchor(null); }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <VisibilityIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          Show Comments
        </MuiMenuItem>
      </Menu>

    </>
  );
}
