import React from 'react';
import { FileText, Plus, MoreVertical, ChevronLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DocumentOutlineProps {
  headings: Array<{ level: number; text: string; id: string }>;
  onHeadingClick: (id: string) => void;
  onClose: () => void;
  title: string;
  lastSaved?: Date;
}

const DocumentOutline: React.FC<DocumentOutlineProps> = ({ headings, onHeadingClick, onClose, title, lastSaved }) => {
  const formatTimestamp = (date?: Date) => {
    if (!date) return '';
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-64 border-r bg-background h-full flex flex-col animate-slide-in-left">
      {/* Header with close button */}
      <div className="px-3 py-3 border-b">
        <div className="flex items-center gap-2 mb-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 flex-shrink-0"
            onClick={onClose}
            title="Close outline"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h3 className="text-sm font-medium flex-1">Document outline</h3>
          <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Document Title and Timestamp */}
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-foreground truncate px-2">
            {title || 'Untitled document'}
          </h4>
          {lastSaved && (
            <div className="flex items-center gap-1.5 px-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatTimestamp(lastSaved)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {headings.length === 0 ? (
          <div className="px-2 py-8 text-center">
            <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">
              Headings you add to the document will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {headings.map((heading, index) => (
              <button
                key={index}
                onClick={() => onHeadingClick(heading.id)}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-accent text-sm transition-colors"
                style={{ paddingLeft: `${(heading.level - 1) * 12 + 8}px` }}
              >
                {heading.text}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tab section */}
      <div className="border-t">
        <div className="px-2 py-2">
          <div className="flex items-center justify-between px-2 py-2 rounded bg-accent">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Tab 1</span>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreVertical className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentOutline;
