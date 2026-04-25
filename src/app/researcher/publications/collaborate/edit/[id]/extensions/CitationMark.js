import { Mark, mergeAttributes } from '@tiptap/core';

export const CitationMark = Mark.create({
  name: 'citation',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      citationId: {
        default: null,
        parseHTML: element => element.getAttribute('data-citation-id'),
        renderHTML: attributes => {
          if (!attributes.citationId) {
            return {};
          }
          return {
            'data-citation-id': attributes.citationId,
          };
        },
      },
      citationData: {
        default: null,
        parseHTML: element => {
          const data = element.getAttribute('data-citation-data');
          return data ? JSON.parse(data) : null;
        },
        renderHTML: attributes => {
          if (!attributes.citationData) {
            return {};
          }
          return {
            'data-citation-data': JSON.stringify(attributes.citationData),
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-citation-id]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'citation-mark',
        style: 'color: #7c5cb5; cursor: pointer; background-color: rgba(139, 108, 188, 0.08); border-radius: 3px; padding: 1px 3px; border-bottom: 2px solid rgba(139, 108, 188, 0.4); transition: all 0.15s ease;',
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setCitation: (citationId, citationData, formattedText) => ({ commands }) => {
        return commands.insertContent({
          type: 'text',
          text: formattedText,
          marks: [
            {
              type: this.name,
              attrs: {
                citationId,
                citationData,
              },
            },
          ],
        });
      },
      updateCitation: (citationId, formattedText, updatedCitationData) => ({ commands, state, tr }) => {
        const { doc } = state;
        let updated = false;

        doc.descendants((node, pos) => {
          if (node.isText && node.marks) {
            const citationMark = node.marks.find(
              mark => mark.type.name === this.name && mark.attrs.citationId === citationId
            );
            
            if (citationMark) {
              const from = pos;
              const to = pos + node.nodeSize;
              
              // Create updated marks with new citation data if provided
              const newMarks = node.marks.map(mark => {
                if (mark === citationMark && updatedCitationData) {
                  return mark.type.create({
                    citationId: mark.attrs.citationId,
                    citationData: updatedCitationData,
                  });
                }
                return mark;
              });
              
              tr.replaceWith(from, to, state.schema.text(formattedText, newMarks));
              updated = true;
            }
          }
        });

        if (updated) {
          commands.setTextSelection({ from: tr.selection.from, to: tr.selection.to });
        }

        return updated;
      },
      removeCitation: (citationId) => ({ commands, state, tr }) => {
        const { doc } = state;
        let removed = false;
        const positionsToDelete = [];

        doc.descendants((node, pos) => {
          if (node.isText && node.marks) {
            const citationMark = node.marks.find(
              mark => mark.type.name === this.name && mark.attrs.citationId === citationId
            );
            
            if (citationMark) {
              positionsToDelete.push({ from: pos, to: pos + node.nodeSize });
              removed = true;
            }
          }
        });

        // Delete in reverse order to preserve positions
        for (let i = positionsToDelete.length - 1; i >= 0; i--) {
          const { from, to } = positionsToDelete[i];
          tr.delete(from, to);
        }

        return removed;
      },
    };
  },
});
