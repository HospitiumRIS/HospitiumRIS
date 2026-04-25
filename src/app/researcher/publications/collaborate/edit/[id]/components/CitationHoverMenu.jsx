'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, Typography, Chip } from '@mui/material';
import {
  Edit as EditIcon,
  DeleteOutline as DeleteIcon,
  MenuBook as JournalIcon,
  CalendarToday as YearIcon,
  OpenInNew as OpenIcon,
} from '@mui/icons-material';

export default function CitationHoverMenu({ editor, onUpdateCitation, onDeleteCitation }) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [currentCitation, setCurrentCitation] = useState(null);
  const menuRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  useEffect(() => {
    if (!editor) return;

    const handleMouseMove = (event) => {
      const target = event.target;
      
      // Check if hovering over a citation mark
      if (target.classList.contains('citation-mark') || target.closest('.citation-mark')) {
        const citationElement = target.classList.contains('citation-mark') 
          ? target 
          : target.closest('.citation-mark');
        
        const citationId = citationElement.getAttribute('data-citation-id');
        const citationDataStr = citationElement.getAttribute('data-citation-data');
        
        if (citationId && citationDataStr) {
          try {
            const citationData = JSON.parse(citationDataStr);
            
            // Clear any existing timeout
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
            }
            
            // Set timeout to show menu after brief hover
            hoverTimeoutRef.current = setTimeout(() => {
              const rect = citationElement.getBoundingClientRect();
              setMenuPosition({
                x: rect.left + rect.width / 2,
                y: rect.bottom + 8,
              });
              setCurrentCitation({
                id: citationId,
                data: citationData,
                element: citationElement,
              });
              setShowMenu(true);
            }, 300);
          } catch (error) {
            console.error('Error parsing citation data:', error);
          }
        }
      } else if (!menuRef.current?.contains(event.target)) {
        // Not hovering over citation or menu
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
        }
        
        // Delay hiding menu to allow moving to it
        hoverTimeoutRef.current = setTimeout(() => {
          setShowMenu(false);
          setCurrentCitation(null);
        }, 200);
      }
    };

    const handleScroll = () => {
      setShowMenu(false);
      setCurrentCitation(null);
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('mousemove', handleMouseMove);
    editorElement.addEventListener('scroll', handleScroll);

    return () => {
      editorElement.removeEventListener('mousemove', handleMouseMove);
      editorElement.removeEventListener('scroll', handleScroll);
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, [editor]);

  const handleMenuMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const handleMenuMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setShowMenu(false);
      setCurrentCitation(null);
    }, 200);
  };

  const handleUpdate = () => {
    if (currentCitation && onUpdateCitation) {
      onUpdateCitation(currentCitation.id, currentCitation.data);
    }
    setShowMenu(false);
    setCurrentCitation(null);
  };

  const handleDelete = () => {
    if (currentCitation && onDeleteCitation) {
      onDeleteCitation(currentCitation.id);
    }
    setShowMenu(false);
    setCurrentCitation(null);
  };

  if (!showMenu || !currentCitation) return null;

  // Extract citation metadata
  const { data } = currentCitation;
  const authors = Array.isArray(data.authors) ? data.authors : [];
  const authorDisplay = authors.length > 2 
    ? `${authors[0]} et al.` 
    : authors.join(', ');
  const journal = data.journal || data.source || data.publisher || '';
  const doi = data.doi || '';

  return (
    <Paper
      ref={menuRef}
      onMouseEnter={handleMenuMouseEnter}
      onMouseLeave={handleMenuMouseLeave}
      elevation={0}
      sx={{
        position: 'fixed',
        left: menuPosition.x,
        top: menuPosition.y,
        transform: 'translateX(-50%)',
        zIndex: 10000,
        boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)',
        border: '1px solid rgba(139, 108, 188, 0.15)',
        borderRadius: '12px',
        overflow: 'hidden',
        minWidth: 300,
        maxWidth: 380,
        animation: 'fadeInUp 0.15s ease-out',
        '@keyframes fadeInUp': {
          from: { opacity: 0, transform: 'translateX(-50%) translateY(4px)' },
          to: { opacity: 1, transform: 'translateX(-50%) translateY(0)' },
        },
      }}
    >
      {/* Purple accent bar */}
      <Box sx={{ height: 3, bgcolor: 'linear-gradient(90deg, #8b6cbc, #a78bda)', background: 'linear-gradient(90deg, #8b6cbc, #a78bda)' }} />

      {/* Citation Info */}
      <Box sx={{ p: 2, pb: 1.5 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            fontSize: '0.85rem',
            color: '#1a202c',
            lineHeight: 1.4,
            mb: 0.75,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {data.title || 'Untitled'}
        </Typography>

        {/* Author */}
        {authorDisplay && (
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.78rem',
              color: '#4a5568',
              display: 'block',
              mb: 0.5,
              fontWeight: 500,
            }}
          >
            {authorDisplay}
          </Typography>
        )}

        {/* Metadata row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 0.75 }}>
          {data.year && (
            <Chip
              icon={<YearIcon sx={{ fontSize: '0.75rem !important' }} />}
              label={data.year}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.7rem',
                fontWeight: 500,
                bgcolor: 'rgba(139, 108, 188, 0.08)',
                color: '#7c5cb5',
                border: '1px solid rgba(139, 108, 188, 0.15)',
                '& .MuiChip-icon': { color: '#8b6cbc' },
              }}
            />
          )}
          {journal && (
            <Chip
              icon={<JournalIcon sx={{ fontSize: '0.75rem !important' }} />}
              label={journal.length > 30 ? journal.substring(0, 30) + '...' : journal}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.7rem',
                fontWeight: 500,
                bgcolor: 'rgba(33, 150, 243, 0.06)',
                color: '#1976d2',
                border: '1px solid rgba(33, 150, 243, 0.12)',
                '& .MuiChip-icon': { color: '#1976d2' },
              }}
            />
          )}
        </Box>
      </Box>

      {/* Divider */}
      <Box sx={{ mx: 2, borderTop: '1px solid #f0f0f0' }} />

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', p: 1, gap: 0.5 }}>
        <Box
          onClick={handleUpdate}
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.5,
            py: 0.75,
            px: 1,
            borderRadius: '8px',
            cursor: 'pointer',
            color: '#7c5cb5',
            fontSize: '0.75rem',
            fontWeight: 600,
            transition: 'all 0.15s ease',
            '&:hover': {
              bgcolor: 'rgba(139, 108, 188, 0.08)',
            },
          }}
        >
          <EditIcon sx={{ fontSize: '1rem' }} />
          Edit
        </Box>

        {doi && (
          <Box
            component="a"
            href={doi.startsWith('http') ? doi : `https://doi.org/${doi}`}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              py: 0.75,
              px: 1,
              borderRadius: '8px',
              cursor: 'pointer',
              color: '#1976d2',
              fontSize: '0.75rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.15s ease',
              '&:hover': {
                bgcolor: 'rgba(33, 150, 243, 0.06)',
              },
            }}
          >
            <OpenIcon sx={{ fontSize: '1rem' }} />
            DOI
          </Box>
        )}

        <Box
          onClick={handleDelete}
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.5,
            py: 0.75,
            px: 1,
            borderRadius: '8px',
            cursor: 'pointer',
            color: '#94a3b8',
            fontSize: '0.75rem',
            fontWeight: 600,
            transition: 'all 0.15s ease',
            '&:hover': {
              bgcolor: 'rgba(239, 68, 68, 0.06)',
              color: '#ef4444',
            },
          }}
        >
          <DeleteIcon sx={{ fontSize: '1rem' }} />
          Remove
        </Box>
      </Box>
    </Paper>
  );
}
