'use client';

import React, { useState } from 'react';
import {
  Paper,
  IconButton,
  Tooltip,
  Divider,
  Button,
  Popover,
  Box,
  Grid
} from '@mui/material';
import {
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatUnderlined as UnderlineIcon,
  FormatColorText as TextColorIcon,
  FormatColorFill as HighlightIcon,
  FormatAlignLeft as AlignLeftIcon,
  FormatAlignCenter as AlignCenterIcon,
  FormatAlignRight as AlignRightIcon,
  FormatListBulleted as BulletListIcon,
  FormatListNumbered as NumberListIcon,
  Link as LinkIcon,
  Image as ImageIcon,
  TableChart as TableIcon,
  FormatQuote as QuoteIcon,
  Code as CodeIcon,
  FormatClear as ClearFormatIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  ArrowDropDown as ArrowDropDownIcon,
  ViewSidebar as ViewSidebarIcon
} from '@mui/icons-material';

// Toolbar Button Component
const ToolbarButton = ({ active, onClick, disabled, children, title }) => (
  <Tooltip title={title}>
    <span>
      <IconButton
        onClick={onClick}
        disabled={disabled}
        size="small"
        sx={{
          color: active ? '#8b6cbc' : '#666',
          backgroundColor: active ? '#8b6cbc10' : 'transparent',
          '&:hover': {
            backgroundColor: active ? '#8b6cbc20' : '#f5f5f5',
          },
          borderRadius: 1,
          mx: 0.25
        }}
      >
        {children}
      </IconButton>
    </span>
  </Tooltip>
);

// Color Picker Component
const ColorPicker = ({ editor, type = 'color' }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  
  const colors = [
    '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
    '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
    '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc'
  ];

  return (
    <>
      <ToolbarButton
        active={false}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        title={type === 'color' ? 'Text Color' : 'Highlight'}
      >
        {type === 'color' ? <TextColorIcon fontSize="small" /> : <HighlightIcon fontSize="small" />}
      </ToolbarButton>
      <Popover
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 1, width: 220 }}>
          <Grid container spacing={0.5}>
            {colors.map((color) => (
              <Grid item key={color}>
                <Box
                  onClick={() => {
                    if (type === 'color') {
                      editor.chain().focus().setColor(color).run();
                    } else {
                      editor.chain().focus().toggleHighlight({ color }).run();
                    }
                    setAnchorEl(null);
                  }}
                  sx={{
                    width: 20,
                    height: 20,
                    backgroundColor: color,
                    border: '1px solid #ddd',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'scale(1.2)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Popover>
    </>
  );
};

export default function EditorToolbar({
  editor,
  showDocumentStructure,
  onToggleDocumentStructure,
  headingDropdownAnchor,
  setHeadingDropdownAnchor,
  fontFamilyAnchor,
  setFontFamilyAnchor,
  fontSizeAnchor,
  setFontSizeAnchor,
  saveEditorSelection,
  addLink,
  addImage,
  addTable,
  paginationControlsRef,
  paginationEnabled,
  setPaginationEnabled,
  PaginationControls
}) {
  return (
    <Paper sx={{ 
      borderRadius: 0,
      borderBottom: '1px solid #e0e0e0',
      p: 1,
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      flexWrap: 'wrap'
    }}>
      
      {/* Document Structure Toggle */}
      <ToolbarButton
        active={showDocumentStructure}
        onClick={onToggleDocumentStructure}
        title="Document Structure"
      >
        <ViewSidebarIcon fontSize="small" />
      </ToolbarButton>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      {/* Undo/Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor?.can().undo()}
        title="Undo"
      >
        <UndoIcon fontSize="small" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor?.can().redo()}
        title="Redo"
      >
        <RedoIcon fontSize="small" />
      </ToolbarButton>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      {/* Text Formatting */}
      <ToolbarButton
        active={editor?.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold"
      >
        <BoldIcon fontSize="small" />
      </ToolbarButton>
      <ToolbarButton
        active={editor?.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic"
      >
        <ItalicIcon fontSize="small" />
      </ToolbarButton>
      <ToolbarButton
        active={editor?.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline"
      >
        <UnderlineIcon fontSize="small" />
      </ToolbarButton>

      {/* Color Tools */}
      <ColorPicker editor={editor} type="color" />
      <ColorPicker editor={editor} type="highlight" />

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      {/* Heading Dropdown */}
      <Button
        size="small"
        onMouseDown={(e) => {
          e.preventDefault();
          saveEditorSelection();
        }}
        onClick={(e) => setHeadingDropdownAnchor(e.currentTarget)}
        endIcon={<ArrowDropDownIcon />}
        variant="outlined"
        sx={{
          color: '#666',
          borderColor: '#e0e0e0',
          '&:hover': {
            backgroundColor: '#f5f5f5',
            borderColor: '#8b6cbc'
          },
          borderRadius: 1,
          mx: 0.25,
          minWidth: 90,
          fontSize: '0.75rem',
          textTransform: 'none',
          height: 32
        }}
      >
        {editor?.isActive('heading', { level: 1 }) ? 'H1' :
         editor?.isActive('heading', { level: 2 }) ? 'H2' :
         editor?.isActive('heading', { level: 3 }) ? 'H3' :
         editor?.isActive('heading', { level: 4 }) ? 'H4' :
         editor?.isActive('heading', { level: 5 }) ? 'H5' :
         editor?.isActive('heading', { level: 6 }) ? 'H6' :
         'Normal'}
      </Button>

      {/* Font Family Dropdown */}
      <Button
        size="small"
        onMouseDown={(e) => {
          e.preventDefault();
          saveEditorSelection();
        }}
        onClick={(e) => setFontFamilyAnchor(e.currentTarget)}
        endIcon={<ArrowDropDownIcon />}
        variant="outlined"
        sx={{
          color: '#666',
          borderColor: '#e0e0e0',
          '&:hover': {
            backgroundColor: '#f5f5f5',
            borderColor: '#8b6cbc'
          },
          borderRadius: 1,
          mx: 0.25,
          minWidth: 120,
          fontSize: '0.75rem',
          textTransform: 'none',
          height: 32,
          justifyContent: 'space-between'
        }}
      >
        {editor?.getAttributes('textStyle')?.fontFamily || 'Default Font'}
      </Button>

      {/* Font Size Dropdown */}
      <Button
        size="small"
        onMouseDown={(e) => {
          e.preventDefault();
          saveEditorSelection();
        }}
        onClick={(e) => setFontSizeAnchor(e.currentTarget)}
        endIcon={<ArrowDropDownIcon />}
        variant="outlined"
        sx={{
          color: '#666',
          borderColor: '#e0e0e0',
          '&:hover': {
            backgroundColor: '#f5f5f5',
            borderColor: '#8b6cbc'
          },
          borderRadius: 1,
          mx: 0.25,
          minWidth: 70,
          fontSize: '0.75rem',
          textTransform: 'none',
          height: 32,
          justifyContent: 'space-between'
        }}
      >
        {editor?.getAttributes('textStyle')?.fontSize?.replace('px', 'pt') || '12pt'}
      </Button>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      {/* Alignment */}
      <ToolbarButton
        active={editor?.isActive({ textAlign: 'left' })}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        title="Align Left"
      >
        <AlignLeftIcon fontSize="small" />
      </ToolbarButton>
      <ToolbarButton
        active={editor?.isActive({ textAlign: 'center' })}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        title="Align Center"
      >
        <AlignCenterIcon fontSize="small" />
      </ToolbarButton>
      <ToolbarButton
        active={editor?.isActive({ textAlign: 'right' })}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        title="Align Right"
      >
        <AlignRightIcon fontSize="small" />
      </ToolbarButton>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      {/* Lists */}
      <ToolbarButton
        active={editor?.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet List"
      >
        <BulletListIcon fontSize="small" />
      </ToolbarButton>
      <ToolbarButton
        active={editor?.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Numbered List"
      >
        <NumberListIcon fontSize="small" />
      </ToolbarButton>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      {/* Insert Tools */}
      <ToolbarButton onClick={addLink} title="Insert Link">
        <LinkIcon fontSize="small" />
      </ToolbarButton>
      <ToolbarButton onClick={addImage} title="Insert Image">
        <ImageIcon fontSize="small" />
      </ToolbarButton>
      <ToolbarButton onClick={addTable} title="Insert Table">
        <TableIcon fontSize="small" />
      </ToolbarButton>
      
      <PaginationControls 
        ref={paginationControlsRef}
        editor={editor} 
        enabled={paginationEnabled}
        onToggle={setPaginationEnabled}
      />

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      {/* Quote & Code */}
      <ToolbarButton
        active={editor?.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="Quote"
      >
        <QuoteIcon fontSize="small" />
      </ToolbarButton>
      <ToolbarButton
        active={editor?.isActive('code')}
        onClick={() => editor.chain().focus().toggleCode().run()}
        title="Inline Code"
      >
        <CodeIcon fontSize="small" />
      </ToolbarButton>

      {/* Clear Formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        title="Clear Format"
      >
        <ClearFormatIcon fontSize="small" />
      </ToolbarButton>
    </Paper>
  );
}
