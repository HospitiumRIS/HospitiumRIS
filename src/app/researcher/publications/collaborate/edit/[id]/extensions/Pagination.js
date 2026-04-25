import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const PaginationPluginKey = new PluginKey('pagination');

export const PageBreak = Node.create({
  name: 'pageBreak',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      pageNumber: {
        default: null,
        parseHTML: element => element.getAttribute('data-page-number'),
        renderHTML: attributes => {
          if (!attributes.pageNumber) {
            return {};
          }
          return {
            'data-page-number': attributes.pageNumber,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-page-break]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-page-break': 'true',
        class: 'page-break',
      }),
    ];
  },

  addCommands() {
    return {
      insertPageBreak: () => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
        });
      },
      removeAllPageBreaks: () => ({ tr, state, dispatch }) => {
        const { doc } = state;
        const pageBreaks = [];

        doc.descendants((node, pos) => {
          if (node.type.name === this.name) {
            pageBreaks.push({ pos, node });
          }
        });

        if (pageBreaks.length === 0) {
          return false;
        }

        pageBreaks.reverse().forEach(({ pos, node }) => {
          tr.delete(pos, pos + node.nodeSize);
        });

        if (dispatch) {
          dispatch(tr);
        }

        return true;
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Enter': () => this.editor.commands.insertPageBreak(),
    };
  },
});

export const Pagination = Node.create({
  name: 'pagination',

  addOptions() {
    return {
      enabled: true,
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 72, right: 72, bottom: 72, left: 72 },
      showPageNumbers: true,
      pageNumberPosition: 'bottom-center',
      wordsPerPage: 800,
      autoCalculate: true,
      pageHeight: null,
    };
  },

  addProseMirrorPlugins() {
    const options = this.options;

    return [
      new Plugin({
        key: PaginationPluginKey,
        state: {
          init(_, state) {
            return {
              enabled: options.enabled,
              pageSize: options.pageSize,
              orientation: options.orientation,
              margins: options.margins,
              showPageNumbers: options.showPageNumbers,
              pageNumberPosition: options.pageNumberPosition,
              wordsPerPage: options.wordsPerPage,
              autoCalculate: options.autoCalculate,
              pageHeight: options.pageHeight,
              decorations: DecorationSet.empty,
            };
          },
          apply(tr, value, oldState, newState) {
            const meta = tr.getMeta(PaginationPluginKey);
            if (meta) {
              return { ...value, ...meta };
            }
            
            if (!value.enabled || !value.showPageNumbers) {
              return { ...value, decorations: DecorationSet.empty };
            }

            const decorations = [];
            let pageNumber = 1;

            newState.doc.descendants((node, pos) => {
              if (node.type.name === 'pageBreak') {
                const decoration = Decoration.widget(
                  pos + 1,
                  () => {
                    const pageNumEl = document.createElement('div');
                    pageNumEl.className = 'page-number';
                    pageNumEl.textContent = `Page ${pageNumber}`;
                    pageNumber++;
                    return pageNumEl;
                  },
                  { side: -1 }
                );
                decorations.push(decoration);
              }
            });

            return {
              ...value,
              decorations: DecorationSet.create(newState.doc, decorations),
            };
          },
        },
        props: {
          decorations(state) {
            return this.getState(state)?.decorations;
          },
        },
      }),
    ];
  },

  addCommands() {
    return {
      setPaginationEnabled: (enabled) => ({ tr, dispatch }) => {
        if (dispatch) {
          tr.setMeta(PaginationPluginKey, { enabled });
        }
        return true;
      },
      setPaginationOptions: (options) => ({ tr, dispatch }) => {
        if (dispatch) {
          tr.setMeta(PaginationPluginKey, options);
        }
        return true;
      },
      autoCalculatePageBreaks: () => ({ editor, tr, state, dispatch }) => {
        const { doc } = state;
        const pluginState = PaginationPluginKey.getState(state);
        
        if (!pluginState?.enabled || !pluginState?.autoCalculate) {
          return false;
        }

        editor.commands.removeAllPageBreaks();

        const { wordsPerPage } = pluginState;
        let wordCount = 0;
        const insertPositions = [];

        doc.descendants((node, pos) => {
          if (node.isText) {
            const words = node.text.split(/\s+/).filter(w => w.length > 0);
            wordCount += words.length;

            if (wordCount >= wordsPerPage) {
              const nextBlockPos = findNextBlockBoundary(doc, pos);
              if (nextBlockPos && !insertPositions.includes(nextBlockPos)) {
                insertPositions.push(nextBlockPos);
                wordCount = 0;
              }
            }
          }
        });

        insertPositions.reverse().forEach(pos => {
          tr.insert(pos, state.schema.nodes.pageBreak.create());
        });

        if (dispatch && insertPositions.length > 0) {
          dispatch(tr);
        }

        return insertPositions.length > 0;
      },
      getPageCount: () => ({ state }) => {
        const { doc } = state;
        let pageCount = 1;

        doc.descendants((node) => {
          if (node.type.name === 'pageBreak') {
            pageCount++;
          }
        });

        return pageCount;
      },
    };
  },
});

function findNextBlockBoundary(doc, currentPos) {
  let foundPos = null;
  let searchPos = currentPos;

  doc.nodesBetween(currentPos, doc.content.size, (node, pos) => {
    if (foundPos !== null) return false;
    
    if (pos > searchPos && node.isBlock && node.type.name !== 'pageBreak') {
      foundPos = pos;
      return false;
    }
  });

  return foundPos;
}

export default Pagination;
