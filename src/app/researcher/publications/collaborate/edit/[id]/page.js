'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Card,
  CardContent,
  IconButton,
  Stack,
  Avatar,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid2 as Grid,
  Paper,
  Divider,
  Chip,
  Badge,
  ToggleButton,
  ToggleButtonGroup,
  Menu,
  MenuItem as MuiMenuItem,
  ListItemIcon,
  Popover,
  MenuList,
  AppBar,
  Toolbar,
  Breadcrumbs,
  LinearProgress,
  CircularProgress,
  Fab,
  ButtonGroup
} from '@mui/material';

import {
  Save as SaveIcon,
  Share as ShareIcon,
  Comment as CommentIcon,
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
  MoreVert as MoreVertIcon,
  Groups as GroupsIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  AutoFixHigh as AutoFixHighIcon,
  Timeline as TimelineIcon,
  Assignment as AssignmentIcon,
  FileOpen as FileOpenIcon,
  FileCopy as FileCopyIcon,
  FileDownload as FileDownloadIcon,
  CreateNewFolder as CreateNewFolderIcon,
  ContentCut as CutIcon,
  ContentCopy as CopyIcon,
  ContentPaste as PasteIcon,
  FindReplace as FindReplaceIcon,
  Fullscreen as FullscreenIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Spellcheck as SpellcheckIcon,
  Translate as TranslateIcon,
  MenuBook as MenuBookIcon,
  BookmarkAdd as BookmarkAddIcon,
  FormatSize as FormatSizeIcon,
  NoteAdd as NoteAddIcon,
  PictureAsPdf as PdfIcon,
  Description as WordIcon,
  AutoMode as AutosaveIcon,
  SelectAll as SelectAllIcon,
  ArrowDropDown as ArrowDropDownIcon,
  Search as SearchIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  RadioButtonChecked as RadioButtonCheckedIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  CloudSync as CloudSyncIcon,
  LibraryBooks as LibraryBooksIcon,
  AutoFixHigh as MagicWandIcon,
  History as HistoryIcon,
  TrackChanges as TrackChangesIcon
} from '@mui/icons-material';

import { useAuth } from '@/components/AuthProvider';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import DocumentHeader from './components/DocumentHeader';
import DocumentMenuBar from './components/DocumentMenuBar';
import CitationLibraryModal from './components/CitationLibraryModal';
import ManageSourcesModal from './components/ManageSourcesModal';
import InsertTableDialog from './components/InsertTableDialog';
import TablePropertiesDialog from './components/TablePropertiesDialog';
import CommentsSidebar from './components/CommentsSidebar';
import CommentTooltip from './components/CommentTooltip';
import TestHighlight from './components/TestHighlight';
import VersionHistorySidebar from './components/VersionHistorySidebar';
import TrackedChangesSidebar from './components/TrackedChangesSidebar';
import CommentHighlight from './extensions/CommentHighlight';
import TrackChanges from './extensions/TrackChanges';
import BibliographyGenerator from '@/components/Bibliography/BibliographyGenerator';
import ReferencesHoverButton from '@/components/Bibliography/ReferencesHoverButton';

// Custom TipTap Extensions Configuration
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
    placeholder: 'Start writing your manuscript...',
    showOnlyWhenEditable: true,
    showOnlyCurrent: false,
    includeChildren: true,
  }),
  CommentHighlight,
  TrackChanges.configure({
    enabled: false, // Start disabled
    userId: null,   // Will be set when editor initializes
    userName: '',   // Will be set when editor initializes
    onChangeCreated: () => {},    // Will be set when editor initializes
    onChangeAccepted: () => {},   // Will be set when editor initializes
    onChangeRejected: () => {},   // Will be set when editor initializes
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

// Heading Structure Display Component
const HeadingStructureDisplay = ({ headings, onNavigate }) => {
  return (
    <>
      {headings.map((heading) => (
        <Box
          key={heading.id}
          onClick={() => onNavigate(heading)}
          sx={{
            pl: (heading.level - 1) * 2 + 1, // H1=1, H2=3, H3=5, H4=7, H5=9, H6=11
            py: 1,
            px: 1,
            mb: 0.5,
            borderRadius: 1,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            '&:hover': {
              bgcolor: '#f5f5f5'
            },
            '&:active': {
              bgcolor: '#8b6cbc20'
            }
          }}
        >
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: getHeadingColor(heading.level),
              mr: 1,
              flexShrink: 0
            }}
          />
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: getHeadingFontSize(heading.level),
              fontWeight: getHeadingFontWeight(heading.level),
              color: '#333',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1
            }}
          >
            {heading.text}
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#999',
              fontSize: '0.7rem',
              ml: 1,
              flexShrink: 0
            }}
          >
            H{heading.level}
          </Typography>
        </Box>
      ))}
    </>
  );
};

// Helper functions for heading display
const getHeadingColor = (level) => {
  const colors = ['#8b6cbc', '#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0'];
  return colors[level - 1] || '#666';
};

const getHeadingFontSize = (level) => {
  const sizes = ['0.95rem', '0.9rem', '0.85rem', '0.8rem', '0.75rem', '0.7rem'];
  return sizes[level - 1] || '0.7rem';
};

const getHeadingFontWeight = (level) => {
  return level <= 2 ? 600 : level <= 4 ? 500 : 400;
};

// Main Editor Component
export default function ManuscriptEditor() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const manuscriptId = params.id;

  // State management
  const [manuscript, setManuscript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [autosaveEnabled, setAutosaveEnabled] = useState(false);
  const [insertTableDialogOpen, setInsertTableDialogOpen] = useState(false);
  const [tablePropertiesDialogOpen, setTablePropertiesDialogOpen] = useState(false);
  
  // Menu dropdown states for remaining menus not yet moved to DocumentMenuBar
  const [citationMenuAnchor, setCitationMenuAnchor] = useState(null);
  const [headingDropdownAnchor, setHeadingDropdownAnchor] = useState(null);
  const [fontFamilyAnchor, setFontFamilyAnchor] = useState(null);
  const [fontSizeAnchor, setFontSizeAnchor] = useState(null);
  const [documentStructure, setDocumentStructure] = useState([]);
  
  // Citation preferences
  const [citeAsYouWrite, setCiteAsYouWrite] = useState(true);
  const [citationStyle, setCitationStyle] = useState('APA');
  const [zoteroConnected, setZoteroConnected] = useState(false);
  
  // Citation functionality
  const [citationPopupAnchor, setCitationPopupAnchor] = useState(null);
  const [citationSearch, setCitationSearch] = useState('');
  const [selectedCitationIndex, setSelectedCitationIndex] = useState(0);
  const [triggerPosition, setTriggerPosition] = useState(null);
  const [citationLibraryOpen, setCitationLibraryOpen] = useState(false);
  const [manageSourcesOpen, setManageSourcesOpen] = useState(false);
  const [bibliographyGeneratorOpen, setBibliographyGeneratorOpen] = useState(false);
  
  // Text selection for commenting
  const [selectedText, setSelectedText] = useState(null);
  
  // Comments data for highlights and tooltips
  const [commentsData, setCommentsData] = useState([]);
  
  // Track changes state
  const [trackChangesEnabled, setTrackChangesEnabled] = useState(false);
  const [trackedChanges, setTrackedChanges] = useState(new Map());
  const [showTrackChanges, setShowTrackChanges] = useState(true);
  const [showTrackedChangesSidebar, setShowTrackedChangesSidebar] = useState(false);
  
  // Version history state
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  
  // Database citation state for Cite as You Write
  const [quickCitations, setQuickCitations] = useState([]);
  const [quickCitationsLoading, setQuickCitationsLoading] = useState(false);
  const [quickCitationsError, setQuickCitationsError] = useState(null);

  // Fetch citations from database for quick search
  const fetchQuickCitations = useCallback(async (searchTerm = '') => {
    setQuickCitationsLoading(true);
    setQuickCitationsError(null);
    
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        limit: '10', // Limit to 10 for quick popup
        offset: '0'
      });
      
      const response = await fetch(`/api/citations?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setQuickCitations(data.citations || []);
      } else {
        setQuickCitationsError(data.error || 'Failed to fetch citations');
        setQuickCitations([]);
      }
    } catch (err) {
      console.error('Error fetching quick citations:', err);
      setQuickCitationsError('Failed to fetch citations');
      setQuickCitations([]);
    } finally {
      setQuickCitationsLoading(false);
    }
  }, []);

  // Citation helper functions
  const formatCitation = useCallback((citation) => {
    switch (citationStyle) {
      case 'APA':
        if (citation.type === 'journal') {
          return `(${citation.authors[0].split(',')[0]} et al., ${citation.year})`;
        } else if (citation.type === 'book') {
          return `(${citation.authors[0].split(',')[0]} ${citation.authors.length > 1 ? '& ' + citation.authors[1].split(',')[0] : ''}, ${citation.year})`;
        } else if (citation.type === 'conference') {
          return `(${citation.authors[0].split(',')[0]} ${citation.authors.length > 1 ? '& ' + citation.authors[1].split(',')[0] : ''}, ${citation.year})`;
        } else if (citation.type === 'book_chapter') {
          return `(${citation.authors[0].split(',')[0]} ${citation.authors.length > 1 ? '& ' + citation.authors[1].split(',')[0] : ''}, ${citation.year})`;
        }
        break;
      case 'MLA':
        return `(${citation.authors[0].split(',')[0]} ${citation.year})`;
      case 'Chicago':
        return `(${citation.authors[0].split(',')[0]} ${citation.year})`;
      default:
        return `(${citation.authors[0].split(',')[0]} et al., ${citation.year})`;
    }
  }, [citationStyle]);

  const filterCitations = useCallback((searchTerm) => {
    // Return the quickCitations which are already filtered by the API call
    return quickCitations || [];
  }, [quickCitations]);

  // Memoize filtered citations for consistent access
  const filteredCitations = useMemo(() => 
    filterCitations(citationSearch), 
    [filterCitations, citationSearch]
  );

  // Citation insertion function (defined as regular function to avoid dependency issues)
  const insertCitation = async (citation) => {
    if (!editor) return;
    
    const formattedCitation = formatCitation(citation);
    
    // If we have a trigger position, replace the trigger text
    if (triggerPosition) {
      editor
        .chain()
        .focus()
        .setTextSelection({ from: triggerPosition.startPos, to: triggerPosition.endPos })
        .insertContent(formattedCitation)
        .run();
    } else {
      // Fallback to inserting at current position
      editor.chain().focus().insertContent(formattedCitation).run();
    }
    
    // Automatically add citation to manuscript library
    try {
      console.log('Adding citation to manuscript library:', {
        manuscriptId,
        citationId: citation.id,
        citationTitle: citation.title
      });
      
      const response = await fetch(`/api/manuscripts/${manuscriptId}/citations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publicationId: citation.id
        })
      });
      
      const result = await response.json();
      console.log('API Response:', result);
      
      if (result.success) {
        console.log(result.isNew ? 'Citation added to manuscript library' : 'Citation count updated');
      } else {
        console.error('Failed to add citation to manuscript library:', result.error);
        console.error('Error details:', result.details);
        console.error('Error code:', result.code);
      }
    } catch (error) {
      console.error('Error adding citation to manuscript library:', error);
    }
    
    setCitationPopupAnchor(null);
    setCitationSearch('');
    setSelectedCitationIndex(0);
    setTriggerPosition(null);
    setQuickCitations([]);
  };

  // Citation detection logic (doesn't depend on editor)
  const detectCitationTrigger = useCallback((text, cursorPos) => {
    // Look for patterns like "@smith" or "cite:" or "[" that might indicate citation intent
    const beforeCursor = text.slice(0, cursorPos);
    const citationTriggers = [
      /@(\w+)$/,           // @author pattern
      /cite:\s*(\w*)$/i,   // cite: pattern  
      /\[\s*(\w*)$/,       // [ pattern for citation brackets
      /\(\s*(\w+)\s*$/     // ( pattern for parenthetical citations
    ];
    
    for (const trigger of citationTriggers) {
      const match = beforeCursor.match(trigger);
      if (match) {
        return {
          found: true,
          query: match[1] || '',
          startPos: cursorPos - match[0].length,
          endPos: cursorPos
        };
      }
    }
    return { found: false };
  }, []);

  // TipTap Editor Configuration
  const editor = useEditor({
    extensions,
    content: '<p></p>',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[500px] p-6',
        style: 'white-space: pre-wrap;'
      },
    },
    onSelectionUpdate: ({ editor }) => {
      // Handle text selection for commenting
      const { from, to, empty } = editor.state.selection;
      
      if (empty) {
        setSelectedText(null);
        return;
      }

      const selectedTextContent = editor.state.doc.textBetween(from, to, ' ');
      
      if (selectedTextContent.trim()) {
        setSelectedText({
          text: selectedTextContent.trim(),
          startOffset: from,
          endOffset: to
        });
      } else {
        setSelectedText(null);
      }
    },
    // Auto-save is now handled by useEffect with autosave toggle
  });

  // Load manuscript data from API
  useEffect(() => {
    const loadManuscript = async () => {
      if (!manuscriptId) return;
      
      setLoading(true);
      try {
        const response = await fetch(`/api/manuscripts/${manuscriptId}`);
        const data = await response.json();
        
        if (data.success) {
          const manuscriptData = data.data;
          setManuscript(manuscriptData);
          
          // Load content into editor if it exists
          if (editor && manuscriptData.content) {
            editor.commands.setContent(manuscriptData.content);
          }
          
          // Load existing comment highlights
          loadExistingCommentHighlights();
          
          // Set last saved time
          setLastSaved(manuscriptData.lastSaved ? new Date(manuscriptData.lastSaved) : null);
          
          // Set collaborators data
          setCollaborators(manuscriptData.collaborators.map(collab => ({
            id: collab.user.id,
            name: `${collab.user.givenName} ${collab.user.familyName}`,
            email: collab.user.email,
            role: collab.role,
            avatar: collab.user.givenName.charAt(0).toUpperCase(),
            color: getAvatarColor(collab.user.id),
            online: Math.random() > 0.5 // Mock online status for now
          })));
          
          // Mock document structure for now
          setDocumentStructure([
            { id: 1, title: 'Abstract', completed: true },
            { id: 2, title: 'Introduction', completed: true },
            { id: 3, title: 'Methods', completed: false },
            { id: 4, title: 'Results', completed: false },
            { id: 5, title: 'Discussion', completed: false },
            { id: 6, title: 'Conclusion', completed: false },
            { id: 7, title: 'References', completed: false }
          ]);
          
        } else {
          console.error('Failed to load manuscript:', data.error);
          // Handle error - maybe redirect to manuscripts list
        }
      } catch (error) {
        console.error('Error loading manuscript:', error);
      } finally {
        setLoading(false);
      }
    };

    loadManuscript();
  }, [manuscriptId, editor]);

  // Configure TrackChanges extension when user data is available
  useEffect(() => {
    if (editor && user) {
      // Update TrackChanges extension configuration
      const trackChangesExtension = editor.extensionManager.extensions.find(ext => ext.name === 'trackChanges');
      
      if (trackChangesExtension) {
        trackChangesExtension.options.userId = user.id;
        trackChangesExtension.options.userName = `${user.givenName} ${user.familyName}`;
        trackChangesExtension.options.onChangeCreated = (change) => {
          console.log('Change created:', change);
          setTrackedChanges(prev => new Map(prev.set(change.id, change)));
        };
        trackChangesExtension.options.onChangeAccepted = (change) => {
          console.log('Change accepted:', change);
          setTrackedChanges(prev => {
            const newMap = new Map(prev);
            newMap.delete(change.id);
            return newMap;
          });
        };
        trackChangesExtension.options.onChangeRejected = (change) => {
          console.log('Change rejected:', change);
          setTrackedChanges(prev => {
            const newMap = new Map(prev);
            newMap.delete(change.id);
            return newMap;
          });
        };
      }
    }
  }, [editor, user]);

  // Handle comment selection from highlight click
  const handleCommentSelection = useCallback((commentId) => {
    // Open comments sidebar if not already open
    if (!showComments) {
      setShowComments(true);
    }
    
    // Dispatch event to focus on specific comment in sidebar
    const focusEvent = new CustomEvent('focusComment', {
      detail: { commentId }
    });
    document.dispatchEvent(focusEvent);
  }, [showComments]);

  // Handle comment selection events from highlights
  useEffect(() => {
    const handleCommentSelect = (event) => {
      const { commentId } = event.detail;
      handleCommentSelection(commentId);
    };

    document.addEventListener('selectComment', handleCommentSelect);

    return () => {
      document.removeEventListener('selectComment', handleCommentSelect);
    };
  }, [handleCommentSelection]);

  // Helper function to generate consistent avatar colors
  const getAvatarColor = (userId) => {
    const colors = ['#3f51b5', '#4caf50', '#ff9800', '#f44336', '#9c27b0', '#00bcd4'];
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  // Extract headings from editor content to build document structure
  const extractDocumentStructure = useCallback(() => {
    if (!editor) return;

    const json = editor.getJSON();
    const headings = [];
    let currentId = 1;

    const extractHeadings = (nodes) => {
      nodes.forEach((node) => {
        if (node.type === 'heading' && node.attrs?.level) {
          const level = node.attrs.level;
          const text = node.content?.map(c => c.text).join('') || `Heading ${level}`;
          
          headings.push({
            id: currentId++,
            level,
            text,
            position: headings.length
          });
        }
        
        if (node.content) {
          extractHeadings(node.content);
        }
      });
    };

    extractHeadings(json.content || []);
    setDocumentStructure(headings);
  }, [editor]);

  // Navigate to heading in the editor
  const navigateToHeading = useCallback((heading) => {
    if (!editor) return;

    // Focus the editor first
    editor.commands.focus();
    
    // Find the heading element in the DOM and scroll to it
    setTimeout(() => {
      const editorElement = document.querySelector('.ProseMirror');
      if (editorElement) {
        const headingElements = editorElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const targetElement = Array.from(headingElements).find(el => {
          const elementLevel = parseInt(el.tagName.charAt(1));
          return el.textContent === heading.text && elementLevel === heading.level;
        });
        
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Briefly highlight the heading
          targetElement.style.backgroundColor = '#8b6cbc20';
          setTimeout(() => {
            targetElement.style.backgroundColor = '';
          }, 2000);
        }
      }
    }, 100);
  }, [editor]);

  // Update document structure when editor content changes
  useEffect(() => {
    if (!editor) return;

    const updateStructure = () => {
      extractDocumentStructure();
    };

    // Initial extraction
    updateStructure();

    // Listen to editor updates
    editor.on('update', updateStructure);

    return () => {
      editor.off('update', updateStructure);
    };
  }, [editor, extractDocumentStructure]);

  // Citation detection useEffect
  useEffect(() => {
    if (!editor || !citeAsYouWrite) return;

    const handleEditorUpdate = async () => {
      if (!editor.isFocused) return;
      
      const { from, to } = editor.state.selection;
      const text = editor.getText();
      
      // Only detect on cursor position (no selection)
      if (from !== to) return;
      
      const detection = detectCitationTrigger(text, from);
      
      if (detection.found) {
        // Get cursor position for popup placement
        const coords = editor.view.coordsAtPos(from);
        setCitationSearch(detection.query);
        setTriggerPosition({
          startPos: detection.startPos,
          endPos: detection.endPos
        });
        setCitationPopupAnchor({
          getBoundingClientRect: () => ({
            left: coords.left,
            top: coords.top + 20,
            right: coords.left,
            bottom: coords.top + 20,
            width: 0,
            height: 0
          })
        });
        setSelectedCitationIndex(0);
        
        // Fetch citations from database based on search query
        await fetchQuickCitations(detection.query);
      } else if (citationPopupAnchor) {
        setCitationPopupAnchor(null);
        setCitationSearch('');
        setTriggerPosition(null);
        setQuickCitations([]);
      }
    };

    editor.on('update', handleEditorUpdate);
    editor.on('selectionUpdate', handleEditorUpdate);

    return () => {
      editor.off('update', handleEditorUpdate);
      editor.off('selectionUpdate', handleEditorUpdate);
    };
  }, [editor, citeAsYouWrite, detectCitationTrigger, citationPopupAnchor, fetchQuickCitations]);

  // Keyboard shortcuts for citation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Shift+C for manual citation insertion
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        if (editor && editor.isFocused) {
          setCitationLibraryOpen(true);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [editor]);

  // Auto-save function
  const handleAutoSave = useCallback(async () => {
    if (!editor || saving || !manuscriptId) return;
    
    setSaving(true);
    try {
      const content = editor.getHTML();
      
      const response = await fetch(`/api/manuscripts/${manuscriptId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setLastSaved(new Date(data.data.lastSaved));
        setManuscript(prev => ({
          ...prev,
          wordCount: data.data.wordCount,
          updatedAt: data.data.updatedAt
        }));
      } else {
        console.error('Save failed:', data.error);
        // Could show a toast notification here
      }
    } catch (error) {
      console.error('Error saving manuscript:', error);
      // Could show an error toast notification here
    } finally {
      setSaving(false);
    }
  }, [editor, saving, manuscriptId]);

  // Invite function
  const handleInvite = useCallback(() => {
    // For now, we'll show a simple prompt. Later this could open a modal.
    console.log('Opening invite dialog...');
    // TODO: Open invite collaborators modal/dialog
  }, []);

  // Handle text selection for commenting
  const handleTextSelection = useCallback(() => {
    if (!editor) return;

    const { from, to, empty } = editor.state.selection;
    
    if (empty) {
      // No text selected, clear selection
      setSelectedText(null);
      return;
    }

    // Get the selected text
    const selectedTextContent = editor.state.doc.textBetween(from, to, ' ');
    
    if (selectedTextContent.trim()) {
      setSelectedText({
        text: selectedTextContent.trim(),
        startOffset: from,
        endOffset: to
      });
    } else {
      setSelectedText(null);
    }
  }, [editor]);

  // Clear text selection
  const clearTextSelection = useCallback(() => {
    setSelectedText(null);
    if (editor) {
      // Clear editor selection
      editor.commands.setTextSelection(editor.state.selection.to);
    }
  }, [editor]);

  // Add comment highlight to selected text
  const addCommentHighlight = useCallback((comment, selectedTextData) => {
    if (!editor || !selectedTextData) return;

    const { startOffset, endOffset } = selectedTextData;
    
    // Apply highlight to the selected range
    editor.chain()
      .focus()
      .setTextSelection({ from: startOffset, to: endOffset })
      .setCommentHighlight({
        commentId: comment.id,
        commentType: comment.type,
        authorName: `${comment.author.givenName} ${comment.author.familyName}`,
        commentContent: comment.content
      })
      .run();
  }, [editor]);

  // Remove comment highlight
  const removeCommentHighlight = useCallback((commentId) => {
    if (!editor) return;
    
    editor.chain()
      .focus()
      .removeCommentHighlight(commentId)
      .run();
  }, [editor]);

  // Load existing comment highlights when manuscript loads
  const loadExistingCommentHighlights = useCallback(async () => {
    if (!editor || !manuscriptId) return;

    try {
      const response = await fetch(`/api/manuscripts/${manuscriptId}/comments`);
      const data = await response.json();
      
      if (data.success && data.data) {
        // Filter comments that have selected text and position data
        const commentsWithSelection = data.data.filter(comment => 
          comment.selectedText && 
          comment.startOffset !== null && 
          comment.endOffset !== null
        );
        
        // Apply highlights for each comment
        commentsWithSelection.forEach(comment => {
          const authorName = `${comment.author.givenName} ${comment.author.familyName}`;
          
          // Apply highlight to the text range
          editor.chain()
            .focus()
            .setTextSelection({ from: comment.startOffset, to: comment.endOffset })
            .setCommentHighlight({
              commentId: comment.id,
              commentType: comment.type,
              authorName: authorName,
              commentContent: comment.content
            })
            .run();
        });
      }
    } catch (error) {
      console.error('Error loading comment highlights:', error);
    }
  }, [editor, manuscriptId]);

  // Toolbar functions
  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  // Menu bar functions
  const handleFileAction = useCallback((action) => {
    switch(action) {
      case 'new':
        if (confirm('Create a new document? Any unsaved changes will be lost.')) {
          router.push('/researcher/publications/collaborate');
        }
        break;
      case 'open':
        router.push('/researcher/publications/collaborate');
        break;
      case 'save':
        handleAutoSave();
        break;
      case 'save-as':
        const newTitle = prompt('Enter document title:', manuscript?.title || 'Untitled Document');
        if (newTitle) {
          console.log('Saving as:', newTitle);
          handleAutoSave();
        }
        break;
      case 'export-pdf':
        console.log('Exporting as PDF');
        window.print(); // Simple print dialog for PDF export
        break;
      case 'export-word':
        console.log('Exporting as Word document');
        // Future implementation for Word export
        break;
      case 'share':
        navigator.share?.({
          title: manuscript?.title || 'Document',
          text: 'Check out this collaborative document',
          url: window.location.href
        }) || console.log('Sharing document');
        break;
      case 'print':
        window.print();
        break;
      case 'toggle-autosave':
        setAutosaveEnabled(!autosaveEnabled);
        break;
      default:
        break;
    }
  }, [router, handleAutoSave, manuscript?.title, autosaveEnabled]);

  const handleEditAction = useCallback((action) => {
    switch(action) {
      case 'undo':
        editor?.chain().focus().undo().run();
        break;
      case 'redo':
        editor?.chain().focus().redo().run();
        break;
      case 'cut':
        if (window.getSelection().toString()) {
          navigator.clipboard?.writeText(window.getSelection().toString());
          editor?.chain().focus().deleteSelection().run();
        }
        break;
      case 'copy':
        if (window.getSelection().toString()) {
          navigator.clipboard?.writeText(window.getSelection().toString());
        }
        break;
      case 'paste':
        navigator.clipboard?.readText().then(text => {
          if (text) {
            editor?.chain().focus().insertContent(text).run();
          }
        }).catch(() => {
          // Fallback to document.execCommand for older browsers
          document.execCommand('paste');
        });
        break;
      case 'find':
        // Simple find implementation
        const searchTerm = prompt('Find:');
        if (searchTerm && window.find) {
          window.find(searchTerm);
        }
        break;
      case 'select-all':
        editor?.commands.selectAll();
        break;
      default:
        break;
    }
  }, [editor]);

  // Handle view menu actions
  const handleViewAction = useCallback((action) => {
    switch(action) {
      case 'fullscreen':
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.documentElement.requestFullscreen();
        }
        break;
      case 'zoom-in':
        // Increase font size in editor
        const editorElement = document.querySelector('.ProseMirror');
        if (editorElement) {
          const currentSize = window.getComputedStyle(editorElement).fontSize;
          const newSize = parseFloat(currentSize) * 1.1;
          editorElement.style.fontSize = newSize + 'px';
        }
        break;
      case 'zoom-out':
        // Decrease font size in editor
        const editorEl = document.querySelector('.ProseMirror');
        if (editorEl) {
          const currentSize = window.getComputedStyle(editorEl).fontSize;
          const newSize = parseFloat(currentSize) * 0.9;
          editorEl.style.fontSize = newSize + 'px';
        }
        break;
      case 'reset-zoom':
        // Reset font size to default
        const editorElem = document.querySelector('.ProseMirror');
        if (editorElem) {
          editorElem.style.fontSize = '16px'; // Default size
        }
        break;
      case 'show-outline':
        // Toggle document outline (could show/hide left sidebar)
        console.log('Toggle outline view');
        break;
      case 'comments':
        setShowComments(!showComments);
        break;
      case 'track-changes':
        // Toggle track changes mode
        console.log('Toggle track changes');
        break;
      default:
        break;
    }
  }, [showComments]);

  // Handle insert menu actions - moved here to fix hoisting issue
  const handleInsertAction = useCallback((action, params) => {
    switch(action) {
      case 'link':
        addLink();
        break;
      case 'image':
        addImage();
        break;
      case 'table':
        setInsertTableDialogOpen(true);
        break;
      case 'quick-table':
        // Insert pre-defined table with specific dimensions
        if (params && params.rows && params.cols) {
          const { rows, cols, type } = params;
          let withHeaderRow = false;
          
          // Different header behavior based on table type
          switch(type) {
            case 'list':
            case 'data':
            case 'report':
              withHeaderRow = true;
              break;
            default:
              withHeaderRow = false;
          }
          
          editor?.chain().focus().insertTable({ 
            rows, 
            cols, 
            withHeaderRow 
          }).run();
        }
        break;
      case 'table-template':
        // Insert pre-designed table templates
        if (params && params.templateType) {
          const { templateType } = params;
          let tableContent = '';
          
          switch(templateType) {
            case 'research-data':
              tableContent = `
                <table>
                  <thead>
                    <tr>
                      <th>Variable</th>
                      <th>Mean</th>
                      <th>Std Dev</th>
                      <th>Min</th>
                      <th>Max</th>
                      <th>N</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Age</td>
                      <td>32.5</td>
                      <td>8.2</td>
                      <td>18</td>
                      <td>65</td>
                      <td>150</td>
                    </tr>
                    <tr>
                      <td>Income</td>
                      <td>45,000</td>
                      <td>12,500</td>
                      <td>25,000</td>
                      <td>80,000</td>
                      <td>150</td>
                    </tr>
                    <tr>
                      <td>Education Years</td>
                      <td>16.2</td>
                      <td>2.8</td>
                      <td>12</td>
                      <td>22</td>
                      <td>150</td>
                    </tr>
                  </tbody>
                </table>
              `;
              break;
            case 'financial-report':
              tableContent = `
                <table>
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th>Q1 2024</th>
                      <th>Q2 2024</th>
                      <th>Q3 2024</th>
                      <th>Q4 2024</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Revenue</strong></td>
                      <td>$125,000</td>
                      <td>$138,000</td>
                      <td>$142,000</td>
                      <td>$155,000</td>
                      <td>$560,000</td>
                    </tr>
                    <tr>
                      <td><strong>Expenses</strong></td>
                      <td>$89,000</td>
                      <td>$95,000</td>
                      <td>$98,000</td>
                      <td>$105,000</td>
                      <td>$387,000</td>
                    </tr>
                    <tr>
                      <td><strong>Net Income</strong></td>
                      <td>$36,000</td>
                      <td>$43,000</td>
                      <td>$44,000</td>
                      <td>$50,000</td>
                      <td>$173,000</td>
                    </tr>
                  </tbody>
                </table>
              `;
              break;
            case 'project-timeline':
              tableContent = `
                <table>
                  <thead>
                    <tr>
                      <th>Phase</th>
                      <th>Task</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Status</th>
                      <th>Owner</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Planning</td>
                      <td>Requirements Gathering</td>
                      <td>Jan 1, 2024</td>
                      <td>Jan 15, 2024</td>
                      <td>Complete</td>
                      <td>John Doe</td>
                    </tr>
                    <tr>
                      <td>Design</td>
                      <td>UI/UX Design</td>
                      <td>Jan 16, 2024</td>
                      <td>Feb 5, 2024</td>
                      <td>In Progress</td>
                      <td>Jane Smith</td>
                    </tr>
                    <tr>
                      <td>Development</td>
                      <td>Frontend Development</td>
                      <td>Feb 6, 2024</td>
                      <td>Mar 15, 2024</td>
                      <td>Pending</td>
                      <td>Mike Johnson</td>
                    </tr>
                  </tbody>
                </table>
              `;
              break;
            case 'comparison-chart':
              tableContent = `
                <table>
                  <thead>
                    <tr>
                      <th>Feature</th>
                      <th>Option A</th>
                      <th>Option B</th>
                      <th>Option C</th>
                      <th>Winner</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Price</td>
                      <td>$299</td>
                      <td>$399</td>
                      <td>$249</td>
                      <td>Option C</td>
                    </tr>
                    <tr>
                      <td>Performance</td>
                      <td>Good</td>
                      <td>Excellent</td>
                      <td>Average</td>
                      <td>Option B</td>
                    </tr>
                    <tr>
                      <td>Support</td>
                      <td>24/7</td>
                      <td>Business Hours</td>
                      <td>Email Only</td>
                      <td>Option A</td>
                    </tr>
                  </tbody>
                </table>
              `;
              break;
            case 'contact-list':
              tableContent = `
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Title</th>
                      <th>Company</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>John Smith</td>
                      <td>Director</td>
                      <td>ABC Corp</td>
                      <td>john.smith@abc.com</td>
                      <td>+1-555-0123</td>
                      <td>New York</td>
                    </tr>
                    <tr>
                      <td>Sarah Davis</td>
                      <td>Manager</td>
                      <td>XYZ Inc</td>
                      <td>sarah.davis@xyz.com</td>
                      <td>+1-555-0124</td>
                      <td>California</td>
                    </tr>
                    <tr>
                      <td>Michael Brown</td>
                      <td>Analyst</td>
                      <td>DEF Ltd</td>
                      <td>m.brown@def.com</td>
                      <td>+1-555-0125</td>
                      <td>Texas</td>
                    </tr>
                  </tbody>
                </table>
              `;
              break;
            case 'product-catalog':
              tableContent = `
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Category</th>
                      <th>Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Laptop Pro 15"</td>
                      <td>LP-001</td>
                      <td>$1,299</td>
                      <td>25</td>
                      <td>Electronics</td>
                      <td>4.5★</td>
                    </tr>
                    <tr>
                      <td>Wireless Mouse</td>
                      <td>WM-002</td>
                      <td>$29</td>
                      <td>150</td>
                      <td>Accessories</td>
                      <td>4.2★</td>
                    </tr>
                    <tr>
                      <td>USB-C Hub</td>
                      <td>UH-003</td>
                      <td>$79</td>
                      <td>80</td>
                      <td>Accessories</td>
                      <td>4.0★</td>
                    </tr>
                  </tbody>
                </table>
              `;
              break;
            default:
              // Fallback to basic table
              editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
              return;
          }
          
          editor?.chain().focus().insertContent(tableContent).run();
        }
        break;
      case 'page-break':
        // Insert a page break (using div with CSS class)
        editor?.chain().focus().insertContent('<div class="page-break" style="page-break-before: always; break-before: page; margin: 2rem 0; border-top: 2px dashed #ccc; padding-top: 1rem;">Page Break</div>').run();
        break;
      case 'horizontal-rule':
        editor?.chain().focus().setHorizontalRule().run();
        break;
      case 'special-characters':
        // Simple implementation - could be expanded with a character picker dialog
        const commonChars = ['©', '®', '™', '°', '±', '÷', '×', '≤', '≥', '≠', '≈', 'α', 'β', 'γ', 'δ', 'π', 'Ω', '∞'];
        const char = prompt('Enter special character or choose from common ones:\n' + commonChars.join(' '));
        if (char) {
          editor?.chain().focus().insertContent(char).run();
        }
        break;
      default:
        break;
    }
  }, [editor]);

  // Handle table insertion from dialog
  const handleInsertTableFromDialog = useCallback((tableConfig) => {
    const { rows, cols, withHeaderRow } = tableConfig;
    editor?.chain().focus().insertTable({ 
      rows, 
      cols, 
      withHeaderRow 
    }).run();
  }, [editor]);

  // Handle table properties
  const handleTableProperties = useCallback(() => {
    setTablePropertiesDialogOpen(true);
  }, []);

  // Handle table properties apply
  const handleTablePropertiesApply = useCallback((settings) => {
    // Apply table settings to the currently selected table
    // This would involve updating the table's styling through TipTap commands
    console.log('Applying table properties:', settings);
    // TODO: Implement actual table styling application
  }, [editor]);

  // Auto-save when content changes
  useEffect(() => {
    if (autosaveEnabled && editor) {
      const timer = setTimeout(() => {
        handleAutoSave();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timer);
    }
  }, [editor?.getHTML(), autosaveEnabled, handleAutoSave]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          // File menu shortcuts
          case 'n':
            event.preventDefault();
            handleFileAction('new');
            break;
          case 'o':
            event.preventDefault();
            handleFileAction('open');
            break;
          case 's':
            event.preventDefault();
            if (event.shiftKey) {
              handleFileAction('save-as');
            } else {
              handleFileAction('save');
            }
            break;
          case 'p':
            if (event.shiftKey) {
              event.preventDefault();
              handleFileAction('share');
            } else {
              // Let browser handle Ctrl+P for print
            }
            break;
          // Edit menu shortcuts
          case 'z':
            event.preventDefault();
            handleEditAction('undo');
            break;
          case 'y':
            event.preventDefault();
            handleEditAction('redo');
            break;
          case 'x':
            event.preventDefault();
            handleEditAction('cut');
            break;
          case 'c':
            event.preventDefault();
            handleEditAction('copy');
            break;
          case 'v':
            event.preventDefault();
            handleEditAction('paste');
            break;
          case 'h':
            event.preventDefault();
            handleEditAction('find');
            break;
          case 'a':
            event.preventDefault();
            handleEditAction('select-all');
            break;
          // View menu shortcuts
          case '=':
          case '+':
            if (event.ctrlKey || event.metaKey) {
              event.preventDefault();
              handleViewAction('zoom-in');
            }
            break;
          case '-':
            if (event.ctrlKey || event.metaKey) {
              event.preventDefault();
              handleViewAction('zoom-out');
            }
            break;
          case '0':
            if (event.ctrlKey || event.metaKey) {
              event.preventDefault();
              handleViewAction('reset-zoom');
            }
            break;
          // Insert menu shortcuts
          case 'k':
            event.preventDefault();
            handleInsertAction('link');
            break;
          case 't':
            if (event.shiftKey) {
              event.preventDefault();
              handleInsertAction('table');
            }
            break;
          default:
            break;
        }
      }

      // Handle F11 for fullscreen
      if (event.key === 'F11') {
        event.preventDefault();
        handleViewAction('fullscreen');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleFileAction, handleEditAction, handleViewAction, handleInsertAction]);

  const handleFormatAction = useCallback((action) => {
    switch(action) {
      case 'bold':
        editor?.chain().focus().toggleBold().run();
        break;
      case 'italic':
        editor?.chain().focus().toggleItalic().run();
        break;
      case 'underline':
        editor?.chain().focus().toggleUnderline().run();
        break;
      case 'clear':
        editor?.chain().focus().clearNodes().unsetAllMarks().run();
        break;
      default:
        break;
    }
  }, [editor]);

  // Handle review menu actions
  const handleReviewAction = useCallback((action) => {
    switch(action) {
      case 'spell-check':
        // Implement spell check functionality
        console.log('Spell check activated');
        // TODO: Integrate with browser spell check or external service
        break;
      case 'grammar-check':
        // Implement grammar check functionality
        console.log('Grammar check activated');
        // TODO: Integrate with grammar checking service
        break;
      case 'language-settings':
        // Open language settings dialog
        console.log('Language settings opened');
        // TODO: Implement language settings dialog
        break;
      case 'track-changes':
        // Toggle track changes mode
        const newTrackChangesState = !trackChangesEnabled;
        setTrackChangesEnabled(newTrackChangesState);
        
        if (editor) {
          if (newTrackChangesState) {
            editor.commands.enableTrackChanges();
          } else {
            editor.commands.disableTrackChanges();
          }
        }
        console.log('Track changes', newTrackChangesState ? 'enabled' : 'disabled');
        break;
      case 'accept-changes':
        // Accept all changes
        if (editor && trackedChanges.size > 0) {
          editor.commands.acceptAllChanges();
          console.log('All changes accepted');
        } else {
          console.log('No changes to accept');
        }
        break;
      case 'reject-changes':
        // Reject all changes
        if (editor && trackedChanges.size > 0) {
          editor.commands.rejectAllChanges();
          console.log('All changes rejected');
        } else {
          console.log('No changes to reject');
        }
        break;
      case 'new-comment':
        // Open comment form or show comments sidebar
        if (!showComments) {
          setShowComments(true);
        }
        // Focus on comment form
        setTimeout(() => {
          const addButton = document.querySelector('[aria-label="Add comment"], button:contains("Add")');
          if (addButton) {
            addButton.click();
          }
        }, 100);
        break;
      case 'show-comments':
        // Toggle comments sidebar
        setShowComments(!showComments);
        break;
      default:
        break;
    }
  }, [showComments, trackChangesEnabled, trackedChanges, editor]);

  // Handle version restore
  const handleVersionRestore = useCallback((versionData) => {
    if (editor && versionData.content) {
      editor.commands.setContent(versionData.content);
      setManuscript(prev => ({
        ...prev,
        title: versionData.title,
        content: versionData.content,
        updatedAt: versionData.updatedAt,
        lastSaved: new Date(versionData.lastSaved)
      }));
      setLastSaved(new Date(versionData.lastSaved));
    }
  }, [editor]);

  // Handle track changes toggle
  const handleToggleTrackChanges = useCallback((enabled) => {
    setTrackChangesEnabled(enabled);
    if (editor) {
      if (enabled) {
        editor.commands.enableTrackChanges();
      } else {
        editor.commands.disableTrackChanges();
      }
    }
  }, [editor]);

  // Handle tracked change accepted
  const handleTrackedChangeAccepted = useCallback((change) => {
    console.log('Tracked change accepted:', change);
    setTrackedChanges(prev => {
      const newMap = new Map(prev);
      newMap.delete(change.changeId);
      return newMap;
    });
  }, []);

  // Handle tracked change rejected
  const handleTrackedChangeRejected = useCallback((change) => {
    console.log('Tracked change rejected:', change);
    setTrackedChanges(prev => {
      const newMap = new Map(prev);
      newMap.delete(change.changeId);
      return newMap;
    });
  }, []);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#fafafa' }}>
      {/* Document Header Component - Always Visible */}
      <DocumentHeader 
        manuscript={manuscript}
        collaborators={collaborators || []}
        onBack={() => router.back()}
        onInvite={handleInvite}
        loading={loading}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
          <LinearProgress sx={{ width: '300px' }} />
        </Box>
      ) : (
        <>

      {/* Top AppBar - Simplified */}
      <AppBar position="static" sx={{ bgcolor: 'white', color: '#333', boxShadow: 'none', borderBottom: '1px solid #e0e0e0' }}>
        <Toolbar sx={{ minHeight: '48px !important', py: 1 }}>
          {/* Document Status */}
          <Stack direction="row" alignItems="center" spacing={2} sx={{ flexGrow: 1 }}>
            <Chip
              size="small"
              label={manuscript?.status || 'Draft'}
              sx={{
                bgcolor: '#e8f5e8',
                color: '#2e7d32',
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 24
              }}
            />
            <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.8rem' }}>
              {manuscript?.type || 'Research Article'} • {manuscript?.wordCount || 0} words
            </Typography>
            <Typography variant="body2" color={saving ? 'primary' : 'textSecondary'} sx={{ fontSize: '0.8rem' }}>
              {saving ? 'Saving...' : `Last saved ${lastSaved ? format(lastSaved, 'HH:mm') : 'Never'}`}
            </Typography>
          </Stack>

          {/* Action Buttons */}
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              size="small"
              startIcon={<SaveIcon />}
              disabled={saving}
              onClick={handleAutoSave}
              sx={{ 
                bgcolor: '#8b6cbc',
                fontSize: '0.8rem',
                py: 0.5
              }}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)} size="small">
              <MoreVertIcon />
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Document Menu Bar Component */}
      <DocumentMenuBar 
        onFileAction={handleFileAction}
        onEditAction={handleEditAction}
        onViewAction={handleViewAction}
        onInsertAction={handleInsertAction}
        onFormatAction={handleFormatAction}
        onReviewAction={handleReviewAction}
        autosaveEnabled={autosaveEnabled}
        editor={editor}
        showComments={showComments}
        setCitationMenuAnchor={setCitationMenuAnchor}
        onTableProperties={handleTableProperties}
      />

      {/* Main Content Area */}
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* Left Sidebar - Document Structure */}
        <Paper sx={{ 
          width: 280, 
          borderRadius: 0, 
          borderRight: '1px solid #e0e0e0',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#333', mb: 1 }}>
              Document Structure
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {manuscript?.wordCount || 0} words • {saving ? 'Saving...' : `Last saved ${lastSaved ? format(lastSaved, 'HH:mm') : 'Never'}`}
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
            {documentStructure.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="textSecondary">
                  No headings yet. Add headings to see document structure.
                </Typography>
              </Box>
            ) : (
              <HeadingStructureDisplay headings={documentStructure} onNavigate={navigateToHeading} />
            )}
          </Box>
        </Paper>

        {/* Center - Editor Area */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* Editor Toolbar */}
          <Paper sx={{ 
            borderRadius: 0,
            borderBottom: '1px solid #e0e0e0',
            p: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap'
          }}>
            
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

          {/* Editor Content */}
          <Box 
            className={trackChangesEnabled ? '' : 'track-changes-disabled'}
            sx={{ 
              flexGrow: 1, 
              overflow: 'auto',
              bgcolor: 'white',
            '& .ProseMirror': {
              outline: 'none',
              padding: '2rem',
              minHeight: '500px',
              '& p.is-editor-empty:first-of-type::before': {
                content: 'attr(data-placeholder)',
                float: 'left',
                color: '#aaa',
                fontStyle: 'italic',
                pointerEvents: 'none',
                height: 0,
              },
              '& p': {
                margin: '0 0 1rem 0',
                lineHeight: 1.6
              },
              '& h1, & h2, & h3': {
                fontWeight: 600,
                marginTop: '2rem',
                marginBottom: '1rem'
              },
              '& h1': {
                fontSize: '2rem',
                color: '#333'
              },
              '& h2': {
                fontSize: '1.5rem',
                color: '#444'
              },
              '& h3': {
                fontSize: '1.25rem',
                color: '#555'
              },
              '& blockquote': {
                borderLeft: '4px solid #8b6cbc',
                paddingLeft: '1rem',
                fontStyle: 'italic',
                margin: '1rem 0'
              },
              '& ul, & ol': {
                paddingLeft: '2rem'
              },
              '& table': {
                borderCollapse: 'collapse',
                width: '100%',
                margin: '1rem 0',
                '& td, & th': {
                  border: '1px solid #ddd',
                  padding: '8px',
                  textAlign: 'left'
                },
                '& th': {
                  backgroundColor: '#f5f5f5',
                  fontWeight: 600
                }
              }
            }
          }}>
            <EditorContent editor={editor} />
            
            {/* References Hover Button */}
            <ReferencesHoverButton
              editor={editor}
              onOpenBibliographyGenerator={() => setBibliographyGeneratorOpen(true)}
            />
          </Box>
        </Box>

        {/* Right Sidebar - Comments */}
        {showComments && (
          <CommentsSidebar
            manuscriptId={manuscriptId}
            currentUserId={user?.id}
            selectedText={selectedText}
            onClearSelection={clearTextSelection}
            onCommentCreated={addCommentHighlight}
            onCommentDeleted={removeCommentHighlight}
          />
        )}
        
        {/* Right Sidebar - Version History */}
        {showVersionHistory && (
          <VersionHistorySidebar
            manuscriptId={manuscriptId}
            open={showVersionHistory}
            onClose={() => setShowVersionHistory(false)}
            onVersionRestore={handleVersionRestore}
            currentContent={editor?.getHTML()}
            currentTitle={manuscript?.title}
          />
        )}
        
        {/* Right Sidebar - Tracked Changes */}
        {showTrackedChangesSidebar && (
          <TrackedChangesSidebar
            manuscriptId={manuscriptId}
            open={showTrackedChangesSidebar}
            onClose={() => setShowTrackedChangesSidebar(false)}
            trackChangesEnabled={trackChangesEnabled}
            onToggleTrackChanges={handleToggleTrackChanges}
            onChangeAccepted={handleTrackedChangeAccepted}
            onChangeRejected={handleTrackedChangeRejected}
          />
        )}
      </Box>

      {/* Floating Action Buttons */}
      <Box sx={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {/* Comments FAB */}
        <Fab
          color="primary"
          sx={{
            bgcolor: '#8b6cbc',
            '&:hover': {
              bgcolor: '#7b5ca7'
            }
          }}
          onClick={() => setShowComments(!showComments)}
        >
          <CommentIcon />
        </Fab>
        
        {/* Version History FAB */}
        <Fab
          size="small"
          sx={{
            bgcolor: '#2196f3',
            color: 'white',
            '&:hover': {
              bgcolor: '#1976d2'
            }
          }}
          onClick={() => setShowVersionHistory(!showVersionHistory)}
        >
          <HistoryIcon />
        </Fab>
        
        {/* Track Changes FAB */}
        <Fab
          size="small"
          sx={{
            bgcolor: trackChangesEnabled ? '#4caf50' : '#757575',
            color: 'white',
            '&:hover': {
              bgcolor: trackChangesEnabled ? '#388e3c' : '#616161'
            }
          }}
          onClick={() => setShowTrackedChangesSidebar(!showTrackedChangesSidebar)}
        >
          <TrackChangesIcon />
        </Fab>
      </Box>

      {/* Options Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MuiMenuItem>
          <ListItemIcon><ShareIcon fontSize="small" /></ListItemIcon>
          Share Document
        </MuiMenuItem>
        <MuiMenuItem>
          <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
          Export PDF
        </MuiMenuItem>
        <MuiMenuItem>
          <ListItemIcon><PrintIcon fontSize="small" /></ListItemIcon>
          Print
        </MuiMenuItem>
        <MuiMenuItem>
          <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
          Document Settings
        </MuiMenuItem>
      </Menu>






      {/* Citation Menu Dropdown */}
      <Menu
        anchorEl={citationMenuAnchor}
        open={Boolean(citationMenuAnchor)}
        onClose={() => setCitationMenuAnchor(null)}
        sx={{
          '& .MuiPaper-root': {
            minWidth: 240,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            py: 1,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1,
              fontSize: '0.875rem',
              minHeight: 'auto',
              '&:hover': { bgcolor: '#f5f5f5' },
              '&.checked': {
                bgcolor: '#8b6cbc08',
                '& .MuiListItemIcon-root': {
                  color: '#8b6cbc'
                }
              }
            },
          },
        }}
      >
          {/* Insert Citation */}
          <MuiMenuItem onClick={() => {
            setCitationMenuAnchor(null);
            setCitationLibraryOpen(true);
          }}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <BookmarkAddIcon fontSize="small" sx={{ color: '#666' }} />
            </ListItemIcon>
            <Box sx={{ flexGrow: 1 }}>Insert Citation</Box>
            <Typography variant="caption" color="textSecondary" sx={{ ml: 2, fontSize: '0.75rem' }}>
              Ctrl+Shift+C
            </Typography>
          </MuiMenuItem>

        {/* Manage Sources */}
        <MuiMenuItem onClick={() => {
          setCitationMenuAnchor(null);
          setManageSourcesOpen(true);
        }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <EditIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          Manage Sources
        </MuiMenuItem>

        {/* Bibliography */}
        <MuiMenuItem onClick={() => {
          setCitationMenuAnchor(null);
          setBibliographyGeneratorOpen(true);
        }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <MenuBookIcon fontSize="small" sx={{ color: '#666' }} />
          </ListItemIcon>
          Bibliography
        </MuiMenuItem>

        <Divider sx={{ my: 0.5 }} />

        {/* Cite as You Write */}
        <MuiMenuItem 
          onClick={() => {
            setCiteAsYouWrite(!citeAsYouWrite);
            setCitationMenuAnchor(null);
          }}
          className={citeAsYouWrite ? 'checked' : ''}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <MagicWandIcon fontSize="small" sx={{ color: citeAsYouWrite ? '#8b6cbc' : '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Cite as You Write</Box>
          {citeAsYouWrite && (
            <CheckBoxIcon fontSize="small" sx={{ color: '#8b6cbc', ml: 1 }} />
          )}
        </MuiMenuItem>

        <Divider sx={{ my: 0.5 }} />

        {/* Citation Style: APA */}
        <MuiMenuItem 
          onClick={() => {
            setCitationStyle('APA');
            setCitationMenuAnchor(null);
          }}
          className={citationStyle === 'APA' ? 'checked' : ''}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            {citationStyle === 'APA' ? (
              <RadioButtonCheckedIcon fontSize="small" sx={{ color: '#8b6cbc' }} />
            ) : (
              <RadioButtonUncheckedIcon fontSize="small" sx={{ color: '#666' }} />
            )}
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Citation Style: APA</Box>
          {citationStyle === 'APA' && (
            <CheckBoxIcon fontSize="small" sx={{ color: '#8b6cbc', ml: 1 }} />
          )}
        </MuiMenuItem>

        {/* Citation Style: MLA */}
        <MuiMenuItem 
          onClick={() => {
            setCitationStyle('MLA');
            setCitationMenuAnchor(null);
          }}
          className={citationStyle === 'MLA' ? 'checked' : ''}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            {citationStyle === 'MLA' ? (
              <RadioButtonCheckedIcon fontSize="small" sx={{ color: '#8b6cbc' }} />
            ) : (
              <RadioButtonUncheckedIcon fontSize="small" sx={{ color: '#666' }} />
            )}
          </ListItemIcon>
          Citation Style: MLA
        </MuiMenuItem>

        {/* Citation Style: Chicago */}
        <MuiMenuItem 
          onClick={() => {
            setCitationStyle('Chicago');
            setCitationMenuAnchor(null);
          }}
          className={citationStyle === 'Chicago' ? 'checked' : ''}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            {citationStyle === 'Chicago' ? (
              <RadioButtonCheckedIcon fontSize="small" sx={{ color: '#8b6cbc' }} />
            ) : (
              <RadioButtonUncheckedIcon fontSize="small" sx={{ color: '#666' }} />
            )}
          </ListItemIcon>
          Citation Style: Chicago
        </MuiMenuItem>

        <Divider sx={{ my: 0.5 }} />

        {/* Connect Zotero */}
        <MuiMenuItem 
          onClick={() => {
            setZoteroConnected(!zoteroConnected);
            setCitationMenuAnchor(null);
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <LinkIcon fontSize="small" sx={{ color: zoteroConnected ? '#4caf50' : '#666' }} />
          </ListItemIcon>
          <Box sx={{ flexGrow: 1 }}>Connect Zotero</Box>
          {zoteroConnected && (
            <Box sx={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              bgcolor: '#4caf50',
              ml: 1
            }} />
          )}
        </MuiMenuItem>

        {/* Sync Library */}
        <MuiMenuItem 
          onClick={() => setCitationMenuAnchor(null)}
          disabled={!zoteroConnected}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <CloudSyncIcon fontSize="small" sx={{ color: zoteroConnected ? '#666' : '#ccc' }} />
          </ListItemIcon>
          <Box sx={{ 
            flexGrow: 1,
            color: zoteroConnected ? 'inherit' : '#ccc'
          }}>
            Sync Library
          </Box>
        </MuiMenuItem>
      </Menu>

      {/* Heading Dropdown Menu */}
      <Menu
        anchorEl={headingDropdownAnchor}
        open={Boolean(headingDropdownAnchor)}
        onClose={() => setHeadingDropdownAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        sx={{
          '& .MuiPaper-root': {
            minWidth: 200,
            maxWidth: 250,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            py: 1,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1,
              fontSize: '0.875rem',
              minHeight: 'auto',
              '&:hover': { bgcolor: '#f5f5f5' },
              '&.active': { 
                bgcolor: '#8b6cbc',
                color: 'white',
                '& .MuiListItemIcon-root': {
                  color: 'white'
                }
              }
            },
          },
        }}
      >
        {/* Headings Section */}
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" sx={{ 
            color: '#666', 
            fontWeight: 600, 
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: 0.5
          }}>
            Headings
          </Typography>
        </Box>
        
        <MuiMenuItem 
          onClick={() => { editor.chain().focus().toggleHeading({ level: 1 }).run(); setHeadingDropdownAnchor(null); }}
          className={editor?.isActive('heading', { level: 1 }) ? 'active' : ''}
          sx={{ pl: 3 }}
        >
          <ListItemIcon sx={{ minWidth: 30 }}>
            <Typography sx={{ fontWeight: 'bold', fontSize: '0.75rem', color: 'inherit' }}>
              H1
            </Typography>
          </ListItemIcon>
          <Typography sx={{ fontSize: '1.2rem', fontWeight: 600, lineHeight: 1.2 }}>
            Heading 1
          </Typography>
        </MuiMenuItem>
        
        <MuiMenuItem 
          onClick={() => { editor.chain().focus().toggleHeading({ level: 2 }).run(); setHeadingDropdownAnchor(null); }}
          className={editor?.isActive('heading', { level: 2 }) ? 'active' : ''}
          sx={{ pl: 3 }}
        >
          <ListItemIcon sx={{ minWidth: 30 }}>
            <Typography sx={{ fontWeight: 'bold', fontSize: '0.75rem', color: 'inherit' }}>
              H2
            </Typography>
          </ListItemIcon>
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 600, lineHeight: 1.2 }}>
            Heading 2
          </Typography>
        </MuiMenuItem>
        
        <MuiMenuItem 
          onClick={() => { editor.chain().focus().toggleHeading({ level: 3 }).run(); setHeadingDropdownAnchor(null); }}
          className={editor?.isActive('heading', { level: 3 }) ? 'active' : ''}
          sx={{ pl: 3 }}
        >
          <ListItemIcon sx={{ minWidth: 30 }}>
            <Typography sx={{ fontWeight: 'bold', fontSize: '0.75rem', color: 'inherit' }}>
              H3
            </Typography>
          </ListItemIcon>
          <Typography sx={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.2 }}>
            Heading 3
          </Typography>
        </MuiMenuItem>
        
        <MuiMenuItem 
          onClick={() => { editor.chain().focus().toggleHeading({ level: 4 }).run(); setHeadingDropdownAnchor(null); }}
          className={editor?.isActive('heading', { level: 4 }) ? 'active' : ''}
          sx={{ pl: 3 }}
        >
          <ListItemIcon sx={{ minWidth: 30 }}>
            <Typography sx={{ fontWeight: 'bold', fontSize: '0.75rem', color: 'inherit' }}>
              H4
            </Typography>
          </ListItemIcon>
          <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.2 }}>
            Heading 4
          </Typography>
        </MuiMenuItem>
        
        <MuiMenuItem 
          onClick={() => { editor.chain().focus().toggleHeading({ level: 5 }).run(); setHeadingDropdownAnchor(null); }}
          className={editor?.isActive('heading', { level: 5 }) ? 'active' : ''}
          sx={{ pl: 3 }}
        >
          <ListItemIcon sx={{ minWidth: 30 }}>
            <Typography sx={{ fontWeight: 'bold', fontSize: '0.75rem', color: 'inherit' }}>
              H5
            </Typography>
          </ListItemIcon>
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.2 }}>
            Heading 5
          </Typography>
        </MuiMenuItem>
        
        <MuiMenuItem 
          onClick={() => { editor.chain().focus().toggleHeading({ level: 6 }).run(); setHeadingDropdownAnchor(null); }}
          className={editor?.isActive('heading', { level: 6 }) ? 'active' : ''}
          sx={{ pl: 3 }}
        >
          <ListItemIcon sx={{ minWidth: 30 }}>
            <Typography sx={{ fontWeight: 'bold', fontSize: '0.75rem', color: 'inherit' }}>
              H6
            </Typography>
          </ListItemIcon>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.2 }}>
            Heading 6
          </Typography>
        </MuiMenuItem>

        {/* Body Text Section */}
        <Box sx={{ px: 2, py: 1, pt: 2 }}>
          <Typography variant="caption" sx={{ 
            color: '#666', 
            fontWeight: 600, 
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: 0.5
          }}>
            Body Text
          </Typography>
        </Box>
        
        <MuiMenuItem 
          onClick={() => { editor.chain().focus().setParagraph().run(); setHeadingDropdownAnchor(null); }}
          className={!editor?.isActive('heading') ? 'active' : ''}
          sx={{ pl: 3 }}
        >
          <ListItemIcon sx={{ minWidth: 30 }}>
            <Typography sx={{ fontWeight: 'normal', fontSize: '0.875rem', color: 'inherit' }}>
              •
            </Typography>
          </ListItemIcon>
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 'normal', lineHeight: 1.2 }}>
            Normal
          </Typography>
        </MuiMenuItem>
      </Menu>

      {/* Font Family Dropdown Menu */}
      <Menu
        anchorEl={fontFamilyAnchor}
        open={Boolean(fontFamilyAnchor)}
        onClose={() => setFontFamilyAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        sx={{
          '& .MuiPaper-root': {
            minWidth: 250,
            maxHeight: 400,
            overflowY: 'auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            py: 1,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1.5,
              fontSize: '0.875rem',
              minHeight: 'auto',
              '&:hover': { bgcolor: '#f5f5f5' },
              '&.active': { 
                bgcolor: '#8b6cbc',
                color: 'white'
              }
            },
          },
        }}
      >
        {/* Search Box */}
        <Box sx={{ px: 2, pb: 1 }}>
          <TextField
            size="small"
            placeholder="Search fonts..."
            fullWidth
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: '#666', mr: 1, fontSize: '16px' }} />
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: '0.875rem',
                height: 32
              }
            }}
          />
        </Box>

        {/* Serif Fonts Section */}
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" sx={{ 
            color: '#666', 
            fontWeight: 600, 
            fontSize: '0.75rem'
          }}>
            Serif Fonts
          </Typography>
        </Box>
        
        {['Times New Roman', 'Georgia', 'Source Serif Pro', 'Merriweather', 'Playfair Display', 'Lora'].map((font) => (
          <MuiMenuItem 
            key={font}
            onClick={() => { 
              editor.chain().focus().setFontFamily(font).run(); 
              setFontFamilyAnchor(null); 
            }}
            className={editor?.getAttributes('textStyle')?.fontFamily === font ? 'active' : ''}
            sx={{ pl: 3 }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 500, fontFamily: font, lineHeight: 1.2 }}>
                {font}
              </Typography>
              <Typography variant="caption" sx={{ color: '#666', fontFamily: font, fontSize: '0.75rem' }}>
                The quick brown fox
              </Typography>
            </Box>
          </MuiMenuItem>
        ))}

        {/* Sans Serif Fonts Section */}
        <Box sx={{ px: 2, py: 1, pt: 2 }}>
          <Typography variant="caption" sx={{ 
            color: '#666', 
            fontWeight: 600, 
            fontSize: '0.75rem'
          }}>
            Sans Serif Fonts
          </Typography>
        </Box>
        
        {['Arial', 'Helvetica', 'Calibri', 'Verdana', 'Open Sans', 'Roboto', 'Lato'].map((font) => (
          <MuiMenuItem 
            key={font}
            onClick={() => { 
              editor.chain().focus().setFontFamily(font).run(); 
              setFontFamilyAnchor(null); 
            }}
            className={editor?.getAttributes('textStyle')?.fontFamily === font ? 'active' : ''}
            sx={{ pl: 3 }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 500, fontFamily: font, lineHeight: 1.2 }}>
                {font}
              </Typography>
              <Typography variant="caption" sx={{ color: '#666', fontFamily: font, fontSize: '0.75rem' }}>
                The quick brown fox
              </Typography>
            </Box>
          </MuiMenuItem>
        ))}

        {/* Monospace Fonts Section */}
        <Box sx={{ px: 2, py: 1, pt: 2 }}>
          <Typography variant="caption" sx={{ 
            color: '#666', 
            fontWeight: 600, 
            fontSize: '0.75rem'
          }}>
            Monospace Fonts
          </Typography>
        </Box>
        
        {['Courier New', 'Monaco', 'Consolas', 'Source Code Pro'].map((font) => (
          <MuiMenuItem 
            key={font}
            onClick={() => { 
              editor.chain().focus().setFontFamily(font).run(); 
              setFontFamilyAnchor(null); 
            }}
            className={editor?.getAttributes('textStyle')?.fontFamily === font ? 'active' : ''}
            sx={{ pl: 3 }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 500, fontFamily: font, lineHeight: 1.2 }}>
                {font}
              </Typography>
              <Typography variant="caption" sx={{ color: '#666', fontFamily: font, fontSize: '0.75rem' }}>
                The quick brown fox
              </Typography>
            </Box>
          </MuiMenuItem>
        ))}
      </Menu>

      {/* Font Size Dropdown Menu */}
      <Menu
        anchorEl={fontSizeAnchor}
        open={Boolean(fontSizeAnchor)}
        onClose={() => setFontSizeAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        sx={{
          '& .MuiPaper-root': {
            minWidth: 120,
            maxHeight: 300,
            overflowY: 'auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            py: 1,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1,
              fontSize: '0.875rem',
              minHeight: 'auto',
              justifyContent: 'center',
              '&:hover': { bgcolor: '#f5f5f5' },
              '&.active': { 
                bgcolor: '#8b6cbc',
                color: 'white'
              }
            },
          },
        }}
      >
        {[8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72].map((size) => {
          const sizeInPx = `${size}px`;
          const currentSize = editor?.getAttributes('textStyle')?.fontSize;
          return (
            <MuiMenuItem 
              key={size}
              onClick={() => { 
                editor.chain().focus().setMark('textStyle', { fontSize: sizeInPx }).run(); 
                setFontSizeAnchor(null); 
              }}
              className={currentSize === sizeInPx ? 'active' : ''}
            >
              {size}pt
            </MuiMenuItem>
          );
        })}
      </Menu>

      {/* Insert Table Dialog */}
      <InsertTableDialog
        open={insertTableDialogOpen}
        onClose={() => setInsertTableDialogOpen(false)}
        onInsert={handleInsertTableFromDialog}
      />

      {/* Table Properties Dialog */}
      <TablePropertiesDialog
        open={tablePropertiesDialogOpen}
        onClose={() => setTablePropertiesDialogOpen(false)}
        onApply={handleTablePropertiesApply}
      />

      {/* Citation Popup */}
      <Popover
        anchorEl={citationPopupAnchor}
        open={Boolean(citationPopupAnchor)}
        onClose={() => {
          setCitationPopupAnchor(null);
          setCitationSearch('');
          setSelectedCitationIndex(0);
          setTriggerPosition(null);
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        sx={{
          '& .MuiPaper-root': {
            maxWidth: 480,
            minWidth: 320,
            maxHeight: 320,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: '1px solid #e0e0e0',
            borderRadius: 2,
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          {/* Search Header */}
          <Box sx={{ mb: 1 }}>
            <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem', mb: 1 }}>
              {citeAsYouWrite ? 'Cite as You Write is active' : 'Insert Citation'}
            </Typography>
            <TextField
              size="small"
              fullWidth
              placeholder="Search citations by title, author, or year..."
              value={citationSearch}
              onChange={(e) => {
                setCitationSearch(e.target.value);
                setSelectedCitationIndex(0);
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setSelectedCitationIndex(prev => 
                    prev < filteredCitations.length - 1 ? prev + 1 : 0
                  );
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setSelectedCitationIndex(prev => 
                    prev > 0 ? prev - 1 : filteredCitations.length - 1
                  );
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  console.log('Enter pressed, selectedIndex:', selectedCitationIndex, 'filteredCitations length:', filteredCitations.length);
                  if (filteredCitations[selectedCitationIndex]) {
                    console.log('Inserting citation:', filteredCitations[selectedCitationIndex].title);
                    insertCitation(filteredCitations[selectedCitationIndex]);
                  } else {
                    console.log('No citation found at index:', selectedCitationIndex);
                  }
                } else if (e.key === 'Escape') {
                  setCitationPopupAnchor(null);
                  setCitationSearch('');
                  setTriggerPosition(null);
                }
              }}
              autoFocus
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '0.875rem',
                }
              }}
            />
          </Box>

          {/* Citations List */}
          <Box sx={{ maxHeight: 240, overflow: 'auto' }}>
            {filteredCitations.length === 0 ? (
              <Typography 
                variant="body2" 
                color="textSecondary" 
                sx={{ p: 2, textAlign: 'center', fontStyle: 'italic' }}
              >
                No citations found
              </Typography>
            ) : (
              filteredCitations.map((citation, index) => (
                <Box
                  key={citation.id}
                  onClick={() => insertCitation(citation)}
                  sx={{
                    p: 1.5,
                    cursor: 'pointer',
                    borderRadius: 1,
                    bgcolor: index === selectedCitationIndex ? '#f0f0f0' : 'transparent',
                    '&:hover': {
                      bgcolor: '#f5f5f5',
                    },
                    border: index === selectedCitationIndex ? '1px solid #8b6cbc' : '1px solid transparent',
                  }}
                >
                  {/* Citation Title */}
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 600, 
                      fontSize: '0.85rem',
                      mb: 0.5,
                      lineHeight: 1.2,
                    }}
                  >
                    {citation.title}
                  </Typography>
                  
                  {/* Authors */}
                  <Typography 
                    variant="caption" 
                    color="textSecondary" 
                    sx={{ 
                      display: 'block',
                      fontSize: '0.75rem',
                      mb: 0.5 
                    }}
                  >
                    {citation.authors.join(', ')}
                  </Typography>
                  
                  {/* Publication Details */}
                  <Typography 
                    variant="caption" 
                    color="primary" 
                    sx={{ 
                      display: 'block',
                      fontSize: '0.7rem',
                      fontWeight: 500 
                    }}
                  >
                    {citation.type === 'journal' && citation.journal && `${citation.journal}, ${citation.year}`}
                    {citation.type === 'book' && `${citation.publisher}, ${citation.year}`}
                    {citation.type === 'conference' && `${citation.conference}, ${citation.year}`}
                    {citation.type === 'book_chapter' && `${citation.book}, ${citation.year}`}
                  </Typography>
                  
                  {/* Preview Citation Format */}
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: 'block',
                      fontSize: '0.7rem',
                      color: '#8b6cbc',
                      fontStyle: 'italic',
                      mt: 0.5
                    }}
                  >
                    Will insert: {formatCitation(citation)}
                  </Typography>
                </Box>
              ))
            )}
          </Box>

          {/* Footer */}
          <Box sx={{ 
            mt: 1, 
            pt: 1, 
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
              Style: {citationStyle}
            </Typography>
            <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
              ↑↓ Navigate • Enter Select • Esc Close
            </Typography>
          </Box>
        </Box>
      </Popover>

      {/* Citation Library Modal */}
      <CitationLibraryModal
        open={citationLibraryOpen}
        onClose={() => setCitationLibraryOpen(false)}
        onCiteInsert={insertCitation}
        citationStyle={citationStyle}
      />

      {/* Manage Sources Modal */}
      <ManageSourcesModal
        open={manageSourcesOpen}
        onClose={() => setManageSourcesOpen(false)}
        manuscriptId={manuscriptId}
        citationStyle={citationStyle}
      />

      {/* Bibliography Generator */}
      <BibliographyGenerator
        open={bibliographyGeneratorOpen}
        onClose={() => setBibliographyGeneratorOpen(false)}
        onInsert={(bibliography) => {
          if (editor) {
            // Insert bibliography at cursor position
            editor.chain().focus().insertContent(bibliography).run();
          }
          setBibliographyGeneratorOpen(false);
        }}
        manuscriptId={manuscriptId}
        title="Bibliography Generator"
      />

      {/* Citation Popup */}
      <Popover
        anchorEl={citationPopupAnchor}
        open={Boolean(citationPopupAnchor)}
        onClose={() => {
          setCitationPopupAnchor(null);
          setCitationSearch('');
          setSelectedCitationIndex(0);
          setTriggerPosition(null);
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        sx={{
          '& .MuiPaper-root': {
            maxWidth: 480,
            minWidth: 320,
            maxHeight: 320,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: '1px solid #e0e0e0',
            borderRadius: 2,
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          {/* Search Header */}
          <Box sx={{ mb: 1 }}>
            <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem', mb: 1 }}>
              {citeAsYouWrite ? 'Cite as You Write is active' : 'Insert Citation'}
            </Typography>
            <TextField
              size="small"
              fullWidth
              placeholder="Search citations by title, author, or year..."
              value={citationSearch}
              onChange={(e) => {
                setCitationSearch(e.target.value);
                setSelectedCitationIndex(0);
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setSelectedCitationIndex(prev => 
                    prev < filteredCitations.length - 1 ? prev + 1 : 0
                  );
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setSelectedCitationIndex(prev => 
                    prev > 0 ? prev - 1 : filteredCitations.length - 1
                  );
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  console.log('Enter pressed, selectedIndex:', selectedCitationIndex, 'filteredCitations length:', filteredCitations.length);
                  if (filteredCitations[selectedCitationIndex]) {
                    console.log('Inserting citation:', filteredCitations[selectedCitationIndex].title);
                    insertCitation(filteredCitations[selectedCitationIndex]);
                  } else {
                    console.log('No citation found at index:', selectedCitationIndex);
                  }
                } else if (e.key === 'Escape') {
                  setCitationPopupAnchor(null);
                  setCitationSearch('');
                  setTriggerPosition(null);
                }
              }}
              autoFocus
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '0.875rem',
                }
              }}
            />
          </Box>

          {/* Citations List */}
          <Box sx={{ maxHeight: 240, overflow: 'auto' }}>
            {filteredCitations.length === 0 ? (
              <Typography 
                variant="body2" 
                color="textSecondary" 
                sx={{ p: 2, textAlign: 'center', fontStyle: 'italic' }}
              >
                No citations found
              </Typography>
            ) : (
              filteredCitations.map((citation, index) => (
                <Box
                  key={citation.id}
                  onClick={() => insertCitation(citation)}
                  sx={{
                    p: 1.5,
                    cursor: 'pointer',
                    borderRadius: 1,
                    bgcolor: index === selectedCitationIndex ? '#f0f0f0' : 'transparent',
                    '&:hover': {
                      bgcolor: '#f5f5f5',
                    },
                    border: index === selectedCitationIndex ? '1px solid #8b6cbc' : '1px solid transparent',
                  }}
                >
                  {/* Citation Title */}
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 600, 
                      fontSize: '0.85rem',
                      mb: 0.5,
                      lineHeight: 1.2,
                    }}
                  >
                    {citation.title}
                  </Typography>
                  
                  {/* Authors */}
                  <Typography 
                    variant="caption" 
                    color="textSecondary" 
                    sx={{ 
                      display: 'block',
                      fontSize: '0.75rem',
                      mb: 0.5 
                    }}
                  >
                    {citation.authors.join(', ')}
                  </Typography>
                  
                  {/* Publication Details */}
                  <Typography 
                    variant="caption" 
                    color="primary" 
                    sx={{ 
                      display: 'block',
                      fontSize: '0.7rem',
                      fontWeight: 500 
                    }}
                  >
                    {citation.type === 'journal' && citation.journal && `${citation.journal}, ${citation.year}`}
                    {citation.type === 'book' && `${citation.publisher}, ${citation.year}`}
                    {citation.type === 'conference' && `${citation.conference}, ${citation.year}`}
                    {citation.type === 'book_chapter' && `${citation.book}, ${citation.year}`}
                  </Typography>
                  
                  {/* Preview Citation Format */}
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: 'block',
                      fontSize: '0.7rem',
                      color: '#8b6cbc',
                      fontStyle: 'italic',
                      mt: 0.5
                    }}
                  >
                    Will insert: {formatCitation(citation)}
                  </Typography>
                </Box>
              ))
            )}
          </Box>

          {/* Footer */}
          <Box sx={{ 
            mt: 1, 
            pt: 1, 
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
              Style: {citationStyle}
            </Typography>
            <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
              ↑↓ Navigate • Enter Select • Esc Close
            </Typography>
          </Box>
        </Box>
      </Popover>
      </>
      )}

      {/* Comment Tooltip for highlighting */}
      <CommentTooltip />
      
      {/* Test component for debugging tooltips */}
      <TestHighlight />
      
      {/* Global styles for comment highlights and tracked changes */}
      <style jsx global>{`
        .comment-highlight:hover {
          box-shadow: 0 0 0 2px rgba(139, 108, 188, 0.3) !important;
          transform: scale(1.02);
        }
        
        .ProseMirror .comment-highlight {
          position: relative;
          z-index: 1;
        }

        /* Tracked Changes Styles */
        .tracked-change {
          position: relative;
          border-radius: 2px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tracked-insertion {
          background-color: #c8e6c9 !important;
          text-decoration: underline;
          text-decoration-color: #4caf50;
          text-decoration-style: solid;
        }

        .tracked-deletion {
          background-color: #ffcdd2 !important;
          text-decoration: line-through;
          text-decoration-color: #f44336;
          text-decoration-style: solid;
        }

        .tracked-replacement {
          background-color: #fff3e0 !important;
          text-decoration: underline;
          text-decoration-color: #ff9800;
          text-decoration-style: double;
        }

        .tracked-change:hover {
          box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.2) !important;
          transform: scale(1.01);
        }

        .tracked-insertion:hover {
          box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.3) !important;
        }

        .tracked-deletion:hover {
          box-shadow: 0 0 0 2px rgba(244, 67, 54, 0.3) !important;
        }

        .tracked-replacement:hover {
          box-shadow: 0 0 0 2px rgba(255, 152, 0, 0.3) !important;
        }

        /* Track changes when disabled */
        .track-changes-disabled .tracked-change {
          background: transparent !important;
          text-decoration: none !important;
        }
      `}</style>
    </Box>
  );
}
