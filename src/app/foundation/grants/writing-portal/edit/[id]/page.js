'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import FontFamily from '@tiptap/extension-font-family';
import CharacterCount from '@tiptap/extension-character-count';
import Placeholder from '@tiptap/extension-placeholder';

import {
  Box,
  Container,
  Typography,
  Button,
  IconButton,
  Stack,
  Avatar,
  Tooltip,
  Paper,
  Divider,
  Chip,
  AppBar,
  Toolbar,
  Breadcrumbs,
  CircularProgress,
  ButtonGroup,
  Menu,
  MenuItem,
  Popover,
  Alert,
  Snackbar,
} from '@mui/material';

import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Share as ShareIcon,
  Person as PersonIcon,
  PersonAdd as PersonAddIcon,
  Settings as SettingsIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatUnderlined as UnderlineIcon,
  FormatAlignLeft as AlignLeftIcon,
  FormatAlignCenter as AlignCenterIcon,
  FormatAlignRight as AlignRightIcon,
  FormatAlignJustify as AlignJustifyIcon,
  FormatListBulleted as BulletListIcon,
  FormatListNumbered as NumberListIcon,
  FormatQuote as QuoteIcon,
  Code as CodeIcon,
  Link as LinkIcon,
  Image as ImageIcon,
  TableChart as TableIcon,
  Highlight as HighlightIcon,
  FormatColorText as TextColorIcon,
  Title as H1Icon,
  ViewHeadline as H2Icon,
  Subject as H3Icon,
  FormatClear as ClearFormatIcon,
  CloudSync as CloudSyncIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

import { alpha } from '@mui/material/styles';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';

// TipTap Extensions Configuration
const extensions = [
  StarterKit.configure({
    bulletList: {
      keepMarks: true,
      keepAttributes: false,
    },
    orderedList: {
      keepMarks: true,
      keepAttributes: false,
    },
  }),
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
  Underline,
  TextStyle,
  Color,
  Highlight.configure({
    multicolor: true,
  }),
  Link.configure({
    openOnClick: false,
  }),
  Image,
  Table.configure({
    resizable: true,
  }),
  TableRow,
  TableHeader,
  TableCell,
  FontFamily.configure({
    types: ['textStyle'],
  }),
  CharacterCount,
  Placeholder.configure({
    placeholder: 'Start writing your grant proposal...',
    showOnlyWhenEditable: true,
    showOnlyCurrent: false,
    includeChildren: true,
  }),
];

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
        <Box sx={{ p: 1, display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 0.5, width: 250 }}>
          {colors.map((color) => (
            <Box
              key={color}
              sx={{
                width: 20,
                height: 20,
                backgroundColor: color,
                border: '1px solid #ccc',
                borderRadius: 0.5,
                cursor: 'pointer',
                '&:hover': {
                  transform: 'scale(1.1)',
                }
              }}
              onClick={() => {
                if (type === 'color') {
                  editor.chain().focus().setColor(color).run();
                } else {
                  editor.chain().focus().setHighlight({ color }).run();
                }
                setAnchorEl(null);
              }}
            />
          ))}
        </Box>
      </Popover>
    </>
  );
};

export default function ProposalEditor() {
  const params = useParams();
  const router = useRouter();
  const proposalId = params.id;
  
  // State management
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Menu states
  const [fileMenuAnchor, setFileMenuAnchor] = useState(null);
  const [shareMenuAnchor, setShareMenuAnchor] = useState(null);
  
  // Initialize TipTap editor
  const editor = useEditor({
    extensions,
    content: '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      // Auto-save logic can be added here
      handleAutoSave(editor.getHTML());
    },
  });
  
  // Fetch proposal data
  const fetchProposal = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/proposals/${proposalId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch proposal');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setProposal(result.proposal);
        if (editor && result.proposal.content) {
          editor.commands.setContent(result.proposal.content);
        }
      }
    } catch (error) {
      console.error('Error fetching proposal:', error);
      showSnackbar('Failed to load proposal', 'error');
    } finally {
      setLoading(false);
    }
  }, [proposalId, editor]);
  
  useEffect(() => {
    if (proposalId) {
      fetchProposal();
    }
  }, [proposalId, fetchProposal]);
  
  // Utility functions
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };
  
  const handleAutoSave = useCallback(async (content) => {
    // Debounced auto-save logic
    // Implementation can be added based on requirements
  }, []);
  
  const handleSave = async () => {
    if (!editor) return;
    
    try {
      setSaving(true);
      const content = editor.getHTML();
      
      const response = await fetch(`/api/proposals/${proposalId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      
      if (response.ok) {
        setLastSaved(new Date());
        showSnackbar('Proposal saved successfully', 'success');
      } else {
        throw new Error('Failed to save proposal');
      }
    } catch (error) {
      console.error('Error saving proposal:', error);
      showSnackbar('Failed to save proposal', 'error');
    } finally {
      setSaving(false);
    }
  };
  
  const handleBack = () => {
    router.push('/foundation/grants/writing-portal');
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress size={60} sx={{ color: '#8b6cbc' }} />
      </Box>
    );
  }
  
  if (!editor) {
    return null;
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Top AppBar */}
      <AppBar position="sticky" sx={{ backgroundColor: 'white', color: 'text.primary', boxShadow: 1 }}>
        <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <IconButton onClick={handleBack} sx={{ color: '#8b6cbc' }}>
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#8b6cbc' }}>
                {proposal?.title || 'Untitled Proposal'}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  {lastSaved ? `Last saved ${format(lastSaved, 'HH:mm:ss')}` : 'Not saved yet'}
                </Typography>
                {saving && (
                  <>
                    <CloudSyncIcon sx={{ fontSize: 14, color: '#8b6cbc' }} />
                    <Typography variant="caption" sx={{ color: '#8b6cbc' }}>
                      Saving...
                    </Typography>
                  </>
                )}
              </Stack>
            </Box>
          </Stack>
          
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<PersonAddIcon />}
              onClick={() => setShareMenuAnchor(true)}
              sx={{ borderColor: '#8b6cbc', color: '#8b6cbc' }}
            >
              Share
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
              onClick={handleSave}
              disabled={saving}
              sx={{
                backgroundColor: '#8b6cbc',
                '&:hover': { backgroundColor: '#7a5ba8' }
              }}
            >
              Save
            </Button>
          </Stack>
        </Toolbar>
        
        {/* Toolbar */}
        <Divider />
        <Toolbar variant="dense" sx={{ gap: 0.5, overflowX: 'auto', minHeight: 48 }}>
          <ButtonGroup size="small" sx={{ mr: 1 }}>
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo"
            >
              <UndoIcon fontSize="small" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo"
            >
              <RedoIcon fontSize="small" />
            </ToolbarButton>
          </ButtonGroup>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          
          <ButtonGroup size="small" sx={{ mr: 1 }}>
            <ToolbarButton
              active={editor.isActive('heading', { level: 1 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              title="Heading 1"
            >
              <H1Icon fontSize="small" />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive('heading', { level: 2 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              title="Heading 2"
            >
              <H2Icon fontSize="small" />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive('heading', { level: 3 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              title="Heading 3"
            >
              <H3Icon fontSize="small" />
            </ToolbarButton>
          </ButtonGroup>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          
          <ButtonGroup size="small" sx={{ mr: 1 }}>
            <ToolbarButton
              active={editor.isActive('bold')}
              onClick={() => editor.chain().focus().toggleBold().run()}
              title="Bold"
            >
              <BoldIcon fontSize="small" />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive('italic')}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              title="Italic"
            >
              <ItalicIcon fontSize="small" />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive('underline')}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              title="Underline"
            >
              <UnderlineIcon fontSize="small" />
            </ToolbarButton>
          </ButtonGroup>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          
          <ButtonGroup size="small" sx={{ mr: 1 }}>
            <ToolbarButton
              active={editor.isActive({ textAlign: 'left' })}
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              title="Align Left"
            >
              <AlignLeftIcon fontSize="small" />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive({ textAlign: 'center' })}
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              title="Align Center"
            >
              <AlignCenterIcon fontSize="small" />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive({ textAlign: 'right' })}
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              title="Align Right"
            >
              <AlignRightIcon fontSize="small" />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive({ textAlign: 'justify' })}
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
              title="Justify"
            >
              <AlignJustifyIcon fontSize="small" />
            </ToolbarButton>
          </ButtonGroup>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          
          <ButtonGroup size="small" sx={{ mr: 1 }}>
            <ToolbarButton
              active={editor.isActive('bulletList')}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              title="Bullet List"
            >
              <BulletListIcon fontSize="small" />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive('orderedList')}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              title="Numbered List"
            >
              <NumberListIcon fontSize="small" />
            </ToolbarButton>
          </ButtonGroup>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          
          <ButtonGroup size="small" sx={{ mr: 1 }}>
            <ColorPicker editor={editor} type="color" />
            <ColorPicker editor={editor} type="highlight" />
          </ButtonGroup>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          
          <ButtonGroup size="small">
            <ToolbarButton
              active={editor.isActive('blockquote')}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              title="Quote"
            >
              <QuoteIcon fontSize="small" />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive('codeBlock')}
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              title="Code Block"
            >
              <CodeIcon fontSize="small" />
            </ToolbarButton>
          </ButtonGroup>
        </Toolbar>
      </AppBar>
      
      {/* Editor Content */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper
          sx={{
            minHeight: '80vh',
            p: 4,
            backgroundColor: 'white',
            boxShadow: 2,
            borderRadius: 2,
            '& .ProseMirror': {
              minHeight: '70vh',
              outline: 'none',
              '& p': {
                marginBottom: '1em',
              },
              '& h1': {
                fontSize: '2em',
                fontWeight: 700,
                marginTop: '0.67em',
                marginBottom: '0.67em',
              },
              '& h2': {
                fontSize: '1.5em',
                fontWeight: 700,
                marginTop: '0.83em',
                marginBottom: '0.83em',
              },
              '& h3': {
                fontSize: '1.17em',
                fontWeight: 700,
                marginTop: '1em',
                marginBottom: '1em',
              },
              '& ul, & ol': {
                paddingLeft: '2em',
                marginBottom: '1em',
              },
              '& blockquote': {
                borderLeft: '4px solid #8b6cbc',
                paddingLeft: '1em',
                marginLeft: 0,
                fontStyle: 'italic',
                color: '#666',
              },
              '& code': {
                backgroundColor: '#f5f5f5',
                padding: '0.2em 0.4em',
                borderRadius: '3px',
                fontSize: '0.9em',
              },
              '& pre': {
                backgroundColor: '#f5f5f5',
                padding: '1em',
                borderRadius: '5px',
                overflow: 'auto',
              },
              '& table': {
                borderCollapse: 'collapse',
                width: '100%',
                marginBottom: '1em',
              },
              '& td, & th': {
                border: '1px solid #ddd',
                padding: '8px',
              },
              '& th': {
                backgroundColor: '#8b6cbc',
                color: 'white',
                fontWeight: 600,
              },
            }
          }}
        >
          <EditorContent editor={editor} />
        </Paper>
        
        {/* Character Count */}
        <Box sx={{ mt: 2, textAlign: 'right' }}>
          <Typography variant="caption" color="text.secondary">
            {editor.storage.characterCount.characters()} characters | {editor.storage.characterCount.words()} words
          </Typography>
        </Box>
      </Container>
      
      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
