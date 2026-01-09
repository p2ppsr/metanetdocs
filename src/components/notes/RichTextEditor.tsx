/**
 * RichTextEditor - TipTap-based WYSIWYG editor
 * 
 * Provides a Google Docs-style editing experience with:
 * - Formatting toolbar (headings, bold, italic, lists, etc.)
 * - Font family selection
 * - Code blocks with syntax highlighting
 * - Page-like document appearance
 * 
 * Built on TipTap (https://tiptap.dev) with extensions:
 * - StarterKit (basic formatting)
 * - FontFamily (custom fonts)
 * - CodeBlockLowlight (syntax highlighting)
 * 
 * @see RichTextToolbar for the formatting toolbar component
 */

import React, { useState, useCallback } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Undo, Redo, Type, ChevronDown, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import './rich-text.css';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

/** Create lowlight instance for code syntax highlighting */
const lowlight = createLowlight(common);

export const RichTextToolbar: React.FC<{
  editor: Editor | null;
  fontOptions: Array<{ name: string; value: string; family: string; disabled?: boolean }>;
}> = ({ editor, fontOptions }) => {
  const handleBoldClick = useCallback(() => {
    if (editor) {
      editor.chain().focus().toggleBold().run();
    }
  }, [editor]);

  const handleItalicClick = useCallback(() => {
    if (editor) {
      editor.chain().focus().toggleItalic().run();
    }
  }, [editor]);

  const handleFontChange = useCallback((fontValue: string) => {
    if (editor && fontValue !== 'separator' && fontValue !== 'separator2') {
      if (fontValue === '') {
        editor.chain().focus().unsetFontFamily().run();
      } else {
        editor.chain().focus().setFontFamily(fontValue).run();
      }
    }
  }, [editor]);

  const getCurrentFont = useCallback(() => {
    if (!editor) return 'Default';
    const fontFamily = editor.getAttributes('textStyle').fontFamily;
    if (!fontFamily) return 'Default';

    const font = fontOptions.find(f => f.value === fontFamily);
    return font ? font.name : 'Custom';
  }, [editor, fontOptions]);

  if (!editor) return null;

  return (
    <div className="toolbar flex flex-wrap items-center gap-1 px-4 py-3 bg-background">
      {/* Font Family Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1 min-w-[120px] justify-start">
            <Type className="h-4 w-4" />
            <span className="text-xs truncate">
              {getCurrentFont()}
            </span>
            <ChevronDown className="h-3 w-3 ml-auto" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 max-h-80 overflow-y-auto bg-popover border border-border shadow-lg z-50">
          {fontOptions.map((font) => (
            <DropdownMenuItem
              key={font.value + font.name}
              onClick={() => handleFontChange(font.value)}
              disabled={font.disabled}
              className={`${font.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} px-3 py-2`}
              style={{
                fontFamily: font.disabled ? 'inherit' : font.family,
                borderBottom: font.disabled ? '1px solid hsl(var(--border))' : 'none'
              }}
            >
              {font.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="w-px h-6 bg-border mx-1" />

      <Button
        variant={editor?.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="h-4 w-4" />
      </Button>

      <Button
        variant={editor?.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-4 w-4" />
      </Button>

      <Button
        variant={editor?.isActive('heading', { level: 3 }) ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <Button
        variant={editor?.isActive('bold') ? 'default' : 'ghost'}
        size="sm"
        onClick={handleBoldClick}
      >
        <Bold className="h-4 w-4" />
      </Button>

      <Button
        variant={editor?.isActive('italic') ? 'default' : 'ghost'}
        size="sm"
        onClick={handleItalicClick}
      >
        <Italic className="h-4 w-4" />
      </Button>

      <Button
        variant={editor?.isActive('strike') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" />
      </Button>

      <Button
        variant={editor?.isActive('code') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code className="h-4 w-4" />
      </Button>

      <Button
        variant={editor?.isActive('codeBlock') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        title="Code Block"
      >
        <FileCode className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <Button
        variant={editor?.isActive('bulletList') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </Button>

      <Button
        variant={editor?.isActive('orderedList') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      <Button
        variant={editor?.isActive('blockquote') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  );
};

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showToolbar?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Start writing...",
  showToolbar = true
}) => {
  const fontOptions = [
    { name: 'Default', value: '', family: 'inherit' },
    { name: 'Inter (Sans)', value: 'Inter', family: '"Inter", system-ui, sans-serif' },
    { name: 'Open Sans', value: 'Open Sans', family: '"Open Sans", system-ui, sans-serif' },
    { name: 'Roboto', value: 'Roboto', family: '"Roboto", system-ui, sans-serif' },
    { name: 'Poppins', value: 'Poppins', family: '"Poppins", system-ui, sans-serif' },
    { name: 'Nunito', value: 'Nunito', family: '"Nunito", system-ui, sans-serif' },
    { name: 'Montserrat', value: 'Montserrat', family: '"Montserrat", system-ui, sans-serif' },
    { name: 'Oswald', value: 'Oswald', family: '"Oswald", system-ui, sans-serif' },
    { name: '─────────', value: 'separator', family: '', disabled: true },
    { name: 'Playfair Display', value: 'Playfair Display', family: '"Playfair Display", Georgia, serif' },
    { name: 'Crimson Text', value: 'Crimson Text', family: '"Crimson Text", Georgia, serif' },
    { name: 'Merriweather', value: 'Merriweather', family: '"Merriweather", Georgia, serif' },
    { name: 'Lora', value: 'Lora', family: '"Lora", Georgia, serif' },
    { name: 'PT Serif', value: 'PT Serif', family: '"PT Serif", Georgia, serif' },
    { name: 'Libre Baskerville', value: 'Libre Baskerville', family: '"Libre Baskerville", Georgia, serif' },
    { name: 'Cormorant Garamond', value: 'Cormorant Garamond', family: '"Cormorant Garamond", Georgia, serif' },
    { name: '─────────', value: 'separator2', family: '', disabled: true },
    { name: 'Source Code Pro', value: 'Source Code Pro', family: '"Source Code Pro", Menlo, monospace' },
    { name: 'Georgia', value: 'Georgia', family: 'Georgia, serif' },
    { name: 'Times New Roman', value: 'Times New Roman', family: '"Times New Roman", serif' },
    { name: 'Arial', value: 'Arial', family: 'Arial, sans-serif' },
    { name: 'Helvetica', value: 'Helvetica', family: 'Helvetica, sans-serif' },
    { name: 'Verdana', value: 'Verdana', family: 'Verdana, sans-serif' },
    { name: 'Courier New', value: 'Courier New', family: '"Courier New", monospace' },
  ];

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable the default code block from StarterKit since we're using CodeBlockLowlight
        codeBlock: false,
      }),
      TextStyle,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'plaintext',
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      setIsInternalUpdate(true);
      onChange(editor.getHTML());
      // Reset the flag after a short delay to allow for the state update
      setTimeout(() => setIsInternalUpdate(false), 0);
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      if (from > 1000 || to > 1000) { // Only log if selection jumps to end
        console.log('Selection jumped to end! From:', from, 'To:', to, 'Content length:', editor.state.doc.content.size);
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[600px] leading-relaxed code-highlight',
        'data-placeholder': placeholder,
      },
    },
  });

  // Only update editor content when value changes from external source (not from typing)
  const [lastExternalValue, setLastExternalValue] = React.useState(value);
  const [isInternalUpdate, setIsInternalUpdate] = React.useState(false);

  React.useEffect(() => {
    // Only update if the value is different from what's in the editor AND it's not from internal typing
    if (editor && value !== lastExternalValue && value !== editor.getHTML() && !isInternalUpdate) {
      console.log('External update detected - setting content');
      const { from, to } = editor.state.selection;
      editor.commands.setContent(value, { emitUpdate: false });
      // Restore cursor position if it was in a reasonable place
      if (from <= editor.state.doc.content.size && to <= editor.state.doc.content.size) {
        editor.commands.setTextSelection({ from: Math.min(from, editor.state.doc.content.size), to: Math.min(to, editor.state.doc.content.size) });
      }
      setLastExternalValue(value);
    }
  }, [value, editor, lastExternalValue, isInternalUpdate]);

  if (!editor) {
    return null;
  }

  const handleContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const editorContent = target.closest('.ProseMirror');
    
    // Only handle clicks outside the editor content area
    if (!editorContent && editor) {
      const editorElement = editor.view.dom;
      const rect = editorElement.getBoundingClientRect();
      const clickY = e.clientY;
      
      // If click is below the editor content, position cursor at end
      if (clickY > rect.bottom) {
        const doc = editor.state.doc;
        const endPos = doc.content.size;
        editor.commands.focus();
        editor.commands.setTextSelection(endPos);
      }
    }
  };

  // Layout without toolbar (for external toolbar usage)
  if (showToolbar === false) {
    return (
      <div 
        className="rich-text-editor-container h-full bg-background cursor-text"
        onClick={handleContainerClick}
      >
        <div className="h-full overflow-y-auto overscroll-contain">
          <div className="min-h-full py-12">
            {/* Page-like content area */}
            <div className="mx-auto w-full max-w-[850px] bg-card shadow-md min-h-[11in] px-[1in] py-[1in]">
              <div className="relative">
                {editor.isEmpty && (
                  <div className="pointer-events-none absolute top-0 left-0 text-muted-foreground/70">
                    {placeholder}
                  </div>
                )}
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Layout with toolbar - Google Docs style
  return (
    <div 
      className="rich-text-editor-container flex flex-col h-full bg-background cursor-text"
      onClick={handleContainerClick}
    >
      {/* Fixed Toolbar at top */}
      <div className="toolbar-container flex-shrink-0 bg-card border-b border-border/50 shadow-sm">
        <RichTextToolbar editor={editor} fontOptions={fontOptions} />
      </div>

      {/* Editor Content - page-like */}
      <div className="editor-scroll flex-1 overflow-y-auto overscroll-contain">
        <div className="min-h-full py-12">
          {/* Page-like content area with shadow */}
          <div className="mx-auto w-full max-w-[850px] bg-card shadow-md min-h-[11in] px-[1in] py-[1in]">
            <div className="relative">
              {editor.isEmpty && (
                <div className="pointer-events-none absolute top-0 left-0 text-muted-foreground/70">
                  {placeholder}
                </div>
              )}
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RichTextEditor;