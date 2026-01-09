/**
 * Metanet Docs - Document Parsing and Serialization Utilities
 * 
 * These utilities handle conversion between raw storage format
 * and the NoteData structure used by the application.
 */

import { NoteData } from './types';

/**
 * Parse a raw message string from storage into a NoteData object.
 * 
 * Handles multiple formats for backwards compatibility:
 * 1. Modern JSON format with all fields
 * 2. Legacy HTML content (rich text without JSON wrapper)
 * 3. Legacy markdown content (plain text)
 * 
 * @param message - Raw string retrieved from LocalKVStore
 * @returns Parsed NoteData object
 * 
 * @example
 * ```typescript
 * // Modern format
 * const data1 = parseNoteMessage('{"title":"My Doc","contents":"<p>Hello</p>"}');
 * 
 * // Legacy HTML
 * const data2 = parseNoteMessage('<p>Some old content</p>');
 * 
 * // Legacy markdown
 * const data3 = parseNoteMessage('# Heading\n\nSome text');
 * ```
 */
export const parseNoteMessage = (message: string): NoteData => {
  // Try parsing as JSON first (modern format)
  try {
    const parsed = JSON.parse(message);
    if (parsed.title && parsed.contents) {
      return {
        title: parsed.title,
        contents: parsed.contents,
        tags: parsed.tags || [],
        isRichText: parsed.isRichText || false,
        lastModified: parsed.lastModified,
        format: parsed.format || (parsed.isRichText ? 'richtext' : 'markdown')
      };
    }
  } catch (error) {
    // Not valid JSON - fall through to legacy handling
  }

  const trimmed = message.trim();
  
  // Check if content looks like HTML (legacy rich text)
  const looksLikeHtml = /^</.test(trimmed) && /<\/(p|h1|h2|h3|ul|ol|li|strong|em|div)>/i.test(trimmed);

  // Extract title from first line (strip markdown heading prefix if present)
  const firstLine = message.split('\n')[0].replace(/^#+\s*/, '');
  const title = firstLine.length > 30 
    ? firstLine.substring(0, 30) + '...' 
    : firstLine || 'Untitled Note';

  if (looksLikeHtml) {
    return {
      title,
      contents: message,
      tags: [],
      isRichText: true,
      lastModified: undefined,
      format: 'richtext'
    };
  }

  // Treat as markdown
  return {
    title,
    contents: message,
    tags: [],
    isRichText: false,
    lastModified: undefined,
    format: 'markdown'
  };
};

/**
 * Serialize a NoteData object to a string for storage.
 * 
 * @param data - The NoteData object to serialize
 * @returns JSON string ready for LocalKVStore
 * 
 * @example
 * ```typescript
 * const jsonStr = stringifyNoteData({
 *   title: "My Doc",
 *   contents: "<p>Hello world</p>",
 *   isRichText: true,
 *   format: "richtext",
 *   lastModified: Date.now()
 * });
 * await kvStore.set("My Doc.md", jsonStr);
 * ```
 */
export const stringifyNoteData = (data: NoteData): string => {
  return JSON.stringify(data);
};
