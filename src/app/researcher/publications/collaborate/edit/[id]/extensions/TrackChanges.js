'use client';

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { Step } from 'prosemirror-transform';

// Generate unique change ID
function generateChangeId() {
  return 'change_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Track Changes Plugin Key
const trackChangesPluginKey = new PluginKey('trackChanges');

export const TrackChanges = Extension.create({
  name: 'trackChanges',

  addOptions() {
    return {
      enabled: false,
      userId: null,
      userName: 'Anonymous',
      onChangeCreated: () => {},
      onChangeAccepted: () => {},
      onChangeRejected: () => {},
    };
  },

  addStorage() {
    return {
      changes: new Map(), // Store tracked changes
      decorations: DecorationSet.empty,
    };
  },

  addCommands() {
    return {
      toggleTrackChanges: () => ({ commands }) => {
        this.options.enabled = !this.options.enabled;
        return true;
      },
      
      enableTrackChanges: () => ({ commands }) => {
        this.options.enabled = true;
        return true;
      },
      
      disableTrackChanges: () => ({ commands }) => {
        this.options.enabled = false;
        return true;
      },

      acceptChange: (changeId) => ({ tr, dispatch, state }) => {
        if (!dispatch) return false;

        const change = this.storage.changes.get(changeId);
        if (!change) return false;

        // Remove the change decoration
        const decorations = this.storage.decorations;
        const newDecorations = decorations.remove(
          decorations.find(null, null, (spec) => spec.changeId === changeId)
        );
        
        this.storage.decorations = newDecorations;
        this.storage.changes.delete(changeId);

        // Call the callback
        this.options.onChangeAccepted(change);

        // Update the plugin state
        tr.setMeta(trackChangesPluginKey, {
          type: 'acceptChange',
          changeId,
        });

        dispatch(tr);
        return true;
      },

      rejectChange: (changeId) => ({ tr, dispatch, state, view }) => {
        if (!dispatch) return false;

        const change = this.storage.changes.get(changeId);
        if (!change) return false;

        // For deletions, restore the content
        if (change.type === 'DELETE') {
          const pos = change.startOffset;
          tr.insertText(change.content, pos);
        }
        // For insertions, remove the content
        else if (change.type === 'INSERT') {
          tr.delete(change.startOffset, change.endOffset);
        }
        // For formatting, restore original formatting
        else if (change.type === 'FORMAT') {
          // This would need more complex logic to restore formatting
          // For now, just remove the change decoration
        }

        // Remove the change decoration
        const decorations = this.storage.decorations;
        const newDecorations = decorations.remove(
          decorations.find(null, null, (spec) => spec.changeId === changeId)
        );
        
        this.storage.decorations = newDecorations;
        this.storage.changes.delete(changeId);

        // Call the callback
        this.options.onChangeRejected(change);

        // Update the plugin state
        tr.setMeta(trackChangesPluginKey, {
          type: 'rejectChange',
          changeId,
        });

        dispatch(tr);
        return true;
      },

      acceptAllChanges: () => ({ tr, dispatch }) => {
        if (!dispatch) return false;

        const changes = Array.from(this.storage.changes.keys());
        changes.forEach(changeId => {
          this.editor.commands.acceptChange(changeId);
        });

        return true;
      },

      rejectAllChanges: () => ({ tr, dispatch }) => {
        if (!dispatch) return false;

        const changes = Array.from(this.storage.changes.keys());
        changes.forEach(changeId => {
          this.editor.commands.rejectChange(changeId);
        });

        return true;
      },
    };
  },

  addProseMirrorPlugins() {
    const extension = this;
    
    return [
      new Plugin({
        key: trackChangesPluginKey,
        
        state: {
          init() {
            return {
              decorations: DecorationSet.empty,
              changes: new Map(),
            };
          },
          
          apply(tr, oldState, oldDoc, newDoc) {
            let { decorations, changes } = oldState;
            
            // Handle meta actions (accept/reject changes)
            const meta = tr.getMeta(trackChangesPluginKey);
            if (meta) {
              switch (meta.type) {
                case 'acceptChange':
                case 'rejectChange':
                  // Decorations and changes are already updated in the command
                  return {
                    decorations: extension.storage.decorations,
                    changes: extension.storage.changes,
                  };
              }
            }

            // Only track changes if enabled
            if (!extension.options.enabled) {
              return { decorations, changes };
            }

            // Track document changes
            if (tr.docChanged) {
              const newChanges = new Map(changes);
              const newDecorations = decorations.map(tr.mapping, tr.doc);
              
              // Analyze the transaction steps
              tr.steps.forEach((step, stepIndex) => {
                const changeId = generateChangeId();
                let changeData = null;

                if (step.jsonID === 'replace' || step.jsonID === 'replaceAround') {
                  const { from, to, slice } = step;
                  const oldContent = oldDoc.textBetween(from, to);
                  const newContent = slice.content.textBetween(0, slice.content.size);
                  
                  if (oldContent && !newContent) {
                    // Deletion
                    changeData = {
                      id: changeId,
                      type: 'DELETE',
                      content: oldContent,
                      startOffset: from,
                      endOffset: to,
                      authorId: extension.options.userId,
                      authorName: extension.options.userName,
                      createdAt: new Date().toISOString(),
                      status: 'PENDING',
                    };

                    // Add deletion decoration
                    const decoration = Decoration.inline(
                      from, from,
                      {
                        class: 'tracked-change tracked-deletion',
                        'data-change-id': changeId,
                        'data-change-type': 'DELETE',
                        'data-author': extension.options.userName,
                        'data-content': oldContent,
                        title: `Deleted by ${extension.options.userName}: "${oldContent}"`,
                      },
                      { changeId }
                    );
                    newDecorations.add(tr.doc, [decoration]);
                    
                  } else if (!oldContent && newContent) {
                    // Insertion
                    changeData = {
                      id: changeId,
                      type: 'INSERT',
                      content: newContent,
                      startOffset: from,
                      endOffset: from + newContent.length,
                      authorId: extension.options.userId,
                      authorName: extension.options.userName,
                      createdAt: new Date().toISOString(),
                      status: 'PENDING',
                    };

                    // Add insertion decoration
                    const mappedFrom = tr.mapping.map(from);
                    const mappedTo = tr.mapping.map(from + newContent.length);
                    
                    const decoration = Decoration.inline(
                      mappedFrom, mappedTo,
                      {
                        class: 'tracked-change tracked-insertion',
                        'data-change-id': changeId,
                        'data-change-type': 'INSERT',
                        'data-author': extension.options.userName,
                        'data-content': newContent,
                        title: `Inserted by ${extension.options.userName}: "${newContent}"`,
                      },
                      { changeId }
                    );
                    newDecorations.add(tr.doc, [decoration]);
                    
                  } else if (oldContent && newContent && oldContent !== newContent) {
                    // Replacement
                    changeData = {
                      id: changeId,
                      type: 'REPLACE',
                      content: newContent,
                      oldContent: oldContent,
                      startOffset: from,
                      endOffset: to,
                      authorId: extension.options.userId,
                      authorName: extension.options.userName,
                      createdAt: new Date().toISOString(),
                      status: 'PENDING',
                    };

                    // Add replacement decoration
                    const mappedFrom = tr.mapping.map(from);
                    const mappedTo = tr.mapping.map(to);
                    
                    const decoration = Decoration.inline(
                      mappedFrom, mappedTo,
                      {
                        class: 'tracked-change tracked-replacement',
                        'data-change-id': changeId,
                        'data-change-type': 'REPLACE',
                        'data-author': extension.options.userName,
                        'data-old-content': oldContent,
                        'data-new-content': newContent,
                        title: `Replaced by ${extension.options.userName}: "${oldContent}" → "${newContent}"`,
                      },
                      { changeId }
                    );
                    newDecorations.add(tr.doc, [decoration]);
                  }
                }

                if (changeData) {
                  newChanges.set(changeId, changeData);
                  
                  // Store in extension storage
                  extension.storage.changes.set(changeId, changeData);
                  
                  // Call the callback
                  extension.options.onChangeCreated(changeData);
                }
              });

              // Update storage and return new state
              extension.storage.decorations = newDecorations;
              extension.storage.changes = newChanges;
              
              return {
                decorations: newDecorations,
                changes: newChanges,
              };
            }

            return { decorations, changes };
          },
        },

        props: {
          decorations(state) {
            return this.getState(state).decorations;
          },

          handleClick(view, pos, event) {
            const decorations = this.getState(view.state).decorations;
            const clickedDecorations = decorations.find(pos, pos);
            
            if (clickedDecorations.length > 0) {
              const spec = clickedDecorations[0].spec;
              if (spec.changeId) {
                // Dispatch custom event for change click
                const changeEvent = new CustomEvent('changeClicked', {
                  detail: {
                    changeId: spec.changeId,
                    change: extension.storage.changes.get(spec.changeId),
                  }
                });
                document.dispatchEvent(changeEvent);
                return true;
              }
            }
            
            return false;
          },
        },
      }),
    ];
  },

  onUpdate() {
    // Update decorations when document changes
    const plugin = trackChangesPluginKey.get(this.editor.state);
    if (plugin) {
      this.storage.decorations = plugin.decorations;
      this.storage.changes = plugin.changes;
    }
  },
});

export default TrackChanges;

