'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, IconButton, Tooltip, Typography, Divider } from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
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
                y: rect.bottom + 5,
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

  return (
    <Paper
      ref={menuRef}
      onMouseEnter={handleMenuMouseEnter}
      onMouseLeave={handleMenuMouseLeave}
      sx={{
        position: 'fixed',
        left: menuPosition.x,
        top: menuPosition.y,
        transform: 'translateX(-50%)',
        zIndex: 10000,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        border: '1px solid #e0e0e0',
        borderRadius: 2,
        overflow: 'hidden',
        minWidth: 280,
      }}
    >
      {/* Citation Info */}
      <Box sx={{ p: 1.5, bgcolor: '#f8f9fa' }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            fontSize: '0.8rem',
            color: '#2d3748',
            mb: 0.5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {currentCitation.data.title}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.7rem',
            color: '#64748b',
            display: 'block',
          }}
        >
          {currentCitation.data.authors?.[0]} {currentCitation.data.year && `(${currentCitation.data.year})`}
        </Typography>
      </Box>

      <Divider />

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', p: 0.5 }}>
        <Tooltip title="Update Reference" placement="top">
          <IconButton
            size="small"
            onClick={handleUpdate}
            sx={{
              flex: 1,
              borderRadius: 1,
              color: '#8b6cbc',
              '&:hover': {
                bgcolor: '#8b6cbc10',
              },
            }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Edit Citation" placement="top">
          <IconButton
            size="small"
            onClick={handleUpdate}
            sx={{
              flex: 1,
              borderRadius: 1,
              color: '#2196f3',
              '&:hover': {
                bgcolor: '#2196f310',
              },
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="View Details" placement="top">
          <IconButton
            size="small"
            sx={{
              flex: 1,
              borderRadius: 1,
              color: '#64748b',
              '&:hover': {
                bgcolor: '#64748b10',
              },
            }}
          >
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Remove Citation" placement="top">
          <IconButton
            size="small"
            onClick={handleDelete}
            sx={{
              flex: 1,
              borderRadius: 1,
              color: '#ef4444',
              '&:hover': {
                bgcolor: '#ef444410',
              },
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  );
}
