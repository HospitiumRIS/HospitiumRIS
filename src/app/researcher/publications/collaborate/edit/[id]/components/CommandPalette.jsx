'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  Box,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Chip,
  InputAdornment,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatUnderlined as UnderlineIcon,
  FormatListBulleted as BulletListIcon,
  FormatListNumbered as NumberListIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  TableChart as TableIcon,
  Comment as CommentIcon,
  LibraryBooks as CitationIcon,
  TrackChanges as TrackChangesIcon,
  History as VersionIcon,
  Save as SaveIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  ContentCopy as CopyIcon,
  ContentCut as CutIcon,
  ContentPaste as PasteIcon,
  SelectAll as SelectAllIcon,
  FindReplace as FindIcon,
  Fullscreen as FullscreenIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
  Description as WordIcon,
  InsertPageBreak as PageBreakIcon,
  FormatAlignLeft as AlignLeftIcon,
  FormatAlignCenter as AlignCenterIcon,
  FormatAlignRight as AlignRightIcon,
  FormatAlignJustify as AlignJustifyIcon,
  Title as HeadingIcon,
  Code as CodeIcon,
  FormatQuote as QuoteIcon,
  HorizontalRule as HrIcon,
  Keyboard as KeyboardIcon
} from '@mui/icons-material';

const CommandPalette = ({ open, onClose, editor, onCommand }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Define all available commands
  const allCommands = useMemo(() => [
    // File
    { id: 'save', label: 'Save Document', category: 'File', icon: <SaveIcon />, shortcut: 'Ctrl+S', action: () => onCommand('save') },
    { id: 'export-pdf', label: 'Export as PDF', category: 'File', icon: <PdfIcon />, action: () => onCommand('exportPdf') },
    { id: 'export-word', label: 'Export as Word', category: 'File', icon: <WordIcon />, action: () => onCommand('exportWord') },
    { id: 'print', label: 'Print Document', category: 'File', icon: <PrintIcon />, shortcut: 'Ctrl+P', action: () => onCommand('print') },
    
    // Edit
    { id: 'undo', label: 'Undo', category: 'Edit', icon: <UndoIcon />, shortcut: 'Ctrl+Z', action: () => editor?.chain().focus().undo().run() },
    { id: 'redo', label: 'Redo', category: 'Edit', icon: <RedoIcon />, shortcut: 'Ctrl+Y', action: () => editor?.chain().focus().redo().run() },
    { id: 'cut', label: 'Cut', category: 'Edit', icon: <CutIcon />, shortcut: 'Ctrl+X', action: () => document.execCommand('cut') },
    { id: 'copy', label: 'Copy', category: 'Edit', icon: <CopyIcon />, shortcut: 'Ctrl+C', action: () => document.execCommand('copy') },
    { id: 'paste', label: 'Paste', category: 'Edit', icon: <PasteIcon />, shortcut: 'Ctrl+V', action: () => document.execCommand('paste') },
    { id: 'select-all', label: 'Select All', category: 'Edit', icon: <SelectAllIcon />, shortcut: 'Ctrl+A', action: () => editor?.commands.selectAll() },
    { id: 'find', label: 'Find & Replace', category: 'Edit', icon: <FindIcon />, shortcut: 'Ctrl+F', action: () => onCommand('find') },
    
    // Format - Text
    { id: 'bold', label: 'Bold', category: 'Format', icon: <BoldIcon />, shortcut: 'Ctrl+B', action: () => editor?.chain().focus().toggleBold().run() },
    { id: 'italic', label: 'Italic', category: 'Format', icon: <ItalicIcon />, shortcut: 'Ctrl+I', action: () => editor?.chain().focus().toggleItalic().run() },
    { id: 'underline', label: 'Underline', category: 'Format', icon: <UnderlineIcon />, shortcut: 'Ctrl+U', action: () => editor?.chain().focus().toggleUnderline().run() },
    { id: 'code', label: 'Code', category: 'Format', icon: <CodeIcon />, shortcut: 'Ctrl+E', action: () => editor?.chain().focus().toggleCode().run() },
    
    // Format - Headings
    { id: 'heading1', label: 'Heading 1', category: 'Format', icon: <HeadingIcon />, shortcut: 'Ctrl+Alt+1', action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run() },
    { id: 'heading2', label: 'Heading 2', category: 'Format', icon: <HeadingIcon />, shortcut: 'Ctrl+Alt+2', action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
    { id: 'heading3', label: 'Heading 3', category: 'Format', icon: <HeadingIcon />, shortcut: 'Ctrl+Alt+3', action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run() },
    
    // Format - Alignment
    { id: 'align-left', label: 'Align Left', category: 'Format', icon: <AlignLeftIcon />, action: () => editor?.chain().focus().setTextAlign('left').run() },
    { id: 'align-center', label: 'Align Center', category: 'Format', icon: <AlignCenterIcon />, action: () => editor?.chain().focus().setTextAlign('center').run() },
    { id: 'align-right', label: 'Align Right', category: 'Format', icon: <AlignRightIcon />, action: () => editor?.chain().focus().setTextAlign('right').run() },
    { id: 'align-justify', label: 'Align Justify', category: 'Format', icon: <AlignJustifyIcon />, action: () => editor?.chain().focus().setTextAlign('justify').run() },
    
    // Format - Lists
    { id: 'bullet-list', label: 'Bullet List', category: 'Format', icon: <BulletListIcon />, shortcut: 'Ctrl+Shift+8', action: () => editor?.chain().focus().toggleBulletList().run() },
    { id: 'numbered-list', label: 'Numbered List', category: 'Format', icon: <NumberListIcon />, shortcut: 'Ctrl+Shift+7', action: () => editor?.chain().focus().toggleOrderedList().run() },
    { id: 'blockquote', label: 'Blockquote', category: 'Format', icon: <QuoteIcon />, shortcut: 'Ctrl+Shift+B', action: () => editor?.chain().focus().toggleBlockquote().run() },
    
    // Insert
    { id: 'insert-link', label: 'Insert Link', category: 'Insert', icon: <LinkIcon />, shortcut: 'Ctrl+K', action: () => onCommand('insertLink') },
    { id: 'insert-image', label: 'Insert Image', category: 'Insert', icon: <ImageIcon />, action: () => onCommand('insertImage') },
    { id: 'insert-table', label: 'Insert Table', category: 'Insert', icon: <TableIcon />, action: () => onCommand('insertTable') },
    { id: 'insert-hr', label: 'Insert Horizontal Rule', category: 'Insert', icon: <HrIcon />, action: () => editor?.chain().focus().setHorizontalRule().run() },
    { id: 'insert-page-break', label: 'Insert Page Break', category: 'Insert', icon: <PageBreakIcon />, shortcut: 'Ctrl+Enter', action: () => editor?.chain().focus().insertPageBreak().run() },
    
    // Citation & References
    { id: 'insert-citation', label: 'Insert Citation', category: 'Citation', icon: <CitationIcon />, shortcut: '@', action: () => onCommand('insertCitation') },
    { id: 'manage-sources', label: 'Manage Sources', category: 'Citation', icon: <CitationIcon />, action: () => onCommand('manageSources') },
    { id: 'bibliography', label: 'Generate Bibliography', category: 'Citation', icon: <CitationIcon />, action: () => onCommand('bibliography') },
    
    // Review
    { id: 'add-comment', label: 'Add Comment', category: 'Review', icon: <CommentIcon />, shortcut: 'Ctrl+Alt+M', action: () => onCommand('addComment') },
    { id: 'show-comments', label: 'Show/Hide Comments', category: 'Review', icon: <CommentIcon />, action: () => onCommand('toggleComments') },
    { id: 'track-changes', label: 'Toggle Track Changes', category: 'Review', icon: <TrackChangesIcon />, action: () => onCommand('toggleTrackChanges') },
    { id: 'show-tracked-changes', label: 'Show Tracked Changes', category: 'Review', icon: <TrackChangesIcon />, action: () => onCommand('showTrackedChanges') },
    
    // Version History
    { id: 'create-version', label: 'Create Version', category: 'Version', icon: <VersionIcon />, action: () => onCommand('createVersion') },
    { id: 'show-versions', label: 'Show Version History', category: 'Version', icon: <VersionIcon />, action: () => onCommand('showVersions') },
    
    // View
    { id: 'fullscreen', label: 'Toggle Fullscreen', category: 'View', icon: <FullscreenIcon />, shortcut: 'F11', action: () => onCommand('toggleFullscreen') },
    { id: 'zoom-in', label: 'Zoom In', category: 'View', icon: <ZoomInIcon />, shortcut: 'Ctrl++', action: () => onCommand('zoomIn') },
    { id: 'zoom-out', label: 'Zoom Out', category: 'View', icon: <ZoomOutIcon />, shortcut: 'Ctrl+-', action: () => onCommand('zoomOut') },
    { id: 'show-outline', label: 'Toggle Document Outline', category: 'View', icon: <HeadingIcon />, action: () => onCommand('toggleOutline') },
  ], [editor, onCommand]);

  // Filter commands based on search query
  const filteredCommands = useMemo(() => {
    if (!searchQuery.trim()) return allCommands;
    
    const query = searchQuery.toLowerCase();
    return allCommands.filter(cmd => 
      cmd.label.toLowerCase().includes(query) ||
      cmd.category.toLowerCase().includes(query) ||
      cmd.shortcut?.toLowerCase().includes(query)
    );
  }, [searchQuery, allCommands]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups = {};
    filteredCommands.forEach(cmd => {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Reset selected index when filtered commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, selectedIndex, filteredCommands]);

  const executeCommand = (command) => {
    command.action?.();
    handleClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedIndex(0);
    onClose();
  };

  // Flatten grouped commands for index-based selection
  const flatCommands = useMemo(() => {
    return Object.values(groupedCommands).flat();
  }, [groupedCommands]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
          maxHeight: '80vh'
        }
      }}
    >
      {/* Search Input */}
      <Box sx={{ p: 2, borderBottom: '1px solid #e9ecef' }}>
        <TextField
          fullWidth
          autoFocus
          placeholder="Type a command or search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#8b6cbc' }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Chip
                  label="Esc"
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: '0.7rem',
                    bgcolor: '#f1f5f9',
                    color: '#64748b',
                    fontWeight: 600
                  }}
                />
              </InputAdornment>
            )
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              fontSize: '0.95rem',
              '& fieldset': { borderColor: '#e2e8f0' },
              '&:hover fieldset': { borderColor: '#8b6cbc' },
              '&.Mui-focused fieldset': { borderColor: '#8b6cbc' }
            }
          }}
        />
      </Box>

      {/* Commands List */}
      <Box sx={{ maxHeight: 'calc(80vh - 100px)', overflow: 'auto' }}>
        {filteredCommands.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <KeyboardIcon sx={{ fontSize: 48, color: '#cbd5e0', mb: 1 }} />
            <Typography variant="body2" color="textSecondary">
              No commands found
            </Typography>
          </Box>
        ) : (
          Object.entries(groupedCommands).map(([category, commands], categoryIndex) => (
            <Box key={category}>
              {categoryIndex > 0 && <Divider />}
              <Box sx={{ px: 2, py: 1, bgcolor: '#f8f9fa' }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {category}
                </Typography>
              </Box>
              <List sx={{ py: 0 }}>
                {commands.map((command, index) => {
                  const globalIndex = flatCommands.indexOf(command);
                  const isSelected = globalIndex === selectedIndex;
                  
                  return (
                    <ListItem
                      key={command.id}
                      button
                      selected={isSelected}
                      onClick={() => executeCommand(command)}
                      sx={{
                        py: 1.25,
                        px: 2,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        ...(isSelected && {
                          bgcolor: '#8b6cbc10',
                          borderLeft: '3px solid #8b6cbc'
                        }),
                        '&:hover': {
                          bgcolor: '#8b6cbc08'
                        }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, color: isSelected ? '#8b6cbc' : '#64748b' }}>
                        {command.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={command.label}
                        primaryTypographyProps={{
                          sx: {
                            fontSize: '0.875rem',
                            fontWeight: isSelected ? 600 : 500,
                            color: isSelected ? '#2d3748' : '#4a5568'
                          }
                        }}
                      />
                      {command.shortcut && (
                        <Chip
                          label={command.shortcut}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.7rem',
                            bgcolor: isSelected ? '#8b6cbc' : '#f1f5f9',
                            color: isSelected ? 'white' : '#64748b',
                            fontWeight: 600,
                            fontFamily: 'monospace'
                          }}
                        />
                      )}
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          ))
        )}
      </Box>

      {/* Footer Hint */}
      <Box sx={{ px: 2, py: 1, borderTop: '1px solid #e9ecef', bgcolor: '#fafafa', display: 'flex', gap: 2, alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <Chip label="↑↓" size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#e2e8f0', fontWeight: 600 }} />
          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>Navigate</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <Chip label="Enter" size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#e2e8f0', fontWeight: 600 }} />
          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>Execute</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <Chip label="Esc" size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#e2e8f0', fontWeight: 600 }} />
          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>Close</Typography>
        </Box>
      </Box>
    </Dialog>
  );
};

export default CommandPalette;
