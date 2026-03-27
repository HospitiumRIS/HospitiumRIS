'use client';

import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { Box, Paper, IconButton, Divider, Tooltip } from '@mui/material';
import {
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatUnderlined as UnderlineIcon,
  FormatListBulleted as BulletListIcon,
  FormatListNumbered as NumberedListIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
} from '@mui/icons-material';

const MenuBar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      gap: 0.5, 
      p: 1, 
      borderBottom: '1px solid #e2e8f0',
      backgroundColor: '#f8f9fa',
      flexWrap: 'wrap'
    }}>
      <Tooltip title="Bold">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleBold().run()}
          sx={{
            backgroundColor: editor.isActive('bold') ? '#8b6cbc' : 'transparent',
            color: editor.isActive('bold') ? 'white' : '#2D3748',
            '&:hover': {
              backgroundColor: editor.isActive('bold') ? '#7a5aa8' : '#e2e8f0',
            }
          }}
        >
          <BoldIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Italic">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          sx={{
            backgroundColor: editor.isActive('italic') ? '#8b6cbc' : 'transparent',
            color: editor.isActive('italic') ? 'white' : '#2D3748',
            '&:hover': {
              backgroundColor: editor.isActive('italic') ? '#7a5aa8' : '#e2e8f0',
            }
          }}
        >
          <ItalicIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Underline">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          sx={{
            backgroundColor: editor.isActive('underline') ? '#8b6cbc' : 'transparent',
            color: editor.isActive('underline') ? 'white' : '#2D3748',
            '&:hover': {
              backgroundColor: editor.isActive('underline') ? '#7a5aa8' : '#e2e8f0',
            }
          }}
        >
          <UnderlineIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      <Tooltip title="Bullet List">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          sx={{
            backgroundColor: editor.isActive('bulletList') ? '#8b6cbc' : 'transparent',
            color: editor.isActive('bulletList') ? 'white' : '#2D3748',
            '&:hover': {
              backgroundColor: editor.isActive('bulletList') ? '#7a5aa8' : '#e2e8f0',
            }
          }}
        >
          <BulletListIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Numbered List">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          sx={{
            backgroundColor: editor.isActive('orderedList') ? '#8b6cbc' : 'transparent',
            color: editor.isActive('orderedList') ? 'white' : '#2D3748',
            '&:hover': {
              backgroundColor: editor.isActive('orderedList') ? '#7a5aa8' : '#e2e8f0',
            }
          }}
        >
          <NumberedListIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      <Tooltip title="Undo">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          sx={{
            color: '#2D3748',
            '&:hover': {
              backgroundColor: '#e2e8f0',
            }
          }}
        >
          <UndoIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Redo">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          sx={{
            color: '#2D3748',
            '&:hover': {
              backgroundColor: '#e2e8f0',
            }
          }}
        >
          <RedoIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default function TipTapEditor({ 
  value = '', 
  onChange, 
  placeholder = 'Start typing...',
  minHeight = '200px'
}) {
  const editor = useEditor({
    extensions: [
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
      Underline,
      Placeholder.configure({
        placeholder: placeholder,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    immediatelyRender: false,
  });

  return (
    <Paper
      sx={{
        border: '1px solid #e2e8f0',
        borderRadius: 2,
        overflow: 'hidden',
        '&:focus-within': {
          borderColor: '#8b6cbc',
          boxShadow: '0 0 0 1px #8b6cbc',
        }
      }}
    >
      <MenuBar editor={editor} />
      <Box
        sx={{
          minHeight: minHeight,
          '& .ProseMirror': {
            padding: 2,
            minHeight: minHeight,
            outline: 'none',
            '& p': {
              margin: '0 0 0.5em 0',
            },
            '& ul, & ol': {
              paddingLeft: '1.5em',
              margin: '0.5em 0',
            },
            '& li': {
              marginBottom: '0.25em',
            },
            '& p.is-editor-empty:first-of-type::before': {
              color: '#a0aec0',
              content: 'attr(data-placeholder)',
              float: 'left',
              height: 0,
              pointerEvents: 'none',
            },
          },
        }}
      >
        <EditorContent editor={editor} />
      </Box>
    </Paper>
  );
}
