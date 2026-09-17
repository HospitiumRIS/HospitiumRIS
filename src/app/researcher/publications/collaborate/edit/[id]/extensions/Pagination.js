import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { getPageDimensions, DEFAULT_MARGINS, PAGE_GAP } from '../utils/paginationHelper';

export const PaginationPluginKey = new PluginKey('pagination');

// Rounding slack so sub-pixel line heights don't push a page break too early
const HEIGHT_TOLERANCE = 1;
// Safety valve against a layout that never settles
const MAX_RELAYOUTS = 6;

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

/**
 * Height of a block as it contributes to the page, modelling the margin
 * collapsing between it and the previous sibling.
 */
function blockOuterHeight(element, previousMarginBottom) {
  const style = window.getComputedStyle(element);
  const marginTop = parseFloat(style.marginTop) || 0;
  const marginBottom = parseFloat(style.marginBottom) || 0;
  const height = element.getBoundingClientRect().height;

  return {
    height: height + Math.max(0, marginTop - previousMarginBottom) + marginBottom,
    marginBottom,
  };
}

/**
 * Walks the top level blocks and works out where the document crosses a page
 * boundary. Returns the spacers needed to push the next block onto the
 * following sheet plus the resulting page count.
 */
export function computePageLayout(view, config) {
  const dimensions = getPageDimensions(config.pageSize, config.orientation);
  const margins = { ...DEFAULT_MARGINS, ...(config.margins || {}) };
  const contentHeight = dimensions.heightPx - margins.top - margins.bottom;
  // Distance from the bottom of one content area to the top of the next
  const boundaryHeight = margins.bottom + (config.pageGap ?? PAGE_GAP) + margins.top;

  const spacers = [];
  const forcedBreaks = [];
  let pageCount = 1;
  let used = 0;
  let previousMarginBottom = 0;

  if (contentHeight <= 0) {
    return { pageCount: 1, spacers, forcedBreaks };
  }

  const absorbOverflow = () => {
    // A single block taller than one page cannot be split, so reserve
    // enough sheets for it to sit on
    while (used > contentHeight + HEIGHT_TOLERANCE) {
      used -= contentHeight;
      pageCount += 1;
    }
  };

  view.state.doc.forEach((node, offset) => {
    const dom = view.nodeDOM(offset);

    if (!dom || dom.nodeType !== 1) {
      return;
    }

    if (node.type.name === 'pageBreak') {
      const remaining = Math.max(0, contentHeight - used);
      forcedBreaks.push({
        pos: offset,
        nodeSize: node.nodeSize,
        height: remaining + boundaryHeight,
      });
      pageCount += 1;
      used = 0;
      previousMarginBottom = 0;
      return;
    }

    const { height, marginBottom } = blockOuterHeight(dom, previousMarginBottom);

    if (used > 0 && used + height > contentHeight + HEIGHT_TOLERANCE) {
      spacers.push({
        pos: offset,
        height: Math.max(0, contentHeight - used) + boundaryHeight,
      });
      pageCount += 1;
      used = height;
    } else {
      used += height;
    }

    previousMarginBottom = marginBottom;
    absorbOverflow();
  });

  return { pageCount, spacers, forcedBreaks };
}

function layoutSignature(layout) {
  if (!layout) return '';
  const spacers = layout.spacers
    .map(s => `${s.pos}:${Math.round(s.height)}`)
    .join(',');
  const forced = layout.forcedBreaks
    .map(b => `${b.pos}:${Math.round(b.height)}`)
    .join(',');
  return `${layout.pageCount}|${spacers}|${forced}`;
}

function buildDecorations(doc, layout, config) {
  if (!config.enabled || !layout) {
    return DecorationSet.empty;
  }

  const decorations = [];

  layout.spacers.forEach(({ pos, height }) => {
    decorations.push(
      Decoration.widget(
        pos,
        () => {
          const gap = document.createElement('div');
          gap.className = 'page-gap';
          gap.style.height = `${height}px`;
          gap.setAttribute('contenteditable', 'false');
          gap.setAttribute('aria-hidden', 'true');
          return gap;
        },
        {
          side: -1,
          key: `page-gap-${pos}-${Math.round(height)}`,
          ignoreSelection: true,
          marks: [],
        }
      )
    );
  });

  layout.forcedBreaks.forEach(({ pos, nodeSize, height }) => {
    decorations.push(
      Decoration.node(pos, pos + nodeSize, {
        style: `height: ${height}px;`,
      })
    );
  });

  return DecorationSet.create(doc, decorations);
}

/**
 * Measures the rendered document after every change and keeps the page
 * layout decorations in sync.
 */
class PaginationLayoutView {
  constructor(view) {
    this.view = view;
    this.frame = null;
    this.relayouts = 0;
    this.reportedPageCount = null;

    if (typeof ResizeObserver !== 'undefined') {
      this.observer = new ResizeObserver(() => this.schedule());
      this.observer.observe(view.dom);
    }

    this.schedule();
  }

  schedule() {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = null;
      this.measure();
    });
  }

  update(view, previousState) {
    this.view = view;

    const config = PaginationPluginKey.getState(view.state);
    const previousConfig = PaginationPluginKey.getState(previousState);
    const configChanged =
      config?.enabled !== previousConfig?.enabled ||
      config?.pageSize !== previousConfig?.pageSize ||
      config?.orientation !== previousConfig?.orientation ||
      config?.margins !== previousConfig?.margins ||
      config?.pageGap !== previousConfig?.pageGap;

    if (config?.onLayoutChange !== previousConfig?.onLayoutChange) {
      // A newly registered listener has not seen the current count yet
      this.reportedPageCount = null;
      this.schedule();
    }

    if (view.state.doc !== previousState.doc || configChanged) {
      this.relayouts = 0;
      this.schedule();
    }
  }

  reportPageCount(config, pageCount) {
    if (this.reportedPageCount === pageCount) return;
    this.reportedPageCount = pageCount;
    if (typeof config.onLayoutChange === 'function') {
      config.onLayoutChange({ pageCount });
    }
  }

  measure() {
    const { view } = this;
    if (!view || !view.dom || !view.dom.isConnected) return;

    const config = PaginationPluginKey.getState(view.state);
    if (!config) return;

    if (!config.enabled) {
      if (layoutSignature(config.layout) !== '') {
        view.dispatch(
          view.state.tr.setMeta(PaginationPluginKey, {
            layout: { pageCount: 1, spacers: [], forcedBreaks: [] },
          })
        );
      }
      this.reportPageCount(config, 1);
      return;
    }

    const layout = computePageLayout(view, config);
    this.reportPageCount(config, layout.pageCount);

    if (layoutSignature(layout) === layoutSignature(config.layout)) {
      this.relayouts = 0;
      return;
    }

    if (this.relayouts >= MAX_RELAYOUTS) return;
    this.relayouts += 1;

    view.dispatch(view.state.tr.setMeta(PaginationPluginKey, { layout }));
  }

  destroy() {
    if (this.frame) cancelAnimationFrame(this.frame);
    if (this.observer) this.observer.disconnect();
  }
}

export const Pagination = Node.create({
  name: 'pagination',

  addOptions() {
    return {
      enabled: true,
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { ...DEFAULT_MARGINS },
      showPageNumbers: true,
      pageNumberPosition: 'bottom-center',
      pageGap: PAGE_GAP,
      wordsPerPage: 800,
      autoCalculate: true,
      onLayoutChange: null,
    };
  },

  addProseMirrorPlugins() {
    const options = this.options;

    return [
      new Plugin({
        key: PaginationPluginKey,
        state: {
          init() {
            return {
              enabled: options.enabled,
              pageSize: options.pageSize,
              orientation: options.orientation,
              margins: options.margins,
              showPageNumbers: options.showPageNumbers,
              pageNumberPosition: options.pageNumberPosition,
              pageGap: options.pageGap,
              wordsPerPage: options.wordsPerPage,
              autoCalculate: options.autoCalculate,
              onLayoutChange: options.onLayoutChange,
              layout: { pageCount: 1, spacers: [], forcedBreaks: [] },
              decorations: DecorationSet.empty,
            };
          },
          apply(tr, value, oldState, newState) {
            const meta = tr.getMeta(PaginationPluginKey);
            const next = meta ? { ...value, ...meta } : value;

            // A fresh measurement always rebuilds the decoration set
            if (meta && (meta.layout || 'enabled' in meta)) {
              return {
                ...next,
                decorations: buildDecorations(newState.doc, next.layout, next),
              };
            }

            if (tr.docChanged) {
              // Keep spacers attached to their block until the next measure pass
              return {
                ...next,
                decorations: next.decorations.map(tr.mapping, tr.doc),
              };
            }

            return next;
          },
        },
        props: {
          decorations(state) {
            return PaginationPluginKey.getState(state)?.decorations;
          },
        },
        view(editorView) {
          return new PaginationLayoutView(editorView);
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

        if (!pluginState?.enabled) {
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
        const pluginState = PaginationPluginKey.getState(state);

        if (pluginState?.enabled && pluginState.layout?.pageCount) {
          return pluginState.layout.pageCount;
        }

        let pageCount = 1;
        state.doc.descendants((node) => {
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
