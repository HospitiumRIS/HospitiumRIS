import { Mark, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

const CommentHighlight = Mark.create({
  name: 'commentHighlight',

  addOptions() {
    return {
      multicolor: false,
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: element => element.getAttribute('data-comment-id'),
        renderHTML: attributes => {
          if (!attributes.commentId) {
            return {};
          }
          return {
            'data-comment-id': attributes.commentId,
          };
        },
      },
      commentType: {
        default: 'COMMENT',
        parseHTML: element => element.getAttribute('data-comment-type'),
        renderHTML: attributes => {
          if (!attributes.commentType) {
            return {};
          }
          return {
            'data-comment-type': attributes.commentType,
          };
        },
      },
      authorName: {
        default: null,
        parseHTML: element => element.getAttribute('data-author-name'),
        renderHTML: attributes => {
          if (!attributes.authorName) {
            return {};
          }
          return {
            'data-author-name': attributes.authorName,
          };
        },
      },
      commentContent: {
        default: null,
        parseHTML: element => element.getAttribute('data-comment-content'),
        renderHTML: attributes => {
          if (!attributes.commentContent) {
            return {};
          }
          return {
            'data-comment-content': attributes.commentContent,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'mark',
        getAttrs: element => element.hasAttribute('data-comment-id') && null,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const commentType = HTMLAttributes['data-comment-type'] || 'COMMENT';
    
    // Different highlight colors based on comment type
    const typeColors = {
      'COMMENT': '#fff59d', // Light yellow
      'SUGGESTION': '#ffcc80', // Light orange
      'QUESTION': '#90caf9', // Light blue
    };

    const backgroundColor = typeColors[commentType] || typeColors['COMMENT'];
    
    return [
      'mark',
      mergeAttributes(
        {
          'data-type': 'comment-highlight',
          style: `
            background-color: ${backgroundColor};
            padding: 1px 2px;
            border-radius: 2px;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
          `,
          class: 'comment-highlight',
        },
        this.options.HTMLAttributes,
        HTMLAttributes,
      ),
      0,
    ];
  },

  addCommands() {
    return {
      setCommentHighlight: (attributes) => ({ commands }) => {
        return commands.setMark(this.name, attributes);
      },
      toggleCommentHighlight: (attributes) => ({ commands }) => {
        return commands.toggleMark(this.name, attributes);
      },
      unsetCommentHighlight: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      },
      removeCommentHighlight: (commentId) => ({ tr, state, dispatch }) => {
        if (!dispatch) return false;

        const { doc } = state;
        let hasChanges = false;

        doc.descendants((node, pos) => {
          if (node.isText) {
            node.marks.forEach((mark, markIndex) => {
              if (mark.type.name === this.name && mark.attrs.commentId === commentId) {
                const from = pos;
                const to = pos + node.nodeSize;
                tr.removeMark(from, to, mark.type);
                hasChanges = true;
              }
            });
          }
        });

        return hasChanges;
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('commentHighlightTooltip'),
        props: {
          handleDOMEvents: {
            mouseenter: (view, event) => {
              const target = event.target;
              console.log('Mouse enter event:', target, target.classList);
              
              if (target.classList.contains('comment-highlight')) {
                const commentId = target.getAttribute('data-comment-id');
                const commentType = target.getAttribute('data-comment-type');
                const authorName = target.getAttribute('data-author-name');
                const commentContent = target.getAttribute('data-comment-content');
                
                console.log('Comment highlight hovered:', {
                  commentId,
                  commentType,
                  authorName,
                  commentContent
                });
                
                if (commentId && commentContent) {
                  // Dispatch custom event for tooltip
                  const tooltipEvent = new CustomEvent('showCommentTooltip', {
                    detail: {
                      commentId,
                      commentType,
                      authorName,
                      commentContent,
                      target,
                      x: event.clientX,
                      y: event.clientY,
                    }
                  });
                  console.log('Dispatching tooltip event:', tooltipEvent.detail);
                  document.dispatchEvent(tooltipEvent);
                }
              }
              return false;
            },
            mouseleave: (view, event) => {
              const target = event.target;
              
              if (target.classList.contains('comment-highlight')) {
                // Dispatch custom event to hide tooltip
                const tooltipEvent = new CustomEvent('hideCommentTooltip');
                document.dispatchEvent(tooltipEvent);
              }
              return false;
            },
            click: (view, event) => {
              const target = event.target;
              
              if (target.classList.contains('comment-highlight')) {
                const commentId = target.getAttribute('data-comment-id');
                
                if (commentId) {
                  // Dispatch custom event for comment selection
                  const selectEvent = new CustomEvent('selectComment', {
                    detail: { commentId }
                  });
                  document.dispatchEvent(selectEvent);
                }
              }
              return false;
            },
          },
        },
      }),
    ];
  },
});

export default CommentHighlight;
