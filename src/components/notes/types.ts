/**
 * Metanet Docs - Type Definitions
 * 
 * These types define the data structures used for documents stored
 * on the BSV blockchain via LocalKVStore.
 */

/**
 * Document data structure stored in the blockchain.
 * This is the payload that gets JSON-stringified and saved to LocalKVStore.
 * 
 * @example
 * ```typescript
 * const doc: NoteData = {
 *   title: "Meeting Notes",
 *   contents: "<p>Today we discussed...</p>",
 *   tags: ["work", "meetings"],
 *   isRichText: true,
 *   lastModified: 1704067200000,
 *   format: "richtext"
 * };
 * ```
 */
export interface NoteData {
  /** Document title displayed in the grid and editor */
  title: string;
  
  /** 
   * Document content - HTML string for rich text, or markdown string.
   * For rich text, this is the output from TipTap's getHTML() method.
   */
  contents: string;
  
  /** Optional array of tag strings for categorization */
  tags?: string[];
  
  /** 
   * Whether the content is rich text (HTML) or markdown.
   * @deprecated Use `format` field instead for new documents
   */
  isRichText?: boolean;
  
  /** 
   * Unix timestamp (milliseconds) of last modification.
   * Used for sorting documents by recency.
   */
  lastModified?: number;
  
  /** Editor format - determines how content should be interpreted */
  format?: 'markdown' | 'richtext';
}

/**
 * Complete document object including metadata.
 * Represents a document as loaded from the blockchain.
 * 
 * @example
 * ```typescript
 * const note: Note = {
 *   token: null,  // Legacy field, not used with LocalKVStore
 *   data: { title: "My Doc", contents: "...", ... },
 *   timestamp: 1704067200000,
 *   tokenId: "My Doc.md"  // The key used in LocalKVStore
 * };
 * ```
 */
export interface Note {
  /** 
   * Legacy token field from Tokenator-based storage.
   * Always null when using LocalKVStore.
   * @deprecated Kept for backwards compatibility
   */
  token: any;
  
  /** The document data payload */
  data: NoteData;
  
  /** 
   * Timestamp for sorting (milliseconds).
   * Same as data.lastModified for new documents.
   * May be 0 for legacy documents without timestamps.
   */
  timestamp: number;
  
  /** 
   * Unique identifier / storage key.
   * For LocalKVStore, this is the filename (e.g., "My Document.md")
   */
  tokenId: string;
}
