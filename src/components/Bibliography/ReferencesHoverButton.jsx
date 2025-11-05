'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Fab,
  Tooltip,
  Box,
  Zoom,
  useTheme
} from '@mui/material';
import {
  AutoStories as BibliographyIcon,
  Add as AddIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

const ReferencesHoverButton = ({ 
  editor, 
  onOpenBibliographyGenerator,
  isVisible = false,
  position = { x: 0, y: 0 }
}) => {
  const theme = useTheme();
  const [showButton, setShowButton] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const hoverTimeoutRef = useRef(null);
  const detectTimeoutRef = useRef(null);

  // Monitor editor content for "References" text
  useEffect(() => {
    if (!editor) return;

    const detectReferencesSection = () => {
      try {
        const editorElement = editor.view.dom;
        if (!editorElement) return;

        // Find all text nodes that contain "References"
        const walker = document.createTreeWalker(
          editorElement,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );

        let node;
        const referenceElements = [];

        while (node = walker.nextNode()) {
          const text = node.textContent?.trim().toLowerCase();
          if (text && (
            text === 'references' || 
            text === 'bibliography' || 
            text.startsWith('references') || 
            text.startsWith('bibliography')
          )) {
            // Get the parent element that contains this text
            let parentElement = node.parentElement;
            
            // Look for heading elements or elements that look like section headers
            while (parentElement && parentElement !== editorElement) {
              const tagName = parentElement.tagName?.toLowerCase();
              const computedStyle = getComputedStyle(parentElement);
              const hasHeadingStyle = tagName?.startsWith('h') || 
                                     parentElement.classList?.contains('heading') ||
                                     computedStyle.fontWeight >= '600' ||
                                     parseInt(computedStyle.fontSize) >= 18 ||
                                     computedStyle.textTransform === 'uppercase';
              
              if (hasHeadingStyle) {
                referenceElements.push({
                  element: parentElement,
                  textNode: node
                });
                break;
              }
              parentElement = parentElement.parentElement;
            }
            
            // If no heading parent found, check if immediate parent looks like a references section
            if (!referenceElements.some(ref => ref.textNode === node)) {
              const immediateParent = node.parentElement;
              if (immediateParent) {
                referenceElements.push({
                  element: immediateParent,
                  textNode: node
                });
              }
            }
          }
        }

        // Add hover listeners to detected reference elements
        referenceElements.forEach(({ element }) => {
          if (element && !element.hasAttribute('data-references-hover')) {
            element.setAttribute('data-references-hover', 'true');
            
            const handleMouseEnter = (e) => {
              clearTimeout(hoverTimeoutRef.current);
              
              // Add subtle highlight to references section
              element.style.backgroundColor = 'rgba(139, 108, 188, 0.1)';
              element.style.borderRadius = '4px';
              element.style.transition = 'background-color 0.2s ease';
              
              const rect = element.getBoundingClientRect();
              const editorRect = editorElement.getBoundingClientRect();
              
              setButtonPosition({
                x: rect.right - editorRect.left + 10,
                y: rect.top - editorRect.top
              });
              
              hoverTimeoutRef.current = setTimeout(() => {
                setShowButton(true);
              }, 200); // Reduced delay for better responsiveness
            };

            const handleMouseLeave = () => {
              clearTimeout(hoverTimeoutRef.current);
              
              // Remove highlight from references section
              element.style.backgroundColor = '';
              element.style.borderRadius = '';
              
              hoverTimeoutRef.current = setTimeout(() => {
                setShowButton(false);
              }, 400); // 400ms delay to allow moving to button
            };

            element.addEventListener('mouseenter', handleMouseEnter);
            element.addEventListener('mouseleave', handleMouseLeave);
            
            // Store cleanup functions
            element._referencesCleanup = () => {
              element.removeEventListener('mouseenter', handleMouseEnter);
              element.removeEventListener('mouseleave', handleMouseLeave);
              element.removeAttribute('data-references-hover');
              delete element._referencesCleanup;
            };
          }
        });

      } catch (error) {
        console.error('Error detecting references section:', error);
      }
    };

    // Detect references periodically and on content changes
    const startDetection = () => {
      detectReferencesSection();
      detectTimeoutRef.current = setTimeout(startDetection, 2000); // Check every 2 seconds
    };

    // Start detection after a short delay to let content load
    const initialTimeout = setTimeout(startDetection, 1000);

    // Also detect on editor content changes
    const handleUpdate = () => {
      clearTimeout(detectTimeoutRef.current);
      detectTimeoutRef.current = setTimeout(detectReferencesSection, 500);
    };

    editor.on('update', handleUpdate);

    return () => {
      clearTimeout(initialTimeout);
      clearTimeout(detectTimeoutRef.current);
      clearTimeout(hoverTimeoutRef.current);
      editor.off('update', handleUpdate);
      
      // Cleanup all hover listeners
      const elementsWithListeners = editor.view.dom?.querySelectorAll('[data-references-hover]');
      elementsWithListeners?.forEach(element => {
        if (element._referencesCleanup) {
          element._referencesCleanup();
        }
      });
    };
  }, [editor]);

  // Handle button hover
  const handleButtonMouseEnter = () => {
    clearTimeout(hoverTimeoutRef.current);
    setShowButton(true);
  };

  const handleButtonMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setShowButton(false);
    }, 300);
  };

  const handleClick = () => {
    setShowButton(false);
    onOpenBibliographyGenerator();
  };

  if (!editor) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        left: buttonPosition.x,
        top: buttonPosition.y,
        zIndex: 1000,
        pointerEvents: showButton ? 'auto' : 'none',
      }}
      onMouseEnter={handleButtonMouseEnter}
      onMouseLeave={handleButtonMouseLeave}
    >
      <Zoom in={showButton} timeout={200}>
        <Tooltip 
          title="Generate Bibliography" 
          placement="top"
          arrow
        >
          <Fab
            size="small"
            color="primary"
            onClick={handleClick}
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: 'white',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
                transform: 'scale(1.1)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <BibliographyIcon fontSize="small" />
          </Fab>
        </Tooltip>
      </Zoom>
    </Box>
  );
};

export default ReferencesHoverButton;
