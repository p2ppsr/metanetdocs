/**
 * Metanet Docs - Auto-Save Hook
 * 
 * Provides debounced auto-saving functionality with status tracking.
 * Used by the document editor to save changes automatically after
 * a period of inactivity.
 */

import { useCallback, useRef, useState, useEffect } from 'react';

/** Possible states of the auto-save process */
type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

/** Return type of the useAutoSave hook */
interface UseAutoSaveReturn {
  /** Trigger a debounced save - call this when content changes */
  save: () => void;
  
  /** Current status of the save operation */
  saveStatus: SaveStatus;
  
  /** Cancel any pending save operation */
  cancelSave: () => void;
  
  /** Immediately save any pending changes (for navigation away) */
  flush: () => Promise<void>;
  
  /** Whether there are unsaved changes */
  hasPendingChanges: boolean;
}

/**
 * Hook for auto-saving with debouncing.
 * 
 * Waits for a period of inactivity before triggering the save function.
 * Tracks save status and provides methods to flush or cancel.
 * 
 * @param saveFunction - Async function that performs the actual save
 * @param delay - Debounce delay in milliseconds (default: 2000)
 * @returns Object with save controls and status
 * 
 * @example
 * ```typescript
 * const { save, saveStatus, flush } = useAutoSave(async () => {
 *   await saveToBlockchain(content);
 * }, 3000);
 * 
 * // In a useEffect when content changes:
 * useEffect(() => {
 *   if (hasChanges) save();
 * }, [content, hasChanges, save]);
 * 
 * // Before navigating away:
 * const handleBack = async () => {
 *   await flush();
 *   navigate('/');
 * };
 * ```
 */
const useAutoSave = (
  saveFunction: () => Promise<void>,
  delay: number = 2000
): UseAutoSaveReturn => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const hasPendingRef = useRef(false);
  const saveFunctionRef = useRef(saveFunction);

  // Keep saveFunction ref up to date to avoid stale closures
  useEffect(() => {
    saveFunctionRef.current = saveFunction;
  }, [saveFunction]);

  // Cleanup on unmount - clear timeout but don't cancel saves
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  /**
   * Execute the save operation
   */
  const performSave = useCallback(async () => {
    if (isSavingRef.current) return;

    isSavingRef.current = true;
    hasPendingRef.current = false;
    setSaveStatus('saving');

    try {
      await saveFunctionRef.current();
      setSaveStatus('saved');

      // Reset to idle after showing saved status
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Auto-save error:', error);
      setSaveStatus('error');

      // Reset to idle after showing error
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } finally {
      isSavingRef.current = false;
    }
  }, []);

  /**
   * Trigger a debounced save
   */
  const save = useCallback(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Mark as pending
    hasPendingRef.current = true;
    setSaveStatus('pending');

    // Don't start a new save if one is in progress
    if (isSavingRef.current) {
      return;
    }

    // Set timeout for debounced save
    timeoutRef.current = setTimeout(() => {
      void performSave();
    }, delay);
  }, [delay, performSave]);

  /**
   * Cancel any pending save operation
   */
  const cancelSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    hasPendingRef.current = false;
    if (!isSavingRef.current) {
      setSaveStatus('idle');
    }
  }, []);

  /**
   * Immediately save any pending changes
   * Useful when user is navigating away
   */
  const flush = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (hasPendingRef.current && !isSavingRef.current) {
      await performSave();
    }
  }, [performSave]);

  return {
    save,
    saveStatus,
    cancelSave,
    flush,
    hasPendingChanges: hasPendingRef.current || saveStatus === 'pending'
  };
};

export default useAutoSave;
