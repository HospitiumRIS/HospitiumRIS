/**
 * useAutoReferences Hook
 * Automatically manages reference list based on citations in the document
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  extractCitationsFromDocument,
  updateReferenceList,
  removeReferencesSection
} from '../utils/referencesManager';

export function useAutoReferences(editor, manuscriptId, citationStyle = 'APA') {
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [citationCount, setCitationCount] = useState(0);
  
  // Track previous citations to detect changes
  const previousCitationsRef = useRef(new Set());
  const updateTimeoutRef = useRef(null);

  /**
   * Fetch full citation data for citation IDs
   */
  const fetchCitationData = useCallback(async (citationIds) => {
    if (!manuscriptId || citationIds.size === 0) return [];

    try {
      const response = await fetch(`/api/manuscripts/${manuscriptId}/citations`);
      const data = await response.json();

      if (data.success) {
        // Filter to only citations that are in the document
        const citationsInDoc = data.data.filter(citation => 
          citationIds.has(citation.id)
        );
        return citationsInDoc;
      }
      return [];
    } catch (error) {
      console.error('Error fetching citation data:', error);
      return [];
    }
  }, [manuscriptId]);

  /**
   * Update the references section
   */
  const updateReferences = useCallback(async () => {
    if (!editor || !autoUpdateEnabled) return;

    setIsUpdating(true);

    try {
      // Extract citation IDs from document
      const citationIds = extractCitationsFromDocument(editor);
      setCitationCount(citationIds.size);

      if (citationIds.size === 0) {
        // No citations - remove references section
        removeReferencesSection(editor);
        setIsUpdating(false);
        return;
      }

      // Fetch full citation data
      const citations = await fetchCitationData(citationIds);

      if (citations.length > 0) {
        // Update reference list
        updateReferenceList(editor, citations, citationStyle);
      }
    } catch (error) {
      console.error('Error updating references:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [editor, autoUpdateEnabled, citationStyle, fetchCitationData]);

  /**
   * Debounced update - wait 2 seconds after last change
   */
  const debouncedUpdate = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      updateReferences();
    }, 2000); // 2 second debounce
  }, [updateReferences]);

  /**
   * Check if citations have changed
   */
  const checkCitationChanges = useCallback(() => {
    if (!editor) return false;

    const currentCitations = extractCitationsFromDocument(editor);
    const previousCitations = previousCitationsRef.current;

    // Check if sets are different
    if (currentCitations.size !== previousCitations.size) {
      previousCitationsRef.current = currentCitations;
      return true;
    }

    for (const id of currentCitations) {
      if (!previousCitations.has(id)) {
        previousCitationsRef.current = currentCitations;
        return true;
      }
    }

    return false;
  }, [editor]);

  /**
   * Listen to editor updates
   */
  useEffect(() => {
    if (!editor || !autoUpdateEnabled) return;

    const handleUpdate = () => {
      // Only update if citations actually changed
      if (checkCitationChanges()) {
        debouncedUpdate();
      }
    };

    editor.on('update', handleUpdate);

    // Initial update
    updateReferences();

    return () => {
      editor.off('update', handleUpdate);
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [editor, autoUpdateEnabled, debouncedUpdate, checkCitationChanges, updateReferences]);

  /**
   * Enable auto-update
   */
  const enableAutoUpdate = useCallback(() => {
    setAutoUpdateEnabled(true);
  }, []);

  /**
   * Disable auto-update
   */
  const disableAutoUpdate = useCallback(() => {
    setAutoUpdateEnabled(false);
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
  }, []);

  /**
   * Manual refresh
   */
  const manualRefresh = useCallback(() => {
    updateReferences();
  }, [updateReferences]);

  return {
    autoUpdateEnabled,
    enableAutoUpdate,
    disableAutoUpdate,
    manualRefresh,
    isUpdating,
    citationCount,
  };
}
