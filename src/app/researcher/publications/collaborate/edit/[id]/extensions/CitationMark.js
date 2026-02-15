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
        style: 'color: #8b6cbc; cursor: pointer; text-decoration: underline; text-decoration-style: dotted;',
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
      updateCitation: (citationId, formattedText) => ({ commands, state, tr }) => {
        const { doc } = state;
        let updated = false;

        doc.descendants((node, pos) => {
          if (node.isText && node.marks) {
            node.marks.forEach(mark => {
              if (mark.type.name === this.name && mark.attrs.citationId === citationId) {
                const from = pos;
                const to = pos + node.nodeSize;
                tr.replaceWith(from, to, state.schema.text(formattedText, node.marks));
                updated = true;
              }
            });
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

        doc.descendants((node, pos) => {
          if (node.isText && node.marks) {
            const citationMark = node.marks.find(
              mark => mark.type.name === this.name && mark.attrs.citationId === citationId
            );
            
            if (citationMark) {
              const from = pos;
              const to = pos + node.nodeSize;
              const newMarks = node.marks.filter(mark => mark !== citationMark);
              tr.replaceWith(from, to, state.schema.text(node.text, newMarks));
              removed = true;
            }
          }
        });

        return removed;
      },
    };
  },
});
