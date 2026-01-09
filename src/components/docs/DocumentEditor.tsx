/**
 * DocumentEditor - Full-page document editing view
 * 
 * Provides a Google Docs-style editing experience with:
 * - Menu bar with file operations and export
 * - Auto-save with visual status indicator
 * - Document outline sidebar (collapsible)
 * - Rich text or markdown editing
 * 
 * @see EditorMenuBar for the top menu bar
 * @see DocumentOutline for the sidebar
 * @see RichTextEditor for the TipTap editor
 */

import React, { useEffect, useState } from 'react';
import { Check, Cloud, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RichTextEditor from '../notes/RichTextEditor';
import EditorMenuBar from './EditorMenuBar';
import DocumentOutline from './DocumentOutline';
import useAutoSave from '@/hooks/useAutoSave';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from 'next-themes';

interface DocumentEditorProps {
  title: string;
  content: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onBack: () => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
  lastSaved?: Date;
  format: 'markdown' | 'richtext';
  initialTitle?: string;
  initialContent?: string;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({
  title,
  content,
  onTitleChange,
  onContentChange,
  onBack,
  onSave,
  isSaving,
  lastSaved,
  format,
  initialTitle,
  initialContent
}) => {
  const [showOutline, setShowOutline] = useState(false);
  const [headings, setHeadings] = useState<Array<{ level: number; text: string; id: string }>>([]);
  const { theme } = useTheme();

  // Track initial values to detect actual changes
  const initialValuesRef = React.useRef({
    title: initialTitle ?? title,
    content: initialContent ?? content
  });

  // Auto-save with 3 second debounce
  const { save, saveStatus, flush } = useAutoSave(onSave, 3000);

  // Check if content has changed from initial values
  const hasChanges = title !== initialValuesRef.current.title ||
    content !== initialValuesRef.current.content;

  // Trigger save only when there are actual changes
  useEffect(() => {
    if (hasChanges && title.trim()) {
      save();
    }
  }, [hasChanges, title, content, save]);

  // Handle back navigation - flush pending saves first
  const handleBack = async () => {
    if (hasChanges) {
      await flush();
    }
    onBack();
  };

  // Extract headings from content for outline
  useEffect(() => {
    const extractHeadings = () => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      const headingElements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');

      const extracted = Array.from(headingElements).map((el, index) => ({
        level: parseInt(el.tagName.substring(1)),
        text: el.textContent || '',
        id: `heading-${index}`
      }));

      setHeadings(extracted);
    };

    if (content) {
      extractHeadings();
    } else {
      setHeadings([]);
    }
  }, [content]);

  const handleHeadingClick = (id: string) => {
    // In a real implementation, this would scroll to the heading
    console.log('Scroll to heading:', id);
  };

  const getSaveStatusText = () => {
    if (isSaving || saveStatus === 'saving') return 'Saving...';
    if (saveStatus === 'pending') return 'Unsaved changes';
    if (saveStatus === 'saved' && lastSaved) {
      const now = new Date();
      const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000);
      if (diff < 60) return 'Saved';
      if (diff < 3600) return `Saved ${Math.floor(diff / 60)}m ago`;
      return `Saved ${Math.floor(diff / 3600)}h ago`;
    }
    return 'All changes saved';
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Menu Bar */}
      <EditorMenuBar
        title={title}
        content={content}
        onTitleChange={onTitleChange}
        onBack={handleBack}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Document Outline */}
        {showOutline && (
          <DocumentOutline
            headings={headings}
            onHeadingClick={handleHeadingClick}
            onClose={() => setShowOutline(false)}
            title={title}
            lastSaved={lastSaved}
          />
        )}

        {/* Show outline button when collapsed - hidden on mobile */}
        {!showOutline && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowOutline(true)}
            className="hidden md:flex absolute left-2 top-20 z-10 h-8 w-8 bg-card border shadow-sm hover:bg-accent"
            title="Show document outline"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        {/* Main Editor Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Save status bar */}
          <div className="px-3 md:px-4 py-2 border-b bg-card/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
              {(isSaving || saveStatus === 'saving') ? (
                <>
                  <Cloud className="h-3 md:h-4 w-3 md:w-4 animate-pulse" />
                  <span className="hidden sm:inline">{getSaveStatusText()}</span>
                </>
              ) : saveStatus === 'pending' ? (
                <>
                  <Cloud className="h-3 md:h-4 w-3 md:w-4 text-yellow-500" />
                  <span className="hidden sm:inline">{getSaveStatusText()}</span>
                </>
              ) : (
                <>
                  <Check className="h-3 md:h-4 w-3 md:w-4 text-green-600" />
                  <span className="hidden sm:inline">{getSaveStatusText()}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="max-w-[850px] mx-auto px-4 md:px-8 lg:px-12 py-4 md:py-8">
              {format === 'richtext' ? (
                <RichTextEditor
                  value={content}
                  onChange={onContentChange}
                  placeholder="Start typing..."
                  showToolbar={true}
                />
              ) : (
                <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
                  <div className="flex flex-col">
                    <textarea
                      className="flex-1 min-h-[200px] md:min-h-[300px] resize-vertical rounded-md border bg-background p-3 font-mono text-sm touch-manipulation"
                      value={content}
                      onChange={(e) => onContentChange(e.target.value)}
                      placeholder="Write markdown..."
                    />
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none border rounded-md bg-card p-4 overflow-y-auto">
                    <ReactMarkdown
                      components={{
                        code(props) {
                          const { children, className, ...rest } = props;
                          const match = /language-(\w+)/.exec(className || '');

                          return match ? (
                            <SyntaxHighlighter
                              style={theme === 'dark' ? oneDark : oneLight}
                              language={match[1]}
                              PreTag="div"
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...rest}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {content}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor;
