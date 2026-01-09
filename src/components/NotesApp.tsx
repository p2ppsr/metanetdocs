/**
 * Metanet Docs - Main Application Component
 * 
 * This is the root component that orchestrates the entire document management
 * application. It handles:
 * 
 * - Wallet initialization via BSV SDK
 * - Document CRUD operations via LocalKVStore
 * - Local caching for offline/fast access
 * - View state management (grid vs editor)
 * 
 * ## Storage Architecture
 * 
 * Documents are stored using `LocalKVStore` from @bsv/sdk:
 * - Store name: "notes"
 * - Each document is stored at key: "{title}.md"
 * - An index at "__wallet_index__" tracks all document paths
 * 
 * ## Caching Strategy
 * 
 * Documents are cached in localStorage scoped by user identity:
 * - Cache key: `metanetdocs_notes_cache_v2_{identityPublicKey}`
 * - Cache is loaded immediately on mount for fast UI
 * - Background sync fetches latest from blockchain
 * 
 * @see {@link https://github.com/bitcoin-sv/ts-sdk} BSV SDK documentation
 */

import React, { useState, useEffect, useRef } from 'react';
import { LocalKVStore, WalletClient } from '@bsv/sdk';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DocumentGrid from './docs/DocumentGrid';
import DocumentEditor from './docs/DocumentEditor';
import { Note, NoteData } from './notes/types';
import { parseNoteMessage, stringifyNoteData } from './notes/utils';

/**
 * Key in LocalKVStore that stores the index of all document paths.
 * The index is a JSON array of strings, e.g., ["Doc1.md", "Doc2.md"]
 */
const INDEX_KEY = '__wallet_index__';

/**
 * Prefix for localStorage cache keys.
 * Full key format: metanetdocs_notes_cache_v2_{identityPublicKey}
 */
const CACHE_KEY_PREFIX = 'metanetdocs_notes_cache_v2_';

/**
 * Main application component for Metanet Docs.
 * Manages document state, wallet connection, and view transitions.
 */
const NotesApp: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [kvStore, setKvStore] = useState<LocalKVStore | null>(null);
  const [isNewNote, setIsNewNote] = useState(false);
  const [editorFormat, setEditorFormat] = useState<'markdown' | 'richtext'>('richtext');
  const [showMetanetNotification, setShowMetanetNotification] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | undefined>();
  const [view, setView] = useState<'grid' | 'editor'>('grid');
  const [identityKey, setIdentityKey] = useState<string | null>(null);
  const savePromiseRef = useRef<Promise<void> | null>(null);

  // Get cache key scoped to identity
  const getCacheKey = (idKey: string) => `${CACHE_KEY_PREFIX}${idKey}`;

  // Initialize wallet once on mount
  useEffect(() => {
    void initializeWallet();
  }, []);

  // Periodically retry wallet initialization when Metanet notification is showing
  useEffect(() => {
    if (!showMetanetNotification) return;

    const checkInterval = setInterval(() => {
      console.log('Checking for Metanet client...');
      void initializeWallet();
    }, 3000); // Check every 3 seconds

    return () => clearInterval(checkInterval);
  }, [showMetanetNotification]);

  // Load cached notes when identity key is available
  useEffect(() => {
    if (!identityKey) return;

    try {
      if (typeof window !== 'undefined') {
        const raw = window.localStorage?.getItem(getCacheKey(identityKey));
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setNotes(parsed as Note[]);
            console.log('Loaded notes from cache for identity:', identityKey.slice(0, 8) + '...');
          }
        }
      }
    } catch (e) {
      console.debug('Failed to load notes cache', e);
    }
  }, [identityKey]);

  // No automatic polling - user can manually refresh if needed
  // This prevents unnecessary reloads and provides a smoother UX

  const initializeWallet = async () => {
    try {
      console.log('Initializing wallet...');

      // Get identity key for cache scoping
      const wallet = new WalletClient();
      // Trigger required group permissions before any note access.
      await wallet.waitForAuthentication();
      const { publicKey } = await wallet.getPublicKey({ identityKey: true });
      setIdentityKey(publicKey);

      // Initialize LocalKVStore with the authenticated wallet
      const store = new LocalKVStore(wallet, 'notes', true);

      setKvStore(store);
      setShowMetanetNotification(false); // Dismiss dialog when client is detected
      await loadNotes(store, publicKey);
      console.log('Wallet initialized successfully for identity:', publicKey.slice(0, 8) + '...');
    } catch (error) {
      console.error('Failed to initialize wallet:', error);

      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('No wallet available over any communication substrate')) {
        setShowMetanetNotification(true);
        return;
      }

      toast({
        title: "Error",
        description: "Failed to initialize blockchain wallet",
        variant: "destructive",
      });
    }
  };

  /**
   * Opens the Metanet download page in a new tab.
   * Called when user clicks "Get on the Metanet" button.
   */
  const downloadMetanet = () => {
    window.open('https://metanet.bsvb.tech', '_blank');
  };

  /**
   * Read the document index from LocalKVStore.
   * The index contains an array of all document paths (filenames).
   * 
   * @param store - The LocalKVStore instance
   * @returns Array of document paths (e.g., ["Doc1.md", "Doc2.md"])
   */
  const readIndex = async (store: LocalKVStore): Promise<string[]> => {
    try {
      const raw = await store.get(INDEX_KEY);
      if (typeof raw === 'string') {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr as string[];
      }
    } catch (error) {
      console.debug('Failed to read note index:', error);
    }
    return [];
  };

  /**
   * Write the document index to LocalKVStore.
   * Deduplicates and sorts paths before saving.
   * 
   * @param store - The LocalKVStore instance
   * @param paths - Array of document paths to save
   */
  const writeIndex = async (store: LocalKVStore, paths: string[]) => {
    try {
      const uniqueSorted = [...new Set(paths)].sort();
      await store.set(INDEX_KEY, JSON.stringify(uniqueSorted));
    } catch (err) {
      console.error('Failed to write wallet index', err);
    }
  };

  /**
   * Add a document path to the index if not already present.
   */
  const addToIndex = async (store: LocalKVStore, path: string) => {
    const idx = await readIndex(store);
    if (!idx.includes(path)) {
      idx.push(path);
      await writeIndex(store, idx);
    }
  };

  /**
   * Remove a document path from the index.
   */
  const removeFromIndex = async (store: LocalKVStore, path: string) => {
    const idx = await readIndex(store);
    const next = idx.filter((p) => p !== path);
    await writeIndex(store, next);
  };

  /**
   * Persist notes array to localStorage for caching.
   * Scoped by user identity to prevent data leakage.
   */
  const writeNotesCache = (notesToCache: Note[]) => {
    if (!identityKey) return;
    try {
      if (typeof window !== 'undefined') {
        window.localStorage?.setItem(getCacheKey(identityKey), JSON.stringify(notesToCache));
      }
    } catch (e) {
      console.debug('Failed to write notes cache', e);
    }
  };

  /**
   * Load all documents from LocalKVStore.
   * Reads the index, then fetches each document in parallel.
   * Updates both React state and localStorage cache.
   * 
   * @param storeInstance - Optional KVStore (uses state if not provided)
   * @param idKey - Optional identity key for cache scoping
   */
  const loadNotes = async (storeInstance?: LocalKVStore, idKey?: string) => {
    const store = storeInstance || kvStore;
    const currentIdentity = idKey || identityKey;
    if (!store) return;

    // Cache is already loaded via useEffect when identityKey changes
    const hasCachedData = notes.length > 0;

    // Show appropriate loading state (only if not already set by caller)
    if (!hasCachedData && !isRefreshing) {
      setIsLoading(true); // Full loading for initial load
    }

    try {
      console.log('Loading notes from KVStore...');
      const paths = await readIndex(store);
      console.log('Found paths:', paths);

      // Load all notes in parallel
      const noteResults = await Promise.all(
        paths.map(async (path): Promise<Note | null> => {
          try {
            const content = await store.get(path);
            if (typeof content === 'string') {
              const data = parseNoteMessage(content);

              // Use filename as title if it's a .md file
              let title = data.title;
              if (path.endsWith('.md')) {
                title = path.replace(/\.md$/, '');
              }

              return {
                token: null,
                data: {
                  ...data,
                  title,
                  contents: data.contents
                },
                timestamp: data.lastModified || 0, // 0 = no timestamp (legacy note)
                tokenId: path
              };
            }
            return null;
          } catch (e) {
            console.error(`Failed to load note at ${path}`, e);
            return null;
          }
        })
      );

      const loadedNotes = noteResults.filter((n): n is Note => n !== null);

      // Sort by most recently modified
      loadedNotes.sort((a, b) => b.timestamp - a.timestamp);

      setNotes(loadedNotes);
      writeNotesCache(loadedNotes);
    } catch (error) {
      console.error('Failed to load notes:', error);

      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('No wallet available over any communication substrate')) {
        setShowMetanetNotification(true);
        return;
      }

      toast({
        title: "Error",
        description: "Failed to load notes from wallet",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  /**
   * Create a new untitled document.
   * Generates unique title if "Untitled document" already exists.
   * Immediately navigates to editor view.
   */
  const createNewNote = async () => {
    if (!kvStore) {
      setShowMetanetNotification(true);
      return;
    }

    // Generate unique title if "Untitled document" already exists
    let baseTitle = 'Untitled document';
    let title = baseTitle;
    let counter = 1;
    const existingTitles = new Set(notes.map(n => n.data.title));
    while (existingTitles.has(title)) {
      title = `${baseTitle} ${counter}`;
      counter++;
    }

    const defaultData: NoteData = {
      title,
      contents: '',
      tags: [],
      isRichText: true,
      format: 'richtext',
      lastModified: Date.now()
    };

    const localNote: Note = {
      token: null,
      data: defaultData,
      timestamp: defaultData.lastModified!,
      tokenId: `${title}.md`
    };

    setSelectedNote(localNote);
    setEditorTitle(title);
    setEditorContent('');
    setEditorFormat('richtext');
    setIsNewNote(true);
    setView('editor');
  };

  /**
   * Retry wrapper for blockchain operations.
   * Implements exponential backoff for resilience.
   * 
   * @param fn - Async function to retry
   * @param attempts - Maximum number of attempts
   * @param delaysMs - Delay between attempts in milliseconds
   */
  const withRetry = async <T,>(
    fn: () => Promise<T>,
    attempts = 3,
    delaysMs: number[] = [300, 800, 1500]
  ): Promise<T> => {
    let lastErr: unknown;
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        if (i < attempts - 1) {
          const delay = delaysMs[i] ?? delaysMs[delaysMs.length - 1] ?? 500;
          await new Promise((res) => setTimeout(res, delay));
        }
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
  };

  /**
   * Save the current document to blockchain.
   * Handles both new document creation and updates.
   * Detects renames and properly updates the index.
   */
  const saveNote = async () => {
    if (!kvStore || !editorTitle.trim()) {
      return;
    }

    // Check if there are actual changes to save
    if (selectedNote && !isNewNote) {
      const currentContent = editorContent;
      const existingContent = selectedNote.data.contents;
      const currentTitle = editorTitle;
      const existingTitle = selectedNote.data.title;

      // If nothing changed, don't save
      if (currentContent === existingContent && currentTitle === existingTitle) {
        return;
      }
    }

    // Store the save promise so it can complete in background
    const saveOperation = (async () => {
      setIsSaving(true);
      try {
        // Decide format based on existing note (default to richtext for new docs)
        const format: 'markdown' | 'richtext' = editorFormat;

        // Construct filename from title
        // ensure .md extension
        let filename = editorTitle.trim();
        if (!filename.endsWith('.md')) {
          filename += '.md';
        }

        // If renaming (and we have an old selectedNote with a different ID/Path), 
        // we should technically remove the old one, but for now let's just save to the new path.
        // The Obsidian plugin handles renames by mirroring vault events.
        // Here we act as the editor.

        // If we are editing an existing note and the title changed, we treat it as a rename
        if (selectedNote && !isNewNote && selectedNote.tokenId !== filename) {
          // It's a rename
          // Remove old key
          await withRetry(() => kvStore.remove(selectedNote.tokenId));
          await withRetry(() => removeFromIndex(kvStore, selectedNote.tokenId));
        }

        console.log('Saving note to:', filename);
        const noteDataToSave: NoteData = {
          title: editorTitle,
          contents: editorContent,
          tags: [],
          isRichText: format === 'richtext',
          lastModified: Date.now(),
          format
        };
        await withRetry(() => kvStore.set(filename, stringifyNoteData(noteDataToSave)));
        await withRetry(() => addToIndex(kvStore, filename));


        const updatedNote: Note = {
          token: null,
          data: noteDataToSave,
          timestamp: noteDataToSave.lastModified!,
          tokenId: filename
        };

        setSelectedNote(updatedNote);
        setIsNewNote(false);

        // Update list and keep sorted by most recent
        setNotes(prevNotes => {
          const others = prevNotes.filter(n => n.tokenId !== filename && (selectedNote ? n.tokenId !== selectedNote.tokenId : true));
          const next = [updatedNote, ...others]; // Put updated note first (most recent)
          writeNotesCache(next);
          return next;
        });

        setLastSaved(new Date());
      } catch (error) {
        console.error('Failed to save note:', error);

        const errorMessage = error instanceof Error ? error.message : String(error);

        if (errorMessage.includes('No wallet available over any communication substrate')) {
          setShowMetanetNotification(true);
          return;
        }

        toast({
          title: "Error",
          description: "Failed to save document",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
        savePromiseRef.current = null;
      }
    })();

    savePromiseRef.current = saveOperation;
    return saveOperation;
  };

  /**
   * Delete a document from blockchain storage.
   * Removes from LocalKVStore and updates the index.
   */
  const deleteNote = async (note: Note) => {
    if (!kvStore) {
      setShowMetanetNotification(true);
      return;
    }

    try {
      console.log('Deleting document:', note.tokenId);
      await withRetry(() => kvStore.remove(note.tokenId));
      await withRetry(() => removeFromIndex(kvStore, note.tokenId));
      console.log('Document deleted successfully');

      setNotes(prev => {
        const next = prev.filter(n => n.tokenId !== note.tokenId);
        writeNotesCache(next);
        return next;
      });

      if (selectedNote?.tokenId === note.tokenId) {
        setSelectedNote(null);
        setView('grid');
      }

      toast({
        title: 'Deleted',
        description: 'Document deleted',
      });
    } catch (error) {
      console.error('Delete error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('No wallet available over any communication substrate')) {
        setShowMetanetNotification(true);
        return;
      }
      toast({
        title: 'Error',
        description: `Failed to delete document: ${errorMessage}`,
        variant: 'destructive',
      });
    }
  };

  /**
   * Select and open a document in the editor.
   */
  const selectNote = (note: Note) => {
    setSelectedNote(note);
    setEditorTitle(note.data.title);
    setEditorContent(note.data.contents);
    const fmt = note.data.format ?? (note.data.isRichText ? 'richtext' : 'markdown');
    setEditorFormat(fmt);
    setIsNewNote(false);
    setView('editor');
  };

  /**
   * Manually refresh documents from blockchain.
   */
  const refreshNotes = async () => {
    if (kvStore) {
      setIsRefreshing(true);
      await loadNotes(kvStore);
    }
  };

  /**
   * Navigate back to document grid from editor.
   * Allows any pending saves to complete in background.
   */
  const handleBackToGrid = () => {
    // Allow ongoing save to complete in background
    if (savePromiseRef.current) {
      savePromiseRef.current.then(() => {
        console.log('Background save completed');
      }).catch((err) => {
        console.error('Background save failed:', err);
      });
    }

    // Don't reload notes - we already update state optimistically on save
    // This provides instant navigation like Google Docs
    setView('grid');
    setSelectedNote(null);
    setEditorTitle('');
    setEditorContent('');
  };

  return (
    <div className="h-screen bg-background">
      {view === 'grid' ? (
        <DocumentGrid
          documents={notes}
          onCreateNew={createNewNote}
          onSelectDocument={selectNote}
          onDeleteDocument={deleteNote}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          onRefresh={refreshNotes}
        />
      ) : (
        <DocumentEditor
          key={selectedNote?.tokenId ?? 'new'} // Reset editor state when switching notes
          title={editorTitle}
          content={editorContent}
          onTitleChange={setEditorTitle}
          onContentChange={setEditorContent}
          onBack={handleBackToGrid}
          onSave={saveNote}
          isSaving={isSaving}
          lastSaved={lastSaved}
          format={editorFormat}
          initialTitle={selectedNote?.data.title ?? ''}
          initialContent={selectedNote?.data.contents ?? ''}
        />
      )}

      {/* Metanet Download Notification */}
      {showMetanetNotification && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
          <Alert className="shadow-lg border bg-background">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <AlertDescription className="mb-3">
                  You need to be on the Metanet to access this app.
                </AlertDescription>
                <Button
                  asChild
                  size="sm"
                  className="w-full"
                >
                  <a href="https://getmetanet.com" target="_blank" rel="noopener noreferrer">
                    Get on the Metanet
                  </a>
                </Button>
              </div>
              <Button
                onClick={() => setShowMetanetNotification(false)}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 ml-2 shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </Alert>
        </div>
      )}
    </div>
  );
};

export default NotesApp;
