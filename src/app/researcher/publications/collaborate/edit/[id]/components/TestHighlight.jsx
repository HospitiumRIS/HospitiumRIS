'use client';

import { useEffect } from 'react';

export default function TestHighlight() {
  useEffect(() => {
    // Add a simple test highlight to verify the tooltip system works
    const testElement = document.createElement('mark');
    testElement.className = 'comment-highlight';
    testElement.setAttribute('data-comment-id', 'test-123');
    testElement.setAttribute('data-comment-type', 'COMMENT');
    testElement.setAttribute('data-author-name', 'Test User');
    testElement.setAttribute('data-comment-content', 'This is a test comment to verify tooltips work');
    testElement.style.backgroundColor = '#fff59d';
    testElement.style.padding = '1px 2px';
    testElement.style.borderRadius = '2px';
    testElement.style.cursor = 'pointer';
    testElement.textContent = 'TEST HIGHLIGHTED TEXT';

    // Insert after a delay to ensure DOM is ready
    setTimeout(() => {
      const editorContent = document.querySelector('.ProseMirror');
      if (editorContent) {
        editorContent.appendChild(testElement);
        console.log('Test highlight element added:', testElement);
        
        // Add event listeners directly to test
        testElement.addEventListener('mouseenter', (e) => {
          console.log('Direct mouseenter on test element');
          const event = new CustomEvent('showCommentTooltip', {
            detail: {
              commentId: 'test-123',
              commentType: 'COMMENT',
              authorName: 'Test User',
              commentContent: 'This is a test comment to verify tooltips work',
              x: e.clientX,
              y: e.clientY
            }
          });
          document.dispatchEvent(event);
        });

        testElement.addEventListener('mouseleave', (e) => {
          console.log('Direct mouseleave on test element');
          const event = new CustomEvent('hideCommentTooltip');
          document.dispatchEvent(event);
        });
      }
    }, 2000);
  }, []);

  return null;
}

